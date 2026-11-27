import { route, jsonBody, HttpError } from "@/lib/server/http";
import { all, get, run, tx } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { conversationBetween } from "@/lib/server/dm";

export const GET = route(async () => {
  const me = await requireUser();
  const orders = all<{ id: number; title: string; status: string; total_fils: number; created_at: number; updated_at: number; seller: string; buyer: string; listing_id: number | null; rating: number | null }>(
    `SELECT o.id, o.title, o.status, o.total_fils, o.created_at, o.updated_at,
      seller.username AS seller, buyer.username AS buyer, o.marketplace_listing_id AS listing_id,
      r.rating
     FROM orders o JOIN users seller ON seller.id = o.seller_id JOIN users buyer ON buyer.id = o.buyer_id
     LEFT JOIN marketplace_reviews r ON r.order_id = o.id
     WHERE o.seller_id = ? OR o.buyer_id = ? ORDER BY o.updated_at DESC LIMIT 100`, me.id, me.id,
  );
  return { orders: orders.map((order) => ({ id: order.id, title: order.title, status: order.status, total: Math.round(order.total_fils / 1000), createdAt: order.created_at, updatedAt: order.updated_at, seller: order.seller, buyer: order.buyer, listingId: order.listing_id, rating: order.rating })) };
});

export const POST = route(async (req) => {
  const me = await requireUser();
  const body = await jsonBody<{ listingId: number; message?: string }>(req);
  const listingId = Number(body.listingId);
  const listing = get<{ id: number; user_id: number; title: string; price: number; status: string }>("SELECT id, user_id, title, price, status FROM marketplace_listings WHERE id = ?", listingId);
  if (!listing || listing.status !== "active") throw new HttpError(404, "Listing is no longer available.");
  if (listing.user_id === me.id) throw new HttpError(400, "You cannot order your own listing.");
  const existing = get<{ id: number }>("SELECT id FROM orders WHERE marketplace_listing_id = ? AND buyer_id = ? AND status NOT IN ('cancelled', 'paid')", listingId, me.id);
  if (existing) return { id: existing.id, existing: true };
  const conversationId = conversationBetween(me.id, listing.user_id);
  const created = Date.now();
  const orderId = tx(() => {
    const order = run("INSERT INTO orders (seller_id, buyer_id, conversation_id, marketplace_listing_id, title, status, total_fils, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'quoted', ?, ?, ?)", listing.user_id, me.id, conversationId, listing.id, listing.title, Math.round(listing.price * 1000), created, created);
    run("INSERT INTO order_items (order_id, description, quantity, unit_fils, position) VALUES (?, ?, 1, ?, 0)", order.id, listing.title, Math.round(listing.price * 1000));
    return order.id;
  });
  return { id: orderId, conversationId, existing: false };
});
