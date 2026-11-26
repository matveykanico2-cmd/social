# SHALTER → SOCIAL migration checklist

Audit source: `/tmp/shalter-upstream.4Zs9CB` (clone of `matveykanico2-cmd/Shalter`).  
Destination: `matveykanico2-cmd/social`, branch `feature/full-shalter-migration`.  
The donor repository is read-only for this migration.

Status meanings: **done** = implemented in the unified Social runtime; **partial** = an equivalent exists but some donor capabilities remain; **todo** = not yet integrated.

## Backend modules (`apps/api/src/modules`)

| Donor module | Social destination / API | Status | Verification / remaining work |
|---|---|---:|---|
| admin | `src/app/api/admin/*`, `src/app/(main)/admin` | partial | Users, posts, server health, verification and reports work; donor audit tools remain. |
| ads, promotions, donation-alerts, partners | — | todo | Need billing/placement model before production use. |
| auth, sessions, profiles, users, usernames | `src/lib/server/auth.ts`, `src/app/api/auth/*`, `src/app/api/users/*` | partial | Unified cookie sessions, password recovery, multi-account, profiles and uploaded profile covers work; donor OAuth/passkeys/2FA remain. |
| background | — | todo | Requires worker process and job ownership model. |
| bootstrap, common, db | `src/lib/server/db.ts`, `db/schema.sql`, `db/migrate.mjs` | partial | Safe SQLite migrations exist; donor PostgreSQL/worker-specific adapters remain. |
| bots | `src/app/api/bots/*`, `src/app/(main)/bots` | partial | Bot CRUD, avatars, commands and webhook work; full donor Bot API/Mini Apps remain. |
| calls, realtime | `src/app/api/calls/*`, `src/app/api/conversations/*/calls`, `src/components/call-overlay.tsx` | partial | WebRTC audio/video signaling works; WebSocket, group calls, TURN and recovery remain. |
| channels, chats, folders, messages | `src/app/api/conversations/*`, `src/app/api/channels`, `src/app/api/chat-folders`, `src/lib/server/dm.ts` | partial | DM/groups/channels with avatars, roles, folders, reactions, reply, pin, edit, delete, forward, media, voice, polls and themes work; typing/online/archive/invites remain. |
| communities | `src/app/api/communities/*`, `src/app/(main)/communities` | partial | Communities, avatars, roles, birthday, privacy and posts work; donor discovery rules remain. |
| contacts, nearby | — | todo | Requires contact permission/geo privacy policy. |
| downloads, export, share-target, short-links | `/api/share`, media routes | partial | Sharing and media serving work; donor download/export/share-target contracts remain. |
| exchange, stars, premium, purchase | — | todo | Requires payment provider and accounting model; no fake payment implementation added. |
| games | — | todo | Donor games and leaderboards require sandboxed asset/API integration. |
| gifts, stickers | Gifts: `src/app/api/gifts`, `src/app/api/conversations/*/gifts`; stickers: UI emoji fallback | partial | Gifts work; donor sticker catalog/assets remain. |
| live | `src/app/api/live/*`, `src/app/(main)/live` | partial | Live rooms and viewer records work; RTMP ingest/transcoding remains. |
| posts, stories, topics, search | `src/app/api/posts/*`, `stories/*`, `/api/search`, `/api/explore` | partial | Social feed, Stories, Reels, comments and search work; donor topic/search ranking remains. |
| mini-apps, oauth | — | todo | Requires signed app manifest and token scopes. |
| push | `src/lib/server/push.ts`, `/api/push/*`, `public/sw.js` | partial | Web Push subscription works when VAPID is configured; native push remains. |
| reports | `/api/reports`, `/api/admin/reports/[id]` | done | User reports and admin resolution verified through build and route smoke tests. |
| settings, ui-language, translate | `src/app/(main)/accounts/edit`, `src/components/app-context.tsx` | partial | Privacy/account/theme/session settings and English/Russian preference work; donor translation services remain. |
| shalter-ai | — | todo | Requires explicit AI provider and privacy/limits configuration. |
| uploads | `src/lib/server/media.ts`, media routes | partial | Local authenticated upload/serving works; S3 and donor media workers remain. |
| version, link-check, support, hugo | — | todo | Operational/documentation modules; no direct Social equivalent yet. |

## Frontend modules (`apps/web/src`)

| Donor area | Social destination | Status |
|---|---|---:|
| entities/chat, message, session, settings, user, story, community | `src/components/direct.tsx`, profile/story/community pages, auth/settings | partial |
| entities/game, gift, stars, topic, safety-label, report | gifts/reports exist; games/stars/safety labels remain | partial |
| features/accounts, sign-in, sign-out, open-profile, usernames | auth, multi-account and profile routes | partial |
| features/send-message, thread, message-actions, chat-actions | unified Direct thread and message menu | partial |
| features/create-chat, edit-chat, manage-members, contact-bar | new message, group/channel/member APIs | partial |
| features/chat-folders, chat-search, chat-wallpaper | folders, search and wallpaper controls | done |
| features/call | WebRTC call overlay and signaling API | partial |
| features/gifts, stories, live, global-search, privacy-settings | corresponding Social pages/APIs | partial |
| features/admin, permissions, staff-actions, reports | admin and moderation APIs/UI | partial |
| features/bot-app, my-bots, oauth-apps | bot CRUD/webhook | partial |
| features/games, exchange, purchase, premium, usernames-market | — | todo |
| features/profile-qr, pwa-install, downloads, suggested-photo | PWA exists; QR/download/suggestions partial | partial |
| features/appearance-settings, power-saving, proxy-settings, ai-settings | theme/settings portions | partial |
| similar-channels, channel-stats, channel-subscription, topics | basic channel/discussion flow | partial |
| ad-cabinet, boost-chat, chat-ads, business, partners, avatar-constructor | — | todo |

## Runtime, packages and clients

| Donor area | Status | Notes |
|---|---:|---|
| `server/ws.js`, realtime stores and events | todo | Current Social uses polling fallback; requires event contract and reconnect tests. |
| `server/rtmp.js` and media workers | todo | Requires ffmpeg/RTMP production service. |
| `packages/shared` and contract tests | partial | Social has its own types and 66 tests; donor contracts need an adapter layer. |
| `packages/contract-tests` | todo | Must be ported against Social API, not copied as an independent app. |
| `apps/proxy` | todo | Needed only for deployments requiring proxy routing. |
| `android`, `android.partial`, `src-tauri`, native resources | todo | PWA is integrated; native builds require platform signing/configuration. |
| `public`, `server/assets`, `store`, `resources` | partial | Brand/PWA assets integrated; donor catalogs/games/stickers/native assets remain selective. |
| scripts, deployment and Docker configuration | partial | Social launch/check scripts and README exist; donor S3/RTMP/mobile scripts remain. |

## Social functionality preserved

- Feed, posts, media, Stories, Reels, comments, likes, follows, profiles, search, suggestions, notifications, saved posts and highlights.
- Single user/session model and one SQLite schema with migrations.
- Existing user data is preserved; no destructive database operation is part of this migration.

## Verification record

- `npm run check`: passed (ESLint, TypeScript, 66 Vitest tests, production build).
- Production smoke routes: feed, profiles, Direct inbox/thread, settings, admin, channels, communities, live, bots and manifest returned `200`.
- Donor repository was not modified.
- Next verification targets: WebSocket contract, group WebRTC, uploads/transcoding, Bot API compatibility, 2FA/OAuth and native clients.
