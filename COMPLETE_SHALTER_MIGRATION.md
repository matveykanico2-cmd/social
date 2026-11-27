# Shalter → Social: карта переноса

Дата аудита: 2026-11-27  
Ветка: `feature/full-shalter-migration`

Social остаётся единым приложением и единой базой. Исходный Shalter используется как донор контрактов и механик; его runtime, авторизация и отдельная база в Social не копируются.

## Карта функциональных областей

| Область Shalter | Раздел Social | Backend / данные | UI | Проверка | Статус |
|---|---|---|---|---|---|
| Accounts, sessions, multi-account | `/accounts/*`, `/accounts/edit` | `/api/auth/*`, `users`, `sessions` | auth pages, AccountsModal, settings | Vitest + build | Перенесено |
| Profile, avatar, cover, privacy | `/:username`, `/accounts/edit` | `/api/me`, `/api/users/[username]`, `users`, uploads | profile-client, edit profile | TypeScript + build | Перенесено |
| Feed, posts, comments, reactions | `/`, `/p/[id]` | `/api/feed`, `/api/posts`, `/api/comments`, SQLite posts/comments | feed, post-view, editor | Vitest + build | Перенесено |
| Stories, archive, highlights | `/stories/*` | `/api/stories`, `/api/stories/archive`, `/api/highlights` | story viewer, stories bar | build | Перенесено частично |
| Reels and media posts | `/reels` | `/api/reels`, media storage | reels viewer/editor | build | Перенесено частично |
| Direct messages and groups | `/direct`, `/direct/t/[id]` | `/api/conversations/*`, `messages`, memberships | direct, message composer | Vitest + build | Перенесено |
| Channels and discussions | `/channels`, `/direct` | conversations, roles, invite tokens | channels, direct | build | Перенесено |
| Chat folders, archive, wallpapers | `/direct` | `/api/chat-folders`, per-user settings | folder tabs, theme picker | Vitest + build | Перенесено |
| Voice, video circles, files, stickers | `/direct/t/[id]` | media/message APIs, uploads | composer and message bubbles | build | Перенесено |
| Reactions, replies, edit/delete, pin/forward | `/direct/t/[id]` | message mutation APIs | message context menu | Vitest + build | Перенесено |
| SSE/WebSocket realtime | `/direct/t/[id]` | `/api/conversations/[id]/events`, `server.mjs` | realtime client with fallback | runtime smoke + build | Перенесено с fallback |
| One-to-one calls | `/direct/t/[id]` | `/api/conversations/[id]/calls`, `/api/calls/[id]` | CallOverlay/WebRTC | API tests + build | Перенесено частично |
| Communities and roles | `/communities` | `/api/communities/*`, community tables | communities UI | build | Перенесено |
| Bots, commands, webhook | `/bots` | `/api/bots/*`, bot tables | bot management | build | Перенесено частично |
| Live streams and live chat | `/live`, `/live/[id]` | `/api/live/*`, live/chat tables | live room + chat | build | Перенесено частично |
| Marketplace and reviews | `/marketplace` | `/api/marketplace/*`, orders/reviews | listing, order, seller UI | Vitest + build | Перенесено |
| Gifts and stickers catalog | profile/direct | `/api/gifts`, `/api/stickers` | gift picker, sticker picker | build | Перенесено |
| Search, hashtags, places, trends | search/explore | `/api/search`, posts/users | SearchBox, explore | Vitest + build | Перенесено |
| Insights and audit | `/insights`, `/admin` | `/api/insights`, `/api/admin/audit` | dashboards/tables | build | Перенесено |
| Admin moderation and server status | `/admin` | protected `/api/admin/*`, role migration, audit log | responsive admin panel with user roles | API auth checks + build | Перенесено частично |
| Push notifications | settings | `/api/push/*`, subscriptions | settings action | build | Перенесено с конфигурацией |
| TOTP / 2FA | settings/login | `/api/auth/totp`, encrypted secret | setup/challenge UI | unit/API contract | Перенесено |
| Personal data export | settings | `/api/me/export`, user-owned queries | download JSON action | build | Перенесено |
| User mute | profile/feed | `/api/users/[username]/mute`, `user_mutes` | profile context menu | build | Перенесено |

## Что нельзя считать полностью перенесённым без инфраструктуры

- Production TURN/ICE recovery, групповые WebRTC-звонки и screen sharing требуют TURN и ручного теста двумя браузерами.
- Production S3/CDN, FFmpeg/transcoding и RTMP требуют внешних сервисов; локальные адаптеры описаны в `docker-compose.media.yml`.
- Полный Bot API/Mini Apps SDK, OAuth/passkeys, Premium/Stars, игры и native Android/Desktop оболочки требуют отдельных контрактов, секретов или клиентов.
- Stories/Reels polls, questions, remix и полноценный видеоредактор требуют дополнительных таблиц и медиапайплайна.

Ни один из этих пунктов не помечен как готовый только по наличию декоративной кнопки.

## Проверки

На дату аудита проходят:

- `npm run lint`
- `npx tsc --noEmit`
- `npm test` — 13 файлов, 78 тестов
- `npm run build` — production build, 71 маршрут

