import { route } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { all } from "@/lib/server/db";
import { queryPosts } from "@/lib/server/queries";

const PAGE = 8;

// Deterministic 32-bit hash of (id, seed): same seed -> same shuffle, so offset paging is stable.
function rank(id: number, seed: number) {
  let h = Math.imul(id ^ seed, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  return (h ^ (h >>> 13)) >>> 0;
}

// Posts from every account in a random order, videos first. ?seed=<int> fixes the shuffle so
// ?offset=<n> pages through the same order; a new seed gives a new shuffle.
export const GET = route(async (req) => {
  const me = await requireUser();
  const q = new URL(req.url).searchParams;
  const seed = Math.trunc(Number(q.get("seed"))) || 1;
  const offset = Math.max(0, Math.trunc(Number(q.get("offset"))) || 0);

  // shortcut: shuffles every post id in memory; fine for thousands of posts, move to a stored random key beyond that.
  const order = all<{ id: number; video: number }>(
    `SELECT p.id, EXISTS (SELECT 1 FROM post_media WHERE post_id = p.id AND kind = 'video') AS video
       FROM posts p WHERE p.archived_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM user_mutes WHERE muter_id = ? AND muted_id = p.user_id)`,
    me.id,
  )
    .sort((a, b) => b.video - a.video || rank(a.id, seed) - rank(b.id, seed))
    .map((r) => r.id);
  const pageIds = order.slice(offset, offset + PAGE);
  if (pageIds.length === 0) return { posts: [], hasMore: false };

  const byId = new Map(
    queryPosts(me.id, `p.id IN (${pageIds.map(() => "?").join(",")})`, pageIds, "").map((p) => [p.id, p]),
  );
  const posts = pageIds.map((id) => byId.get(id)!).filter(Boolean);
  return { posts, hasMore: offset + PAGE < order.length };
});
