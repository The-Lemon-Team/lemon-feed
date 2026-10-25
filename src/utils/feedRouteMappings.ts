import { FeedSourceMode } from '../adapters/feeds/types';

export type FeedLayoutMode = 'split' | 'stream';

export interface FeedRouteState {
  streamSource: FeedSourceMode;
  selectedFeedSlug?: string;
  subtopicSlug?: string;
  noteId?: string;
  layoutMode: FeedLayoutMode;
  isEmbed: boolean;
  searchQuery?: string;
}

export interface BuildFeedPathOptions {
  feedSlug?: string;
  subtopic?: string;
  noteId?: string;
  layoutMode?: FeedLayoutMode;
  isEmbed?: boolean;
  searchQuery?: string;
}

export interface MicrofrontendFeedNavigatePayload {
  url: string;
  pathname: string;
  streamSource: FeedSourceMode;
  selectedFeedSlug?: string;
  subtopicSlug?: string;
  noteId?: string;
}

// 1. Declarative Route Mappings (High-order tabs & Clean aliases)
export const SOURCE_TO_PATH: Record<FeedSourceMode, string> = {
  spark: '/spark',
  dev: '/dev',
  seasons: '/seasons',
  classic: '/classic',
  telegram: '/tg',
};

export const PATH_TO_SOURCE: Record<string, FeedSourceMode> = {
  spark: 'spark',
  dev: 'dev',
  devhub: 'dev',
  seasons: 'seasons',
  classic: 'classic',
  tg: 'telegram',
  telegram: 'telegram',
};

export const FEED_SLUG_TO_ALIAS: Record<string, string> = {
  'spark-changelogsfeed': 'changelogs',
  'spark-ai': 'ai',
  'spark-habr': 'habr',
  'spark-cyber-security': 'cybersec',
  'spark-xakep': 'xakep',
  'spark-notebooklmai': 'notebooklm',
  'tg-vibes': 'vibes',
  'tg-rf': 'rf',
  'tg-it': 'it',
};

export const ALIAS_TO_FEED_SLUG: Record<string, string> = {
  changelogs: 'spark-changelogsfeed',
  changelog: 'spark-changelogsfeed',
  ai: 'spark-ai',
  ml: 'spark-ai',
  habr: 'spark-habr',
  cybersec: 'spark-cyber-security',
  'cyber-security': 'spark-cyber-security',
  cybersecurity: 'spark-cyber-security',
  xakep: 'spark-xakep',
  hacker: 'spark-xakep',
  notebooklm: 'spark-notebooklmai',
  notebooklmai: 'spark-notebooklmai',
  vibes: 'tg-vibes',
  rf: 'tg-rf',
  it: 'tg-it',
};

export const COMPOUND_PREFIXES: Array<{ prefix: string; feedSlug: string; alias: string }> = [
  { prefix: 'spark-changelogsfeed-', feedSlug: 'spark-changelogsfeed', alias: 'changelogs' },
  { prefix: 'spark-notebooklmai-', feedSlug: 'spark-notebooklmai', alias: 'notebooklm' },
];

/**
 * Decomposes compound slugs (e.g. 'spark-changelogsfeed-google') into parent feed & subtopic.
 */
export function decomposeFeedSlug(slug?: string): {
  feedSlug?: string;
  subtopic?: string;
  cleanFeedAlias?: string;
} {
  if (!slug) return {};

  for (const entry of COMPOUND_PREFIXES) {
    if (slug.startsWith(entry.prefix)) {
      return {
        feedSlug: entry.feedSlug,
        subtopic: slug.slice(entry.prefix.length),
        cleanFeedAlias: entry.alias,
      };
    }
  }

  const cleanFeedAlias = FEED_SLUG_TO_ALIAS[slug] || slug;
  return {
    feedSlug: slug,
    subtopic: undefined,
    cleanFeedAlias,
  };
}

/**
 * Composes feed and optional subtopic into canonical internal slug.
 */
export function composeFeedSlug(feedOrAlias: string, subtopic?: string): string {
  const normalized = ALIAS_TO_FEED_SLUG[feedOrAlias] || feedOrAlias;
  if (!subtopic) return normalized;

  if (normalized === 'spark-changelogsfeed' || feedOrAlias === 'changelogs') {
    return `spark-changelogsfeed-${subtopic}`;
  }
  if (normalized === 'spark-notebooklmai' || feedOrAlias === 'notebooklm') {
    return `spark-notebooklmai-${subtopic}`;
  }

  return `${normalized}-${subtopic}`;
}

/**
 * Maps stream source, feed, subtopic, note ID and options to canonical URL.
 * Supports 3 levels of nesting: /:source/:feed/:subtopic (e.g. /dev/changelogs/google?note=123).
 */
export function getPathForFeedSource(
  source: FeedSourceMode,
  optionsOrFeedSlug?: string | BuildFeedPathOptions,
  layoutMode?: FeedLayoutMode,
  isEmbed?: boolean
): string {
  let opts: BuildFeedPathOptions;
  if (typeof optionsOrFeedSlug === 'string' || optionsOrFeedSlug === undefined) {
    opts = {
      feedSlug: optionsOrFeedSlug,
      layoutMode,
      isEmbed,
    };
  } else {
    opts = optionsOrFeedSlug;
  }

  const basePath = SOURCE_TO_PATH[source] || '/spark';

  let feedSlug = opts.feedSlug;
  let subtopic = opts.subtopic;
  if (feedSlug) {
    const decomp = decomposeFeedSlug(feedSlug);
    if (decomp.feedSlug) {
      feedSlug = decomp.feedSlug;
    }
    if (decomp.subtopic && !subtopic) {
      subtopic = decomp.subtopic;
    }
  }

  const pathSegments = [basePath];
  if (feedSlug && feedSlug.trim()) {
    const cleanAlias = FEED_SLUG_TO_ALIAS[feedSlug.trim()] || feedSlug.trim();
    pathSegments.push(encodeURIComponent(cleanAlias));
    if (subtopic && subtopic.trim()) {
      pathSegments.push(encodeURIComponent(subtopic.trim()));
    }
  }

  const fullPath = pathSegments.join('/').replace(/\/+/g, '/');

  const params = new URLSearchParams();
  if (opts.noteId) {
    params.set('note', opts.noteId);
  }
  if (opts.searchQuery && opts.searchQuery.trim()) {
    params.set('q', opts.searchQuery.trim());
  }
  if (opts.layoutMode === 'stream') {
    params.set('layout', 'stream');
  }
  if (opts.isEmbed) {
    params.set('embed', 'true');
  }

  const query = params.toString();
  return query ? `${fullPath}?${query}` : fullPath;
}

/**
 * Parses arbitrary feed route string (e.g. '/dev/changelogs/google?note=xyz' or 'spark') into FeedRouteState.
 */
export function parseFeedRouteString(rawRoute: string): FeedRouteState {
  let clean = rawRoute.trim();
  clean = clean.replace(/^\/?feeds\/?/i, '').replace(/^\/+/, '');
  const [pathPart, queryPart] = clean.split('?');
  const params = new URLSearchParams(queryPart || '');
  const noteId = params.get('note') || params.get('noteId') || undefined;
  const searchQuery = params.get('q') || params.get('tag') || params.get('search') || undefined;
  const layoutParam = params.get('layout') || params.get('view');
  const isEmbed = params.get('embed') === 'true';

  const segments = pathPart.split('/').filter(Boolean);
  const primarySegment = segments[0] || 'spark';
  const feedSegment = segments[1];
  const subtopicSegment = segments[2];

  let streamSource: FeedSourceMode = 'spark';
  if (primarySegment && PATH_TO_SOURCE[primarySegment]) {
    streamSource = PATH_TO_SOURCE[primarySegment];
  }

  let selectedFeedSlug: string | undefined;
  let subtopicSlug: string | undefined;

  if (feedSegment) {
    const rawFeed = ALIAS_TO_FEED_SLUG[feedSegment] || feedSegment;
    if (subtopicSegment) {
      selectedFeedSlug = composeFeedSlug(rawFeed, subtopicSegment);
      subtopicSlug = subtopicSegment;
    } else {
      selectedFeedSlug = rawFeed;
      const decomp = decomposeFeedSlug(selectedFeedSlug);
      if (decomp.subtopic) {
        subtopicSlug = decomp.subtopic;
      }
    }
  }

  return {
    streamSource,
    selectedFeedSlug,
    subtopicSlug,
    noteId,
    layoutMode: layoutParam === 'stream' ? 'stream' : 'split',
    isEmbed,
    searchQuery,
  };
}

/**
 * Parses current window location into FeedRouteState (handles 3-level routes and ?note query).
 */
export function parseCurrentFeedRoute(): FeedRouteState {
  if (typeof window === 'undefined') {
    return { streamSource: 'spark', layoutMode: 'split', isEmbed: false };
  }

  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');

  // Handle direct /notes/:id or /note/:id deep link
  if (pathname.startsWith('/notes/') || pathname.startsWith('/note/')) {
    const directNoteId = pathname.split('/')[2];
    const embedParam = searchParams.get('embed') === 'true';
    const isEmbed = embedParam || (typeof window !== 'undefined' && window.self !== window.top);
    return {
      streamSource: 'spark',
      noteId: directNoteId || searchParams.get('note') || undefined,
      layoutMode: searchParams.get('layout') === 'stream' ? 'stream' : 'split',
      isEmbed,
      searchQuery: searchParams.get('q') || undefined,
    };
  }

  const pathWithSearch = `${pathname}${window.location.search}`;
  const parsed = parseFeedRouteString(hash || pathWithSearch);

  // Check if embedded in iframe
  const embedParam = searchParams.get('embed') === 'true';
  const isEmbed = embedParam || (typeof window !== 'undefined' && window.self !== window.top);

  return {
    ...parsed,
    isEmbed,
  };
}
