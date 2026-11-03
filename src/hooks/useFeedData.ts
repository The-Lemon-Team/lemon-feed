import { useMemo, useCallback } from 'react';
import { Note } from '@lenta/shared';
import { useInfiniteFeedNotes, useFeedSources, useFeedPeriods } from '../api/queries';
import { FeedAppRuntimeMode, normalizeNotesForPublicFeeds } from '../utils/appMode';
import { PeriodItem } from '../utils/periods';

export interface UseFeedDataOptions {
  appMode: FeedAppRuntimeMode;
  streamSource?: string;
  selectedFeedSlug?: string;
}

export function useFeedData(options: FeedAppRuntimeMode | UseFeedDataOptions) {
  const appMode = typeof options === 'string' ? options : options.appMode;
  const streamSource = typeof options === 'object' ? options.streamSource : undefined;
  const selectedFeedSlug = typeof options === 'object' ? options.selectedFeedSlug : undefined;

  const notesQueryParams = useMemo(
    () => ({
      ...(appMode === 'public'
        ? { appMode: 'public' as const, privacy: 'public' as const, status: 'PUBLISHED' as const }
        : appMode === 'staging'
        ? { appMode: 'staging' as const, privacy: 'public' as const }
        : { appMode: 'dev' as const, privacy: 'all' as const }),
      streamSource,
      selectedFeedSlug,
    }),
    [appMode, streamSource, selectedFeedSlug]
  );

  const {
    data: infiniteData,
    isLoading: isStreamLoading,
    refetch: refetchStream,
    isRefetching: isStreamRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteFeedNotes(notesQueryParams);

  const { data: allFeeds = [], refetch: refetchFeeds } = useFeedSources();
  const { data: allPeriods = [], refetch: refetchPeriods } = useFeedPeriods(appMode);

  // Flatten and deduplicate loaded pages by Note ID
  const rawNotes = useMemo(() => {
    if (!infiniteData?.pages) return [];
    const map = new Map<string, Note>();
    for (const page of infiniteData.pages) {
      if (Array.isArray(page.items)) {
        for (const item of page.items) {
          if (item?.id) map.set(item.id, item);
        }
      }
    }
    return Array.from(map.values());
  }, [infiniteData]);

  const totalNotesCount = infiniteData?.pages?.[0]?.total ?? rawNotes.length;

  const refetch = useCallback(async () => {
    await Promise.all([refetchStream(), refetchFeeds(), refetchPeriods()]);
  }, [refetchStream, refetchFeeds, refetchPeriods]);

  const allMappedNotes = useMemo(
    () => normalizeNotesForPublicFeeds(rawNotes),
    [rawNotes]
  );

  const notes = useMemo(() => {
    if (appMode === 'public') {
      return allMappedNotes.filter((n) => n.privacy === 'public' && n.status === 'PUBLISHED');
    }
    if (appMode === 'staging') {
      return allMappedNotes.filter((n) => n.privacy === 'public' && n.status !== 'PUBLISHED');
    }
    return allMappedNotes;
  }, [allMappedNotes, appMode]);

  return {
    rawNotes,
    allMappedNotes,
    notes,
    allFeeds,
    isLoading: isStreamLoading,
    refetch,
    isRefetching: isStreamRefetching,
    allPeriods,
    fetchNextPage,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    totalNotesCount,
  };
}
