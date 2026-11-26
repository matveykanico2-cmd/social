import { route, HttpError } from "@/lib/server/http";
import { get, run, now } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";

async function target(username: string) {
  const user = get<{ id: number }>("SELECT id FROM users WHERE username = ?", decodeURIComponent(username));
  if (!user) throw new HttpError(404, "User not found.");
  return user.id;
}

export const POST = route(async (_req, { params }: { params: Promise<{ username: string }> }) => {
  const me = await requireUser();
  const blockedId = await target((await params).username);
  if (me.id === blockedId) throw new HttpError(400, "You can't block yourself.");
  run("INSERT OR IGNORE INTO user_blocks (blocker_id, blocked_id, created_at) VALUES (?, ?, ?)", me.id, blockedId, now());
  run("DELETE FROM follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)", me.id, blockedId, blockedId, me.id);
  return { blocked: true };
});

export const DELETE = route(async (_req, { params }: { params: Promise<{ username: string }> }) => {
  const me = await requireUser();
  const blockedId = await target((await params).username);
  run("DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?", me.id, blockedId);
  return { blocked: false };
});
