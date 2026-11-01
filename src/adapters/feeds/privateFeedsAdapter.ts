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

export const PrivateFeedsAdapter: FeedAdapter = {
  sourceType: 'private_feeds',
  label: 'Приватные ленты',
  shortLabel: 'Private feeds',
  emoji: '🔮',
  description: 'Приватные ленты, защищенные потоки и внутренние заметки',

  getTabs(context: FeedAdapterContext): UnifiedFeedTab[] {
    const countsBySlug: Record<string, number> = {};
    const feedMetaBySlug: Record<
      string,
      { title: string; emoji: string; color: string; description?: string }
    > = {};

    // 1. First collect all explicit private feeds
    for (const f of context.allFeeds) {
      if (f.privacy === 'private') {
        countsBySlug[f.slug] = 0;
        feedMetaBySlug[f.slug] = {
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
        const slug = n.feed?.slug || 'private-notes';
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

    // 3. Return tabs
    return Object.entries(feedMetaBySlug)
      .filter(([slug]) => (countsBySlug[slug] || 0) > 0)
      .map(([slug, meta]) => ({
        id: `tab-private-${slug}`,
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
          const slug = note.feed?.slug || 'private-notes';
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
        const channelTitle = n.feed?.title || 'Приватный контур';
        const channelHandle = `private/${n.feed?.slug || 'vault'}`;
        const avatarIcon = n.feed?.icon || '🔒';

        return {
          id: n.id,
          sourceType: 'private_feeds',
          feedSlug: n.feed?.slug || 'private-notes',
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
          summary: n.description || null,
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
