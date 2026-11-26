import { route, intParam } from "@/lib/server/http";
import { get, run, now } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { otherMember } from "@/lib/server/dm";

type Ctx = { params: Promise<{ id: string }> };

function conversationId(params: Promise<{ id: string }>) {
  return params.then(({ id }) => intParam(id));
}

export const GET = route(async (_req, { params }: Ctx) => {
  const me = await requireUser();
  const id = await conversationId(params);
  const other = otherMember(id, me.id);
  const active = get<{ user_id: number }>(
    "SELECT user_id FROM conversation_typing WHERE conversation_id = ? AND user_id = ? AND updated_at > ?",
    id,
    other.id,
    now() - 4000,
  );
  return { typing: !!active };
});

export const POST = route(async (_req, { params }: Ctx) => {
  const me = await requireUser();
  const id = await conversationId(params);
  otherMember(id, me.id);
  run(
    "INSERT INTO conversation_typing (conversation_id, user_id, updated_at) VALUES (?, ?, ?) ON CONFLICT(conversation_id, user_id) DO UPDATE SET updated_at = excluded.updated_at",
    id,
    me.id,
    now(),
  );
  return { ok: true };
});

export const DELETE = route(async (_req, { params }: Ctx) => {
  const me = await requireUser();
  const id = await conversationId(params);
  otherMember(id, me.id);
  run("DELETE FROM conversation_typing WHERE conversation_id = ? AND user_id = ?", id, me.id);
  return { ok: true };
});
