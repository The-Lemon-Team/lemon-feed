# Lenta Feed App (`@lenta/feed-app`)

Автономное, мобильно-ориентированное веб-приложение умной новостной ленты для проекта **Lemon Calendarium / Lenta**.

---

## Возможности

- **Полная автономность**: Приложение выделено в отдельный модуль и может работать как внутри монорепозитория, так и быть экспортировано в отдельный Git-репозиторий.
- **Mobile-First UX в стиле Telegram Desktop / iOS / macOS**:
  - Плавающая верхняя софт-панель (`FeedTopBar`) с переключателем тем (Светлая / Тёмная).
  - Горизонтальные свайп-табы категорий (`FeedTabsBar`) с защитой от сдвигов геометрии при клике (0px layout shift).
  - Компактные сенсорные карточки постов (`FeedPostCard`) с нативным Web Share, тегами и рейтингом резонанса.
  - Нижняя навигационная панель для смартфонов (`FeedBottomNav`) с поддержкой безопасных зон (`safe-area-inset`).
  - Быстрый просмотр полной статьи в модальном окне (`FeedDetailModal`).
- **Архитектура адаптеров (Feed Adapters)**:
  - `✨ Spark` — ленты AI, нейросетей, IT-сообщества Хабр и динамических папок Obsidian/GDrive.
  - `🏛️ Classic` — государственные, религиозные и мировые памятные даты календаря.
  - `✈️ Telegram live` — живая интеграция с внешними тематическими папками из `telegram-web-reader`.

---

## Быстрый запуск

### 1. В составе монорепозитория

```bash
# Запуск dev-сервера ленты на порту 5175
pnpm --filter @lenta/feed-app run dev

# Проверка типов
pnpm --filter @lenta/feed-app run lint

# Сборка продакшн-бандла
pnpm --filter @lenta/feed-app run build
```

Приложение доступно по адресу: **http://localhost:5175/**

### 2. Экспорт в отдельный Git-репозиторий

Чтобы вынести проект в полностью независимый репозиторий:

```bash
# Использование git subtree:
git subtree push --prefix=apps/feed-app origin feed-standalone-branch

# Либо копирование директории apps/feed-app и установка зависимостей:
cd apps/feed-app
pnpm install
pnpm dev
```

---

## Архитектура файлов (строго до 300 строк по AGENTS.md)

- `src/App.tsx` — корневой оркестратор ленты и управления состоянием (~220 строк).
- `src/adapters/feeds/` — подключаемые адаптеры провайдеров (`spark`, `classic`, `telegram`).
- `src/components/FeedTopBar.tsx` — мобильная верхняя софт-панель (~160 строк).
- `src/components/FeedTabsBar.tsx` — полоса горизонтальных табов (~90 строк).
- `src/components/FeedPostCard.tsx` — карточка поста с мобильным шерингом (~170 строк).
- `src/components/FeedBottomNav.tsx` — нижняя мобильная навигация (~70 строк).
- `src/components/FeedDetailModal.tsx` — модальное чтение статьи (~150 строк).
- `src/components/FeedDesktopRail.tsx` — правый сайдбар для планшетов и десктопов (~180 строк).
- `src/api/client.ts` & `queries.ts` — типизированный API-клиент и React Query хуки.
