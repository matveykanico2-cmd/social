import { route, intParam, jsonBody, HttpError } from "@/lib/server/http";
import { get, run } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { saveUpload } from "@/lib/server/media";

type Ctx = { params: Promise<{ id: string }> };
export const PATCH = route(async (req, { params }: Ctx) => {
  const me = await requireUser();
  const id = intParam((await params).id);
  const multipart = req.headers.get("content-type")?.includes("multipart/form-data");
  const form = multipart ? await req.formData() : null;
  const body = form ? { active: form.has("active") ? form.get("active") === "1" : undefined, description: form.has("description") ? String(form.get("description")) : undefined } : await jsonBody<{ active?: boolean; description?: string }>(req);
  const bot = get<{ user_id: number; avatar: string | null }>("SELECT user_id, (SELECT avatar FROM users WHERE users.id = bots.user_id) AS avatar FROM bots WHERE id = ? AND owner_id = ?", id, me.id);
  if (!bot) throw new HttpError(404, "Bot not found.");
  const file = form?.get("avatar");
  if (file instanceof File && file.size > 0) {
    const avatar = (await saveUpload(file, "image")).url;
    run("UPDATE users SET avatar = ? WHERE id = ?", avatar, bot.user_id);
  }
  run("UPDATE bots SET active = COALESCE(?, active), description = COALESCE(?, description) WHERE id = ?", body.active === undefined ? null : body.active ? 1 : 0, body.description === undefined ? null : String(body.description).slice(0, 300), id);
  return { ok: true };
});

export const DELETE = route(async (_req, { params }: Ctx) => {
  const me = await requireUser();
  const id = intParam((await params).id);
  if (!get("SELECT id FROM bots WHERE id = ? AND owner_id = ?", id, me.id)) throw new HttpError(404, "Bot not found.");
  run("DELETE FROM bots WHERE id = ?", id);
  return { ok: true };
});
