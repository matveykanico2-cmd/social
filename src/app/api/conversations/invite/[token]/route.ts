import { route, HttpError } from "@/lib/server/http";
import { get, run } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";

export const POST = route(async (_req, { params }: { params: Promise<{ token: string }> }) => {
  const me = await requireUser();
  const token = (await params).token;
  const conversation = get<{ id: number; kind: "group" | "channel" }>("SELECT id, kind FROM conversations WHERE invite_token = ?", token);
  if (!conversation) throw new HttpError(404, "This invite link is invalid or expired.");
  const member = get("SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?", conversation.id, me.id);
  if (!member) run("INSERT INTO conversation_members (conversation_id, user_id, role) VALUES (?, ?, 'member')", conversation.id, me.id);
  return { id: conversation.id, kind: conversation.kind };
});
