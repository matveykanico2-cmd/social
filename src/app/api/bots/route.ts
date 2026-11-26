import crypto from "node:crypto";
import { route, jsonBody, HttpError } from "@/lib/server/http";
import { all, run, now } from "@/lib/server/db";
import { hashPassword, requireUser } from "@/lib/server/auth";
import { saveUpload } from "@/lib/server/media";

export const GET = route(async () => {
  const me = await requireUser();
  const bots = all<{ id: number; username: string; name: string; description: string; token_hint: string; active: number; created_at: number; avatar: string | null }>("SELECT b.id, b.username, b.name, b.description, b.token_hint, b.active, b.created_at, u.avatar FROM bots b JOIN users u ON u.id = b.user_id WHERE b.owner_id = ? ORDER BY b.id DESC", me.id);
  return { bots: bots.map((bot) => ({ id: bot.id, username: bot.username, name: bot.name, description: bot.description, tokenHint: bot.token_hint, active: !!bot.active, createdAt: bot.created_at, avatar: bot.avatar })) };
});

export const POST = route(async (req) => {
  const me = await requireUser();
  const multipart = req.headers.get("content-type")?.includes("multipart/form-data");
  const form = multipart ? await req.formData() : null;
  const body = form ? { name: String(form.get("name") ?? ""), username: String(form.get("username") ?? ""), description: String(form.get("description") ?? "") } : await jsonBody<{ name?: string; username?: string; description?: string }>(req);
  const name = String(body.name ?? "").trim().slice(0, 60);
  const slug = String(body.username ?? name).trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 24);
  if (!name || !slug) throw new HttpError(400, "Bot name is required.");
  const username = `bot_${slug}_${crypto.randomBytes(3).toString("hex")}`;
  const token = `shb_${crypto.randomBytes(24).toString("hex")}`;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const email = `${username}@bot.local`;
  const user = run("INSERT INTO users (username, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)", username, email, name, hashPassword(crypto.randomBytes(32).toString("hex")), now());
  const avatar = form?.get("avatar");
  const avatarUrl = avatar instanceof File && avatar.size > 0 ? (await saveUpload(avatar, "image")).url : null;
  if (avatarUrl) run("UPDATE users SET avatar = ? WHERE id = ?", avatarUrl, user.id);
  const bot = run("INSERT INTO bots (owner_id, user_id, username, name, description, token_hash, token_hint, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", me.id, user.id, username, name, String(body.description ?? "").trim().slice(0, 300), tokenHash, `${token.slice(0, 10)}…${token.slice(-4)}`, now());
  return { bot: { id: bot.id, username, name, token, warning: "Save this token now. It is shown only once." } };
});
