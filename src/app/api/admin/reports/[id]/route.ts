import { route, intParam, jsonBody, HttpError } from "@/lib/server/http";
import { get, run } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/admin";

export const PATCH = route(async (req, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const status = String((await jsonBody<{ status?: string }>(req)).status ?? "");
  if (!["open", "resolved", "rejected"].includes(status)) throw new HttpError(400, "Invalid report status.");
  const id = intParam((await params).id);
  if (!get("SELECT 1 FROM reports WHERE id = ?", id)) throw new HttpError(404, "Report not found.");
  run("UPDATE reports SET status = ? WHERE id = ?", status, id);
  return { ok: true };
});
