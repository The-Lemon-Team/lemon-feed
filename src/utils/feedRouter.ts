import { useState, useEffect, useCallback, useRef } from 'react';
import { FeedSourceMode } from '../adapters/feeds/types';
import {
  FeedLayoutMode,
  FeedRouteState,
  MicrofrontendFeedNavigatePayload,
  PATH_TO_SOURCE,
  decomposeFeedSlug,
  composeFeedSlug,
  getPathForFeedSource,
  parseFeedRouteString,
  parseCurrentFeedRoute,
} from './feedRouteMappings';

export * from './feedRouteMappings';

/**
 * Notifies parent host (calendar-app) via postMessage when running in microfrontend iframe.
 */
export function notifyParentHost(type: string, payload: MicrofrontendFeedNavigatePayload) {
  if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
    try {
      window.parent.postMessage(
        {
          type,
          source: 'lenta-feed-app',
          payload,
        },
        '*'
      );
    } catch {
      // Cross-origin safety
    }
  }
}

/**
 * React hook providing reactive routing and browser history synchronization for 3-level feeds and notes.
 */
export function useFeedRouter() {
  const [routeState, setRouteState] = useState<FeedRouteState>(() => parseCurrentFeedRoute());
  const initialNotifiedRef = useRef(false);

  // Sync initial route with parent host on mount if running embedded
  useEffect(() => {
    if (initialNotifiedRef.current) return;
    initialNotifiedRef.current = true;

    const initial = parseCurrentFeedRoute();
    if (initial.isEmbed) {
      const decomp = decomposeFeedSlug(initial.selectedFeedSlug);
      notifyParentHost('LENTA_FEED_NAVIGATE', {
        url: window.location.pathname + window.location.search,
        pathname: window.location.pathname,
        streamSource: initial.streamSource,
        selectedFeedSlug: initial.selectedFeedSlug,
        subtopicSlug: initial.subtopicSlug || decomp.subtopic,
        noteId: initial.noteId,
      });
    }
  }, []);

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

  // Listen for microfrontend navigation events from host app
  useEffect(() => {
    const handleHostMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LENTA_NAVIGATE_FEED') {
        const payload = event.data.payload || {};
        if (typeof payload === 'string' || payload.route || payload.pathname) {
          const rawRoute = typeof payload === 'string' ? payload : (payload.route || payload.pathname);
          const parsed = parseFeedRouteString(rawRoute);
          navigateTo(parsed.streamSource, parsed.selectedFeedSlug, parsed.subtopicSlug, parsed.noteId, undefined, true);
          return;
        }

        const { source, feedSlug, subtopic, noteId: hostNoteId } = payload;
        if (source && PATH_TO_SOURCE[source]) {
          const targetSource = PATH_TO_SOURCE[source];
          const fullSlug = subtopic ? composeFeedSlug(feedSlug || '', subtopic) : feedSlug;
          navigateTo(targetSource, fullSlug, subtopic, hostNoteId, undefined, true);
        }
      }
    };

    window.addEventListener('message', handleHostMessage);
    return () => {
      window.removeEventListener('message', handleHostMessage);
    };
  }, []);

  const navigateTo = useCallback(
    (
      source: FeedSourceMode,
      feedSlug?: string,
      subtopic?: string,
      newNoteId?: string,
      newLayoutMode?: FeedLayoutMode,
      replace = false
    ) => {
      setRouteState((curr) => {
        const layoutMode = newLayoutMode ?? curr.layoutMode;
        const decomp = decomposeFeedSlug(feedSlug);
        const effectiveSubtopic = subtopic || decomp.subtopic;
        const effectiveFeedSlug = decomp.feedSlug || feedSlug;

        if (typeof window !== 'undefined') {
          const newUrl = getPathForFeedSource(source, {
            feedSlug: effectiveFeedSlug,
            subtopic: effectiveSubtopic,
            noteId: newNoteId,
            layoutMode,
            isEmbed: curr.isEmbed,
          });
          const currentUrl = window.location.pathname + window.location.search;
          if (newUrl !== currentUrl) {
            if (replace) {
              window.history.replaceState({ noteId: newNoteId }, '', newUrl);
            } else {
              window.history.pushState({ noteId: newNoteId }, '', newUrl);
            }
            notifyParentHost('LENTA_FEED_NAVIGATE', {
              url: newUrl,
              pathname: newUrl.split('?')[0],
              streamSource: source,
              selectedFeedSlug: effectiveFeedSlug ? composeFeedSlug(effectiveFeedSlug, effectiveSubtopic) : undefined,
              subtopicSlug: effectiveSubtopic,
              noteId: newNoteId,
            });
          }
        }

        return {
          ...curr,
          streamSource: source,
          selectedFeedSlug: effectiveFeedSlug ? composeFeedSlug(effectiveFeedSlug, effectiveSubtopic) : undefined,
          subtopicSlug: effectiveSubtopic,
          noteId: newNoteId,
          layoutMode,
        };
      });
    },
    []
  );

  const setStreamSource = useCallback(
    (source: FeedSourceMode) => {
      navigateTo(source, undefined, undefined, undefined);
    },
    [navigateTo]
  );

  const setSelectedFeedSlug = useCallback(
    (feedSlug?: string | ((prev?: string) => string | undefined)) => {
      setRouteState((curr) => {
        const nextSlug = typeof feedSlug === 'function' ? feedSlug(curr.selectedFeedSlug) : feedSlug;
        const decomp = decomposeFeedSlug(nextSlug);
        if (typeof window !== 'undefined') {
          const newUrl = getPathForFeedSource(curr.streamSource, {
            feedSlug: nextSlug,
            noteId: curr.noteId,
            layoutMode: curr.layoutMode,
            isEmbed: curr.isEmbed,
          });
          window.history.pushState(null, '', newUrl);
          notifyParentHost('LENTA_FEED_NAVIGATE', {
            url: newUrl,
            pathname: newUrl.split('?')[0],
            streamSource: curr.streamSource,
            selectedFeedSlug: nextSlug,
            subtopicSlug: decomp.subtopic,
            noteId: curr.noteId,
          });
        }
        return {
          ...curr,
          selectedFeedSlug: nextSlug,
          subtopicSlug: decomp.subtopic,
        };
      });
    },
    []
  );

  const openNote = useCallback((id: string) => {
    setRouteState((curr) => {
      if (typeof window !== 'undefined') {
        const newUrl = getPathForFeedSource(curr.streamSource, {
          feedSlug: curr.selectedFeedSlug,
          subtopic: curr.subtopicSlug,
          noteId: id,
          layoutMode: curr.layoutMode,
          isEmbed: curr.isEmbed,
        });
        window.history.pushState({ noteId: id }, '', newUrl);
        notifyParentHost('LENTA_FEED_NAVIGATE', {
          url: newUrl,
          pathname: newUrl.split('?')[0],
          streamSource: curr.streamSource,
          selectedFeedSlug: curr.selectedFeedSlug,
          subtopicSlug: curr.subtopicSlug,
          noteId: id,
        });
      }
      return {
        ...curr,
        noteId: id,
      };
    });
  }, []);

  const closeNote = useCallback(() => {
    setRouteState((curr) => {
      if (typeof window !== 'undefined') {
        const newUrl = getPathForFeedSource(curr.streamSource, {
          feedSlug: curr.selectedFeedSlug,
          subtopic: curr.subtopicSlug,
          noteId: undefined,
          layoutMode: curr.layoutMode,
          isEmbed: curr.isEmbed,
        });
        window.history.pushState({ noteId: null }, '', newUrl);
        notifyParentHost('LENTA_FEED_NAVIGATE', {
          url: newUrl,
          pathname: newUrl.split('?')[0],
          streamSource: curr.streamSource,
          selectedFeedSlug: curr.selectedFeedSlug,
          subtopicSlug: curr.subtopicSlug,
          noteId: undefined,
        });
      }
      return {
        ...curr,
        noteId: undefined,
      };
    });
  }, []);

  const setLayoutMode = useCallback((layoutMode: FeedLayoutMode) => {
    setRouteState((curr) => {
      if (typeof window !== 'undefined') {
        const newUrl = getPathForFeedSource(curr.streamSource, {
          feedSlug: curr.selectedFeedSlug,
          subtopic: curr.subtopicSlug,
          noteId: curr.noteId,
          layoutMode,
          isEmbed: curr.isEmbed,
        });
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
        const newUrl = getPathForFeedSource(curr.streamSource, {
          feedSlug: curr.selectedFeedSlug,
          subtopic: curr.subtopicSlug,
          noteId: curr.noteId,
          layoutMode: nextMode,
          isEmbed: curr.isEmbed,
        });
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
    subtopicSlug: routeState.subtopicSlug,
    noteId: routeState.noteId,
    layoutMode: routeState.layoutMode,
    isEmbed: routeState.isEmbed,
    searchQuery: routeState.searchQuery,
    setStreamSource,
    setSelectedFeedSlug,
    setLayoutMode,
    toggleLayoutMode,
    openNote,
    closeNote,
    navigateTo,
  };
}
