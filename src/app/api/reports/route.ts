import { route, jsonBody, HttpError } from "@/lib/server/http";
import { get, run, now } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";

export const POST = route(async (req) => {
  const me = await requireUser();
  const body = await jsonBody<{ targetType?: string; targetId?: number; reason?: string }>(req);
  const targetType = String(body.targetType ?? "").trim();
  const targetId = Number(body.targetId);
  const reason = String(body.reason ?? "").trim().slice(0, 500);
  if (!["user", "post", "message", "story"].includes(targetType) || !Number.isInteger(targetId) || targetId <= 0 || !reason) throw new HttpError(400, "A valid report target and reason are required.");
  if (targetType === "user" && !get("SELECT 1 FROM users WHERE id = ?", targetId)) throw new HttpError(404, "User not found.");
  if (targetType === "post" && !get("SELECT 1 FROM posts WHERE id = ?", targetId)) throw new HttpError(404, "Post not found.");
  run("INSERT INTO reports (reporter_id, target_type, target_id, reason, created_at) VALUES (?, ?, ?, ?, ?)", me.id, targetType, targetId, reason, now());
  return { ok: true };
});
