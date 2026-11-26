import { route, intParam, HttpError } from "@/lib/server/http";
import { get, run } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { deleteUpload } from "@/lib/server/media";

export const DELETE = route(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const id = intParam((await params).id);
  const listing = get<{ user_id: number; image_url: string | null }>("SELECT user_id, image_url FROM marketplace_listings WHERE id = ?", id);
  if (!listing || listing.user_id !== me.id) throw new HttpError(404, "Listing not found.");
  run("UPDATE marketplace_listings SET status = 'removed', updated_at = ? WHERE id = ?", Date.now(), id);
  await deleteUpload(listing.image_url);
});
