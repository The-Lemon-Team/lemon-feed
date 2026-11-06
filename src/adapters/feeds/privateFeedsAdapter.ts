import { Note } from '@lenta/shared';
import {
  FeedAdapter,
  FeedAdapterContext,
  UnifiedFeedItem,
  UnifiedFeedTab,
  extractNoteCoverUrl,
} from './types';

export function isPrivateFeedOrNote(note: Note): boolean {
  if (note.privacy === 'private') return true;
  if (note.feed && note.feed.privacy === 'private') return true;
  const p = (note.folderPath || '').toLowerCase();
  if (p.startsWith('private/') || p.includes('/private') || p.includes('.private') || p.includes('секрет')) {
    return true;
  }
  return false;
}

export const DEFAULT_PRELOADED_PRIVATE_TABS: Array<{
  slug: string;
  title: string;
  emoji: string;
  color: string;
  description: string;
}> = [
  {
    slug: 'private-notes',
    title: 'Личные заметки',
    emoji: '🔒',
    color: '#a855f7',
    description: 'Личные конфиденциальные заметки и мысли',
  },
  {
    slug: 'work-vault',
    title: 'Рабочий архив & Проекты',
    emoji: '💼',
    color: '#3b82f6',
    description: 'Закрытые рабочие документы, архитектурные планы и задачи',
  },
  {
    slug: 'diary-logs',
    title: 'Личный дневник',
    emoji: '📓',
    color: '#ec4899',
    description: 'Ежедневные личные записи и рефлексия',
  },
  {
    slug: 'secure-vault',
    title: 'Защищенный сейф',
    emoji: '🛡️',
    color: '#10b981',
    description: 'Секреты, ключи, резервные данные и чувствительная информация',
  },
];

export function resolvePrivateNoteSlug(note: Note): string {
  if (note.feed?.slug) return note.feed.slug;
  const p = (note.folderPath || '').toLowerCase();
  const tags = (note.hashtags || []).map((h: any) =>
    (typeof h === 'string' ? h : h?.name || '').toLowerCase()
  );

  if (p.includes('work') || p.includes('project') || tags.includes('work') || tags.includes('проект')) {
    return 'work-vault';
  }
  if (p.includes('diary') || tags.includes('diary') || tags.includes('дневник')) {
    return 'diary-logs';
  }
  if (p.includes('vault') || p.includes('key') || tags.includes('vault') || tags.includes('сейф') || tags.includes('ключи')) {
    return 'secure-vault';
  }
  return 'private-notes';
}

export const PrivateFeedsAdapter: FeedAdapter = {
  sourceType: 'private_feeds',
  label: 'Все приватные',
  shortLabel: 'Все приватные',
  emoji: '🔮',
  description: 'Сводный поток всех приватных заметок, защищенных папок и внутренних лент',

  getTabs(context: FeedAdapterContext): UnifiedFeedTab[] {
    const countsBySlug: Record<string, number> = {};
    const feedMetaBySlug: Record<
      string,
      { id?: string; title: string; emoji: string; color: string; description?: string }
    > = {};

    // 1. Collect all explicit private feeds from database
    for (const f of context.allFeeds) {
      if (f.privacy === 'private') {
        const count = (f as any)._count?.notes || countsBySlug[f.slug] || 0;
        countsBySlug[f.slug] = count;
        feedMetaBySlug[f.slug] = {
          id: f.id,
          title: f.title,
          emoji: f.icon || '🔒',
          color: f.color || '#a855f7',
          description: f.description || undefined,
        };
      }
    }

    // 2. Count matching notes per feed or private container
    for (const n of context.notes) {
      if (isPrivateFeedOrNote(n)) {
        const slug = n.feed?.slug || resolvePrivateNoteSlug(n);
        countsBySlug[slug] = (countsBySlug[slug] || 0) + 1;
        if (!feedMetaBySlug[slug]) {
          feedMetaBySlug[slug] = {
            title: n.feed?.title || (slug === 'private-notes' ? 'Личные заметки' : slug),
            emoji: n.feed?.icon || '🔒',
            color: n.feed?.color || '#a855f7',
            description: n.feed?.description || 'Заметки приватного контура',
          };
        }
      }
    }

    // 3. Return all DB private tabs and active note tabs
    return Object.entries(feedMetaBySlug).map(([slug, meta]) => ({
      id: meta.id || `tab-private-${slug}`,
      slug,
      title: meta.title,
      shortTitle: meta.title.length > 18 ? meta.title.slice(0, 18) + '...' : meta.title,
      emoji: meta.emoji,
      category: 'Private',
      count: countsBySlug[slug] || 0,
      accentColor: meta.color,
      badgeBgLight: 'rgba(168, 85, 247, 0.1)',
      badgeTextLight: '#7e22ce',
      badgeBgDark: 'rgba(168, 85, 247, 0.25)',
      badgeTextDark: '#d8b4fe',
      description: meta.description,
    }));
  },

  adaptNotes(notes: Note[], activeFeedSlug?: string, searchQuery?: string): UnifiedFeedItem[] {
    const query = searchQuery?.toLowerCase().trim();

    return notes
      .filter((note) => {
        if (!isPrivateFeedOrNote(note)) return false;

        if (activeFeedSlug) {
          const slug = note.feed?.slug || resolvePrivateNoteSlug(note);
          if (slug !== activeFeedSlug) return false;
        }

        if (query) {
          const matchTitle = note.title?.toLowerCase().includes(query);
          const matchDesc = note.description?.toLowerCase().includes(query);
          const matchAuthor = (note.author || note.curator)?.toLowerCase().includes(query);
          const matchTag = note.hashtags?.some((h: any) =>
            (typeof h === 'string' ? h : h.name)?.toLowerCase().includes(query)
          );
          if (!matchTitle && !matchDesc && !matchAuthor && !matchTag) return false;
        }

        return true;
      })
      .map((n) => {
        const cover = extractNoteCoverUrl(n);
        const slug = n.feed?.slug || resolvePrivateNoteSlug(n);
        const channelTitle = n.feed?.title || 'Приватный контур';
        const channelHandle = `private/${slug}`;
        const avatarIcon = n.feed?.icon || '🔒';

        return {
          id: n.id,
          sourceType: 'private_feeds',
          feedSlug: slug,
          channelTitle,
          channelHandle,
          avatarIcon,
          category: {
            label: 'Private',
            emoji: '🔒',
            colorClass: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
          },
          title: n.title,
          description: n.description || '',
          summary: (n as any).summary || null,
          publishedAt: n.startDate ? new Date(n.startDate).toISOString() : new Date().toISOString(),
          updatedAt: n.updatedAt ? new Date(n.updatedAt).toISOString() : null,
          sourceLink: n.sourceLink,
          status: n.status,
          author: n.author || null,
          curator: n.curator || 'Private Vault',
          hashtags: n.hashtags?.map((h: any) => (typeof h === 'string' ? h : h.name)) || [],
          coverUrl: cover,
          isHot: Boolean(n.metadata?.isHot || n.metadata?.priority === 'high'),
          rawPayload: n,
        };
      });
  },
};
