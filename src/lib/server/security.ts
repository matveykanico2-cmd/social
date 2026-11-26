export class SecurityError extends Error {
  status: 403 | 429;
  constructor(status: 403 | 429, message: string) {
    super(message);
    this.status = status;
  }
}

type Bucket = { startedAt: number; count: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const WRITE_LIMIT = 120;
const AUTH_WINDOW_MS = 15 * 60_000;
const AUTH_LIMIT = 10;

function clientKey(req: Request) {
  // Do not trust forwarded headers unless the app is behind a configured proxy.
  // The session cookie remains the identity boundary; this is only abuse control.
  return req.headers.get("x-real-ip")?.trim() || req.headers.get("cf-connecting-ip")?.trim() || "local";
}

function consume(key: string, limit: number, windowMs: number, at = Date.now()) {
  const current = buckets.get(key);
  if (!current || at - current.startedAt >= windowMs) {
    buckets.set(key, { startedAt: at, count: 1 });
    return;
  }
  current.count += 1;
  if (current.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((windowMs - (at - current.startedAt)) / 1000));
    throw new SecurityError(429, `Too many requests. Try again in ${retryAfter} seconds.`);
  }
}

export function guardRequest(req: Request) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;

  const origin = req.headers.get("origin");
  if (origin && origin !== "null") {
    const requestOrigin = new URL(req.url).origin;
    if (origin !== requestOrigin) throw new SecurityError(403, "Cross-site request blocked.");
  }

  const path = new URL(req.url).pathname;
  const isAuth = path.startsWith("/api/auth/");
  consume(`${clientKey(req)}:${isAuth ? "auth" : "write"}`, isAuth ? AUTH_LIMIT : WRITE_LIMIT, isAuth ? AUTH_WINDOW_MS : WINDOW_MS);
}

export function securityHeaders(headers = new Headers()) {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=() ");
  return headers;
}

export function resetSecurityBuckets() {
  buckets.clear();
}
