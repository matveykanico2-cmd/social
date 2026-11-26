# Полный аудит переноса Shalter → Social

Дата аудита: 2026-11-26. Донор: `matveykanico2-cmd/Shalter`. Социальная сеть: единое Next.js-приложение Social. Shalter не изменяется.

Статусы: **done** — проверено в Social; **partial** — рабочий аналог есть, но часть донорского контракта отсутствует; **blocked** — нужна внешняя инфраструктура или отдельная бизнес-модель; **todo** — не переносилось.

| Донорский модуль | Целевой модуль | Frontend | Backend/БД | Тесты | Результат и ограничения |
|---|---|---|---|---|---|
| auth, sessions, profiles, users | `src/app/(auth)`, `src/lib/server/auth.ts` | done | done, единая SQLite-модель и HTTP-only cookie | build + Vitest | OAuth, passkeys и 2FA не перенесены |
| chats, folders, messages | `src/components/direct.tsx` | partial | partial | build + server tests | ЛС, группы, каналы, реакции, ответы, файлы, voice, video circles, read/last-seen работают; WebSocket, typing, archive и invites остаются |
| calls, realtime | `call-overlay.tsx`, calls API | partial | partial | build | WebRTC signaling и аудио/видео UI есть; групповые звонки, TURN и reconnect требуют инфраструктуры |
| channels | channels page/API | partial | partial | build | Аватары, обсуждения, роли и публикации есть; invite links и расширенная аналитика отсутствуют |
| communities | communities page/API | partial | partial | build | Роли, приватность, дни рождения, аватары и посты есть; discovery-правила донора не полностью перенесены |
| bots | bots page/API | partial | partial | build | CRUD, аватары, команды и webhook есть; полный Bot API, Mini Apps SDK и scopes отсутствуют |
| posts, stories, live | feed, stories, live routes | partial | partial | build + Vitest | Публикации, Stories, Reels и live работают; ranking, RTMP и transcoding отсутствуют |
| gifts, push, reports | gifts, notifications, push, admin | partial | partial | build | Подарки, Web Push и жалобы есть; платежная инфраструктура не подключена |
| stickers, GIF, documents | messenger composer/media | partial | partial | build | Emoji/sticker fallback и image/video upload есть; каталог стикеров, GIF provider и документы требуют отдельного storage-контракта |
| premium, stars, games, nearby | — | todo | blocked | — | Нужны платежи, sandbox игр, geo/privacy policy и отдельные API |
| S3, RTMP, workers, native clients | — | todo | blocked | — | Требуются внешние production-сервисы, ffmpeg/RTMP, очереди и подпись Android/Desktop |

## Дополнительные Facebook-модули

Marketplace реализован как единая Social-модель объявлений с авторизованными API и локальным upload storage. Платежи намеренно не подключены: для production нужны отдельный провайдер, accounting, fraud checks и moderation queue.

## Текущая проверка

`npm run check` проходит: ESLint, TypeScript, 66 Vitest-тестов и production build с 63 маршрутами. Строки со статусом `partial`, `blocked` и `todo` намеренно не отмечены как завершённые.
