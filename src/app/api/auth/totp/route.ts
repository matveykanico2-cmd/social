import { route, jsonBody, HttpError } from "@/lib/server/http";
import { get, run } from "@/lib/server/db";
import { requireUser, verifyPassword } from "@/lib/server/auth";
import { authenticatorUri, decryptTotpSecret, encryptTotpSecret, generateTotpSecret, totpReady, verifyTotp } from "@/lib/server/totp";

type TotpUser = {
  password_hash: string;
  totp_secret: string | null;
  totp_pending_secret: string | null;
  totp_last_counter: number;
};
function account(id: number) {
  const user = get<TotpUser>("SELECT password_hash, totp_secret, totp_pending_secret, totp_last_counter FROM users WHERE id = ?", id);
  if (!user) throw new HttpError(404, "Account not found.");
  return user;
}
function configured() {
  if (!totpReady()) throw new HttpError(503, "Authenticator setup requires SHALTER_TOTP_ENCRYPTION_KEY on the server.");
}
export const GET = route(async () => {
  const me = await requireUser();
  return { enabled: Boolean(account(me.id).totp_secret), available: totpReady() };
});
export const POST = route(async (req) => {
  const me = await requireUser();
  configured();
  const body = await jsonBody<{ action?: string; password?: string; code?: string }>(req);
  const action = String(body.action ?? "");
  const user = account(me.id);

  if (action === "begin" || action === "disable") {
    if (!verifyPassword(String(body.password ?? ""), user.password_hash)) throw new HttpError(401, "Current password is incorrect.");
  }

  if (action === "begin") {
    if (user.totp_secret) throw new HttpError(409, "Authenticator is already enabled.");
    const secret = generateTotpSecret();
    run("UPDATE users SET totp_pending_secret = ? WHERE id = ?", encryptTotpSecret(secret), me.id);
    return { secret, uri: authenticatorUri(me.username, secret) };
  }

  if (action === "enable") {
    if (user.totp_secret || !user.totp_pending_secret) throw new HttpError(409, "Begin authenticator setup first.");
    const secret = decryptTotpSecret(user.totp_pending_secret);
    const counter = verifyTotp(secret, String(body.code ?? ""));
    if (counter === null) throw new HttpError(400, "Invalid authenticator code.");
    run("UPDATE users SET totp_secret = ?, totp_pending_secret = NULL, totp_last_counter = ? WHERE id = ?", user.totp_pending_secret, counter, me.id);
    return { enabled: true };
  }

  if (action === "disable") {
    if (!user.totp_secret) throw new HttpError(409, "Authenticator is not enabled.");
    const counter = verifyTotp(decryptTotpSecret(user.totp_secret), String(body.code ?? ""), user.totp_last_counter);
    if (counter === null) throw new HttpError(400, "Invalid or already used authenticator code.");
    run("UPDATE users SET totp_secret = NULL, totp_pending_secret = NULL, totp_last_counter = -1 WHERE id = ?", me.id);
    return { enabled: false };
  }

  throw new HttpError(400, "Unknown authenticator action.");
});
