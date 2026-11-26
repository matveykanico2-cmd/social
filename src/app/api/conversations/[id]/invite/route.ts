import crypto from "node:crypto";
import { route, intParam, HttpError } from "@/lib/server/http";
import { get, run } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { otherMember } from "@/lib/server/dm";

export const POST = route(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const id = intParam((await params).id);
  otherMember(id, me.id);
  const conversation = get<{ kind: string; owner_id: number | null; invite_token: string | null }>("SELECT kind, owner_id, invite_token FROM conversations WHERE id = ?", id);
  if (!conversation || !["group", "channel"].includes(conversation.kind)) throw new HttpError(400, "Invites are available for groups and channels only.");
  const role = get<{ role: string }>("SELECT role FROM conversation_members WHERE conversation_id = ? AND user_id = ?", id, me.id)?.role;
  if (conversation.kind === "channel" ? conversation.owner_id !== me.id : !["owner", "admin"].includes(role ?? "")) throw new HttpError(403, "Only an administrator can create an invite.");
  const token = conversation.invite_token ?? crypto.randomBytes(18).toString("base64url");
  if (!conversation.invite_token) run("UPDATE conversations SET invite_token = ? WHERE id = ?", token, id);
  return { token, url: `/direct/invite/${token}` };
});
