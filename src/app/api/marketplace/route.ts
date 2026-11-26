import { route, HttpError } from "@/lib/server/http";
import { all, run, now } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { saveUpload } from "@/lib/server/media";
import { userLite } from "@/lib/server/queries";

const CATEGORIES = new Set(["Other", "Electronics", "Home", "Clothing", "Vehicles", "Services", "Collectibles"]);

export const GET = route(async (req) => {
  await requireUser();
  const search = new URL(req.url).searchParams;
  const q = search.get("q")?.trim().slice(0, 80) ?? "";
  const category = search.get("category")?.trim() ?? "";
  const rows = all<{
    id: number; user_id: number; title: string; description: string; category: string; location: string; price: number; image_url: string | null; created_at: number;
    uid: number; username: string; name: string; avatar: string | null; verified: number;
  }>(
    `SELECT l.id, l.user_id, l.title, l.description, l.category, l.location, l.price, l.image_url, l.created_at,
       u.id AS uid, u.username, u.name, u.avatar, u.verified
     FROM marketplace_listings l JOIN users u ON u.id = l.user_id
     WHERE l.status = 'active' ${q ? "AND (l.title LIKE ? OR l.description LIKE ? OR l.location LIKE ?)" : ""} ${category && CATEGORIES.has(category) ? "AND l.category = ?" : ""}
     ORDER BY l.created_at DESC LIMIT 100`,
    ...(q ? [`%${q}%`, `%${q}%`, `%${q}%`] : []),
    ...(category && CATEGORIES.has(category) ? [category] : []),
  );
  return { listings: rows.map((r) => ({ id: r.id, title: r.title, description: r.description, category: r.category, location: r.location, price: r.price, imageUrl: r.image_url, createdAt: r.created_at, seller: userLite(r) })) };
});

export const POST = route(async (req) => {
  const me = await requireUser();
  if (!req.headers.get("content-type")?.includes("multipart/form-data")) throw new HttpError(400, "Use a multipart form to create a listing.");
  const form = await req.formData();
  const title = String(form.get("title") ?? "").trim().slice(0, 120);
  const description = String(form.get("description") ?? "").trim().slice(0, 2000);
  const category = String(form.get("category") ?? "Other");
  const location = String(form.get("location") ?? "").trim().slice(0, 120);
  const price = Math.max(0, Math.round(Number(form.get("price") ?? 0)));
  if (!title) throw new HttpError(400, "Add a title.");
  if (!CATEGORIES.has(category)) throw new HttpError(400, "Unknown category.");
  if (!Number.isFinite(price) || price > 2_000_000_000) throw new HttpError(400, "Invalid price.");
  const file = form.get("image");
  const image = file instanceof File && file.size ? await saveUpload(file, "image") : null;
  const created = now();
  const { id } = run("INSERT INTO marketplace_listings (user_id, title, description, category, location, price, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", me.id, title, description, category, location, price, image?.url ?? null, created, created);
  return { id };
});
