"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Paperclip, X } from "lucide-react";
import { api, compact, timeAgo } from "@/lib/client";
import type { Comment, Post } from "@/lib/types";
import { useApp } from "./app-context";
import { ActionBar, HeartIcon, usePostToggles } from "./post-actions";
import { LikesLine, PostMenu } from "./post-card";
import { MediaCarousel } from "./media";
import { FollowButton, RichText, UserListModal } from "./social";
import { Avatar, Modal, OptionsMenu, Spinner, UserName } from "./ui";

function CommentRow({
  comment,
  canDelete,
  onReply,
  onDelete,
  depth = 0,
}: {
  comment: Comment;
  canDelete: boolean;
  onReply: () => void;
  onDelete: () => void;
  depth?: number;
}) {
  const [c, setC] = useState(comment);
  const [menu, setMenu] = useState(false);
  const toggleLike = async () => {
    const liked = !c.liked;
    setC({ ...c, liked, likeCount: c.likeCount + (liked ? 1 : -1) });
    try {
      await api(`/api/comments/${c.id}/like`, { method: liked ? "POST" : "DELETE" });
    } catch {
      setC(c);
    }
  };
  return (
    <div className={`group flex gap-3.5 py-2 ${depth ? "ml-8 border-l-2 border-separator pl-3" : ""}`}>
      <Link href={`/${c.user.username}`}>
        <Avatar src={c.user.avatar} size={32} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="break-words">
          <UserName user={c.user} className="mr-1" />
          <RichText text={c.text} />
          {c.attachment && (c.attachment.kind === "video" ? <video src={c.attachment.url} controls playsInline className="mt-2 max-h-64 max-w-full rounded-xl" /> : <CommentImage src={c.attachment.url} />)}
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted">
          <span title={new Date(c.createdAt).toLocaleString()}>{timeAgo(c.createdAt)}</span>
          {c.likeCount > 0 && <span className="font-semibold">{c.likeCount} {c.likeCount === 1 ? "like" : "likes"}</span>}
          <button className="font-semibold" onClick={onReply}>
            Reply
          </button>
          {canDelete && (
            <button className="opacity-0 group-hover:opacity-100 max-md:opacity-100" onClick={() => setMenu(true)} aria-label="Comment options">
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>
      </div>
      <button className="mt-1 self-start hover:opacity-50" onClick={toggleLike} aria-label="Like comment">
        <HeartIcon filled={c.liked} size={12} />
      </button>
      {menu && (
        <OptionsMenu
          onClose={() => setMenu(false)}
          options={[
            {
              label: "Delete",
              danger: true,
              onClick: async () => {
                setMenu(false);
                await api(`/api/comments/${c.id}`, { method: "DELETE" });
                onDelete();
              },
            },
          ]}
        />
      )}
    </div>
  );
}

function CommentImage({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Comment attachment" className="mt-2 max-h-64 max-w-full rounded-xl object-cover" />;
}

/**
 * Full post with comments. layout="split" puts media left / comments right (desktop modal + post page);
 * it collapses to a stacked layout on small screens.
 */
export function PostView({
  post: initial,
  onChange,
  onClose,
}: {
  post: Post;
  onChange?: (post: Post | null) => void;
  onClose?: () => void;
}) {
  const { me, toast } = useApp();
  const [post, setPostState] = useState(initial);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [menu, setMenu] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const attachmentInput = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const setPost = (p: Post) => {
    setPostState(p);
    onChange?.(p);
  };
  const { like, save } = usePostToggles(post, setPost);

  useEffect(() => {
    api<{ post: Post; comments: Comment[] }>(`/api/posts/${initial.id}`)
      .then((d) => {
        setPostState(d.post);
        setComments(d.comments);
      })
      .catch((e) => toast(e.message));
  }, [initial.id, toast]);

  const submit = async () => {
    const t = text.trim();
    if ((!t && !attachment) || sending) return;
    setSending(true);
    try {
      const body = new FormData();
      body.set("text", t);
      if (replyTo) body.set("parentId", String(replyTo.id));
      if (attachment) body.set("file", attachment);
      const { comment } = await api<{ comment: Comment }>(`/api/posts/${post.id}/comments`, { body });
      setComments((c) => [...(c ?? []), comment]);
      setPost({ ...post, commentCount: post.commentCount + 1 });
      setText("");
      setAttachment(null);
      setReplyTo(null);
      requestAnimationFrame(() => list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" }));
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const header = (
    <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-separator px-4">
      <Link href={`/${post.user.username}`} onClick={onClose}>
        <Avatar src={post.user.avatar} size={32} />
      </Link>
      <div className="min-w-0 flex-1 leading-[18px]">
        <div className="flex items-center gap-1">
          <UserName user={post.user} />
          {post.user.id !== me.id && !post.user.isFollowing && (
            <>
              <span>•</span>
              <FollowButton
                variant="link"
                username={post.user.username}
                isFollowing={false}
                onChange={(f) => setPost({ ...post, user: { ...post.user, isFollowing: f } })}
              />
            </>
          )}
        </div>
        {post.location && <div className="truncate text-xs">{post.location}</div>}
      </div>
      <button onClick={() => setMenu(true)} className="p-1 hover:opacity-50" aria-label="More options">
        <MoreHorizontal size={22} />
      </button>
    </header>
  );

  return (
    <div className="flex h-full w-full flex-col bg-bg md:flex-row">
      <div className="md:hidden">{header}</div>
      <div className="flex shrink-0 items-center justify-center bg-black md:h-full md:min-w-0 md:flex-1">
        <div className="w-full max-md:aspect-[4/5] md:h-full">
          <MediaCarousel media={post.media} onDoubleTap={() => like(true)} fit="contain" dotsInside />
        </div>
      </div>

      <div className="flex min-h-0 flex-col md:w-[405px] md:shrink-0 md:border-l md:border-separator">
        <div className="hidden md:block">{header}</div>

        <div ref={list} className="min-h-[120px] flex-1 overflow-y-auto px-4 pt-2 max-md:order-2">
          {post.caption && (
            <div className="flex gap-3.5 py-2">
              <Avatar src={post.user.avatar} size={32} />
              <div className="min-w-0 flex-1">
                <div className="whitespace-pre-line break-words">
                  <UserName user={post.user} className="mr-1" />
                  <RichText text={post.caption} />
                </div>
                <div className="mt-1.5 text-xs text-muted">{timeAgo(post.createdAt)}</div>
              </div>
            </div>
          )}
          {comments === null ? (
            <div className="flex justify-center py-6">
              <Spinner size={24} />
            </div>
          ) : comments.length === 0 && !post.caption ? (
            <div className="flex flex-col items-center py-16 text-center">
              <p className="text-2xl font-bold">No comments yet.</p>
              <p className="mt-2 text-muted">Start the conversation.</p>
            </div>
          ) : (
            comments.map((c) => (
              <CommentRow
                key={c.id}
                comment={c}
                canDelete={c.user.id === me.id || post.user.id === me.id}
                onReply={() => {
                  setReplyTo(c);
                  setText(`@${c.user.username} `);
                  input.current?.focus();
                }}
                onDelete={() => {
                  setComments((cs) => cs!.filter((x) => x.id !== c.id));
                  setPost({ ...post, commentCount: post.commentCount - 1 });
                }}
                depth={c.parentId ? 1 : 0}
              />
            ))
          )}
        </div>

        <div className="border-t border-separator px-4 pb-2 max-md:order-1 max-md:border-t-0">
          <ActionBar post={post} onLike={() => like()} onSave={save} onComment={() => input.current?.focus()} />
          <LikesLine post={post} onOpen={() => setShowLikes(true)} />
          <div className="mt-1 text-xs uppercase tracking-wide text-muted">{timeAgo(post.createdAt, true)}</div>
        </div>

        <form
          className="flex items-center gap-3 border-t border-separator px-4 py-2 max-md:order-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {replyTo && <div className="absolute bottom-[52px] left-0 right-0 rounded-xl border border-border bg-elevated px-3 py-2 text-xs shadow-lg"><span className="font-semibold">Replying to @{replyTo.user.username}</span><button type="button" className="float-right text-link" onClick={() => { setReplyTo(null); setText(""); }}>Cancel</button></div>}
          <Avatar src={me.avatar} size={32} className="md:hidden" />
          <input ref={attachmentInput} type="file" accept="image/*,video/*,.gif" className="hidden" onChange={(e) => { setAttachment(e.target.files?.[0] ?? null); e.target.value = ""; }} />
          <button type="button" onClick={() => attachmentInput.current?.click()} className="shrink-0 text-muted hover:text-link" aria-label="Attach photo or video" title="Attach photo or video"><Paperclip size={19} /></button>
          <input
            ref={input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            className="min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:text-muted"
            maxLength={2200}
          />
          <button
            disabled={(!text.trim() && !attachment) || sending}
            className="font-semibold text-link hover:text-link-text disabled:opacity-30"
          >
            Post
          </button>
        </form>
        {attachment && <div className="border-t border-separator px-4 py-2 text-xs text-muted">Attached: {attachment.name} <button type="button" className="ml-2 font-semibold text-link" onClick={() => setAttachment(null)}>Remove</button></div>}
      </div>

      {menu && (
        <PostMenu
          post={post}
          hideGoToPost={!onClose}
          onClose={() => setMenu(false)}
          onDeleted={() => {
            onChange?.(null);
            onClose?.();
          }}
          onUnfollow={() => setPost({ ...post, user: { ...post.user, isFollowing: false } })}
        />
      )}
      {showLikes && <UserListModal title="Likes" url={`/api/posts/${post.id}/likes`} onClose={() => setShowLikes(false)} />}
    </div>
  );
}

/** The post modal opened from grids and "View all comments". */
export function PostModal() {
  const { modalPost, closePost } = useApp();
  if (!modalPost) return null;
  return (
    <Modal onClose={closePost} className="h-[calc(100dvh-32px)] w-full max-w-[1200px] rounded-none md:h-[min(90vh,900px)] md:rounded-[4px]" showClose={false}>
      <button onClick={closePost} className="fixed right-3 top-3 z-10 p-2 text-white max-md:hidden" aria-label="Close">
        <X size={28} />
      </button>
      <div className="flex h-full flex-col overflow-y-auto md:overflow-hidden">
        <div className="flex items-center border-b border-separator p-2 md:hidden">
          <button onClick={closePost} className="p-1" aria-label="Close">
            <X size={24} />
          </button>
          <span className="flex-1 text-center font-semibold">Post</span>
          <span className="w-8" />
        </div>
        <PostView key={modalPost.post.id} post={modalPost.post} onChange={modalPost.onChange} onClose={closePost} />
      </div>
    </Modal>
  );
}

export function PostGrid({
  posts,
  onChange,
  explore = false,
}: {
  posts: Post[];
  onChange?: (id: number, post: Post | null) => void;
  /** Explore layout: every block of 5 has one tall tile, alternating right and left. */
  explore?: boolean;
}) {
  const { openPost } = useApp();
  const tall = (i: number) => (i % 10 === 2 ? "col-start-3 row-span-2" : i % 10 === 5 ? "col-start-1 row-span-2" : null);
  return (
    <div className={`grid grid-cols-3 gap-[3px] md:gap-1 ${explore ? "grid-flow-dense" : ""}`}>
      {posts.map((p, i) => {
        const thumb = p.media[0];
        const big = explore ? tall(i) : null;
        return (
          <button
            key={p.id}
            onClick={() => openPost(p, (np) => onChange?.(p.id, np))}
            className={`group relative overflow-hidden bg-secondary ${big ?? "aspect-[3/4]"}`}
          >
            {thumb?.kind === "video" ? (
              <video src={thumb.url} muted preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb?.url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            )}
            {p.media.length > 1 && <GridBadge kind="carousel" />}
            {p.type === "reel" && <GridBadge kind="reel" />}
            <span className="absolute inset-0 hidden items-center justify-center gap-7 bg-black/30 font-bold text-white group-hover:flex">
              <span className="flex items-center gap-1.5">
                <HeartIcon filled={false} size={20} /> {compact(p.likeCount)}
              </span>
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" />
                </svg>
                {compact(p.commentCount)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function GridBadge({ kind }: { kind: "carousel" | "reel" }) {
  return (
    <span className="absolute right-2 top-2 text-white drop-shadow">
      {kind === "carousel" ? (
        <svg viewBox="0 0 48 48" width="20" height="20" fill="currentColor">
          <path d="M34.8 29.7V11c0-2.9-2.3-5.2-5.2-5.2H11c-2.9 0-5.2 2.3-5.2 5.2v18.7c0 2.9 2.3 5.2 5.2 5.2h18.7c2.8-.1 5.1-2.4 5.1-5.2zM39.2 15v16.1c0 4.5-3.7 8.2-8.2 8.2H14.9c-.6 0-.9.7-.5 1.1 1 1.1 2.4 1.8 4.1 1.8h13.4c5.7 0 10.3-4.6 10.3-10.3V18.5c0-1.6-.7-3.1-1.8-4.1-.5-.4-1.2 0-1.2.6z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm4.5 6v7l6-3.5Z" />
        </svg>
      )}
    </span>
  );
}
