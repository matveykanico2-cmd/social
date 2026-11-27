import { route } from "@/lib/server/http";
import { all } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";

/** Export the authenticated user's portable data without passwords, sessions or TOTP secrets. */
export const GET = route(async () => {
  const me = await requireUser();
  const posts = all<Record<string, unknown>>("SELECT id, type, caption, location, archived_at, created_at FROM posts WHERE user_id = ? ORDER BY id", me.id);
  const comments = all<Record<string, unknown>>("SELECT id, post_id, text, parent_id, attachment_url, attachment_kind, created_at FROM comments WHERE user_id = ? ORDER BY id", me.id);
  const stories = all<Record<string, unknown>>("SELECT id, url, kind, created_at, expires_at FROM stories WHERE user_id = ? ORDER BY id", me.id);
  const memberships = all<Record<string, unknown>>(
    `SELECT c.id, c.kind, c.title, c.created_at, cm.role, cm.joined_at
     FROM conversation_members cm JOIN conversations c ON c.id = cm.conversation_id
     WHERE cm.user_id = ? ORDER BY c.id`,
    me.id,
  );
  const messages = all<Record<string, unknown>>(
    "SELECT id, conversation_id, kind, text, media_url, media_kind, media_name, voice_url, created_at, edited_at FROM messages WHERE sender_id = ? ORDER BY id",
    me.id,
  );
  const follows = all<Record<string, unknown>>("SELECT follower_id, following_id, created_at FROM follows WHERE follower_id = ? OR following_id = ?", me.id, me.id);
  const profile = {
    id: me.id,
    username: me.username,
    email: me.email,
    phone: me.phone,
    name: me.name,
    lastName: me.last_name,
    bio: me.bio,
    website: me.website,
    avatar: me.avatar,
    cover: me.cover,
    verified: !!me.verified,
    privateAccount: !!me.private_account,
    showActivity: !!me.show_activity,
    allowMessages: !!me.allow_messages,
    createdAt: me.created_at,
  };
  return {
    exportedAt: new Date().toISOString(),
    profile,
    posts,
    comments,
    stories,
    conversationMemberships: memberships,
    messages,
    follows,
  };
});
