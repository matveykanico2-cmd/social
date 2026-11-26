import { route } from "@/lib/server/http";
import { all } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/admin";

export const GET = route(async () => {
  await requireAdmin();
  const logs = all<{ id: number; action: string; ip: string | null; created_at: number; username: string | null }>(
    `SELECT a.id, a.action, a.ip, a.created_at, u.username
     FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.id DESC LIMIT 100`,
  );
  return { logs };
});
