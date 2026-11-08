import { Note } from '@lenta/shared';
import {
  FeedAdapter,
  FeedAdapterContext,
  UnifiedFeedItem,
  UnifiedFeedTab,
  extractNoteCoverUrl,
} from './types';
import { getThematicCategoryBadge } from '../../utils/sparkFeeds';

export const SEASONS_FEED_PRESETS: Array<{
  slug: string;
  title: string;
  shortTitle: string;
  emoji: string;
  category: string;
  accentColor: string;
  badgeBgLight: string;
  badgeTextLight: string;
  badgeBgDark: string;
  badgeTextDark: string;
  description: string;
}> = [
  {
    slug: 'daily-logs',
    title: 'Ежедневный дневник (Daily Logs)',
    shortTitle: 'Дневник',
    emoji: '📔',
    category: 'Дневник',
    accentColor: '#f59e0b',
    badgeBgLight: 'rgba(245, 158, 11, 0.1)',
    badgeTextLight: '#b45309',
    badgeBgDark: 'rgba(245, 158, 11, 0.25)',
    badgeTextDark: '#fde68a',
    description: 'Личные и командные ежедневные хроники, фокус дня, чеклисты и мысли',
  },
  {
    slug: 'tech-strategy',
    title: 'Technical Architecture & Strategy',
    shortTitle: 'Архитектура',
    emoji: '💻',
    category: 'Инженерия',
    accentColor: '#0284c7',
    badgeBgLight: 'rgba(2, 132, 199, 0.1)',
    badgeTextLight: '#0369a1',
    badgeBgDark: 'rgba(2, 132, 199, 0.25)',
    badgeTextDark: '#7dd3fc',
    description: 'Архитектурные планы, системные спецификации и дорожная карта разработки',
  },
  {
    slug: 'product-milestones',
    title: 'Product Milestones',
    shortTitle: 'Продукт',
    emoji: '🚀',
    category: 'Продукт',
    accentColor: '#10b981',
    badgeBgLight: 'rgba(16, 185, 129, 0.1)',
    badgeTextLight: '#047857',
    badgeBgDark: 'rgba(16, 185, 129, 0.25)',
    badgeTextDark: '#6ee7b7',
    description: 'Ключевые майлстоуны продукта, синхронизация с Obsidian и релизы Lenta',
  },
  {
    slug: 'design-systems',
    title: 'Design Systems & UI',
    shortTitle: 'Дизайн',
    emoji: '🎨',
    category: 'Дизайн',
    accentColor: '#ec4899',
    badgeBgLight: 'rgba(236, 72, 153, 0.1)',
    badgeTextLight: '#be185d',
    badgeBgDark: 'rgba(236, 72, 153, 0.25)',
    badgeTextDark: '#f472b6',
    description: 'Токены дизайн-системы, компоненты интерфейса и визуальный стиль Lemon Seasons',
  },
  {
    slug: 'devops-infra',
    title: 'DevOps & Infrastructure',
    shortTitle: 'DevOps',
    emoji: '⚙️',
    category: 'Инфраструктура',
    accentColor: '#8b5cf6',
    badgeBgLight: 'rgba(139, 92, 246, 0.1)',
    badgeTextLight: '#6d28d9',
    badgeBgDark: 'rgba(139, 92, 246, 0.25)',
    badgeTextDark: '#c4b5fd',
    description: 'Docker-окружения, базы данных PostgreSQL и надежность сервисов',
  },
];

const SEASONS_SLUGS = new Set(SEASONS_FEED_PRESETS.map((p) => p.slug));

export const SeasonsFeedAdapter: FeedAdapter = {
  sourceType: 'seasons',
  label: 'Lemon Seasons',
  shortLabel: 'Seasons',
  emoji: '🍋',
  description: 'Официальные ленты, городские хроники и новости Lemon Seasons',

  getTabs(context: FeedAdapterContext): UnifiedFeedTab[] {
    const countsBySlug: Record<string, number> = {};
    for (const n of context.notes) {
      const isDaily =
        n.feed?.slug === 'daily-logs' ||
        Boolean(
          n.folderPath &&
            (n.folderPath.toLowerCase().includes('daily_logs') ||
              n.folderPath.toLowerCase().includes('01_daily_logs') ||
              n.folderPath.toLowerCase().includes('дневник'))
        );
      if (isDaily) {
        countsBySlug['daily-logs'] = (countsBySlug['daily-logs'] || 0) + 1;
      } else if (n.feed?.slug && SEASONS_SLUGS.has(n.feed.slug)) {
        countsBySlug[n.feed.slug] = (countsBySlug[n.feed.slug] || 0) + 1;
      }
    }

    return SEASONS_FEED_PRESETS
      .map((preset) => {
        const dbFeed = context.allFeeds.find((f) => f.slug === preset.slug);
        const count = Math.max(countsBySlug[preset.slug] || 0, dbFeed?._count?.notes ?? 0);

        const title = dbFeed?.title || preset.title;
        const cleanTitle = dbFeed?.title
          ? dbFeed.title.replace(/\s*\(Spark\)/gi, '').replace(/\s*\(daily\)/gi, '').trim()
          : preset.shortTitle;
        const shortTitle = dbFeed?.title
          ? (cleanTitle.length > 18 ? cleanTitle.slice(0, 18) + '...' : cleanTitle)
          : preset.shortTitle;

        return {
          id: dbFeed?.id || preset.slug,
          slug: preset.slug,
          title,
          shortTitle,
          emoji: dbFeed?.icon || preset.emoji,
          category: preset.category,
          count,
          accentColor: dbFeed?.color || preset.accentColor,
          badgeBgLight: preset.badgeBgLight,
          badgeTextLight: preset.badgeTextLight,
          badgeBgDark: preset.badgeBgDark,
          badgeTextDark: preset.badgeTextDark,
          description: dbFeed?.description || preset.description,
        };
      })
      .filter((tab) => tab.count > 0 || Boolean(context.allFeeds.some((f) => f.slug === tab.slug)));
  },

  adaptNotes(notes: Note[], activeFeedSlug?: string, searchQuery?: string): UnifiedFeedItem[] {
    // 1. Filter notes belonging to Seasons ecosystem
    let matched = notes.filter((n) => {
      if (n.feed?.slug && SEASONS_SLUGS.has(n.feed.slug)) return true;
      if (
        n.folderPath &&
        (n.folderPath.toLowerCase().startsWith('editorial/') ||
          n.folderPath.toLowerCase().startsWith('seasons/') ||
          n.folderPath.toLowerCase().startsWith('lemon-seasons/') ||
          n.folderPath.toLowerCase().includes('daily_logs') ||
          n.folderPath.toLowerCase().includes('01_daily_logs'))
      )
        return true;
      return false;
    });

    // 2. Specific feed filter
    if (activeFeedSlug) {
      matched = matched.filter((n) => {
        if (activeFeedSlug === 'daily-logs') {
          return (
            n.feed?.slug === 'daily-logs' ||
            Boolean(
              n.folderPath &&
                (n.folderPath.toLowerCase().includes('daily_logs') ||
                  n.folderPath.toLowerCase().includes('01_daily_logs') ||
                  n.folderPath.toLowerCase().includes('дневник'))
            )
          );
        }
        if (n.feed?.slug === activeFeedSlug) return true;
        if (n.folderPath && n.folderPath.toLowerCase().includes(activeFeedSlug)) return true;
        return false;
      });
    }

    // Note: DRAFT vs PUBLISHED filtering is controlled by App runtime mode (Staging Hub vs Public Feed)

    // 3. Map notes to UnifiedFeedItem
    const convertedItems: UnifiedFeedItem[] = matched.map((n) => {
      const preset = SEASONS_FEED_PRESETS.find((p) => p.slug === n.feed?.slug);
      const badge = preset
        ? {
            label: preset.category,
            emoji: preset.emoji,
            colorClass: `border-[${preset.accentColor}]/30 text-[${preset.accentColor}]`,
          }
        : getThematicCategoryBadge(n.feed?.title || 'Lemon Seasons');

      const meta = (n.metadata as any) || {};
      const audioUrl = meta.audioUrl || meta.podcast?.audioUrl || null;
      const audioDuration = meta.audioDuration || meta.podcast?.duration || null;

      return {
        id: n.id,
        sourceType: 'seasons',
        feedSlug: n.feed?.slug || 'tech-strategy',
        channelTitle: preset?.title || n.feed?.title || 'Lemon Seasons',
        channelHandle: n.feed?.slug || 'lemon-seasons',
        avatarIcon: preset?.emoji || '🍋',
        category: badge,
        title: n.title,
        description: n.description || '',
        summary: (n as any).summary || null,
        publishedAt: n.publishAt || n.startDate,
        updatedAt: n.updatedAt,
        timeSlot: meta.timeSlot,
        resonanceScore: meta.resonanceScore ?? (n as any).resonanceScore ?? 85,
        sourceLink: n.sourceLink,
        audioUrl,
        audioDuration,
        status: n.status || 'PUBLISHED',
        author: (n as any).author || n.curator || 'Lemon Seasons',
        curator: (n as any).author || n.curator || 'Lemon Seasons',
        hashtags: n.hashtags?.map((h) => h.name) || [],
        coverUrl: extractNoteCoverUrl(n),
        rawPayload: n,
      };
    });

    // 4. Search query filter
    let results = convertedItems;
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter((n) => {
        const titleMatch = n.title.toLowerCase().includes(q);
        const descMatch = Boolean(n.description?.toLowerCase().includes(q));
        const feedMatch = Boolean(n.channelTitle.toLowerCase().includes(q));
        const tagMatch = n.hashtags?.some((h) => h.toLowerCase().includes(q));
        return titleMatch || descMatch || feedMatch || tagMatch;
      });
    }

    // 6. Sort newest first
    results.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return results;
  },
};
