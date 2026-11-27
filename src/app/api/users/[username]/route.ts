import { route, HttpError } from "@/lib/server/http";
import { all, get, now } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import { userLite } from "@/lib/server/queries";
import type { Profile } from "@/lib/types";

export const GET = route(async (_req, { params }: { params: Promise<{ username: string }> }) => {
  const me = await requireUser();
  const username = decodeURIComponent((await params).username);
  const r = get<{
    id: number;
    username: string;
    name: string;
    last_name: string;
    avatar: string | null;
    cover: string | null;
    verified: number;
    bio: string;
    website: string;
    post_count: number;
    follower_count: number;
    following_count: number;
    is_following: number;
    is_muted: number;
    follows_you: number;
    has_story: number;
    is_business: number;
    business_category: string;
    friend_status: "none" | "outgoing" | "incoming" | "friends";
  }>(
    `SELECT u.id, u.username, u.name, u.last_name, u.avatar, u.cover, u.verified, u.bio, u.website, u.is_business, u.business_category,
       (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS post_count,
       u.imported_follower_count + (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count,
       u.imported_following_count + (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count,
       EXISTS (SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) AS is_following,
       EXISTS (SELECT 1 FROM user_mutes WHERE muter_id = ? AND muted_id = u.id) AS is_muted,
       EXISTS (SELECT 1 FROM follows WHERE follower_id = u.id AND following_id = ?) AS follows_you,
       CASE
         WHEN EXISTS (SELECT 1 FROM friend_requests fr WHERE fr.status = 'accepted' AND ((fr.requester_id = ? AND fr.addressee_id = u.id) OR (fr.requester_id = u.id AND fr.addressee_id = ?))) THEN 'friends'
         WHEN EXISTS (SELECT 1 FROM friend_requests fr WHERE fr.status = 'pending' AND fr.requester_id = ? AND fr.addressee_id = u.id) THEN 'outgoing'
         WHEN EXISTS (SELECT 1 FROM friend_requests fr WHERE fr.status = 'pending' AND fr.requester_id = u.id AND fr.addressee_id = ?) THEN 'incoming'
         ELSE 'none'
       END AS friend_status,
       EXISTS (SELECT 1 FROM stories WHERE user_id = u.id AND expires_at > ?) AS has_story
     FROM users u WHERE u.username = ?`,
    me.id,
    me.id,
    me.id,
    me.id,
    me.id,
    me.id,
    me.id,
    now(),
    username,
  );
  if (!r) throw new HttpError(404, "Sorry, this page isn't available.");

  // "Followed by …": people you follow who also follow this profile.
  const mutualFrom = `FROM follows f JOIN users u ON u.id = f.follower_id
     WHERE f.following_id = ? AND f.follower_id IN (SELECT following_id FROM follows WHERE follower_id = ?)`;
  const mutualUsers =
    r.id === me.id
      ? []
      : all<{ uid: number; username: string; name: string; avatar: string | null; verified: number }>(
          `SELECT u.id AS uid, u.username, u.name, u.avatar, u.verified ${mutualFrom} ORDER BY f.created_at DESC LIMIT 3`,
          r.id,
          me.id,
        ).map(userLite);
  const mutualCount = mutualUsers.length ? get<{ n: number }>(`SELECT COUNT(*) AS n ${mutualFrom}`, r.id, me.id)!.n : 0;

  const profile: Profile = {
    id: r.id,
    username: r.username,
    name: r.name,
    lastName: r.last_name,
    avatar: r.avatar,
    cover: r.cover,
    verified: !!r.verified,
    bio: r.bio,
    website: r.website,
    postCount: r.post_count,
    followerCount: r.follower_count,
    followingCount: r.following_count,
    isFollowing: !!r.is_following,
    isMuted: !!r.is_muted,
    followsYou: !!r.follows_you,
    isMe: r.id === me.id,
    hasStory: !!r.has_story,
    isBusiness: !!r.is_business,
    businessCategory: r.business_category,
    mutuals: { users: mutualUsers, count: mutualCount },
    friendStatus: r.friend_status,
  };
  return { profile };
});
