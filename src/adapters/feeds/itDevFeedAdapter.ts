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
  KNOWN_NOTEBOOKLM_SUBTOPICS,
  buildChangelogSubtopics,
  extractChangelogSubfolder,
  isChangelogsNote,
  isNotebooklmNote,
  extractNotebooklmSubtopic,
} from './devFeedSubtopics';
import { getThematicCategoryBadge } from '../../utils/sparkFeeds';

export interface ItDevPresetConfig {
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
  isHot?: boolean;
  isChangelogs?: boolean;
  isNotebooklm?: boolean;
  matchingSlugs: string[];
}

export const IT_DEV_PRESETS: ItDevPresetConfig[] = [
  {
    slug: 'spark-ai',
    title: 'AI & Нейросети (Spark)',
    shortTitle: 'AI & Нейросети',
    emoji: '🤖',
    category: 'AI & Нейросети',
    accentColor: '#8b5cf6',
    badgeBgLight: 'rgba(139, 92, 246, 0.1)',
    badgeTextLight: '#6d28d9',
    badgeBgDark: 'rgba(139, 92, 246, 0.25)',
    badgeTextDark: '#c4b5fd',
    description: 'Релизы LLM моделей, исследования в области искусственного интеллекта и агентные вычисления',
    isHot: true,
    matchingSlugs: ['spark-ai', 'ai-models', 'ai'],
  },
  {
    slug: 'spark-habr',
    title: 'Хабр & IT (Spark)',
    shortTitle: 'Хабр & IT',
    emoji: '💻',
    category: 'IT & Разработка',
    accentColor: '#0ea5e9',
    badgeBgLight: 'rgba(14, 165, 233, 0.1)',
    badgeTextLight: '#0284c7',
    badgeBgDark: 'rgba(14, 165, 233, 0.25)',
    badgeTextDark: '#7dd3fc',
    description: 'Инженерные статьи, архитектурные разборы, туториалы и опыт сообщества Хабр',
    isHot: true,
    matchingSlugs: ['spark-habr', 'habr', 'community', 'dev-articles'],
  },
  {
    slug: 'spark-changelogsfeed',
    title: 'Changelogs & Релизы (Spark)',
    shortTitle: 'Changelogs & Релизы',
    emoji: '🚀',
    category: 'Changelogs & Релизы',
    accentColor: '#f97316',
    badgeBgLight: 'rgba(249, 115, 22, 0.1)',
    badgeTextLight: '#c2410c',
    badgeBgDark: 'rgba(249, 115, 22, 0.25)',
    badgeTextDark: '#fdba74',
    description: 'Официальные обновления и релизы вендоров: Google, OpenAI, Anthropic, DeepSeek',
    isHot: true,
    isChangelogs: true,
    matchingSlugs: ['spark-changelogsfeed', 'changelogs', 'releases', 'changelog'],
  },
  {
    slug: 'spark-notebooklmai',
    title: 'NotebookLM AI (Spark)',
    shortTitle: 'NotebookLM AI',
    emoji: '🎙️',
    category: 'Аналитика & Подкасты',
    accentColor: '#a855f7',
    badgeBgLight: 'rgba(168, 85, 247, 0.1)',
    badgeTextLight: '#7e22ce',
    badgeBgDark: 'rgba(168, 85, 247, 0.25)',
    badgeTextDark: '#d8b4fe',
    description: 'Структурированные аудио-обзоры и аналитические синтезы от NotebookLM (Обычные и Telegram)',
    isHot: true,
    isNotebooklm: true,
    matchingSlugs: ['spark-notebooklmai', 'notebooklm-ai', 'notebooklm'],
  },
  {
    slug: 'spark-xakep',
    title: 'Журнал «Хакер» (Spark)',
    shortTitle: 'Журнал «Хакер»',
    emoji: '👾',
    category: 'AppSec & Реверс',
    accentColor: '#22c55e',
    badgeBgLight: 'rgba(34, 197, 94, 0.1)',
    badgeTextLight: '#15803d',
    badgeBgDark: 'rgba(34, 197, 94, 0.25)',
    badgeTextDark: '#86efac',
    description: 'Материалы журнала «Хакер», эксплойты, reverse engineering и разборы атак',
    isHot: true,
    matchingSlugs: ['spark-xakep', 'xakep', 'hacker'],
  },
  {
    slug: 'spark-cyber-security',
    title: 'Cyber Security & InfoSec (Spark)',
    shortTitle: 'Cyber Security',
    emoji: '🛡️',
    category: 'Кибербезопасность',
    accentColor: '#10b981',
    badgeBgLight: 'rgba(16, 185, 129, 0.1)',
    badgeTextLight: '#047857',
    badgeBgDark: 'rgba(16, 185, 129, 0.25)',
    badgeTextDark: '#6ee7b7',
    description: 'Информационная безопасность, бюллетени CVE, SecOps и защита инфраструктуры',
    isHot: true,
    matchingSlugs: ['spark-cyber-security', 'cybersec', 'security'],
  },
  {
    slug: 'spark-youtube-oneday',
    title: 'YouTube • OneDay (Spark)',
    shortTitle: 'YouTube',
    emoji: '📺',
    category: 'Политическая аналитика',
    accentColor: '#ef4444',
    badgeBgLight: 'rgba(239, 68, 68, 0.1)',
    badgeTextLight: '#b91c1c',
    badgeBgDark: 'rgba(239, 68, 68, 0.25)',
    badgeTextDark: '#fca5a5',
    description: 'Ежедневная политическая выжимка и аналитические разборы YouTube-канала OneDay',
    isHot: true,
    matchingSlugs: ['spark-youtube-oneday', 'spark-youtube', 'youtube', 'oneday'],
  },
];

export function isItDevNote(note: Note): boolean {
  const slug = (note.feed?.slug || '').toLowerCase();
  if (
    slug.startsWith('spark-') ||
    slug.startsWith('reactive-') ||
    slug.includes('changelog') ||
    slug.includes('habr') ||
    slug.includes('cyber') ||
    slug.includes('xakep') ||
    slug.includes('security') ||
    slug.includes('notebooklm') ||
    slug.includes('youtube') ||
    slug.includes('oneday')
  ) {
    return true;
  }
  const folder = (note.folderPath || '').toLowerCase();
  if (
    folder.startsWith('spark/') ||
    folder.startsWith('reactive/') ||
    folder.includes('changelog') ||
    folder.includes('engineering') ||
    folder.includes('xakep') ||
    folder.includes('security') ||
    folder.includes('notebooklm') ||
    folder.includes('youtube') ||
    folder.includes('oneday')
  ) {
    return true;
  }
  return false;
}

export const ItDevFeedAdapter: FeedAdapter = {
  sourceType: 'it_dev',
  label: 'IT & Dev',
  shortLabel: 'IT & Dev',
  emoji: '💻',
  description: 'Реактивные технологические потоки: AI-модели, официальные ченджлоги вендоров, безопасность, журнал Хакер и YouTube выжимки',

  getTabs(context: FeedAdapterContext): UnifiedFeedTab[] {
    const changelogSubCounts: Record<string, number> = {};
    const notebooklmSubCounts: Record<'regular' | 'telegram', number> = {
      regular: 0,
      telegram: 0,
    };
    for (const note of context.notes) {
      if (isChangelogsNote(note)) {
        const sub = extractChangelogSubfolder(note);
        if (sub) {
          changelogSubCounts[sub] = (changelogSubCounts[sub] || 0) + 1;
        }
      }
      if (isNotebooklmNote(note)) {
        const nbSub = extractNotebooklmSubtopic(note) || 'regular';
        notebooklmSubCounts[nbSub] = (notebooklmSubCounts[nbSub] || 0) + 1;
      }
    }

    const countsByPreset: Record<string, number> = {};
    for (const n of context.notes) {
      if (!isItDevNote(n)) continue;
      const slug = (n.feed?.slug || '').toLowerCase();
      const folder = (n.folderPath || '').toLowerCase();

      if (slug.includes('changelog') || folder.includes('changelog')) {
        countsByPreset['spark-changelogsfeed'] = (countsByPreset['spark-changelogsfeed'] || 0) + 1;
      } else if (slug.includes('notebooklm') || folder.includes('notebooklm')) {
        countsByPreset['spark-notebooklmai'] = (countsByPreset['spark-notebooklmai'] || 0) + 1;
      } else if (slug.includes('xakep') || folder.includes('xakep')) {
        countsByPreset['spark-xakep'] = (countsByPreset['spark-xakep'] || 0) + 1;
      } else if (slug.includes('cyber') || folder.includes('cyber') || slug.includes('security') || folder.includes('security')) {
        countsByPreset['spark-cyber-security'] = (countsByPreset['spark-cyber-security'] || 0) + 1;
      } else if (slug.includes('habr') || folder.includes('habr')) {
        countsByPreset['spark-habr'] = (countsByPreset['spark-habr'] || 0) + 1;
      } else if (slug.includes('youtube') || folder.includes('youtube') || slug.includes('oneday') || folder.includes('oneday')) {
        countsByPreset['spark-youtube-oneday'] = (countsByPreset['spark-youtube-oneday'] || 0) + 1;
      } else {
        countsByPreset['spark-ai'] = (countsByPreset['spark-ai'] || 0) + 1;
      }
    }

    return IT_DEV_PRESETS
      .map((preset) => {
        const dbFeed = context.allFeeds.find((f) => preset.matchingSlugs.includes(f.slug));
        const count = countsByPreset[preset.slug] || (dbFeed?._count?.notes ?? 0);
        let subtopics: UnifiedSubtopic[] | undefined;

        if (preset.isChangelogs) {
          subtopics = buildChangelogSubtopics(changelogSubCounts, context.allFeeds);
        } else if (preset.isNotebooklm) {
          subtopics = KNOWN_NOTEBOOKLM_SUBTOPICS.map((known) => ({
            id: `sub-notebooklm-${known.subfolder}`,
            slug: `spark-notebooklmai-${known.subfolder}`,
            subfolder: known.subfolder,
            title: known.title,
            emoji: known.emoji,
            count: notebooklmSubCounts[known.subfolder] || 0,
            accentColor: known.accentColor,
          })).filter((s) => s.count > 0);
        }

        const resolvedTitle = dbFeed?.title || preset.title;
        const resolvedShortTitle = dbFeed
          ? dbFeed.title.replace(/\s*\(Spark\)/gi, '').replace(/\s*\(daily\)/gi, '').trim()
          : preset.shortTitle;

        return {
          id: dbFeed?.id || preset.slug,
          slug: preset.slug,
          title: resolvedTitle,
          shortTitle: resolvedShortTitle,
          emoji: preset.emoji,
          category: preset.category,
          count,
          accentColor: preset.accentColor,
          badgeBgLight: preset.badgeBgLight,
          badgeTextLight: preset.badgeTextLight,
          badgeBgDark: preset.badgeBgDark,
          badgeTextDark: preset.badgeTextDark,
          description: dbFeed?.description || preset.description,
          isHot: preset.isHot,
          subtopics,
        };
      });
  },

  adaptNotes(notes: Note[], activeFeedSlug?: string, searchQuery?: string): UnifiedFeedItem[] {
    let matched = notes.filter((n) => isItDevNote(n));

    if (activeFeedSlug) {
      if (activeFeedSlug === 'spark-changelogsfeed' || activeFeedSlug === 'changelogs') {
        matched = matched.filter(isChangelogsNote);
      } else if (activeFeedSlug.startsWith('spark-changelogsfeed-') || activeFeedSlug.startsWith('changelogs-')) {
        const sub = activeFeedSlug.replace(/^(spark-changelogsfeed-|changelogs-)/, '').toLowerCase();
        matched = matched.filter((n) => extractChangelogSubfolder(n) === sub);
      } else if (activeFeedSlug === 'spark-notebooklmai' || activeFeedSlug === 'notebooklm') {
        matched = matched.filter(isNotebooklmNote);
      } else if (activeFeedSlug.startsWith('spark-notebooklmai-') || activeFeedSlug.startsWith('notebooklm-')) {
        const sub = activeFeedSlug.replace(/^(spark-notebooklmai-|notebooklm-)/, '').toLowerCase();
        matched = matched.filter((n) => extractNotebooklmSubtopic(n) === sub);
      } else if (activeFeedSlug === 'spark-xakep' || activeFeedSlug === 'xakep') {
        matched = matched.filter((n) => {
          const s = (n.feed?.slug || '').toLowerCase();
          const p = (n.folderPath || '').toLowerCase();
          return s.includes('xakep') || p.includes('xakep');
        });
      } else if (activeFeedSlug === 'spark-cyber-security' || activeFeedSlug === 'cybersec') {
        matched = matched.filter((n) => {
          const s = (n.feed?.slug || '').toLowerCase();
          const p = (n.folderPath || '').toLowerCase();
          return (s.includes('cyber') || p.includes('cyber') || s.includes('security') || p.includes('security')) && !s.includes('xakep') && !p.includes('xakep');
        });
      } else if (activeFeedSlug === 'spark-habr' || activeFeedSlug === 'habr') {
        matched = matched.filter((n) => {
          const s = (n.feed?.slug || '').toLowerCase();
          const p = (n.folderPath || '').toLowerCase();
          return s.includes('habr') || p.includes('habr');
        });
      } else if (activeFeedSlug === 'spark-youtube-oneday' || activeFeedSlug === 'spark-youtube' || activeFeedSlug === 'youtube' || activeFeedSlug === 'oneday') {
        matched = matched.filter((n) => {
          const s = (n.feed?.slug || '').toLowerCase();
          const p = (n.folderPath || '').toLowerCase();
          return s.includes('youtube') || p.includes('youtube') || s.includes('oneday') || p.includes('oneday');
        });
      } else if (activeFeedSlug === 'spark-ai' || activeFeedSlug === 'ai') {
        matched = matched.filter((n) => {
          const s = (n.feed?.slug || '').toLowerCase();
          const p = (n.folderPath || '').toLowerCase();
          const isOther =
            isChangelogsNote(n) ||
            isNotebooklmNote(n) ||
            s.includes('habr') ||
            s.includes('cyber') ||
            s.includes('xakep') ||
            s.includes('youtube') ||
            s.includes('oneday') ||
            p.includes('habr') ||
            p.includes('xakep') ||
            p.includes('youtube') ||
            p.includes('oneday');
          return (s.includes('ai') || p.includes('ai')) && !isOther;
        });
      } else {
        matched = matched.filter((n) => (n.feed?.slug || '').toLowerCase() === activeFeedSlug.toLowerCase());
      }
    }

    const convertedItems: UnifiedFeedItem[] = matched.map((n) => {
      const changelogSub = extractChangelogSubfolder(n);
      const nbSub = extractNotebooklmSubtopic(n);
      const meta = (n.metadata as any) || {};

      let categoryBadge = {
        label: 'IT & Dev',
        emoji: '💻',
        colorClass: 'border-indigo-500/30 text-indigo-500',
      };

      if (changelogSub) {
        categoryBadge = {
          label: `Changelog / ${changelogSub.toUpperCase()}`,
          emoji: '🚀',
          colorClass: 'border-orange-500/30 text-orange-500',
        };
      } else if (nbSub) {
        categoryBadge = {
          label: 'NotebookLM AI',
          emoji: '🎙️',
          colorClass: 'border-purple-500/30 text-purple-500',
        };
      } else if (n.feed?.slug?.includes('youtube') || (n.folderPath && n.folderPath.toLowerCase().includes('youtube')) || (n.folderPath && n.folderPath.toLowerCase().includes('oneday'))) {
        categoryBadge = {
          label: 'YouTube • OneDay',
          emoji: '📺',
          colorClass: 'border-red-500/30 text-red-500',
        };
      } else if (n.feed?.title) {
        categoryBadge = getThematicCategoryBadge(n.feed.title);
      }

      return {
        id: n.id,
        sourceType: 'it_dev',
        feedSlug: n.feed?.slug || 'it-dev',
        channelTitle: n.feed?.title || 'IT & Dev',
        channelHandle: n.feed?.slug || 'it-dev',
        avatarIcon: changelogSub
          ? '🚀'
          : nbSub
          ? '🎙️'
          : (n.feed?.slug?.includes('xakep') || n.title.toLowerCase().includes('хакер') || (n.folderPath && n.folderPath.toLowerCase().includes('xakep')))
          ? '👾'
          : (n.feed?.slug?.includes('youtube') || n.title.toLowerCase().includes('youtube') || (n.folderPath && n.folderPath.toLowerCase().includes('youtube')) || (n.folderPath && n.folderPath.toLowerCase().includes('oneday')))
          ? '📺'
          : (n.feed?.slug?.includes('cyber') || n.feed?.slug?.includes('security'))
          ? '🛡️'
          : (n.feed?.slug?.includes('habr') || n.title.toLowerCase().includes('хабр'))
          ? '💻'
          : (n.feed?.slug?.includes('ai') || n.title.toLowerCase().includes('ai'))
          ? '🤖'
          : '💻',
        category: categoryBadge,
        title: n.title,
        description: n.description || '',
        summary: (n as any).summary || null,
        publishedAt: n.publishAt || n.startDate,
        updatedAt: n.updatedAt,
        timeSlot: meta.timeSlot,
        resonanceScore: meta.resonanceScore ?? (n as any).resonanceScore ?? 85,
        sourceLink: n.sourceLink,
        audioUrl: meta.audioUrl || meta.podcast?.audioUrl || null,
        audioDuration: meta.audioDuration || meta.podcast?.duration || null,
        status: n.status || 'PUBLISHED',
        curator: n.curator || 'IT & Dev Radar',
        hashtags: n.hashtags?.map((h) => h.name) || [],
        coverUrl: extractNoteCoverUrl(n),
        isHot: true,
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
