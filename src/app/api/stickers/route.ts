import { route } from "@/lib/server/http";
import { all } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";

export const GET = route(async () => {
  await requireUser();
  return { packs: all<{ id: number; name: string; emoji: string; label: string }>("SELECT p.id, p.name, s.emoji, s.label FROM sticker_packs p JOIN stickers s ON s.pack_id = p.id ORDER BY p.id, s.id") };
});
