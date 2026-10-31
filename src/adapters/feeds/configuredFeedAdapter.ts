import { Note } from '@lenta/shared';
import {
  FeedAdapter,
  FeedAdapterContext,
  UnifiedFeedItem,
  UnifiedFeedTab,
  extractNoteCoverUrl,
} from './types';
import { FeedModeOption } from '../../components/toolbar/types';

export function createConfiguredFeedAdapter(modeOption: FeedModeOption): FeedAdapter {
  const filterConfig = modeOption.filterConfig || {};
  const targetPrivacy = filterConfig.privacy || 'all';
  const targetSlugs =
    filterConfig.feedSlugs && filterConfig.feedSlugs.length > 0
      ? new Set(filterConfig.feedSlugs)
      : null;
  const targetFolders =
    filterConfig.folderPaths && filterConfig.folderPaths.length > 0
      ? filterConfig.folderPaths.map((f) => f.toLowerCase().trim())
      : null;

  const matchesNote = (note: Note): boolean => {
    // 1. Privacy filter
    if (targetPrivacy === 'private') {
      const isPriv =
        note.privacy === 'private' ||
        note.feed?.privacy === 'private' ||
        (note.folderPath || '').toLowerCase().includes('/private');
      if (!isPriv) return false;
    } else if (targetPrivacy === 'public') {
      const isPub =
        (note.privacy === 'public' || !note.privacy) &&
        (!note.feed || note.feed.privacy === 'public');
      if (!isPub) return false;
    }

    // 2. Feed slug filter
    if (targetSlugs) {
      const noteSlug = note.feed?.slug;
      if (!noteSlug || !targetSlugs.has(noteSlug)) {
        return false;
      }
    }

    // 3. Folder prefix filter
    if (targetFolders) {
      const noteFolder = (note.folderPath || '').toLowerCase();
      const folderMatches = targetFolders.some((f) => noteFolder.includes(f));
      if (!folderMatches) return false;
    }

    return true;
  };

  return {
    sourceType: modeOption.id,
    label: modeOption.label,
    shortLabel: modeOption.label,
    emoji: modeOption.emoji || '📁',
    description: modeOption.description || `Поток для раздела ${modeOption.label}`,

    getTabs(context: FeedAdapterContext): UnifiedFeedTab[] {
      const countsBySlug: Record<string, number> = {};
      const feedMetaBySlug: Record<
        string,
        { title: string; emoji: string; color: string; description?: string }
      > = {};

      for (const f of context.allFeeds) {
        if (targetPrivacy === 'private' && f.privacy !== 'private') continue;
        if (targetPrivacy === 'public' && f.privacy === 'private') continue;
        if (targetSlugs && !targetSlugs.has(f.slug)) continue;

        countsBySlug[f.slug] = 0;
        feedMetaBySlug[f.slug] = {
          title: f.title,
          emoji: f.icon || modeOption.emoji || '📁',
          color: f.color || '#2481cc',
          description: f.description || undefined,
        };
      }

      for (const n of context.notes) {
        if (matchesNote(n)) {
          const slug = n.feed?.slug || 'general-notes';
          countsBySlug[slug] = (countsBySlug[slug] || 0) + 1;
          if (!feedMetaBySlug[slug]) {
            feedMetaBySlug[slug] = {
              title: n.feed?.title || 'Заметки',
              emoji: n.feed?.icon || modeOption.emoji || '📁',
              color: n.feed?.color || '#2481cc',
              description: n.feed?.description || undefined,
            };
          }
        }
      }

      return Object.entries(feedMetaBySlug)
        .filter(([slug]) => (countsBySlug[slug] || 0) > 0)
        .map(([slug, meta]) => ({
          id: `tab-cfg-${slug}`,
          slug,
          title: meta.title,
          shortTitle: meta.title.length > 18 ? meta.title.slice(0, 18) + '...' : meta.title,
          emoji: meta.emoji,
          category: modeOption.label,
          count: countsBySlug[slug] || 0,
          accentColor: meta.color,
          badgeBgLight: 'rgba(36, 129, 204, 0.1)',
          badgeTextLight: '#1e6cb0',
          badgeBgDark: 'rgba(36, 129, 204, 0.25)',
          badgeTextDark: '#93c5fd',
          description: meta.description,
        }));
    },

    adaptNotes(notes: Note[], activeFeedSlug?: string, searchQuery?: string): UnifiedFeedItem[] {
      const query = searchQuery?.toLowerCase().trim();

      return notes
        .filter((note) => {
          if (!matchesNote(note)) return false;

          if (activeFeedSlug) {
            const slug = note.feed?.slug || 'general-notes';
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
          return {
            id: n.id,
            sourceType: modeOption.id,
            feedSlug: n.feed?.slug || 'general-notes',
            channelTitle: n.feed?.title || modeOption.label,
            channelHandle: `@${modeOption.id}/${n.feed?.slug || 'feed'}`,
            avatarIcon: n.feed?.icon || modeOption.emoji || '📁',
            category: {
              label: modeOption.label,
              emoji: modeOption.emoji || '📁',
              colorClass: 'border-blue-500/30 text-blue-500',
            },
            title: n.title,
            description: n.description || '',
            summary: n.description || null,
            publishedAt: n.startDate ? new Date(n.startDate).toISOString() : new Date().toISOString(),
            updatedAt: n.updatedAt ? new Date(n.updatedAt).toISOString() : null,
            sourceLink: n.sourceLink,
            status: n.status,
            author: n.author || null,
            curator: n.curator || modeOption.label,
            hashtags: n.hashtags?.map((h: any) => (typeof h === 'string' ? h : h.name)) || [],
            coverUrl: cover,
            isHot: Boolean(n.metadata?.isHot || n.metadata?.priority === 'high'),
            rawPayload: n,
          };
        });
    },
  };
}
