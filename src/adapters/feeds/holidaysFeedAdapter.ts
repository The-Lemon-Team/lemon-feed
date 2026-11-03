import { Note } from '@lenta/shared';
import dayjs from 'dayjs';
import {
  FeedAdapter,
  FeedAdapterContext,
  UnifiedFeedItem,
  UnifiedFeedTab,
  extractNoteCoverUrl,
} from './types';
import { getThematicCategoryBadge } from '../../utils/sparkFeeds';

export interface HolidayFeedPreset {
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
}

export const HOLIDAY_FEED_PRESETS: HolidayFeedPreset[] = [
  {
    slug: 'russian-holidays',
    title: 'Российские праздники',
    shortTitle: 'Праздники РФ',
    emoji: '🇷🇺',
    category: 'Российские праздники',
    accentColor: '#ef4444',
    badgeBgLight: 'rgba(239, 68, 68, 0.1)',
    badgeTextLight: '#b91c1c',
    badgeBgDark: 'rgba(239, 68, 68, 0.25)',
    badgeTextDark: '#fca5a5',
    description: 'Официальные нерабочие праздничные дни по ТК РФ, памятные даты и Дни воинской славы России по 32-ФЗ',
    matchingSlugs: ['russian-holidays', 'russian-official', 'russian-military'],
  },
  {
    slug: 'orthodox-holidays',
    title: 'Православные праздники',
    shortTitle: 'Православные',
    emoji: '☦️',
    category: 'Православные праздники',
    accentColor: '#f59e0b',
    badgeBgLight: 'rgba(245, 158, 11, 0.1)',
    badgeTextLight: '#b45309',
    badgeBgDark: 'rgba(245, 158, 11, 0.25)',
    badgeTextDark: '#fde68a',
    description: 'Двунадесятые праздники, Пасха Христова, посты и дни памяти святых',
    matchingSlugs: ['orthodox-holidays', 'christian-holidays'],
  },
  {
    slug: 'world-holidays',
    title: 'Мировые и религиозные праздники',
    shortTitle: 'Мировые даты',
    emoji: '🌍',
    category: 'Мировые праздники',
    accentColor: '#10b981',
    badgeBgLight: 'rgba(16, 185, 129, 0.1)',
    badgeTextLight: '#047857',
    badgeBgDark: 'rgba(16, 185, 129, 0.25)',
    badgeTextDark: '#6ee7b7',
    description: 'Международные дни ООН, всемирные памятные события и традиции',
    matchingSlugs: ['world-holidays', 'world-religions', 'catholic-holidays', 'islamic-holidays'],
  },
];

export function getHolidayPresetForSlug(feedSlug?: string | null): HolidayFeedPreset | undefined {
  if (!feedSlug) return undefined;
  return HOLIDAY_FEED_PRESETS.find(
    (p) => p.slug === feedSlug || p.matchingSlugs.includes(feedSlug)
  );
}

export function isHolidayNote(note: Note): boolean {
  if (getHolidayPresetForSlug(note.feed?.slug)) return true;
  if (note.folderPath && note.folderPath.toLowerCase().includes('holiday')) return true;
  return false;
}

export function isTodayHoliday(note: Note, targetDate = dayjs()): boolean {
  if (!isHolidayNote(note)) return false;
  const d = dayjs(note.startDate);
  return d.isValid() && d.isSame(targetDate, 'day');
}

export const HolidaysFeedAdapter: FeedAdapter = {
  sourceType: 'holidays',
  label: 'Праздники',
  shortLabel: 'Праздники',
  emoji: '🎉',
  description: 'Официальные нерабочие дни РФ, православные праздники, дни воинской славы и мировые даты',

  getTabs(context: FeedAdapterContext): UnifiedFeedTab[] {
    const countsByPreset: Record<string, number> = {};
    for (const n of context.notes) {
      if (!isHolidayNote(n)) continue;
      const preset = getHolidayPresetForSlug(n.feed?.slug) || HOLIDAY_FEED_PRESETS[0];
      countsByPreset[preset.slug] = (countsByPreset[preset.slug] || 0) + 1;
    }

    return HOLIDAY_FEED_PRESETS
      .map((preset) => {
        const dbFeed = context.allFeeds.find((f) => preset.matchingSlugs.includes(f.slug));
        const count = countsByPreset[preset.slug] || (dbFeed?._count?.notes ?? 0);

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
      });
  },

  adaptNotes(notes: Note[], activeFeedSlug?: string, searchQuery?: string): UnifiedFeedItem[] {
    let matched = notes.filter((n) => isHolidayNote(n));

    if (activeFeedSlug) {
      const activePreset = HOLIDAY_FEED_PRESETS.find((p) => p.slug === activeFeedSlug);
      if (activePreset) {
        matched = matched.filter((n) => {
          if (n.feed?.slug && activePreset.matchingSlugs.includes(n.feed.slug)) return true;
          if (n.folderPath && activePreset.matchingSlugs.some((s) => n.folderPath?.toLowerCase().includes(s))) return true;
          return false;
        });
      }
    }

    const convertedItems: UnifiedFeedItem[] = matched.map((n) => {
      const preset = getHolidayPresetForSlug(n.feed?.slug) || HOLIDAY_FEED_PRESETS[0];
      const badge = preset
        ? {
            label: preset.category,
            emoji: preset.emoji,
            colorClass: `border-[${preset.accentColor}]/30 text-[${preset.accentColor}]`,
          }
        : getThematicCategoryBadge(n.feed?.title || 'Праздники');

      const meta = (n.metadata as any) || {};

      return {
        id: n.id,
        sourceType: 'holidays',
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
        resonanceScore: meta.resonanceScore ?? (n as any).resonanceScore ?? 80,
        sourceLink: n.sourceLink,
        audioUrl: meta.audioUrl || null,
        audioDuration: meta.audioDuration || null,
        status: n.status || 'PUBLISHED',
        curator: n.curator || 'Календарь Lenta',
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
