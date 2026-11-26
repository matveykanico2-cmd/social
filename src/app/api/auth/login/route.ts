import { route, jsonBody, HttpError } from "@/lib/server/http";
import { get, run } from "@/lib/server/db";
import { decryptTotpSecret, verifyTotp } from "@/lib/server/totp";
import { startSession, verifyPassword } from "@/lib/server/auth";
import { audit } from "@/lib/server/audit";

export const POST = route(async (req) => {
  const body = await jsonBody<{ login: string; password: string; totpCode?: string }>(req);
  const login = String(body.login ?? "").trim();
  const user = get<{ id: number; password_hash: string; totp_secret: string | null; totp_last_counter: number }>(
    "SELECT id, password_hash, totp_secret, totp_last_counter FROM users WHERE username = ? OR email = ? OR phone = ?",
    login,
    login,
    login,
  );
  if (!user)
    throw new HttpError(401, "The username you entered doesn't belong to an account. Please check your username and try again.");
  if (!verifyPassword(String(body.password ?? ""), user.password_hash))
    throw new HttpError(401, "Sorry, your password was incorrect. Please double-check your password.");
  if (user.totp_secret) {
    const counter = verifyTotp(decryptTotpSecret(user.totp_secret), String(body.totpCode ?? ""), user.totp_last_counter);
    if (counter === null) throw new HttpError(401, "A valid, unused authenticator code is required.");
    const result = run("UPDATE users SET totp_last_counter = ? WHERE id = ? AND totp_last_counter < ?", counter, user.id, counter);
    if (!result.changes) throw new HttpError(401, "Authenticator code was already used.");
  }
  await startSession(user.id);
  audit(user.id, "auth.login", req);
  return { ok: true };
});
