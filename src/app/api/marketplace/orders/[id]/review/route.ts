import { route, intParam, jsonBody, HttpError } from "@/lib/server/http";
import { get, run } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";

export const POST = route(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const id = intParam((await params).id);
  const order = get<{ seller_id: number; buyer_id: number; status: string }>("SELECT seller_id, buyer_id, status FROM orders WHERE id = ? AND buyer_id = ?", id, me.id);
  if (!order || order.status !== "paid") throw new HttpError(400, "Reviews are available after payment is marked complete.");
  if (get("SELECT 1 FROM marketplace_reviews WHERE order_id = ?", id)) throw new HttpError(409, "This order already has a review.");
  const body = await jsonBody<{ rating: number; text?: string }>(req);
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, "Rating must be between 1 and 5.");
  run("INSERT INTO marketplace_reviews (order_id, author_id, seller_id, rating, text, created_at) VALUES (?, ?, ?, ?, ?, ?)", id, me.id, order.seller_id, rating, String(body.text ?? "").trim().slice(0, 1000), Date.now());
  return { ok: true };
});
