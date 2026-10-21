import { useState, useEffect, useCallback } from 'react';
import { FeedSourceMode } from '../adapters/feeds/types';

export type FeedLayoutMode = 'split' | 'stream';

export interface FeedRouteState {
  streamSource: FeedSourceMode;
  selectedFeedSlug?: string;
  layoutMode: FeedLayoutMode;
  isEmbed: boolean;
}

/**
 * Maps a FeedSourceMode and route options to its canonical primary URL path.
 */
export function getPathForFeedSource(
  source: FeedSourceMode,
  feedSlug?: string,
  layoutMode?: FeedLayoutMode,
  isEmbed?: boolean
): string {
  let basePath = '/';
  switch (source) {
    case 'dev':
      basePath = '/dev';
      break;
    case 'seasons':
      basePath = '/seasons';
      break;
    case 'classic':
      basePath = '/classic';
      break;
    case 'telegram':
      basePath = '/tg';
      break;
    case 'spark':
    default:
      basePath = '/spark';
      break;
  }

  const params = new URLSearchParams();
  if (feedSlug && feedSlug.trim()) {
    params.set('feed', feedSlug.trim());
  }
  if (layoutMode === 'stream') {
    params.set('layout', 'stream');
  }
  if (isEmbed) {
    params.set('embed', 'true');
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/**
 * Parses the current window location (path, hash, query params) into FeedRouteState.
 */
export function parseCurrentFeedRoute(): FeedRouteState {
  if (typeof window === 'undefined') {
    return { streamSource: 'spark', layoutMode: 'split', isEmbed: false };
  }

  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');

  // 1. Embed & Layout parameters
  const layoutParam = searchParams.get('layout') || searchParams.get('view');
  const streamOnly = searchParams.get('streamOnly') === 'true' || searchParams.get('only') === 'stream';
  const embedParam = searchParams.get('embed') === 'true';
  const isEmbed = embedParam || (typeof window !== 'undefined' && window.self !== window.top);
  const layoutMode: FeedLayoutMode = (layoutParam === 'stream' || streamOnly) ? 'stream' : 'split';

  // 2. Check direct query param ?tab=... or ?source=...
  const tabParam = searchParams.get('tab') || searchParams.get('source');
  const feedParam = searchParams.get('feed') || undefined;

  if (tabParam) {
    if (tabParam === 'dev' || tabParam === 'devhub') return { streamSource: 'dev', selectedFeedSlug: feedParam, layoutMode, isEmbed };
    if (tabParam === 'seasons') return { streamSource: 'seasons', selectedFeedSlug: feedParam, layoutMode, isEmbed };
    if (tabParam === 'classic') return { streamSource: 'classic', selectedFeedSlug: feedParam, layoutMode, isEmbed };
    if (tabParam === 'tg' || tabParam === 'telegram') return { streamSource: 'telegram', selectedFeedSlug: feedParam, layoutMode, isEmbed };
    if (tabParam === 'spark') return { streamSource: 'spark', selectedFeedSlug: feedParam, layoutMode, isEmbed };
  }

  // 3. Check Hash Route (#/classic, #seasons, #tg, etc.)
  if (hash) {
    const [hashPath, hashQuery] = hash.split('?');
    const hashParams = new URLSearchParams(hashQuery || '');
    const hashFeed = hashParams.get('feed') || feedParam;

    if (hashPath === 'dev' || hashPath === 'devhub') return { streamSource: 'dev', selectedFeedSlug: hashFeed, layoutMode, isEmbed };
    if (hashPath === 'seasons') return { streamSource: 'seasons', selectedFeedSlug: hashFeed, layoutMode, isEmbed };
    if (hashPath === 'classic') return { streamSource: 'classic', selectedFeedSlug: hashFeed, layoutMode, isEmbed };
    if (hashPath === 'tg' || hashPath === 'telegram') return { streamSource: 'telegram', selectedFeedSlug: hashFeed, layoutMode, isEmbed };
    if (hashPath === 'wiki') return { streamSource: 'classic', selectedFeedSlug: 'wiki', layoutMode, isEmbed };
    if (hashPath === 'spark') return { streamSource: 'spark', selectedFeedSlug: hashFeed, layoutMode, isEmbed };
  }

  // 4. Check HTML5 Pathname (/spark, /seasons, /classic, /tg, /telegram, /wiki)
  const segments = pathname.split('/').filter(Boolean);
  const primarySegment = segments[0] || '';
  const subSegment = segments[1] || feedParam;

  if (primarySegment === 'dev' || primarySegment === 'devhub') {
    return { streamSource: 'dev', selectedFeedSlug: subSegment, layoutMode, isEmbed };
  }
  if (primarySegment === 'seasons') {
    return { streamSource: 'seasons', selectedFeedSlug: subSegment, layoutMode, isEmbed };
  }
  if (primarySegment === 'classic') {
    return { streamSource: 'classic', selectedFeedSlug: subSegment, layoutMode, isEmbed };
  }
  if (primarySegment === 'tg' || primarySegment === 'telegram') {
    return { streamSource: 'telegram', selectedFeedSlug: subSegment, layoutMode, isEmbed };
  }
  if (primarySegment === 'wiki') {
    return { streamSource: 'classic', selectedFeedSlug: 'wiki', layoutMode, isEmbed };
  }

  // Default to spark
  return {
    streamSource: 'spark',
    selectedFeedSlug: primarySegment === 'spark' ? subSegment : feedParam,
    layoutMode,
    isEmbed,
  };
}

/**
 * React hook providing reactive routing and browser history synchronization for feed tabs.
 */
export function useFeedRouter() {
  const [routeState, setRouteState] = useState<FeedRouteState>(() => parseCurrentFeedRoute());

  // Listen for browser popstate (back / forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      setRouteState(parseCurrentFeedRoute());
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Navigate to a new source / feed tab with history push
  const navigateTo = useCallback(
    (source: FeedSourceMode, feedSlug?: string, newLayoutMode?: FeedLayoutMode, replace = false) => {
      setRouteState((curr) => {
        const layoutMode = newLayoutMode ?? curr.layoutMode;
        if (typeof window !== 'undefined') {
          const newUrl = getPathForFeedSource(source, feedSlug, layoutMode, curr.isEmbed);
          const currentUrl = window.location.pathname + window.location.search;
          if (newUrl !== currentUrl) {
            if (replace) {
              window.history.replaceState(null, '', newUrl);
            } else {
              window.history.pushState(null, '', newUrl);
            }
          }
        }
        return {
          ...curr,
          streamSource: source,
          selectedFeedSlug: feedSlug,
          layoutMode,
        };
      });
    },
    []
  );

  const setStreamSource = useCallback(
    (source: FeedSourceMode) => {
      navigateTo(source, undefined);
    },
    [navigateTo]
  );

  const setSelectedFeedSlug = useCallback(
    (feedSlug?: string | ((prev?: string) => string | undefined)) => {
      setRouteState((curr) => {
        const nextSlug = typeof feedSlug === 'function' ? feedSlug(curr.selectedFeedSlug) : feedSlug;
        if (typeof window !== 'undefined') {
          const newUrl = getPathForFeedSource(curr.streamSource, nextSlug, curr.layoutMode, curr.isEmbed);
          window.history.pushState(null, '', newUrl);
        }
        return {
          ...curr,
          selectedFeedSlug: nextSlug,
        };
      });
    },
    []
  );

  const setLayoutMode = useCallback((layoutMode: FeedLayoutMode) => {
    setRouteState((curr) => {
      if (typeof window !== 'undefined') {
        const newUrl = getPathForFeedSource(curr.streamSource, curr.selectedFeedSlug, layoutMode, curr.isEmbed);
        window.history.pushState(null, '', newUrl);
      }
      return {
        ...curr,
        layoutMode,
      };
    });
  }, []);

  const toggleLayoutMode = useCallback(() => {
    setRouteState((curr) => {
      const nextMode: FeedLayoutMode = curr.layoutMode === 'stream' ? 'split' : 'stream';
      if (typeof window !== 'undefined') {
        const newUrl = getPathForFeedSource(curr.streamSource, curr.selectedFeedSlug, nextMode, curr.isEmbed);
        window.history.pushState(null, '', newUrl);
      }
      return {
        ...curr,
        layoutMode: nextMode,
      };
    });
  }, []);

  return {
    streamSource: routeState.streamSource,
    selectedFeedSlug: routeState.selectedFeedSlug,
    layoutMode: routeState.layoutMode,
    isEmbed: routeState.isEmbed,
    setStreamSource,
    setSelectedFeedSlug,
    setLayoutMode,
    toggleLayoutMode,
    navigateTo,
  };
}
