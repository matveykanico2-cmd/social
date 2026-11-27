import { route, jsonBody, HttpError } from "@/lib/server/http";
import { connectedAccounts, connectAccount, disconnectAccount, requireUser, switchSession, verifyPassword } from "@/lib/server/auth";
import { get, run } from "@/lib/server/db";
import { decryptTotpSecret, verifyTotp } from "@/lib/server/totp";
import { normalizeEmail, normalizePhone } from "@/lib/server/identity";

export const GET = route(async () => {
  await requireUser();
  return { accounts: await connectedAccounts() };
});

export const POST = route(async (req) => {
  const body = await jsonBody<{ action?: string; userId?: number; login?: string; password?: string; totpCode?: string }>(req);
  if (body.action === "switch") {
    await switchSession(Number(body.userId));
    return { ok: true };
  }
  const rawLogin = String(body.login ?? "").trim();
  const login = rawLogin.includes("@") ? normalizeEmail(rawLogin) : /^[+\d\s()-]+$/.test(rawLogin) ? normalizePhone(rawLogin) : rawLogin.toLowerCase();
  const username = rawLogin.toLowerCase();
  const user = get<{ id: number; password_hash: string; totp_secret: string | null; totp_last_counter: number }>("SELECT id, password_hash, totp_secret, totp_last_counter FROM users WHERE username = ? OR email = ? OR phone = ?", username, login, login);
  if (!user || !verifyPassword(String(body.password ?? ""), user.password_hash)) throw new HttpError(401, "Incorrect account credentials.");
  if (user.totp_secret) {
    const counter = verifyTotp(decryptTotpSecret(user.totp_secret), String(body.totpCode ?? ""), user.totp_last_counter);
    if (counter === null) throw new HttpError(401, "A valid, unused authenticator code is required.");
    const updated = run("UPDATE users SET totp_last_counter = ? WHERE id = ? AND totp_last_counter < ?", counter, user.id, counter);
    if (!updated.changes) throw new HttpError(401, "Authenticator code was already used.");
  }
  await connectAccount(user.id);
  return { ok: true };
});

export const DELETE = route(async (req) => {
  await requireUser();
  const body = await jsonBody<{ userId?: number }>(req);
  await disconnectAccount(Number(body.userId));
  return { ok: true };
});
