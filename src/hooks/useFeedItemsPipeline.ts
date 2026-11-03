import { useState, useMemo, useEffect, useRef } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { feedApi } from '../api/client';
import { UnifiedFeedItem, FeedAdapter } from '../adapters/feeds';
import {
  FeedHorizon,
  PeriodFilterMode,
  PeriodItem,
  filterNotesByHorizon,
  filterNotesByPeriod,
} from '../utils/periods';

interface UseFeedItemsPipelineOptions {
  notes: any[];
  rawNotes: any[];
  allFeeds: any[];
  allPeriods: PeriodItem[];
  refetch: () => void;
  streamSource: string;
  selectedFeedSlug?: string;
  deferredSearchQuery: string;
  isMonthFilterActive: boolean;
  selectedMonth: Dayjs;
  filterUnassignedOnly: boolean;
  selectedPeriodId?: string;
  periodFilterMode: PeriodFilterMode;
  feedHorizon: FeedHorizon;
  activeAdapter: FeedAdapter;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  totalNotesCount?: number;
}

export function useFeedItemsPipeline({
  notes,
  rawNotes,
  allFeeds,
  allPeriods,
  refetch,
  streamSource,
  selectedFeedSlug,
  deferredSearchQuery,
  isMonthFilterActive,
  selectedMonth,
  filterUnassignedOnly,
  selectedPeriodId,
  periodFilterMode,
  feedHorizon,
  activeAdapter,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  totalNotesCount,
}: UseFeedItemsPipelineOptions) {
  // Enriched feeds list (combines DB feeds and feeds detected in notes with actual count)
  const allAvailableFeeds = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        slug: string;
        title: string;
        privacy?: string;
        icon?: string | null;
        color?: string | null;
        count: number;
      }
    >();

    for (const f of allFeeds) {
      map.set(f.slug, {
        id: f.id,
        slug: f.slug,
        title: f.title,
        privacy: f.privacy,
        icon: f.icon,
        color: f.color,
        count: f._count?.notes || 0,
      });
    }

    for (const n of rawNotes) {
      if (n.feed?.slug) {
        const existing = map.get(n.feed.slug);
        if (existing) {
          existing.count = (existing.count || 0) + 1;
        } else {
          map.set(n.feed.slug, {
            id: n.feed.id || n.feed.slug,
            slug: n.feed.slug,
            title: n.feed.title || n.feed.slug,
            privacy: n.feed.privacy || n.privacy,
            icon: n.feed.icon || '📁',
            color: n.feed.color || null,
            count: 1,
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => (b.count || 0) - (a.count || 0));
  }, [allFeeds, rawNotes]);

  // Available hashtags aggregated from current loaded notes with frequencies
  const allAvailableHashtags = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of rawNotes) {
      if (Array.isArray(n.hashtags)) {
        for (const h of n.hashtags) {
          const raw = typeof h === 'string' ? h : (h as any)?.name;
          if (raw) {
            const clean = raw.replace(/^#/, '').trim().toLowerCase();
            if (clean) {
              counts[clean] = (counts[clean] || 0) + 1;
            }
          }
        }
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [rawNotes]);

  // On-demand Wiki calendar feed auto-sync
  const wikiSyncTriggered = useRef(false);
  useEffect(() => {
    if (selectedFeedSlug === 'wiki' && !wikiSyncTriggered.current) {
      const hasWikiNotes = notes.some(
        (n) => n.feed?.slug === 'wiki' || n.feed?.slug === 'wiki-history'
      );
      if (!hasWikiNotes) {
        wikiSyncTriggered.current = true;
        feedApi
          .syncWikiToday()
          .then(() => {
            refetch();
          })
          .catch((e) => {
            console.warn('[Wiki Sync] Auto-fetch error:', e);
          });
      }
    }
  }, [selectedFeedSlug, notes, refetch]);

  // Selected period
  const selectedPeriod = useMemo(
    () => allPeriods.find((p) => p.id === selectedPeriodId),
    [allPeriods, selectedPeriodId]
  );

  // All items for current streamSource
  const allSourceItems = useMemo(() => {
    return activeAdapter.adaptNotes(notes, undefined, '');
  }, [activeAdapter, notes]);

  // Active channel periods for rail & mobile carousel
  const activeChannelPeriods = useMemo(() => {
    // If viewing a scoped or custom source tab (not global 'all'), scope periods to the notes in this tab
    const isGlobal = streamSource === 'all' || streamSource === 'classic';
    const sourceNoteIds = isGlobal ? null : new Set(allSourceItems.map((item) => item.id));
    const basePeriods = sourceNoteIds
      ? allPeriods.filter((p) => sourceNoteIds.has(p.rawNote?.id || p.id))
      : allPeriods;

    if (selectedFeedSlug) {
      return basePeriods.filter(
        (p) =>
          p.feedSlug === selectedFeedSlug ||
          (p.rawNote.folderPath && p.rawNote.folderPath.toLowerCase().includes(selectedFeedSlug.toLowerCase()))
      );
    }
    return basePeriods.filter((p) => p.status === 'active' || p.status === 'upcoming');
  }, [allPeriods, selectedFeedSlug, streamSource, allSourceItems]);

  // Upcoming items count for Horizon switcher badge
  const upcomingCount = useMemo(() => {
    const today = dayjs().startOf('day');
    return allSourceItems.filter((item: UnifiedFeedItem) => {
      const d = dayjs(item.publishedAt);
      return d.isValid() && d.isSameOrAfter(today);
    }).length;
  }, [allSourceItems]);

  const totalCount = allSourceItems.length;

  // Filtered feed items (search query + optional month filter + period + horizon)
  const feedItems: UnifiedFeedItem[] = useMemo(() => {
    let items =
      !selectedFeedSlug && !deferredSearchQuery.trim()
        ? allSourceItems
        : activeAdapter.adaptNotes(notes, selectedFeedSlug, deferredSearchQuery);

    if (isMonthFilterActive) {
      items = items.filter((item: UnifiedFeedItem) => {
        const itemDate = dayjs(item.publishedAt);
        return itemDate.isValid() && itemDate.isSame(selectedMonth, 'month');
      });
    }

    if (filterUnassignedOnly) {
      items = items.filter((item: UnifiedFeedItem) => {
        const slug = item.feedSlug?.toLowerCase() || '';
        return (
          !slug ||
          slug === 'spark-general' ||
          slug === 'general' ||
          slug === 'unassigned' ||
          slug === 'news' ||
          slug === 'default'
        );
      });
    }

    if (selectedPeriod) {
      items = filterNotesByPeriod(items, selectedPeriod, periodFilterMode);
    }

    items = filterNotesByHorizon(items, feedHorizon);

    return items;
  }, [
    activeAdapter,
    notes,
    allSourceItems,
    selectedFeedSlug,
    deferredSearchQuery,
    isMonthFilterActive,
    selectedMonth,
    filterUnassignedOnly,
    selectedPeriod,
    periodFilterMode,
    feedHorizon,
  ]);

  // Progressive infinite loading
  const BATCH_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [
    streamSource,
    selectedFeedSlug,
    deferredSearchQuery,
    isMonthFilterActive,
    selectedMonth,
    filterUnassignedOnly,
    selectedPeriodId,
    periodFilterMode,
    feedHorizon,
  ]);

  const visibleFeedItems = useMemo(() => {
    return feedItems.slice(0, visibleCount);
  }, [feedItems, visibleCount]);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleCount >= feedItems.length && !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (visibleCount < feedItems.length) {
            setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, feedItems.length));
          } else if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
            fetchNextPage();
            setVisibleCount((prev) => prev + BATCH_SIZE);
          }
        }
      },
      { rootMargin: '350px' }
    );

    const el = loadMoreRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
      observer.disconnect();
    };
  }, [visibleCount, feedItems.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Available hashtags extracted from current filtered items
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const item of feedItems) {
      if (item.hashtags) {
        for (const h of item.hashtags) {
          if (h) set.add(h);
        }
      }
    }
    return Array.from(set);
  }, [feedItems]);

  return {
    allAvailableFeeds,
    allAvailableHashtags,
    selectedPeriod,
    activeChannelPeriods,
    feedItems,
    visibleFeedItems,
    totalCount,
    upcomingCount,
    availableTags,
    visibleCount,
    loadMoreRef,
  };
}
