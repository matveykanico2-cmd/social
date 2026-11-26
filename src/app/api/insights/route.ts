import { route } from "@/lib/server/http";
import { get, all } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";

export const GET = route(async () => {
  const me = await requireUser();
  const posts = get<{ n: number }>("SELECT COUNT(*) AS n FROM posts WHERE user_id = ? AND archived_at IS NULL", me.id)!.n;
  const reels = get<{ n: number }>("SELECT COUNT(*) AS n FROM posts WHERE user_id = ? AND type = 'reel' AND archived_at IS NULL", me.id)!.n;
  const likes = get<{ n: number }>("SELECT COUNT(*) AS n FROM likes l JOIN posts p ON p.id = l.post_id WHERE p.user_id = ? AND p.archived_at IS NULL", me.id)!.n;
  const comments = get<{ n: number }>("SELECT COUNT(*) AS n FROM comments c JOIN posts p ON p.id = c.post_id WHERE p.user_id = ? AND p.archived_at IS NULL", me.id)!.n;
  const followers = get<{ n: number }>("SELECT COUNT(*) AS n FROM follows WHERE following_id = ?", me.id)!.n;
  const following = get<{ n: number }>("SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?", me.id)!.n;
  const stories = get<{ n: number }>("SELECT COUNT(*) AS n FROM stories WHERE user_id = ?", me.id)!.n;
  const storyViews = get<{ n: number }>("SELECT COUNT(*) AS n FROM story_views sv JOIN stories s ON s.id = sv.story_id WHERE s.user_id = ?", me.id)!.n;
  const live = get<{ n: number }>("SELECT COUNT(*) AS n FROM live_streams WHERE host_id = ?", me.id)!.n;
  const liveViewers = get<{ n: number }>("SELECT COUNT(*) AS n FROM live_viewers lv JOIN live_streams ls ON ls.id = lv.stream_id WHERE ls.host_id = ?", me.id)!.n;
  const daily = all<{ day: string; posts: number; likes: number; comments: number }>(
    `SELECT date(datetime(p.created_at / 1000, 'unixepoch')) AS day,
      COUNT(DISTINCT p.id) AS posts,
      COUNT(DISTINCT l.user_id || ':' || l.post_id) AS likes,
      COUNT(DISTINCT c.id) AS comments
     FROM posts p
     LEFT JOIN likes l ON l.post_id = p.id
     LEFT JOIN comments c ON c.post_id = p.id
     WHERE p.user_id = ? AND p.archived_at IS NULL AND p.created_at >= ?
     GROUP BY day ORDER BY day`, me.id, Date.now() - 30 * 86_400_000,
  );
  return { periodDays: 30, totals: { posts, reels, likes, comments, followers, following, stories, storyViews, live, liveViewers }, daily };
});
