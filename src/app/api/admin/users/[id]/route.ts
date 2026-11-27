import { route, intParam, jsonBody, HttpError } from "@/lib/server/http";
import { get, run } from "@/lib/server/db";
import { requireAdmin, requireOwner } from "@/lib/server/admin";

export const PATCH = route(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const me = await requireAdmin();
  const id = intParam((await params).id);
  const body = await jsonBody<{ verified?: boolean; role?: "admin" | "user" }>(req);
  if (body.role !== undefined) {
    if (me.role !== "owner") await requireOwner();
    if (id === me.id) throw new HttpError(400, "You can't change your own admin role.");
    const result = run("UPDATE users SET role = ? WHERE id = ?", body.role, id);
    if (!result.changes) throw new HttpError(404, "User not found.");
    return;
  }
  const result = run("UPDATE users SET verified = ? WHERE id = ?", body.verified ? 1 : 0, id);
  if (!result.changes) throw new HttpError(404, "User not found.");
});

export const DELETE = route(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const me = await requireAdmin();
  const id = intParam((await params).id);
  if (id === me.id) throw new HttpError(400, "You can't delete the admin account.");
  if (!get("SELECT 1 FROM users WHERE id = ?", id)) throw new HttpError(404, "User not found.");
  run("DELETE FROM users WHERE id = ?", id);
});
