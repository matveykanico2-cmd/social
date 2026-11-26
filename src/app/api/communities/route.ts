import { route, jsonBody, HttpError } from "@/lib/server/http";
import { all, now, run, tx } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { saveUpload } from "@/lib/server/media";
import type { Community } from "@/lib/types";

type CommunityRow = { id: number; name: string; slug: string; description: string; avatar: string | null; birthday: string | null; owner_id: number; is_private: number; member_count: number; joined: number; role: Community["role"] };

function load(viewerId: number) {
  return all<CommunityRow>(
    `SELECT c.*, COUNT(DISTINCT cm.user_id) AS member_count,
       EXISTS (SELECT 1 FROM community_members x WHERE x.community_id = c.id AND x.user_id = ?) AS joined,
       (SELECT role FROM community_members x WHERE x.community_id = c.id AND x.user_id = ?) AS role
     FROM communities c LEFT JOIN community_members cm ON cm.community_id = c.id
     WHERE c.is_private = 0 OR c.owner_id = ? OR EXISTS (SELECT 1 FROM community_members x WHERE x.community_id = c.id AND x.user_id = ?)
     GROUP BY c.id ORDER BY c.created_at DESC`,
    viewerId,
    viewerId,
    viewerId,
    viewerId,
  ).map((r) => ({ id: r.id, name: r.name, slug: r.slug, description: r.description, avatar: r.avatar, birthday: r.birthday, ownerId: r.owner_id, memberCount: r.member_count, isPrivate: !!r.is_private, joined: !!r.joined, role: r.role }));
}

export const GET = route(async () => {
  const me = await requireUser();
  return { communities: load(me.id) };
});

export const POST = route(async (req) => {
  const me = await requireUser();
  const multipart = req.headers.get("content-type")?.includes("multipart/form-data");
  const form = multipart ? await req.formData() : null;
  const body = form ? { name: String(form.get("name") ?? ""), slug: String(form.get("slug") ?? ""), description: String(form.get("description") ?? ""), birthday: String(form.get("birthday") ?? ""), isPrivate: form.get("isPrivate") === "1" } : await jsonBody<{ name?: string; slug?: string; description?: string; birthday?: string; isPrivate?: boolean }>(req);
  const name = String(body.name ?? "").trim().slice(0, 60);
  const slug = String(body.slug ?? name).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  if (!name || !slug) throw new HttpError(400, "Add a community name.");
  if (all("SELECT id FROM communities WHERE slug = ?", slug).length) throw new HttpError(409, "This community address is already taken.");
  const avatar = form?.get("avatar");
  const avatarUrl = avatar instanceof File && avatar.size > 0 ? (await saveUpload(avatar, "image")).url : null;
  const id = tx(() => {
    const created = run("INSERT INTO communities (name, slug, description, avatar, birthday, owner_id, is_private, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", name, slug, String(body.description ?? "").trim().slice(0, 500), avatarUrl, body.birthday ? String(body.birthday).slice(0, 10) : null, me.id, body.isPrivate ? 1 : 0, now());
    run("INSERT INTO community_members (community_id, user_id, role, joined_at) VALUES (?, ?, 'owner', ?)", created.id, me.id, now());
    return created.id;
  });
  return { community: load(me.id).find((item) => item.id === id) };
});
