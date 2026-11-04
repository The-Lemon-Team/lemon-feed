import { Note } from '@lenta/shared';
import {
  FeedAdapter,
  FeedAdapterContext,
  UnifiedFeedItem,
  UnifiedFeedTab,
  extractNoteCoverUrl,
} from './types';
import { getThematicCategoryBadge } from '../../utils/sparkFeeds';

export interface EntertainmentFeedPreset {
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

export const ENTERTAINMENT_FEED_PRESETS: EntertainmentFeedPreset[] = [
  {
    slug: 'marvel',
    title: 'Marvel Universe',
    shortTitle: 'Marvel',
    emoji: '🛡️',
    category: 'Marvel',
    accentColor: '#ef4444',
    badgeBgLight: 'rgba(239, 68, 68, 0.1)',
    badgeTextLight: '#b91c1c',
    badgeBgDark: 'rgba(239, 68, 68, 0.25)',
    badgeTextDark: '#fca5a5',
    description: 'Киновселенная Marvel: фильмы Саги Мультивселенной, сериалы Disney+, расписание и хронология',
    matchingSlugs: ['marvel', 'mcu', 'mcu-radar', 'marvel-cinematic-universe'],
  },
  {
    slug: 'cinema',
    title: 'Киноновинки & Сериалы',
    shortTitle: 'Кино',
    emoji: '🎬',
    category: 'Кино',
    accentColor: '#8b5cf6',
    badgeBgLight: 'rgba(139, 92, 246, 0.1)',
    badgeTextLight: '#6d28d9',
    badgeBgDark: 'rgba(139, 92, 246, 0.25)',
    badgeTextDark: '#c4b5fd',
    description: 'Мировые премьеры проката и стримингов, обзоры и рейтинги киноиндустрии',
    matchingSlugs: ['cinema', 'movies', 'tmdb', 'films', 'series', 'my-films', 'my-movies'],
  },
  {
    slug: 'music',
    title: 'Музыка & Саундтреки',
    shortTitle: 'Музыка',
    emoji: '🎧',
    category: 'Музыка',
    accentColor: '#ec4899',
    badgeBgLight: 'rgba(236, 72, 153, 0.1)',
    badgeTextLight: '#be185d',
    badgeBgDark: 'rgba(236, 72, 153, 0.25)',
    badgeTextDark: '#f472b6',
    description: 'Новые музыкальные альбомы, официальные саундтреки и ключевые музыкальные релизы',
    matchingSlugs: ['music', 'soundtrack', 'albums', 'музыка', 'my-music'],
  },
  {
    slug: 'gaming',
    title: 'Игровая индустрия',
    shortTitle: 'Игры',
    emoji: '🎮',
    category: 'Игры',
    accentColor: '#10b981',
    badgeBgLight: 'rgba(16, 185, 129, 0.1)',
    badgeTextLight: '#047857',
    badgeBgDark: 'rgba(16, 185, 129, 0.25)',
    badgeTextDark: '#6ee7b7',
    description: 'Релизы видеоигр, анонсы игровых студий, трейлеры и события игровой индустрии',
    matchingSlugs: ['gaming', 'games', 'игры'],
  },
];

export function getEntertainmentPresetForSlug(feedSlug?: string | null): EntertainmentFeedPreset | undefined {
  if (!feedSlug) return undefined;
  const s = feedSlug.toLowerCase();
  return ENTERTAINMENT_FEED_PRESETS.find(
    (p) => p.slug === s || p.matchingSlugs.includes(s)
  );
}

export function isEntertainmentNote(note: Note): boolean {
  if (getEntertainmentPresetForSlug(note.feed?.slug)) return true;
  const s = (note.feed?.slug || '').toLowerCase();
  if (s.includes('music') || s.includes('film') || s.includes('movie') || s.includes('marvel') || s.includes('game')) return true;
  const p = (note.folderPath || '').toLowerCase();
  if (p.includes('marvel') || p.includes('mcu') || p.includes('cinema') || p.includes('movie') || p.includes('film') || p.includes('music') || p.includes('game')) {
    return true;
  }
  return false;
}

export const EntertainmentFeedAdapter: FeedAdapter = {
  sourceType: 'entertainment',
  label: 'Развлечения',
  shortLabel: 'Развлечения',
  emoji: '🍿',
  description: 'Поп-культура: киновселенная Marvel, мировые премьеры кино, музыкальные релизы и гейминг',

  getTabs(context: FeedAdapterContext): UnifiedFeedTab[] {
    const countsByPreset: Record<string, number> = {};
    for (const n of context.notes) {
      if (!isEntertainmentNote(n)) continue;
      const preset =
        getEntertainmentPresetForSlug(n.feed?.slug) ||
        ENTERTAINMENT_FEED_PRESETS.find((p) =>
          p.matchingSlugs.some((s) => (n.folderPath || '').toLowerCase().includes(s))
        ) ||
        ENTERTAINMENT_FEED_PRESETS[0];
      countsByPreset[preset.slug] = (countsByPreset[preset.slug] || 0) + 1;
    }

    const presetTabs = ENTERTAINMENT_FEED_PRESETS
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

    // Custom database feeds matching entertainment (e.g. My Music, MY_films)
    const customDbTabs: UnifiedFeedTab[] = context.allFeeds
      .filter((f) => {
        if (ENTERTAINMENT_FEED_PRESETS.some((p) => p.matchingSlugs.includes(f.slug.toLowerCase()))) return false;
        const s = f.slug.toLowerCase();
        const p = (f.folderPaths || []).join(' ').toLowerCase();
        const t = (f.hashtags || []).join(' ').toLowerCase();
        return (
          s.includes('music') ||
          s.includes('film') ||
          s.includes('movie') ||
          s.includes('marvel') ||
          s.includes('game') ||
          p.includes('entertainment') ||
          p.includes('music') ||
          p.includes('film') ||
          t.includes('music') ||
          t.includes('film')
        );
      })
      .map((f) => {
        const count = context.notes.filter(
          (n) => n.feed?.id === f.id || n.feed?.slug === f.slug
        ).length;
        return {
          id: f.id,
          slug: f.slug,
          title: f.title,
          shortTitle: f.title.length > 18 ? f.title.slice(0, 18) + '...' : f.title,
          emoji: f.icon || '📁',
          category: 'Развлечения',
          count,
          accentColor: f.color || '#ec4899',
          badgeBgLight: 'rgba(236, 72, 153, 0.1)',
          badgeTextLight: '#be185d',
          badgeBgDark: 'rgba(236, 72, 153, 0.25)',
          badgeTextDark: '#f472b6',
          description: f.description || undefined,
        };
      });

    return [...presetTabs, ...customDbTabs];
  },

  adaptNotes(notes: Note[], activeFeedSlug?: string, searchQuery?: string): UnifiedFeedItem[] {
    let matched = notes.filter((n) => isEntertainmentNote(n));

    if (activeFeedSlug) {
      const activePreset = ENTERTAINMENT_FEED_PRESETS.find((p) => p.slug === activeFeedSlug);
      if (activePreset) {
        matched = matched.filter((n) => {
          const s = (n.feed?.slug || '').toLowerCase();
          if (activePreset.matchingSlugs.includes(s)) return true;
          const p = (n.folderPath || '').toLowerCase();
          if (activePreset.matchingSlugs.some((ms) => p.includes(ms))) return true;
          return false;
        });
      } else {
        matched = matched.filter((n) => {
          const s = (n.feed?.slug || '').toLowerCase();
          const target = activeFeedSlug.toLowerCase();
          return s === target || s.includes(target) || target.includes(s);
        });
      }
    }

    const convertedItems: UnifiedFeedItem[] = matched.map((n) => {
      const preset =
        getEntertainmentPresetForSlug(n.feed?.slug) ||
        ENTERTAINMENT_FEED_PRESETS.find((p) =>
          p.matchingSlugs.some((s) => (n.folderPath || '').toLowerCase().includes(s))
        ) ||
        ENTERTAINMENT_FEED_PRESETS[0];

      const badge = {
        label: preset.category,
        emoji: preset.emoji,
        colorClass: `border-[${preset.accentColor}]/30 text-[${preset.accentColor}]`,
      };

      const meta = (n.metadata as any) || {};

      return {
        id: n.id,
        sourceType: 'entertainment',
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
        resonanceScore: meta.resonanceScore ?? (n as any).resonanceScore ?? 85,
        sourceLink: n.sourceLink,
        audioUrl: meta.audioUrl || null,
        audioDuration: meta.audioDuration || null,
        status: n.status || 'PUBLISHED',
        curator: n.curator || 'Lenta Развлечения',
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
