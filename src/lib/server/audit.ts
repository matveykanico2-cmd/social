import { run } from "./db";

export function audit(userId: number | null, action: string, req?: Request, metadata: Record<string, unknown> = {}) {
  const ip = req?.headers.get("x-real-ip")?.trim() || req?.headers.get("cf-connecting-ip")?.trim() || null;
  run("INSERT INTO audit_logs (user_id, action, ip, metadata, created_at) VALUES (?, ?, ?, ?, ?)", userId, action.slice(0, 80), ip, JSON.stringify(metadata).slice(0, 2000), Date.now());
}
