import "server-only";
import { guardRequest, SecurityError, securityHeaders } from "./security";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Handler<C> = (req: Request, ctx: C) => Promise<unknown>;

/** Wraps a route handler: returns its value as JSON and turns thrown HttpErrors into error responses. */
export function route<C>(fn: Handler<C>) {
  return async (req: Request, ctx: C) => {
    try {
      guardRequest(req);
      const result = await fn(req, ctx);
      if (result instanceof Response) {
        const headers = securityHeaders(new Headers(result.headers));
        return new Response(result.body, { status: result.status, statusText: result.statusText, headers });
      }
      return Response.json(result ?? { ok: true }, { headers: securityHeaders() });
    } catch (e) {
      if (e instanceof HttpError || e instanceof SecurityError) return Response.json({ error: e.message }, { status: e.status, headers: securityHeaders() });
      console.error(e);
      return Response.json({ error: "Something went wrong." }, { status: 500, headers: securityHeaders() });
    }
  };
}

export function intParam(value: string | null | undefined, name = "id") {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, `Invalid ${name}.`);
  return n;
}

export async function jsonBody<T>(req: Request): Promise<Partial<T>> {
  try {
    return (await req.json()) as Partial<T>;
  } catch {
    return {};
  }
}
