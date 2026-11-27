import { route, intParam, jsonBody, HttpError } from "@/lib/server/http";
import { get, run } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { ORDER_TRANSITIONS } from "@/lib/marketplace";

export const PATCH = route(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const id = intParam((await params).id);
  const order = get<{ seller_id: number; buyer_id: number; status: string }>("SELECT seller_id, buyer_id, status FROM orders WHERE id = ?", id);
  if (!order || (order.seller_id !== me.id && order.buyer_id !== me.id)) throw new HttpError(404, "Order not found.");
  const body = await jsonBody<{ status?: string }>(req);
  const next = String(body.status ?? "");
  if (!ORDER_TRANSITIONS[order.status]?.includes(next)) throw new HttpError(400, "This order status transition is not allowed.");
  if (next === "paid" && order.buyer_id !== me.id) throw new HttpError(403, "Only the buyer can mark an order as paid.");
  if (next === "delivered" && order.seller_id !== me.id) throw new HttpError(403, "Only the seller can mark an order as delivered.");
  run("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?", next, Date.now(), id);
  return { ok: true, status: next };
});

export const GET = route(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const id = intParam((await params).id);
  const order = get<{ seller_id: number; buyer_id: number; title: string; status: string; total_fils: number; created_at: number; updated_at: number }>("SELECT seller_id, buyer_id, title, status, total_fils, created_at, updated_at FROM orders WHERE id = ? AND (seller_id = ? OR buyer_id = ?)", id, me.id, me.id);
  if (!order) throw new HttpError(404, "Order not found.");
  return { order: { ...order, total: Math.round(order.total_fils / 1000) } };
});
