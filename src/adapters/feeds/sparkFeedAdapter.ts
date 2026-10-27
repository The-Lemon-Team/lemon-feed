import { Note } from '@lenta/shared';
import {
  FeedAdapter,
  FeedAdapterContext,
  UnifiedFeedItem,
  UnifiedFeedTab,
  UnifiedSubtopic,
  extractNoteCoverUrl,
} from './types';
import { resolveSparkFeeds, getThematicCategoryBadge, isSparkSlug } from '../../utils/sparkFeeds';
import {
  KNOWN_NOTEBOOKLM_SUBTOPICS,
  buildChangelogSubtopics,
  isNotebooklmNote,
  extractNotebooklmSubtopic,
  isChangelogsNote,
  extractChangelogSubfolder,
} from './devFeedAdapter';

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
  if (slug.includes('ai')) return '🤖';
  if (slug.includes('habr')) return '💻';
  return '✨';
}

export const SparkFeedAdapter: FeedAdapter = {
  sourceType: 'spark',
  label: 'Spark Ленты',
  shortLabel: 'Spark',
  emoji: '✨',
  description: 'AI, LLM релизы, агентные технологии и инженерное IT-сообщество',

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

    return rawSparkFeeds.map((f) => {
      let subtopics: UnifiedSubtopic[] | undefined;

      if (f.slug === 'spark-notebooklmai') {
        subtopics = KNOWN_NOTEBOOKLM_SUBTOPICS.map((known) => ({
          id: `sub-notebooklm-${known.subfolder}`,
          slug: `spark-notebooklmai-${known.subfolder}`,
          subfolder: known.subfolder,
          title: known.title,
          emoji: known.emoji,
          count: notebooklmSubCounts[known.subfolder] || 0,
          accentColor: known.accentColor,
        })).filter((sub) => sub.count > 0);
      } else if (f.slug === 'spark-changelogsfeed') {
        subtopics = buildChangelogSubtopics(changelogSubCounts, context.allFeeds);
      }

      return {
        id: f.id,
        slug: f.slug,
        title: f.title,
        shortTitle: f.shortTitle,
        emoji: f.emoji,
        category: f.category,
        count: f.notesCount,
        accentColor: f.accentColor,
        badgeBgLight: f.badgeBgLight,
        badgeTextLight: f.badgeTextLight,
        badgeBgDark: f.badgeBgDark,
        badgeTextDark: f.badgeTextDark,
        description: f.description,
        isCustomFolder: f.isCustomFolder,
        isHot: true,
        subtopics,
      };
    }).filter((tab) => tab.count > 0);
  },

  adaptNotes(notes: Note[], activeFeedSlug?: string, searchQuery?: string): UnifiedFeedItem[] {
    // 1. Strictly filter only Spark ecosystem notes
    let matched = notes.filter((n) => {
      if (n.feed?.slug && isSparkSlug(n.feed.slug)) return true;
      if (n.folderPath && n.folderPath.toLowerCase().startsWith('spark/')) return true;
      if (n.folders && Array.isArray(n.folders)) {
        return n.folders.some((f) => {
          const p = (f.folder?.path || f.folder?.name || '').toLowerCase();
          return p.startsWith('spark/');
        });
      }
      return false;
    });

    // 2. Specific feed or subtopic filter
    if (activeFeedSlug) {
      if (activeFeedSlug === 'spark-notebooklmai') {
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

    // 3. Search query filter
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      matched = matched.filter((n) => {
        const titleMatch = n.title.toLowerCase().includes(q);
        const descMatch = Boolean(n.description?.toLowerCase().includes(q));
        const feedMatch = Boolean(n.feed?.title?.toLowerCase().includes(q));
        const tagMatch = n.hashtags?.some((h) => h.name.toLowerCase().includes(q));
        return titleMatch || descMatch || feedMatch || tagMatch;
      });
    }

    // 4. Sort newest first
    matched.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    // 5. Convert to UnifiedFeedItem
    return matched.map((n) => {
      const rawTitle = n.feed?.title || 'Spark News';
      const changelogSub = extractChangelogSubfolder(n);
      const nbSub = extractNotebooklmSubtopic(n);
      const cleanChannelTitle = changelogSub
        ? `${changelogSub.charAt(0).toUpperCase() + changelogSub.slice(1)} Changelog`
        : nbSub === 'telegram'
        ? 'NotebookLM • Telegram'
        : nbSub === 'regular'
        ? 'NotebookLM AI'
        : rawTitle.replace(/\s*\(Spark\)/i, '').replace(/^Spark\s*[—–-]\s*/i, '').trim();
      const badge =
        changelogSub === 'google'
          ? {
              label: 'Changelog / Google',
              emoji: '🌐',
              colorClass: 'bg-blue-50 text-blue-700 border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
            }
          : changelogSub === 'openai'
          ? {
              label: 'Changelog / OpenAI',
              emoji: '🧠',
              colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
            }
          : changelogSub === 'anthropic'
          ? {
              label: 'Changelog / Anthropic',
              emoji: '⚡',
              colorClass: 'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
            }
          : changelogSub
          ? {
              label: `Changelog / ${changelogSub.charAt(0).toUpperCase() + changelogSub.slice(1)}`,
              emoji: '🚀',
              colorClass: 'bg-orange-50 text-orange-700 border-orange-200/70 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/40',
            }
          : nbSub === 'telegram'
          ? {
              label: 'NotebookLM / Telegram',
              emoji: '✈️',
              colorClass: 'bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40',
            }
          : nbSub === 'regular'
          ? {
              label: 'NotebookLM / Обычные',
              emoji: '🎙️',
              colorClass: 'bg-purple-50 text-purple-700 border-purple-200/70 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40',
            }
          : getThematicCategoryBadge(rawTitle);

      return {
        id: n.id,
        sourceType: 'spark',
        feedSlug: n.feed?.slug || 'spark',
        channelTitle: cleanChannelTitle,
        channelHandle: n.feed?.slug || 'spark',
        avatarIcon: resolveAvatarIcon(n),
        category: badge,
        title: n.title,
        description: n.description || '',
        summary: (n as any).summary || null,
        publishedAt: n.startDate,
        updatedAt: n.updatedAt,
        timeSlot: (n.metadata as any)?.timeSlot,
        resonanceScore: (n.metadata as any)?.resonanceScore ?? (n as any).resonanceScore,
        sourceLink: n.sourceLink,
        status: n.status || 'PUBLISHED',
        author: (n as any).author || n.curator,
        curator: (n as any).author || n.curator,
        isHot: true,
        hashtags: n.hashtags?.map((h) => h.name) || [],
        coverUrl: extractNoteCoverUrl(n),
        rawPayload: n,
      };
    });
  },
};
