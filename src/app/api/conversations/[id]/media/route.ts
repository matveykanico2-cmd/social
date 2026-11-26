import { route, intParam, HttpError } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { saveChatUpload } from "@/lib/server/media";
import { loadMessages, otherMember, sendMediaMessage } from "@/lib/server/dm";
import type { ChatMedia } from "@/lib/types";

export const POST = route(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const id = intParam((await params).id);
  otherMember(id, me.id);
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) throw new HttpError(400, "Choose a photo, video, audio file or document.");
  const saved = await saveChatUpload(file);
  const media: ChatMedia = { ...saved, kind: form.get("circle") === "1" && saved.kind === "video" ? "circle" : saved.kind };
  const messageId = sendMediaMessage(id, me.id, media);
  return { message: loadMessages(id, messageId - 1, me.id).find((m) => m.id === messageId) };
});
