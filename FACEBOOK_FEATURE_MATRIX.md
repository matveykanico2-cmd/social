# Facebook feature matrix для SHALTER Social

| Функция | Фактический статус | Где проверять | Ограничение |
|---|---|---|---|
| Лента и публикации | partial | `/`, `/api/feed`, `/api/posts` | Нет полного алгоритма ranking и геотегов |
| Фото/видео публикации | done | create modal, `/api/posts` | Локальное storage вместо S3 |
| Реакции и лайки | partial | post/message/comment actions | Набор реакций сообщений шире, чем в постах |
| Комментарии и вложения | partial | `/p/[id]` | Фото/видео/GIF вложения есть, документы и nested threads ещё нет |
| Профили и обложки | done | `/:username`, `/accounts/edit` | Альбомы и расширенная информация Facebook отсутствуют |
| Подписки и рекомендации | partial | explore/people, profile | Заявки в друзья работают; общие друзья и расширенные рекомендации ещё не выделены в отдельный модуль |
| Группы и сообщества | partial | `/communities` | Заявки, правила и расширенная модерация не полностью перенесены |
| Страницы | todo | — | Нужна отдельная модель pages и ролей |
| Messenger | partial | `/direct` | Основные сообщения, voice, media, circles, read states и calls есть; WebSocket/typing/group calls остаются |
| Stories и Reels | partial | `/stories`, `/reels` | Ограничены текущей media-моделью |
| Watch/live | partial | `/live` | Нет RTMP ingest/transcoding |
| Marketplace | todo | — | Не добавлен без безопасной модели объявлений и moderation |
| Уведомления и Push | partial | `/notifications`, `/api/push` | Web Push требует VAPID-конфигурации |
| Admin/moderation | partial | `/admin` | Нет полного safety-label и audit-контракта донора |
| Темы/мобильная навигация/PWA | done | shell, manifest, global CSS | Native apps не входят в web runtime |
