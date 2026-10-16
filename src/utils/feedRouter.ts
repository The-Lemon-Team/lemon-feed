import { useState, useEffect, useCallback } from 'react';
import { FeedSourceMode } from '../adapters/feeds/types';

export interface FeedRouteState {
  streamSource: FeedSourceMode;
  selectedFeedSlug?: string;
}

/**
 * Maps a FeedSourceMode to its canonical primary URL path.
 */
export function getPathForFeedSource(source: FeedSourceMode, feedSlug?: string): string {
  let basePath = '/';
  switch (source) {
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

  if (feedSlug && feedSlug.trim()) {
    return `${basePath}?feed=${encodeURIComponent(feedSlug.trim())}`;
  }

  return basePath;
}

/**
 * Parses the current window location (path, hash, query params) into FeedRouteState.
 */
export function parseCurrentFeedRoute(): FeedRouteState {
  if (typeof window === 'undefined') {
    return { streamSource: 'spark' };
  }

  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');

  // 1. Check direct query param ?tab=... or ?source=...
  const tabParam = searchParams.get('tab') || searchParams.get('source');
  const feedParam = searchParams.get('feed') || undefined;

  if (tabParam) {
    if (tabParam === 'seasons') return { streamSource: 'seasons', selectedFeedSlug: feedParam };
    if (tabParam === 'classic') return { streamSource: 'classic', selectedFeedSlug: feedParam };
    if (tabParam === 'tg' || tabParam === 'telegram') return { streamSource: 'telegram', selectedFeedSlug: feedParam };
    if (tabParam === 'spark') return { streamSource: 'spark', selectedFeedSlug: feedParam };
  }

  // 2. Check Hash Route (#/classic, #seasons, #tg, etc.)
  if (hash) {
    const [hashPath, hashQuery] = hash.split('?');
    const hashParams = new URLSearchParams(hashQuery || '');
    const hashFeed = hashParams.get('feed') || feedParam;

    if (hashPath === 'seasons') return { streamSource: 'seasons', selectedFeedSlug: hashFeed };
    if (hashPath === 'classic') return { streamSource: 'classic', selectedFeedSlug: hashFeed };
    if (hashPath === 'tg' || hashPath === 'telegram') return { streamSource: 'telegram', selectedFeedSlug: hashFeed };
    if (hashPath === 'wiki') return { streamSource: 'classic', selectedFeedSlug: 'wiki' };
    if (hashPath === 'spark') return { streamSource: 'spark', selectedFeedSlug: hashFeed };
  }

  // 3. Check HTML5 Pathname (/spark, /seasons, /classic, /tg, /telegram, /wiki)
  const segments = pathname.split('/').filter(Boolean);
  const primarySegment = segments[0] || '';
  const subSegment = segments[1] || feedParam;

  if (primarySegment === 'seasons') {
    return { streamSource: 'seasons', selectedFeedSlug: subSegment };
  }
  if (primarySegment === 'classic') {
    return { streamSource: 'classic', selectedFeedSlug: subSegment };
  }
  if (primarySegment === 'tg' || primarySegment === 'telegram') {
    return { streamSource: 'telegram', selectedFeedSlug: subSegment };
  }
  if (primarySegment === 'wiki') {
    return { streamSource: 'classic', selectedFeedSlug: 'wiki' };
  }

  // Default to spark
  return {
    streamSource: 'spark',
    selectedFeedSlug: primarySegment === 'spark' ? subSegment : feedParam,
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
  const navigateTo = useCallback((source: FeedSourceMode, feedSlug?: string, replace = false) => {
    setRouteState({ streamSource: source, selectedFeedSlug: feedSlug });

    if (typeof window !== 'undefined') {
      const newUrl = getPathForFeedSource(source, feedSlug);
      const currentUrl = window.location.pathname + window.location.search;
      if (newUrl !== currentUrl) {
        if (replace) {
          window.history.replaceState(null, '', newUrl);
        } else {
          window.history.pushState(null, '', newUrl);
        }
      }
    }
  }, []);

  const setStreamSource = useCallback((source: FeedSourceMode) => {
    navigateTo(source, undefined);
  }, [navigateTo]);

  const setSelectedFeedSlug = useCallback((feedSlug?: string | ((prev?: string) => string | undefined)) => {
    setRouteState((curr) => {
      const nextSlug = typeof feedSlug === 'function' ? feedSlug(curr.selectedFeedSlug) : feedSlug;
      if (typeof window !== 'undefined') {
        const newUrl = getPathForFeedSource(curr.streamSource, nextSlug);
        window.history.pushState(null, '', newUrl);
      }
      return {
        ...curr,
        selectedFeedSlug: nextSlug,
      };
    });
  }, []);

  return {
    streamSource: routeState.streamSource,
    selectedFeedSlug: routeState.selectedFeedSlug,
    setStreamSource,
    setSelectedFeedSlug,
    navigateTo,
  };
}
