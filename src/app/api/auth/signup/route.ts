import { route, jsonBody, HttpError } from "@/lib/server/http";
import { get, run, now } from "@/lib/server/db";
import { hashPassword, startSession, USERNAME_RE } from "@/lib/server/auth";
import { saveUpload } from "@/lib/server/media";

export const POST = route(async (req) => {
  const multipart = req.headers.get("content-type")?.includes("multipart/form-data") ?? false;
  const form = multipart ? await req.formData() : null;
  const body = multipart ? {
    email: String(form?.get("email") ?? ""),
    phone: String(form?.get("phone") ?? ""),
    name: String(form?.get("name") ?? ""),
    lastName: String(form?.get("lastName") ?? ""),
    username: String(form?.get("username") ?? ""),
    password: String(form?.get("password") ?? ""),
  } : await jsonBody<{ email: string; phone: string; name: string; lastName?: string; username: string; password: string }>(req);
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const name = String(body.name ?? "").trim();
  const lastName = String(body.lastName ?? "").trim().slice(0, 40);
  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, "Enter a valid email address.");
  if (!/^\+?[0-9\s()-]{7,20}$/.test(phone)) throw new HttpError(400, "Enter a valid phone number.");
  if (!USERNAME_RE.test(username))
    throw new HttpError(400, "Usernames can only use letters, numbers, underscores and periods.");
  if (password.length < 8) throw new HttpError(400, "Create a password at least 8 characters long.");
  if (get("SELECT 1 FROM users WHERE username = ?", username))
    throw new HttpError(409, "This username isn't available. Please try another.");
  if (get("SELECT 1 FROM users WHERE email = ?", email))
    throw new HttpError(409, "Another account is using the same email.");
  if (get("SELECT 1 FROM users WHERE phone = ?", phone))
    throw new HttpError(409, "Another account is using the same phone number.");

  const { id } = run(
    "INSERT INTO users (username, email, phone, name, last_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    username,
    email,
    phone,
    name,
    lastName,
    hashPassword(password),
    now(),
  );
  const avatar = form?.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    try {
      const saved = await saveUpload(avatar, "image");
      run("UPDATE users SET avatar = ? WHERE id = ?", saved.url, id);
    } catch (error) {
      run("DELETE FROM users WHERE id = ?", id);
      throw error;
    }
  }
  await startSession(id);
  return { ok: true };
});
