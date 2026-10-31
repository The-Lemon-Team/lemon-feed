import { Note } from '@lenta/shared';
import {
  FeedAdapter,
  FeedAdapterContext,
  UnifiedFeedItem,
  UnifiedFeedTab,
  UnifiedSubtopic,
  extractNoteCoverUrl,
} from './types';
import {
  resolveSparkFeeds,
  getThematicCategoryBadge,
  isSparkSlug,
} from '../../utils/sparkFeeds';
import { isItDevNote } from './itDevFeedAdapter';
import { isEntertainmentNote } from './entertainmentFeedAdapter';
import { isHolidayNote, isTodayHoliday } from './holidaysFeedAdapter';
import {
  KNOWN_NOTEBOOKLM_SUBTOPICS,
  buildChangelogSubtopics,
  isNotebooklmNote,
  extractNotebooklmSubtopic,
  isChangelogsNote,
  extractChangelogSubfolder,
} from './devFeedSubtopics';

export const ALL_STREAMS_PRESETS = [
  {
    slug: 'hot-daily',
    title: 'Горячее (Daily Sync)',
    shortTitle: 'Горячее',
    emoji: '🔥',
    category: 'Daily Sync',
    accentColor: '#f97316',
    badgeBgLight: 'rgba(249, 115, 22, 0.1)',
    badgeTextLight: '#c2410c',
    badgeBgDark: 'rgba(249, 115, 22, 0.25)',
    badgeTextDark: '#fdba74',
    description: 'Ежедневные живые сводки от автономных агентов и вотчеров',
    isHot: true,
  },
  {
    slug: 'it-tech',
    title: 'IT & Технологии',
    shortTitle: 'Технологии',
    emoji: '💻',
    category: 'Инженерия & AI',
    accentColor: '#8b5cf6',
    badgeBgLight: 'rgba(139, 92, 246, 0.1)',
    badgeTextLight: '#6d28d9',
    badgeBgDark: 'rgba(139, 92, 246, 0.25)',
    badgeTextDark: '#c4b5fd',
    description: 'AI-модели, ченджлоги вендоров и инженерные статьи',
    isHot: true,
  },
  {
    slug: 'seasons-hub',
    title: 'Lemon Seasons & Дневник',
    shortTitle: 'Seasons',
    emoji: '🍋',
    category: 'Экосистема Seasons',
    accentColor: '#eab308',
    badgeBgLight: 'rgba(234, 179, 8, 0.1)',
    badgeTextLight: '#a16207',
    badgeBgDark: 'rgba(234, 179, 8, 0.25)',
    badgeTextDark: '#fde047',
    description: 'Ежедневный журнал, проектная база знаний и архитектурные решения',
  },
  {
    slug: 'entertainment-hub',
    title: 'Развлечения & Marvel',
    shortTitle: 'Развлечения',
    emoji: '🍿',
    category: 'Поп-культура',
    accentColor: '#ec4899',
    badgeBgLight: 'rgba(236, 72, 153, 0.1)',
    badgeTextLight: '#be185d',
    badgeBgDark: 'rgba(236, 72, 153, 0.25)',
    badgeTextDark: '#f472b6',
    description: 'Киновселенная Marvel, кинорелизы, сериалы и музыка',
  },
  {
    slug: 'holidays-hub',
    title: 'Праздники & Календарь',
    shortTitle: 'Праздники',
    emoji: '🎉',
    category: 'Праздничные даты',
    accentColor: '#ef4444',
    badgeBgLight: 'rgba(239, 68, 68, 0.1)',
    badgeTextLight: '#b91c1c',
    badgeBgDark: 'rgba(239, 68, 68, 0.25)',
    badgeTextDark: '#fca5a5',
    description: 'Государственные праздники РФ, православные и мировые даты',
  },
];

export function isDailyFolderNote(note: Note): boolean {
  const slug = (note.feed?.slug || '').toLowerCase();
  if (isSparkSlug(slug) || slug.startsWith('daily-') || slug.includes('daily')) return true;
  const folder = (note.folderPath || '').toLowerCase();
  if (folder.startsWith('spark/') || folder === 'spark' || folder.startsWith('daily/') || folder === 'daily') return true;
  if (note.folders && Array.isArray(note.folders)) {
    return note.folders.some((f) => {
      const p = (f.folder?.path || f.folder?.name || '').toLowerCase();
      return p.startsWith('spark/') || p === 'spark' || p.startsWith('daily/') || p === 'daily';
    });
  }
  return false;
}

function resolveAvatarIcon(note: Note): string {
  const changelogSub = extractChangelogSubfolder(note);
  if (changelogSub === 'google') return '🌐';
  if (changelogSub === 'openai') return '🧠';
  if (changelogSub === 'anthropic') return '⚡';
  if (isChangelogsNote(note)) return '🚀';
  const nbSub = extractNotebooklmSubtopic(note);
  if (nbSub === 'telegram') return '✈️';
  if (nbSub === 'regular') return '🎙️';
  if (note.icon) {
    if (Array.from(note.icon).length <= 2) return note.icon;
    const iconKey = note.icon.toLowerCase();
    if (iconKey.includes('bot') || iconKey.includes('ai')) return '🤖';
    if (iconKey.includes('code') || iconKey.includes('habr')) return '💻';
    if (iconKey.includes('ghost')) return '👻';
    if (iconKey.includes('palett')) return '🎨';
    if (iconKey.includes('globe') || iconKey.includes('world')) return '🌐';
    if (iconKey.includes('radio') || iconKey.includes('news')) return '📡';
  }
  const slug = note.feed?.slug?.toLowerCase() || '';
  const title = (note.title || '').toLowerCase();
  if (slug.includes('xakep') || title.includes('хакер')) return '👾';
  if (slug.includes('youtube') || slug.includes('oneday') || title.includes('oneday')) return '📺';
  if (slug.includes('ai')) return '🤖';
  if (slug.includes('habr')) return '💻';
  return '✨';
}

export const AllStreamsFeedAdapter: FeedAdapter = {
  sourceType: 'all',
  label: 'Все ленты',
  shortLabel: 'Все',
  emoji: '🌐',
  description: 'Единый агрегированный поток всех событий, новостей, вех разработки и календарных дат',

  getTabs(context: FeedAdapterContext): UnifiedFeedTab[] {
    const rawSparkFeeds = resolveSparkFeeds(context.allFeeds as any, context.notes);

    const notebooklmSubCounts: Record<'regular' | 'telegram', number> = {
      regular: 0,
      telegram: 0,
    };
    const changelogSubCounts: Record<string, number> = {};

    for (const n of context.notes) {
      if (isNotebooklmNote(n)) {
        const nbSub = extractNotebooklmSubtopic(n) || 'regular';
        notebooklmSubCounts[nbSub] = (notebooklmSubCounts[nbSub] || 0) + 1;
      }
      if (isChangelogsNote(n)) {
        const sub = extractChangelogSubfolder(n) || 'other';
        changelogSubCounts[sub] = (changelogSubCounts[sub] || 0) + 1;
      }
    }

    const dailyFolderTabs: UnifiedFeedTab[] = rawSparkFeeds
      .filter((f) => f.notesCount > 0)
      .map((f) => {
        let subtopics: UnifiedSubtopic[] | undefined;

        if (f.slug === 'spark-notebooklmai') {
          subtopics = KNOWN_NOTEBOOKLM_SUBTOPICS.map((known) => ({
            id: `sub-notebooklm-${known.subfolder}`,
            slug: `spark-notebooklmai-${known.subfolder}`,
            subfolder: known.subfolder,
            title: `${known.title} (daily)`,
            emoji: known.emoji,
            count: notebooklmSubCounts[known.subfolder] || 0,
            accentColor: known.accentColor,
          })).filter((sub) => sub.count > 0);
        } else if (f.slug === 'spark-changelogsfeed') {
          subtopics = buildChangelogSubtopics(changelogSubCounts, context.allFeeds).map((s) => ({
            ...s,
            title: `${s.title} (daily)`,
          }));
        }

        const cleanTitle = f.title
          .replace(/\s*\(Spark\)/gi, '')
          .replace(/^Spark\s*[—–-]\s*/gi, '')
          .replace(/\s*\(daily\)/gi, '')
          .trim();
        const cleanShortTitle = f.shortTitle
          .replace(/\s*\(Spark\)/gi, '')
          .replace(/^Spark\s*[—–-]\s*/gi, '')
          .replace(/\s*\(daily\)/gi, '')
          .trim();

        return {
          id: f.id,
          slug: f.slug,
          title: `${cleanTitle} (daily)`,
          shortTitle: cleanShortTitle,
          emoji: f.emoji,
          category: `${cleanTitle} (daily)`,
          count: f.notesCount,
          accentColor: f.accentColor,
          badgeBgLight: f.badgeBgLight,
          badgeTextLight: f.badgeTextLight,
          badgeBgDark: f.badgeBgDark,
          badgeTextDark: f.badgeTextDark,
          description: f.description || `Лента ${cleanTitle} на основе папок spark/`,
          isCustomFolder: true,
          isHot: true,
          badgeLabel: '(daily)',
          subtopics,
        };
      });

    const countsByPreset: Record<string, number> = {
      'hot-daily': 0,
      'it-tech': 0,
      'seasons-hub': 0,
      'entertainment-hub': 0,
      'holidays-hub': 0,
    };

    for (const n of context.notes) {
      const isIt = isItDevNote(n);
      const isEnt = isEntertainmentNote(n);
      const isHol = isHolidayNote(n);
      const isSeas =
        Boolean(n.feed?.slug?.includes('strategy') || n.feed?.slug?.includes('milestone') || n.feed?.slug?.includes('daily-logs')) ||
        Boolean(n.folderPath && (n.folderPath.toLowerCase().includes('seasons') || n.folderPath.toLowerCase().includes('daily_logs') || n.folderPath.toLowerCase().includes('editorial')));

      if (isIt) countsByPreset['it-tech'] = (countsByPreset['it-tech'] || 0) + 1;
      if (isEnt) countsByPreset['entertainment-hub'] = (countsByPreset['entertainment-hub'] || 0) + 1;
      if (isHol) countsByPreset['holidays-hub'] = (countsByPreset['holidays-hub'] || 0) + 1;
      if (isSeas) countsByPreset['seasons-hub'] = (countsByPreset['seasons-hub'] || 0) + 1;

      // Hot count (daily sync items + today's holidays)
      if (
        isDailyFolderNote(n) ||
        isIt ||
        n.feed?.slug?.startsWith('spark-') ||
        n.feed?.slug?.startsWith('reactive-') ||
        isTodayHoliday(n)
      ) {
        countsByPreset['hot-daily'] = (countsByPreset['hot-daily'] || 0) + 1;
      }
    }

    const presetTabs: UnifiedFeedTab[] = ALL_STREAMS_PRESETS
      .filter((preset) => (countsByPreset[preset.slug] || 0) > 0)
      .map((preset) => ({
        id: preset.slug,
        slug: preset.slug,
        title: preset.title,
        shortTitle: preset.shortTitle,
        emoji: preset.emoji,
        category: preset.category,
        count: countsByPreset[preset.slug] || 0,
        accentColor: preset.accentColor,
        badgeBgLight: preset.badgeBgLight,
        badgeTextLight: preset.badgeTextLight,
        badgeBgDark: preset.badgeBgDark,
        badgeTextDark: preset.badgeTextDark,
        description: preset.description,
        isHot: preset.isHot,
      }));

    const hotTab = presetTabs.find((t) => t.slug === 'hot-daily');
    const otherPresets = presetTabs.filter((t) => t.slug !== 'hot-daily');

    // Return: Hot preset -> Daily folder feeds -> Remaining thematic presets
    return [
      ...(hotTab ? [hotTab] : []),
      ...dailyFolderTabs,
      ...otherPresets,
    ];
  },

  adaptNotes(notes: Note[], activeFeedSlug?: string, searchQuery?: string): UnifiedFeedItem[] {
    let matched = notes;

    if (activeFeedSlug) {
      if (activeFeedSlug === 'hot-daily') {
        matched = matched.filter(
          (n) =>
            isDailyFolderNote(n) ||
            isItDevNote(n) ||
            (n.feed?.slug || '').startsWith('spark-') ||
            (n.feed?.slug || '').startsWith('reactive-') ||
            isTodayHoliday(n)
        );
      } else if (activeFeedSlug === 'it-tech') {
        matched = matched.filter(isItDevNote);
      } else if (activeFeedSlug === 'entertainment-hub') {
        matched = matched.filter(isEntertainmentNote);
      } else if (activeFeedSlug === 'holidays-hub') {
        matched = matched.filter(isHolidayNote);
      } else if (activeFeedSlug === 'seasons-hub') {
        matched = matched.filter(
          (n) =>
            Boolean(n.feed?.slug?.includes('strategy') || n.feed?.slug?.includes('milestone') || n.feed?.slug?.includes('daily-logs')) ||
            Boolean(n.folderPath && (n.folderPath.toLowerCase().includes('seasons') || n.folderPath.toLowerCase().includes('daily_logs') || n.folderPath.toLowerCase().includes('editorial')))
        );
      } else if (activeFeedSlug === 'spark-notebooklmai') {
        matched = matched.filter(isNotebooklmNote);
      } else if (activeFeedSlug.startsWith('spark-notebooklmai-')) {
        const targetSub = activeFeedSlug.replace(/^spark-notebooklmai-/, '').toLowerCase();
        matched = matched.filter((n) => extractNotebooklmSubtopic(n) === targetSub);
      } else if (activeFeedSlug === 'spark-changelogsfeed') {
        matched = matched.filter(isChangelogsNote);
      } else if (activeFeedSlug.startsWith('spark-changelogsfeed-')) {
        const targetSub = activeFeedSlug.replace(/^spark-changelogsfeed-/, '').toLowerCase();
        matched = matched.filter((n) => extractChangelogSubfolder(n) === targetSub);
      } else {
        matched = matched.filter((n) => {
          if (n.feed?.slug === activeFeedSlug) return true;
          const sub = activeFeedSlug.replace(/^spark-/, '').toLowerCase();
          if (n.folderPath && n.folderPath.toLowerCase().includes(sub)) return true;
          if (n.folders && Array.isArray(n.folders)) {
            return n.folders.some((f) => {
              const p = (f.folder?.path || f.folder?.name || '').toLowerCase();
              return p.includes(sub);
            });
          }
          return false;
        });
      }
    }

    const convertedItems: UnifiedFeedItem[] = matched.map((n) => {
      const isDaily = isDailyFolderNote(n);
      const isIt = isItDevNote(n);
      const isEnt = isEntertainmentNote(n);
      const isHol = isHolidayNote(n);

      const changelogSub = extractChangelogSubfolder(n);
      const nbSub = extractNotebooklmSubtopic(n);

      let channelTitle = n.feed?.title || 'Все ленты';
      let categoryBadge = {
        label: n.feed?.title || 'Lenta',
        emoji: '📌',
        colorClass: 'border-slate-500/30 text-slate-500',
      };

      if (isDaily) {
        const rawTitle = n.feed?.title || (n.folderPath ? n.folderPath.split('/').pop() : '') || 'Daily Feed';
        const cleanName = rawTitle
          .replace(/\s*\(Spark\)/gi, '')
          .replace(/^Spark\s*[—–-]\s*/gi, '')
          .replace(/\s*\(daily\)/gi, '')
          .trim();

        if (changelogSub) {
          channelTitle = `${changelogSub.charAt(0).toUpperCase() + changelogSub.slice(1)} Changelog (daily)`;
        } else if (nbSub === 'telegram') {
          channelTitle = 'NotebookLM • Telegram (daily)';
        } else if (nbSub === 'regular') {
          channelTitle = 'NotebookLM AI (daily)';
        } else {
          channelTitle = `${cleanName} (daily)`;
        }

        categoryBadge = {
          label: `${cleanName} (daily)`,
          emoji: resolveAvatarIcon(n),
          colorClass: 'border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10',
        };
      } else if (isHol) {
        categoryBadge = { label: 'Праздники', emoji: '🎉', colorClass: 'border-red-500/30 text-red-500' };
      } else if (isEnt) {
        categoryBadge = { label: 'Развлечения', emoji: '🍿', colorClass: 'border-pink-500/30 text-pink-500' };
      } else if (isIt) {
        categoryBadge = { label: 'IT & Dev', emoji: '💻', colorClass: 'border-indigo-500/30 text-indigo-500' };
      } else if (n.feed?.title) {
        categoryBadge = getThematicCategoryBadge(n.feed.title);
      }

      const meta = (n.metadata as any) || {};

      return {
        id: n.id,
        sourceType: 'all',
        feedSlug: n.feed?.slug || 'general',
        channelTitle,
        channelHandle: isDaily
          ? `@daily/${(n.feed?.slug || 'feed').replace(/^spark-/, '')}`
          : `@${n.feed?.slug || 'lenta'}`,
        avatarIcon: isDaily ? resolveAvatarIcon(n) : isHol ? '🎉' : isEnt ? '🍿' : isIt ? '💻' : '🍋',
        category: categoryBadge,
        title: n.title,
        description: n.description || '',
        summary: (n as any).summary || null,
        publishedAt: n.publishAt || n.startDate,
        updatedAt: n.updatedAt,
        timeSlot: meta.timeSlot,
        resonanceScore: meta.resonanceScore ?? (n as any).resonanceScore ?? 80,
        sourceLink: n.sourceLink,
        audioUrl: meta.audioUrl || meta.podcast?.audioUrl || null,
        audioDuration: meta.audioDuration || meta.podcast?.duration || null,
        status: n.status || 'PUBLISHED',
        curator: n.curator || 'Lenta',
        hashtags: n.hashtags?.map((h) => h.name) || [],
        coverUrl: extractNoteCoverUrl(n),
        isHot: isDaily || isIt || (n.feed?.slug || '').startsWith('spark-') || (n.feed?.slug || '').startsWith('reactive-'),
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
