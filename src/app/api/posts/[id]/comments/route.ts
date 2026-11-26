import { route, intParam, jsonBody, HttpError } from "@/lib/server/http";
import { get, run, now } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { notify, queryComments } from "@/lib/server/queries";
import { saveUpload } from "@/lib/server/media";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req, { params }: Ctx) => {
  const me = await requireUser();
  return { comments: queryComments(me.id, intParam((await params).id)) };
});

export const POST = route(async (req, { params }: Ctx) => {
  const me = await requireUser();
  const id = intParam((await params).id);
  const post = get<{ user_id: number }>("SELECT user_id FROM posts WHERE id = ?", id);
  if (!post) throw new HttpError(404, "Post not found.");
  let text = "";
  let attachment: { url: string; kind: "image" | "video" } | null = null;
  if (req.headers.get("content-type")?.includes("multipart/form-data")) {
    const form = await req.formData();
    text = String(form.get("text") ?? "").trim().slice(0, 2200);
    const file = form.get("file");
    if (file instanceof File && file.size > 0) attachment = await saveUpload(file);
  } else {
    text = String((await jsonBody<{ text: string }>(req)).text ?? "").trim().slice(0, 2200);
  }
  if (!text && !attachment) throw new HttpError(400, "Write a comment or attach a file first.");

  const { id: commentId } = run(
    "INSERT INTO comments (post_id, user_id, text, attachment_url, attachment_kind, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    id,
    me.id,
    text,
    attachment?.url ?? null,
    attachment?.kind ?? null,
    now(),
  );
  notify(post.user_id, me.id, "comment", id, text);
  return { comment: queryComments(me.id, id).find((c) => c.id === commentId) };
});
