import { Note } from '@lenta/shared';

export type FeedAppRuntimeMode = 'dev' | 'staging' | 'public';
export type StagingStatusFilter = 'all' | 'pending' | 'published';

/**
 * Resolves whether feed-app is running as:
 * - Developer Admin Feed (:5175 in dev mode, default)
 * - Staging Publication Hub (:5175 with --mode staging)
 * - Public Approved Feed (:5176 with --mode public)
 */
export function resolveFeedAppMode(): FeedAppRuntimeMode {
  if (typeof window !== 'undefined') {
    const sp = new URLSearchParams(window.location.search);
    const paramMode = (sp.get('appMode') || sp.get('mode') || '').toLowerCase();
    if (paramMode === 'public') return 'public';
    if (paramMode === 'staging') return 'staging';
    if (paramMode === 'dev' || paramMode === 'admin') return 'dev';

    if (window.location.port === '5176') {
      return 'public';
    }
  }

  const envMode = (
    import.meta.env.VITE_FEED_APP_MODE ||
    import.meta.env.MODE ||
    ''
  ).toLowerCase();
  if (envMode === 'staging') {
    return 'staging';
  }
  if (envMode === 'public') {
    return 'public';
  }

  return 'dev';
}

/**
 * Maps notes so that `note.feed` reflects `note.publicFeed || note.feed` for staging/public routing,
 * while preserving the original internal admin feed as `(note as any).adminFeed`.
 */
export function normalizeNotesForPublicFeeds(notes: Note[]): Note[] {
  return notes.map((note) => {
    if (note.publicFeed) {
      return {
        ...note,
        feedId: note.publicFeedId || note.publicFeed.id,
        feed: note.publicFeed,
        metadata: {
          ...(note.metadata || {}),
          adminFeedTitle: note.feed?.title || null,
          adminFeedSlug: note.feed?.slug || null,
          publicFeedTitle: note.publicFeed.title,
          publicFeedSlug: note.publicFeed.slug,
        },
      };
    }
    return note;
  });
}
