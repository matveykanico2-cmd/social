# Instagram + Shalter feature matrix

Источник обязательных пунктов: `INSTAGRAM_FEATURES_SHALTER.md`. Social использует собственную реализацию и одну SQLite-базу; внешние сервисы не маскируются под готовые функции.

| Раздел | Реализовано | Ограничения | Код / проверка |
|---|---|---|---|
| Accounts and login | email/phone signup, sessions, recovery, password, multi-account, language, theme | 2FA, passkeys, OAuth, age policy | `src/app/(auth)`, `src/lib/server/auth.ts`; build + Vitest |
| Profiles | avatar, cover, username, bio, links, tabs, follow, friend request, message, gifts, highlights | QR, full business contacts, pinned posts | `src/app/(main)/[username]`; build |
| Feed and Explore | feed, explore, search, saves, likes, recommendations | full ranking, trends, hashtags, places | `/api/feed`, `/api/explore`, `/api/search`; build |
| Posts | photo/video carousel, captions, location, edit/delete, share, comments, replies, attachments, reactions | crop/filter editor, mentions/hashtags parsing, drafts/scheduling/collabs | `/api/posts`, `PostView`; build + 66 tests |
| Comments | create, nested replies, likes, ownership deletion, photo/video/GIF attachment | document attachments, moderation filter, pagination/pinning | `/api/posts/[id]/comments`, `post-view.tsx`; build |
| Stories | upload, expiry, fullscreen viewer, progress, viewers, reply to Direct, delete, archive/highlights | polls, questions, mentions, close friends, music, effects | `/api/stories`, `story-viewer.tsx`; build |
| Reels | vertical route, upload, autoplay UI, likes, comments, saves, sharing | transcoding, clip editor, remix/audio/subtitles | `/reels`, `/api/reels`; build |
| Direct / Messenger | groups, channels, folders, archive, invite links, text, media, docs, audio, voice, circles, stickers, polls, reactions, reply, edit/delete, forward, read/last-seen, typing, themes, calls | WebSocket realtime, reconnect events, group WebRTC/TURN, disappearing media, E2E | `src/components/direct.tsx`, `/api/conversations/*`; build + Vitest |
| Search | user/post basic search, recent searches | full hashtags, places, trends and ranking | `/api/search`, panels; build |
| Notifications | likes, comments, follows, friend requests, push foundation, read state | category preferences, event deduplication, full email categories | `/api/notifications`, panels; build |
| Live | rooms, viewers, route/UI | RTMP, recording, guests, realtime moderation | `/api/live`; build |
| Professional tools | business flag/category, admin panel, server stats | creator analytics dashboard, scheduler, ads cabinet | admin/settings; build |
| Commerce | Marketplace listings, image, categories, search, seller chat, admin removal, gifts | payments, orders, anti-fraud, payouts | `/marketplace`, `/api/marketplace`; build |
| Security/moderation | HTTP-only sessions, ownership checks, blocks, reports, admin roles, MIME/size limits, write/auth rate limits, Origin checks, security headers | MIME sniffing/quarantine, 2FA, audit log | auth/admin/media/security guard; build + 69 tests |
| UX/mobile | responsive nav, themes, avatar fallback, loading/error boundaries, PWA manifest, Russian default | Playwright viewport matrix, native Android/Desktop, offline queue | CSS/nav/PWA; production build |

## Verification

`npm run check` is the required gate: ESLint, TypeScript, Vitest and production build. Current code passes 66 tests and builds 66 routes. Infrastructure-dependent items remain explicitly marked instead of being represented by mock buttons.
