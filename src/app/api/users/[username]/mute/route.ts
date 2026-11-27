import { route } from "@/lib/server/http";
import { get, now, run } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { HttpError } from "@/lib/server/http";

async function target(username: string) {
  const user = get<{ id: number }>("SELECT id FROM users WHERE username = ?", decodeURIComponent(username));
  if (!user) throw new HttpError(404, "User not found.");
  return user.id;
}

export const POST = route(async (_req, { params }: { params: Promise<{ username: string }> }) => {
  const me = await requireUser();
  const mutedId = await target((await params).username);
  if (me.id === mutedId) throw new HttpError(400, "You can't mute yourself.");
  run("INSERT OR IGNORE INTO user_mutes (muter_id, muted_id, created_at) VALUES (?, ?, ?)", me.id, mutedId, now());
  return { muted: true };
});

export const DELETE = route(async (_req, { params }: { params: Promise<{ username: string }> }) => {
  const me = await requireUser();
  const mutedId = await target((await params).username);
  run("DELETE FROM user_mutes WHERE muter_id = ? AND muted_id = ?", me.id, mutedId);
  return { muted: false };
});
