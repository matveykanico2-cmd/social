import { route } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { queryUsers } from "@/lib/server/queries";
import { all } from "@/lib/server/db";
import { queryPosts } from "@/lib/server/queries";
import { topHashtags } from "@/lib/search";

export const GET = route(async (req) => {
  const me = await requireUser();
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().replace(/^@/, "");
  if (!q) {
    const recent = all<{ caption: string }>("SELECT caption FROM posts WHERE archived_at IS NULL AND created_at >= ? ORDER BY created_at DESC LIMIT 200", Date.now() - 30 * 86_400_000);
    return { users: [], posts: [], hashtags: topHashtags(recent.map((row) => row.caption)), locations: [], trends: topHashtags(recent.map((row) => row.caption)).slice(0, 8) };
  }
  const like = `%${q.replace(/[%_\\]/g, (c) => "\\" + c)}%`;
  const postQuery = q.replace(/^#/, "");
  const posts = queryPosts(me.id, "p.archived_at IS NULL AND (p.caption LIKE ? ESCAPE '\\' OR p.location LIKE ? ESCAPE '\\')", [`%${postQuery}%`, `%${postQuery}%`], "ORDER BY p.created_at DESC LIMIT 30");
  const hashtags = topHashtags(all<{ caption: string }>("SELECT caption FROM posts WHERE archived_at IS NULL AND caption LIKE ? ORDER BY created_at DESC LIMIT 100", `%#${postQuery}%`).map((row) => row.caption));
  const locations = all<{ location: string }>("SELECT DISTINCT location FROM posts WHERE archived_at IS NULL AND location != '' AND location LIKE ? ORDER BY location LIMIT 20", `%${postQuery}%`).map((row) => row.location);
  return {
    users: queryUsers(
      me.id,
      `FROM users u WHERE u.username LIKE ? ESCAPE '\\' OR u.name LIKE ? ESCAPE '\\'
       ORDER BY (u.username LIKE ? ESCAPE '\\') DESC,
         (SELECT COUNT(*) FROM follows WHERE following_id = u.id) DESC LIMIT 30`,
      [like, like, `${like.slice(1)}`],
    ),
    posts,
    hashtags,
    locations,
    trends: hashtags,
  };
});
