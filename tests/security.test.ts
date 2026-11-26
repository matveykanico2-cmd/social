import { describe, expect, it, beforeEach } from "vitest";
import { guardRequest, resetSecurityBuckets, securityHeaders } from "../src/lib/server/security";

describe("API security guard", () => {
  beforeEach(() => resetSecurityBuckets());

  it("rejects cross-site state-changing requests", () => {
    expect(() => guardRequest(new Request("https://social.test/api/posts", { method: "POST", headers: { origin: "https://evil.test" } }))).toThrow("Cross-site request blocked");
  });

  it("allows same-origin writes and blocks after the write budget", () => {
    const request = () => new Request("https://social.test/api/posts", { method: "POST", headers: { origin: "https://social.test", "x-real-ip": "198.51.100.2" } });
    for (let i = 0; i < 120; i++) guardRequest(request());
    expect(() => guardRequest(request())).toThrow("Too many requests");
  });

  it("adds baseline browser security headers", () => {
    const headers = securityHeaders();
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
  });
});
