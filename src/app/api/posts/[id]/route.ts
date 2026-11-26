import { route, intParam, HttpError } from "@/lib/server/http";
import { all, get, run } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { deleteUpload } from "@/lib/server/media";
import { queryComments, queryPosts } from "@/lib/server/queries";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req, { params }: Ctx) => {
  const me = await requireUser();
  const id = intParam((await params).id);
  const post = queryPosts(me.id, "p.id = ?", [id], "")[0];
  if (!post) throw new HttpError(404, "Sorry, this page isn't available.");
  return { post, comments: queryComments(me.id, id) };
});

export const PATCH = route(async (req, { params }: Ctx) => {
  const me = await requireUser();
  const id = intParam((await params).id);
  const body = (await req.json()) as { caption?: string; location?: string; archived?: boolean };
  const { changes } = run(
    "UPDATE posts SET caption = COALESCE(?, caption), location = COALESCE(?, location), archived_at = CASE WHEN ? IS NULL THEN archived_at WHEN ? = 1 THEN ? ELSE NULL END WHERE id = ? AND user_id = ?",
    body.caption?.slice(0, 2200) ?? null,
    body.location?.slice(0, 100) ?? null,
    body.archived === undefined ? null : body.archived ? 1 : 0,
    body.archived === undefined ? null : body.archived ? 1 : 0,
    body.archived ? Date.now() : null,
    id,
    me.id,
  );
  if (!changes) throw new HttpError(404, "Post not found.");
  return { post: queryPosts(me.id, "p.id = ?", [id], "")[0] };
});

export const DELETE = route(async (_req, { params }: Ctx) => {
  const me = await requireUser();
  const id = intParam((await params).id);
  if (!get("SELECT 1 FROM posts WHERE id = ? AND user_id = ?", id, me.id)) throw new HttpError(404, "Post not found.");
  const media = all<{ url: string }>("SELECT url FROM post_media WHERE post_id = ?", id);
  run("DELETE FROM posts WHERE id = ?", id);
  for (const m of media) await deleteUpload(m.url);
});
