import { Note } from '@lenta/shared';
import {
  FeedAdapter,
  FeedAdapterContext,
  UnifiedFeedItem,
  UnifiedFeedTab,
  extractNoteCoverUrl,
} from './types';
import { getThematicCategoryBadge } from '../../utils/sparkFeeds';
import { isHolidayNote, isTodayHoliday } from './holidaysFeedAdapter';

export const GENERAL_FEED_PRESETS: Array<{
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
  matchingSlugs: string[];
}> = [
  {
    slug: 'wiki',
    title: 'Этот день в истории (Wiki)',
    shortTitle: 'Wiki история',
    emoji: '📖',
    category: 'Wiki история',
    accentColor: '#0ea5e9',
    badgeBgLight: 'rgba(14, 165, 233, 0.1)',
    badgeTextLight: '#0284c7',
    badgeBgDark: 'rgba(14, 165, 233, 0.25)',
    badgeTextDark: '#7dd3fc',
    description: 'Сводка исторических событий, открытий и памятных вех текущего дня из свободной энциклопедии Wikipedia',
    matchingSlugs: ['wiki', 'wiki-history', 'wikipedia'],
  },
  {
    slug: 'spark-general',
    title: 'Общий поток',
    shortTitle: 'Общее',
    emoji: '🌐',
    category: 'Общий поток',
    accentColor: '#64748b',
    badgeBgLight: 'rgba(100, 116, 139, 0.1)',
    badgeTextLight: '#334155',
    badgeBgDark: 'rgba(100, 116, 139, 0.25)',
    badgeTextDark: '#cbd5e1',
    description: 'Базовые новости, входящие материалы без узкой специализации и непомеченные потоки',
    matchingSlugs: ['spark-general', 'general', 'news', 'default'],
  },
  {
    slug: 'media-radar',
    title: 'Медиа & Радары',
    shortTitle: 'Медиа',
    emoji: '📡',
    category: 'Медиа',
    accentColor: '#ec4899',
    badgeBgLight: 'rgba(236, 72, 153, 0.1)',
    badgeTextLight: '#be185d',
    badgeBgDark: 'rgba(236, 72, 153, 0.25)',
    badgeTextDark: '#f472b6',
    description: 'Кинорелизы, культура и международные радары',
    matchingSlugs: ['mcu-radar', 'politics-2026', 'cinema'],
  },
];

export function isGeneralNote(note: Note): boolean {
  if (isHolidayNote(note)) {
    return isTodayHoliday(note);
  }
  const slug = note.feed?.slug?.toLowerCase() || '';
  if (slug === 'wiki' || slug === 'wiki-history' || slug === 'wikipedia') return true;
  if (slug === 'spark-general' || slug === 'general' || slug === 'news' || slug === 'default') return true;
  if (slug === 'mcu-radar' || slug === 'politics-2026') return true;
  if (!slug) return true;
  return false;
}

export const GeneralFeedAdapter: FeedAdapter = {
  sourceType: 'general',
  label: 'Общее',
  shortLabel: 'Общее',
  emoji: '🌐',
  description: 'Общий поток новостей, историческая хроника Wiki, медиа-радары и непомеченные ленты',

  getTabs(context: FeedAdapterContext): UnifiedFeedTab[] {
    const countsByPreset: Record<string, number> = {};
    for (const n of context.notes) {
      if (!isGeneralNote(n)) continue;
      const slug = n.feed?.slug?.toLowerCase() || '';
      const preset = GENERAL_FEED_PRESETS.find(
        (p) => p.slug === slug || p.matchingSlugs.includes(slug)
      ) || GENERAL_FEED_PRESETS[1];
      countsByPreset[preset.slug] = (countsByPreset[preset.slug] || 0) + 1;
    }

    return GENERAL_FEED_PRESETS
      .filter((preset) => (countsByPreset[preset.slug] || 0) > 0)
      .map((preset) => {
        const dbFeed = context.allFeeds.find((f) => preset.matchingSlugs.includes(f.slug));
        const count = countsByPreset[preset.slug] || 0;

        return {
          id: dbFeed?.id || preset.slug,
          slug: preset.slug,
          title: preset.title,
          shortTitle: preset.shortTitle,
          emoji: preset.emoji,
          category: preset.category,
          count,
          accentColor: preset.accentColor,
          badgeBgLight: preset.badgeBgLight,
          badgeTextLight: preset.badgeTextLight,
          badgeBgDark: preset.badgeBgDark,
          badgeTextDark: preset.badgeTextDark,
          description: dbFeed?.description || preset.description,
        };
      });
  },

  adaptNotes(notes: Note[], activeFeedSlug?: string, searchQuery?: string): UnifiedFeedItem[] {
    let matched = notes.filter((n) => isGeneralNote(n));

    if (activeFeedSlug) {
      const activePreset = GENERAL_FEED_PRESETS.find((p) => p.slug === activeFeedSlug);
      if (activePreset) {
        matched = matched.filter((n) => {
          const s = n.feed?.slug?.toLowerCase() || '';
          if (activePreset.matchingSlugs.includes(s)) return true;
          if (activePreset.slug === 'spark-general' && !s) return true;
          return false;
        });
      }
    }

    const convertedItems: UnifiedFeedItem[] = matched.map((n) => {
      const slug = n.feed?.slug?.toLowerCase() || '';
      const preset = GENERAL_FEED_PRESETS.find(
        (p) => p.slug === slug || p.matchingSlugs.includes(slug)
      ) || GENERAL_FEED_PRESETS[1];

      const badge = {
        label: preset.category,
        emoji: preset.emoji,
        colorClass: `border-[${preset.accentColor}]/30 text-[${preset.accentColor}]`,
      };

      const meta = (n.metadata as any) || {};

      return {
        id: n.id,
        sourceType: 'general',
        feedSlug: n.feed?.slug || preset.slug,
        channelTitle: preset.title,
        channelHandle: preset.slug,
        avatarIcon: preset.emoji,
        category: badge,
        title: n.title,
        description: n.description || '',
        summary: (n as any).summary || null,
        publishedAt: n.publishAt || n.startDate,
        updatedAt: n.updatedAt,
        timeSlot: meta.timeSlot,
        resonanceScore: meta.resonanceScore ?? (n as any).resonanceScore ?? 75,
        sourceLink: n.sourceLink,
        audioUrl: meta.audioUrl || null,
        audioDuration: meta.audioDuration || null,
        status: n.status || 'PUBLISHED',
        curator: n.curator || 'Lenta Общее',
        hashtags: n.hashtags?.map((h) => h.name) || [],
        coverUrl: extractNoteCoverUrl(n),
        rawPayload: n,
      };
    });

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

    results.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return results;
  },
};
