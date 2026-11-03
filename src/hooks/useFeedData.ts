import { useMemo, useCallback } from 'react';
import { useFeedNotes, useFeedSources } from '../api/queries';
import { FeedAppRuntimeMode, normalizeNotesForPublicFeeds } from '../utils/appMode';
import { extractPeriodItems, PeriodItem } from '../utils/periods';

export function useFeedData(appMode: FeedAppRuntimeMode) {
  const notesQueryParams = useMemo(
    () =>
      appMode === 'public'
        ? { appMode: 'public' as const, privacy: 'public' as const, status: 'PUBLISHED' as const }
        : appMode === 'staging'
        ? { appMode: 'staging' as const, privacy: 'public' as const }
        : { appMode: 'dev' as const, privacy: 'all' as const },
    [appMode]
  );

  const { data: rawNotes = [], isLoading, refetch: refetchNotes, isRefetching } = useFeedNotes(notesQueryParams);
  const { data: allFeeds = [], refetch: refetchFeeds } = useFeedSources();

  const refetch = useCallback(async () => {
    await Promise.all([refetchNotes(), refetchFeeds()]);
  }, [refetchNotes, refetchFeeds]);

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

  const allPeriods: PeriodItem[] = useMemo(() => extractPeriodItems(rawNotes), [rawNotes]);

  return {
    rawNotes,
    allMappedNotes,
    notes,
    allFeeds,
    isLoading,
    refetch,
    isRefetching,
    allPeriods,
  };
}
