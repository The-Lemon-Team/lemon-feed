import { Note } from '@lenta/shared';

export type FeedAppRuntimeMode = 'dev' | 'staging' | 'public';
export type FeedAppProfile = 'standard' | 'feed-bus';

/**
 * Determines whether the app is running in Feed-Bus (Lemon-Bus moderation) mode:
 * - URL param ?profile=feed-bus or ?mode=feed-bus
 * - Path /bus or /feed-bus
 * - LocalStorage 'lenta_feed_profile' === 'feed-bus'
 * - Env VITE_FEED_APP_PROFILE === 'feed-bus'
 */
export function isFeedBusEnvironment(): boolean {
  if (typeof window !== 'undefined') {
    const sp = new URLSearchParams(window.location.search);
    const profile = (sp.get('profile') || sp.get('mode') || '').toLowerCase();
    if (profile === 'feed-bus' || profile === 'bus') return true;
    if (window.location.pathname === '/bus' || window.location.pathname.startsWith('/feed-bus')) return true;

    const saved = localStorage.getItem('lenta_feed_profile')?.toLowerCase();
    if (saved === 'feed-bus' || saved === 'bus') return true;
  }

  const envProfile = (
    import.meta.env.VITE_FEED_APP_PROFILE ||
    import.meta.env.VITE_APP_PROFILE ||
    ''
  ).toLowerCase();
  return envProfile === 'feed-bus' || envProfile === 'bus';
}

export function setFeedBusProfile(isFeedBus: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const target = isFeedBus ? 'feed-bus' : 'standard';
    localStorage.setItem('lenta_feed_profile', target);
    const url = new URL(window.location.href);
    if (isFeedBus) {
      url.searchParams.set('profile', 'feed-bus');
    } else {
      url.searchParams.delete('profile');
      if (url.searchParams.get('mode') === 'feed-bus') {
        url.searchParams.delete('mode');
      }
    }
    window.history.replaceState({}, '', url.toString());
  } catch (err) {
    console.warn('Failed to set feed profile:', err);
  }
}

/**
 * Determines whether the app is running in Public Environment:
 * - Public port 5176
 * - Vite build mode public (VITE_FEED_APP_MODE=public or MODE=public)
 * - Explicit appMode=public query param in standalone public view
 */
export function isPublicEnvironment(): boolean {
  if (typeof window !== 'undefined') {
    if (window.location.port === '5176') {
      return true;
    }
  }

  const envMode = (
    import.meta.env.VITE_FEED_APP_MODE ||
    import.meta.env.MODE ||
    ''
  ).toLowerCase();
  return envMode === 'public';
}

/**
 * Resolves the initial active feed mode:
 * - In Public Environment: strictly 'public' (no tabs, cut ui)
 * - In Dev Environment: defaults to 'dev', with tabs 'dev' | 'staging' | 'public' to switch context
 */
export function resolveFeedAppMode(): FeedAppRuntimeMode {
  if (isPublicEnvironment()) {
    return 'public';
  }

  if (typeof window !== 'undefined') {
    const sp = new URLSearchParams(window.location.search);
    const paramMode = (sp.get('appMode') || sp.get('mode') || '').toLowerCase();
    if (paramMode === 'public') return 'public';
    if (paramMode === 'staging') return 'staging';
    if (paramMode === 'dev' || paramMode === 'admin') return 'dev';

    const saved = localStorage.getItem('lenta_app_mode')?.toLowerCase();
    if (saved === 'public' || saved === 'staging' || saved === 'dev') {
      return saved as FeedAppRuntimeMode;
    }
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
