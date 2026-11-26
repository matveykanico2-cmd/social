import { route, intParam, HttpError } from "@/lib/server/http";
import { get, run } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/admin";
import { deleteUpload } from "@/lib/server/media";

export const DELETE = route(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const id = intParam((await params).id);
  const listing = get<{ image_url: string | null }>("SELECT image_url FROM marketplace_listings WHERE id = ?", id);
  if (!listing) throw new HttpError(404, "Listing not found.");
  run("UPDATE marketplace_listings SET status = 'moderated', updated_at = ? WHERE id = ?", Date.now(), id);
  await deleteUpload(listing.image_url);
});
