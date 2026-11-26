import { route, jsonBody, HttpError } from "@/lib/server/http";
import { get, run, now } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { notify } from "@/lib/server/queries";
import { userIdByUsername } from "@/lib/server/users";

type Ctx = { params: Promise<{ username: string }> };

function targetId(username: string, me: number) {
  const target = userIdByUsername(username);
  if (target === me) throw new HttpError(400, "You can't add yourself as a friend.");
  return target;
}

export const POST = route(async (_req, { params }: Ctx) => {
  const me = await requireUser();
  const target = targetId((await params).username, me.id);
  const existing = get<{ requester_id: number; addressee_id: number; status: string }>("SELECT requester_id, addressee_id, status FROM friend_requests WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)", me.id, target, target, me.id);
  if (existing?.status === "accepted") return { status: "friends" };
  if (existing?.status === "pending") return { status: existing.requester_id === me.id ? "outgoing" : "incoming" };
  run("INSERT INTO friend_requests (requester_id, addressee_id, status, created_at, updated_at) VALUES (?, ?, 'pending', ?, ?)", me.id, target, now(), now());
  notify(target, me.id, "friend_request");
  return { status: "outgoing" };
});

export const PATCH = route(async (req, { params }: Ctx) => {
  const me = await requireUser();
  const target = targetId((await params).username, me.id);
  const action = String((await jsonBody<{ action?: string }>(req)).action ?? "");
  const request = get<{ requester_id: number; addressee_id: number; status: string }>("SELECT requester_id, addressee_id, status FROM friend_requests WHERE requester_id = ? AND addressee_id = ?", target, me.id);
  if (!request || request.status !== "pending") throw new HttpError(404, "Friend request not found.");
  if (action === "accept") {
    run("UPDATE friend_requests SET status = 'accepted', updated_at = ? WHERE requester_id = ? AND addressee_id = ?", now(), target, me.id);
    notify(target, me.id, "friend_accept");
    return { status: "friends" };
  }
  if (action === "reject") {
    run("DELETE FROM friend_requests WHERE requester_id = ? AND addressee_id = ?", target, me.id);
    return { status: "none" };
  }
  throw new HttpError(400, "Unknown friend request action.");
});

export const DELETE = route(async (_req, { params }: Ctx) => {
  const me = await requireUser();
  const target = targetId((await params).username, me.id);
  run("DELETE FROM friend_requests WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)", me.id, target, target, me.id);
  return { status: "none" };
});
