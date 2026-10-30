import React, { useState, useMemo, useEffect, useCallback, useRef, useDeferredValue, Suspense, lazy } from 'react';
import dayjs from 'dayjs';
import { useFeedNotes, useFeedSources, useUpdateNote } from './api/queries';
import { feedApi, setFeedAppMode } from './api/client';
import {
  resolveFeedAppMode,
  isPublicEnvironment,
  FeedAppRuntimeMode,
  normalizeNotesForPublicFeeds,
} from './utils/appMode';
import {
  FEED_ADAPTERS,
  FeedSourceMode,
  UnifiedFeedItem,
  UnifiedFeedTab,
} from './adapters/feeds';
import { FeedToolbar, FeedModeOption, DEFAULT_FEED_MODES } from './components/FeedToolbar';
import { FeedStreamView } from './components/FeedStreamView';
import { FeedDesktopRail } from './components/FeedDesktopRail';
import { FeedBottomNav } from './components/FeedBottomNav';
import { X } from 'lucide-react';
import { useFeedRouter } from './utils/feedRouter';
import { useFeedAuthSync } from './hooks/useFeedAuthSync';
import {
  FeedHorizon,
  PeriodFilterMode,
  extractPeriodItems,
  filterNotesByHorizon,
  filterNotesByPeriod,
} from './utils/periods';
import { FeedPeriodActiveBanner } from './components/toolbar/FeedPeriodActiveBanner';
import { FeedActivitiesMobileCarousel } from './components/activities/FeedActivitiesMobileCarousel';

const FeedDetailModal = lazy(() => import('./components/FeedDetailModal').then((m) => ({ default: m.FeedDetailModal })));
const FeedEditNoteModal = lazy(() => import('./components/FeedEditNoteModal').then((m) => ({ default: m.FeedEditNoteModal })));
const FeedAiCoverModal = lazy(() => import('./components/FeedAiCoverModal').then((m) => ({ default: m.FeedAiCoverModal })));
const LemonSeasonsModal = lazy(() => import('./components/LemonSeasonsModal').then((m) => ({ default: m.LemonSeasonsModal })));
const FeedEntityModal = lazy(() => import('./components/FeedEntityModal').then((m) => ({ default: m.FeedEntityModal })));
const FeedSourceTabModal = lazy(() => import('./components/FeedSourceTabModal').then((m) => ({ default: m.FeedSourceTabModal })));

export const App: React.FC = () => {
  const {
    streamSource,
    selectedFeedSlug,
    layoutMode,
    isEmbed,
    noteId,
    setStreamSource,
    setSelectedFeedSlug,
    toggleLayoutMode,
    openNote,
    closeNote,
  } = useFeedRouter();

  // Synchronize authentication token and session from parent host via postMessage
  const authSync = useFeedAuthSync(isEmbed);
  const isPublicMode = isPublicEnvironment();
  const [appMode, setAppMode] = useState<FeedAppRuntimeMode>(() => resolveFeedAppMode());

  const handleSetAppMode = useCallback((newMode: FeedAppRuntimeMode) => {
    setAppMode(newMode);
    setFeedAppMode(newMode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lenta_app_mode', newMode);
        const url = new URL(window.location.href);
        url.searchParams.set('appMode', newMode);
        window.history.replaceState({}, '', url.toString());
      } catch (err) {
        console.warn('Failed to update URL:', err);
      }
      if (isEmbed && window.parent) {
        window.parent.postMessage(
          {
            type: 'LENTA_APP_MODE_CHANGED',
            source: 'lenta-feed-app',
            payload: { appMode: newMode },
          },
          '*'
        );
      }
    }
  }, [isEmbed]);

  // Synchronize mode incoming from host container
  useEffect(() => {
    const handleModeMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LENTA_SET_APP_MODE') {
        const incoming = event.data.payload?.appMode;
        if (incoming === 'dev' || incoming === 'staging' || incoming === 'public') {
          setAppMode(incoming);
          setFeedAppMode(incoming);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('lenta_app_mode', incoming);
              const url = new URL(window.location.href);
              url.searchParams.set('appMode', incoming);
              window.history.replaceState({}, '', url.toString());
            } catch {
              // ignore
            }
          }
        }
      }
    };
    window.addEventListener('message', handleModeMessage);
    return () => window.removeEventListener('message', handleModeMessage);
  }, []);

  const updateNoteMutation = useUpdateNote();

  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Month navigation & filter (supports start / startDate from host app URL)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const urlDate = sp.get('startDate') || sp.get('start');
      if (urlDate) {
        const parsed = dayjs(urlDate);
        if (parsed.isValid()) return parsed;
      }
    }
    return dayjs('2026-10-17');
  });
  const [isMonthFilterActive, setIsMonthFilterActive] = useState(false);
  const [filterUnassignedOnly, setFilterUnassignedOnly] = useState(false);

  // Horizon State ('recent' = ⚡ Свежее, 'upcoming' = 🔔 Скоро)
  const [feedHorizon, setFeedHorizon] = useState<FeedHorizon>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const urlH = sp.get('horizon');
      if (urlH === 'upcoming' || urlH === 'recent') return urlH;
      const saved = localStorage.getItem('lenta_feed_horizon');
      if (saved === 'upcoming' || saved === 'recent') return saved as FeedHorizon;
    }
    return 'recent';
  });

  const handleSetHorizon = useCallback((newHorizon: FeedHorizon) => {
    setFeedHorizon(newHorizon);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lenta_feed_horizon', newHorizon);
        const url = new URL(window.location.href);
        if (newHorizon === 'upcoming') {
          url.searchParams.set('horizon', 'upcoming');
        } else {
          url.searchParams.delete('horizon');
        }
        window.history.replaceState({}, '', url.toString());
      } catch (err) {
        console.warn('Failed to update URL horizon:', err);
      }
    }
  }, []);

  // Selected Period state & filter mode ('bound' vs 'all')
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('period') || undefined;
    }
    return undefined;
  });
  const [periodFilterMode, setPeriodFilterMode] = useState<PeriodFilterMode>('bound');

  const [activeMobileNav, setActiveMobileNav] = useState<'stream' | 'categories' | 'search'>('stream');
  const [selectedDetailItem, setSelectedDetailItem] = useState<UnifiedFeedItem | null>(null);
  const [editingItem, setEditingItem] = useState<UnifiedFeedItem | null>(null);
  const [aiCoverItem, setAiCoverItem] = useState<UnifiedFeedItem | null>(null);
  const [aiCoverTemplateId, setAiCoverTemplateId] = useState<string | undefined>(undefined);
  const [isLemonSeasonsModalOpen, setIsLemonSeasonsModalOpen] = useState(false);

  // Edit Mode state (available in Dev mode)
  const [isEditMode, setIsEditMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('editMode') === 'true' || sp.get('edit') === '1') return true;
      return localStorage.getItem('lenta_edit_mode') === 'true';
    }
    return false;
  });

  const handleToggleEditMode = useCallback(() => {
    setIsEditMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('lenta_edit_mode', String(next));
        const url = new URL(window.location.href);
        if (next) {
          url.searchParams.set('editMode', 'true');
        } else {
          url.searchParams.delete('editMode');
          url.searchParams.delete('edit');
        }
        window.history.replaceState({}, '', url.toString());
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Custom source modes (upper tabs)
  const [sourceModes, setSourceModes] = useState<FeedModeOption[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lenta_custom_stream_modes');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // fallback
      }
    }
    return DEFAULT_FEED_MODES;
  });

  // Modal states for tabs and feeds
  const [editingSourceTab, setEditingSourceTab] = useState<FeedModeOption | null>(null);
  const [isSourceTabModalOpen, setIsSourceTabModalOpen] = useState(false);

  const [editingFeedTab, setEditingFeedTab] = useState<UnifiedFeedTab | null>(null);
  const [editingDbFeed, setEditingDbFeed] = useState<any | null>(null);
  const [isFeedEntityModalOpen, setIsFeedEntityModalOpen] = useState(false);

  const handleOpenEditSourceTab = useCallback((tab: FeedModeOption) => {
    setEditingSourceTab(tab);
    setIsSourceTabModalOpen(true);
  }, []);

  const handleOpenAddSourceTab = useCallback(() => {
    setEditingSourceTab(null);
    setIsSourceTabModalOpen(true);
  }, []);

  const handleSaveSourceTab = useCallback((tab: FeedModeOption) => {
    setSourceModes((prev) => {
      const existingIndex = prev.findIndex((m) => m.id === tab.id);
      let updated: FeedModeOption[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = tab;
      } else {
        updated = [...prev, tab];
      }
      try {
        localStorage.setItem('lenta_custom_stream_modes', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const handleDeleteSourceTab = useCallback((tabId: string) => {
    setSourceModes((prev) => {
      const updated = prev.filter((m) => m.id !== tabId);
      try {
        localStorage.setItem('lenta_custom_stream_modes', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Dark / Light Theme
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return next;
    });
  };

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Data fetching:
  // - In dev & funnel testing mode: fetches all notes with admin privileges (nothing hidden)
  // - In public mode: strictly approved public notes (privacy='public', status='PUBLISHED')
  const notesQueryParams = useMemo(
    () =>
      appMode === 'public'
        ? { appMode: 'public' as const, privacy: 'public' as const, status: 'PUBLISHED' as const }
        : appMode === 'staging'
        ? { appMode: 'staging' as const, privacy: 'public' as const }
        : { appMode: 'dev' as const, privacy: 'all' as const },
    [appMode]
  );
  const { data: rawNotes = [], isLoading, refetch, isRefetching } = useFeedNotes(notesQueryParams);
  const { data: allFeeds = [] } = useFeedSources();

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

  // On-demand Wiki calendar feed auto-sync
  const wikiSyncTriggered = useRef(false);
  useEffect(() => {
    if (selectedFeedSlug === 'wiki' && !wikiSyncTriggered.current) {
      const hasWikiNotes = notes.some(
        (n) => n.feed?.slug === 'wiki' || n.feed?.slug === 'wiki-history'
      );
      if (!hasWikiNotes) {
        wikiSyncTriggered.current = true;
        feedApi.syncWikiToday().then(() => {
          refetch();
        }).catch((e) => {
          console.warn('[Wiki Sync] Auto-fetch error:', e);
        });
      }
    }
  }, [selectedFeedSlug, notes, refetch]);

  // Active adapter
  const activeAdapter = useMemo(() => {
    return FEED_ADAPTERS[streamSource] || FEED_ADAPTERS.all;
  }, [streamSource]);

  // Thematic tabs (only tabs that actually have notes in the current staging/public view)
  const activeTabs: UnifiedFeedTab[] = useMemo(() => {
    return activeAdapter.getTabs({ allFeeds, notes }).filter((t) => t.count > 0);
  }, [activeAdapter, allFeeds, notes]);

  // Reset selectedFeedSlug if the selected tab becomes empty/unavailable
  useEffect(() => {
    if (!selectedFeedSlug || isLoading) return;
    const stillExists = activeTabs.some(
      (t) =>
        t.slug === selectedFeedSlug ||
        Boolean(t.subtopics && t.subtopics.some((s) => s.slug === selectedFeedSlug))
    );
    if (!stillExists) {
      setSelectedFeedSlug(undefined);
    }
  }, [activeTabs, selectedFeedSlug, isLoading, setSelectedFeedSlug]);

  // Active tab object for sidebar detail
  const activeTabObj: UnifiedFeedTab | null = useMemo(() => {
    if (!selectedFeedSlug) return null;
    return (
      activeTabs.find(
        (t) =>
          t.slug === selectedFeedSlug ||
          Boolean(t.subtopics && t.subtopics.some((s) => s.slug === selectedFeedSlug))
      ) || null
    );
  }, [activeTabs, selectedFeedSlug]);

  const handleOpenEditFeed = useCallback(
    (tab: UnifiedFeedTab) => {
      const dbFeed = allFeeds.find((f) => f.id === tab.id || f.slug === tab.slug);
      setEditingFeedTab(tab);
      setEditingDbFeed(dbFeed || null);
      setIsFeedEntityModalOpen(true);
    },
    [allFeeds]
  );

  const handleOpenAddFeed = useCallback(() => {
    setEditingFeedTab(null);
    setEditingDbFeed(null);
    setIsFeedEntityModalOpen(true);
  }, []);

  // Periods extraction & mapping
  const allPeriods = useMemo(() => extractPeriodItems(rawNotes), [rawNotes]);

  const selectedPeriod = useMemo(
    () => allPeriods.find((p) => p.id === selectedPeriodId),
    [allPeriods, selectedPeriodId]
  );

  const handleSelectPeriod = useCallback(
    (periodId?: string) => {
      setSelectedPeriodId(periodId);
      setPeriodFilterMode('bound'); // Auto-reset to bound notes as per spec

      if (typeof window !== 'undefined') {
        try {
          const url = new URL(window.location.href);
          if (periodId) {
            url.searchParams.set('period', periodId);
          } else {
            url.searchParams.delete('period');
          }
          window.history.replaceState({}, '', url.toString());
        } catch {
          // ignore
        }
      }

      if (periodId) {
        const targetPeriod = allPeriods.find((p) => p.id === periodId);
        if (targetPeriod?.feedSlug) {
          setSelectedFeedSlug(targetPeriod.feedSlug);
        }
      }
    },
    [allPeriods, setSelectedFeedSlug]
  );

  // Active channel periods for rail & mobile carousel
  const activeChannelPeriods = useMemo(() => {
    if (selectedFeedSlug) {
      return allPeriods.filter(
        (p) =>
          p.feedSlug === selectedFeedSlug ||
          (p.rawNote.folderPath && p.rawNote.folderPath.toLowerCase().includes(selectedFeedSlug.toLowerCase()))
      );
    }
    return allPeriods.filter((p) => p.status === 'active' || p.status === 'upcoming');
  }, [allPeriods, selectedFeedSlug]);

  // All items for current streamSource (shared for totalCount and unfiltered view)
  const allSourceItems = useMemo(() => {
    return activeAdapter.adaptNotes(notes, undefined, '');
  }, [activeAdapter, notes]);

  // Upcoming items count for Horizon switcher badge
  const upcomingCount = useMemo(() => {
    const today = dayjs().startOf('day');
    return allSourceItems.filter((item) => {
      const d = dayjs(item.publishedAt);
      return d.isValid() && d.isSameOrAfter(today);
    }).length;
  }, [allSourceItems]);

  // Mode total count
  const totalCount = allSourceItems.length;

  // Filtered feed items (search query + optional month filter + period + horizon)
  const feedItems: UnifiedFeedItem[] = useMemo(() => {
    let items =
      !selectedFeedSlug && !deferredSearchQuery.trim()
        ? allSourceItems
        : activeAdapter.adaptNotes(notes, selectedFeedSlug, deferredSearchQuery);

    if (isMonthFilterActive) {
      items = items.filter((item) => {
        const itemDate = dayjs(item.publishedAt);
        return itemDate.isValid() && itemDate.isSame(selectedMonth, 'month');
      });
    }

    if (filterUnassignedOnly) {
      items = items.filter((item) => {
        const slug = item.feedSlug?.toLowerCase() || '';
        return !slug || slug === 'spark-general' || slug === 'general' || slug === 'unassigned' || slug === 'news' || slug === 'default';
      });
    }

    // Apply chosen period filter if active
    if (selectedPeriod) {
      items = filterNotesByPeriod(items, selectedPeriod, periodFilterMode);
    }

    // Apply Horizon filter & sorting ('recent' vs 'upcoming')
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
    if (visibleCount >= feedItems.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, feedItems.length));
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
  }, [visibleCount, feedItems.length]);

  const handleOpenDetail = useCallback(
    (item: UnifiedFeedItem) => {
      setSelectedDetailItem(item);
      openNote(item.id);
    },
    [openNote]
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedDetailItem(null);
    closeNote();
  }, [closeNote]);

  // Synchronize open note modal with route query param (?note=...)
  useEffect(() => {
    if (!noteId) {
      if (selectedDetailItem) {
        setSelectedDetailItem(null);
      }
      return;
    }

    if (selectedDetailItem && selectedDetailItem.id === noteId) {
      return;
    }

    const targetNote = allMappedNotes.find(
      (n) => n.id === noteId || n.externalId === noteId || (n.metadata && (n.metadata as any).slug === noteId)
    );
    if (targetNote) {
      const adapted = activeAdapter.adaptNotes([targetNote])[0];
      if (adapted) {
        setSelectedDetailItem(adapted);
      }
    }
  }, [noteId, allMappedNotes, activeAdapter, selectedDetailItem]);

  const handleSelectTag = useCallback((tag: string) => {
    setSearchQuery(tag);
  }, []);

  // Available hashtags
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

  const handleSelectSource = (mode: FeedSourceMode) => {
    setStreamSource(mode);
    setSelectedFeedSlug(undefined);
  };

  const handleSelectFeed = (slug?: string) => {
    setSelectedFeedSlug((prev) => (prev === slug ? undefined : slug));
    setActiveMobileNav('stream');
  };

  const handlePrevMonth = useCallback(() => {
    setSelectedMonth((prev) => prev.subtract(1, 'month'));
    setIsMonthFilterActive(true);
  }, []);

  const handleNextMonth = useCallback(() => {
    setSelectedMonth((prev) => prev.add(1, 'month'));
    setIsMonthFilterActive(true);
  }, []);

  const handleSelectMonth = useCallback((year: number, monthIndex: number) => {
    setSelectedMonth(dayjs().year(year).month(monthIndex));
    setIsMonthFilterActive(true);
  }, []);

  const handleResetMonthFilter = useCallback(() => {
    setIsMonthFilterActive(false);
  }, []);

  const handleToday = useCallback(() => {
    setSelectedMonth(dayjs());
    setIsMonthFilterActive(true);
  }, []);

  const handleOpenCalendar = useCallback(() => {
    if (isEmbed && typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'LENTA_HOST_NAVIGATE',
          source: 'lenta-feed-app',
          payload: { view: 'month' },
        },
        '*'
      );
      return;
    }
    window.open('http://localhost:5174/calendar', '_blank');
  }, [isEmbed]);

  const handleOpenTimeline = useCallback(() => {
    if (isEmbed && typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'LENTA_HOST_NAVIGATE',
          source: 'lenta-feed-app',
          payload: { view: 'timeline' },
        },
        '*'
      );
      return;
    }
    window.open('http://localhost:5174/', '_blank');
  }, [isEmbed]);

  const handleOpenEdit = useCallback((item: UnifiedFeedItem) => {
    setEditingItem(item);
  }, []);

  const handleOpenAiCover = useCallback((item: UnifiedFeedItem, templateId?: string) => {
    setAiCoverTemplateId(templateId);
    setAiCoverItem(item);
  }, []);

  const handleApprovePublish = useCallback(
    async (item: UnifiedFeedItem) => {
      await updateNoteMutation.mutateAsync({
        id: item.id,
        data: {
          privacy: 'public',
          status: 'PUBLISHED',
          publishAt: new Date().toISOString(),
        },
      });
    },
    [updateNoteMutation]
  );

  const handleUnpublishToStaging = useCallback(
    async (item: UnifiedFeedItem) => {
      await updateNoteMutation.mutateAsync({
        id: item.id,
        data: {
          privacy: 'public',
          status: 'DRAFT',
        },
      });
    },
    [updateNoteMutation]
  );

  const handleReturnToPrivate = useCallback(
    async (item: UnifiedFeedItem) => {
      await updateNoteMutation.mutateAsync({
        id: item.id,
        data: {
          privacy: 'private',
          status: 'DRAFT',
        },
      });
    },
    [updateNoteMutation]
  );

  // Close categories drawer on ESC key
  useEffect(() => {
    if (activeMobileNav !== 'categories') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMobileNav('stream');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMobileNav]);

  return (
    <div
      className={`min-h-screen bg-[#f8fafc] dark:bg-[#0e1621] text-slate-800 dark:text-[#e2e2e2] flex flex-col transition-colors w-full max-w-full overflow-x-hidden ${
        isEmbed ? 'pb-4' : 'pb-16 sm:pb-8'
      }`}
    >
      {/* Main Responsive Container */}
      <main className="flex-1 max-w-5xl xl:max-w-6xl mx-auto w-full min-w-0 px-3 py-4 sm:px-5 sm:py-5 space-y-4">
        {/* Unified Top Toolbar matching calendar-app */}
        <FeedToolbar
          streamSource={streamSource}
          onSetStreamSource={handleSelectSource}
          tabs={activeTabs}
          activeFeedSlug={selectedFeedSlug}
          isAllSelected={!selectedFeedSlug}
          onSelectFeed={handleSelectFeed}
          totalCount={totalCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedMonth={selectedMonth}
          isMonthFilterActive={isMonthFilterActive}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSelectMonth={handleSelectMonth}
          onResetMonthFilter={handleResetMonthFilter}
          onToday={handleToday}
          horizon={feedHorizon}
          onChangeHorizon={handleSetHorizon}
          upcomingCount={upcomingCount}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onRefresh={() => refetch()}
          isRefreshing={isRefetching}
          onOpenLemonSeasons={() => setIsLemonSeasonsModalOpen(true)}
          onNavigateToCalendar={handleOpenCalendar}
          onNavigateToTimeline={handleOpenTimeline}
          layoutMode={layoutMode}
          onToggleLayoutMode={toggleLayoutMode}
          appMode={appMode}
          onSetAppMode={handleSetAppMode}
          isPublicMode={isPublicMode}
          filterUnassigned={filterUnassignedOnly}
          onToggleFilterUnassigned={() => setFilterUnassignedOnly((prev) => !prev)}
          isEditMode={appMode === 'dev' && isEditMode}
          onToggleEditMode={appMode === 'dev' ? handleToggleEditMode : undefined}
          sourceModes={sourceModes}
          onEditSourceTab={handleOpenEditSourceTab}
          onAddSourceTab={handleOpenAddSourceTab}
          onEditFeed={handleOpenEditFeed}
          onAddFeed={handleOpenAddFeed}
        />

        {/* Active Period Banner if selected */}
        {selectedPeriod && (
          <FeedPeriodActiveBanner
            period={selectedPeriod}
            mode={periodFilterMode}
            onChangeMode={setPeriodFilterMode}
            onClearPeriod={() => handleSelectPeriod(undefined)}
            totalPeriodNotesCount={feedItems.length}
          />
        )}

        {/* Mobile Horizontal Activities Carousel */}
        {activeChannelPeriods.length > 0 && (
          <FeedActivitiesMobileCarousel
            periods={activeChannelPeriods}
            selectedPeriodId={selectedPeriodId}
            onSelectPeriod={handleSelectPeriod}
          />
        )}

        {/* Responsive Body: Stream-only or Split layout with desktop rail */}
        <div
          className={`flex flex-col ${
            layoutMode === 'split' ? 'md:flex-row gap-5 items-start' : 'gap-4 items-center'
          } w-full`}
        >
          {/* Feed Stream Component (Reusable & Exportable) */}
          <FeedStreamView
            streamSource={streamSource}
            onSetStreamSource={handleSelectSource}
            feedItems={feedItems}
            visibleFeedItems={visibleFeedItems}
            selectedFeedSlug={selectedFeedSlug}
            onSelectFeed={handleSelectFeed}
            isLoading={isLoading}
            searchQuery={searchQuery}
            isMonthFilterActive={isMonthFilterActive}
            selectedMonth={selectedMonth}
            onResetMonthFilter={handleResetMonthFilter}
            onOpenDetail={handleOpenDetail}
            onSelectTag={handleSelectTag}
            onEditNote={!isPublicMode && appMode !== 'public' ? handleOpenEdit : undefined}
            onAiCover={!isPublicMode && appMode !== 'public' ? handleOpenAiCover : undefined}
            visibleCount={visibleCount}
            loadMoreRef={loadMoreRef}
            layoutMode={layoutMode}
            appMode={appMode}
            onApprovePublish={!isPublicMode && appMode !== 'public' ? handleApprovePublish : undefined}
            onUnpublishToStaging={!isPublicMode && appMode !== 'public' ? handleUnpublishToStaging : undefined}
            onReturnToPrivate={!isPublicMode && appMode !== 'public' ? handleReturnToPrivate : undefined}
            isMutating={updateNoteMutation.isPending}
            allPeriods={allPeriods}
            selectedPeriodId={selectedPeriodId}
            onSelectPeriod={handleSelectPeriod}
          />

          {/* Right Desktop Rail: Folders, Metrics, Calendar, Tags (Only shown in split mode) */}
          {layoutMode === 'split' && (
            <FeedDesktopRail
              sourceType={streamSource}
              activeFeed={activeTabObj}
              tabs={activeTabs}
              selectedFeedSlug={selectedFeedSlug}
              onSelectFeed={handleSelectFeed}
              totalCount={totalCount}
              availableTags={availableTags}
              onSelectTag={(tag) => {
                setSearchQuery(tag);
              }}
              onOpenLemonSeasons={() => setIsLemonSeasonsModalOpen(true)}
              onNavigateToCalendar={handleOpenCalendar}
              currentMonthName={selectedMonth.format('MMMM YYYY')}
              isPublicMode={isPublicMode}
              periods={activeChannelPeriods}
              selectedPeriodId={selectedPeriodId}
              onSelectPeriod={handleSelectPeriod}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Sheet for Categories */}
      {activeMobileNav === 'categories' && (
        <div
          className="fixed inset-0 z-40 sm:hidden bg-black/50 backdrop-blur-xs flex items-end animate-fade-in"
          onClick={() => setActiveMobileNav('stream')}
        >
          <div
            className="w-full bg-white dark:bg-[#18222d] rounded-t-3xl max-h-[75vh] flex flex-col p-4 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Категории и каналы
              </h3>
              <button
                type="button"
                onClick={() => setActiveMobileNav('stream')}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-1 touch-scroll">
              <button
                type="button"
                onClick={() => handleSelectFeed(undefined)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium ${
                  !selectedFeedSlug ? 'bg-[#2481cc]/10 text-[#2481cc]' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>Все каналы</span>
                <span className="font-mono text-[10px]">{totalCount}</span>
              </button>

              {activeTabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectFeed(t.slug)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium ${
                    selectedFeedSlug === t.slug ? 'bg-[#2481cc]/10 text-[#2481cc]' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>{t.emoji}</span>
                    <span className="truncate">{t.title}</span>
                  </div>
                  <span className="font-mono text-[10px]">{t.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lazy-loaded Modals */}
      <Suspense fallback={null}>
        {selectedDetailItem && (
          <FeedDetailModal
            item={selectedDetailItem}
            onClose={handleCloseDetail}
            disableEscClose={Boolean(aiCoverItem || editingItem)}
            onSelectTag={(tag) => {
              setSearchQuery(tag);
            }}
            onEditNote={
              !isPublicMode && appMode !== 'public'
                ? (item) => {
                    handleCloseDetail();
                    handleOpenEdit(item);
                  }
                : undefined
            }
            onAiCover={
              !isPublicMode && appMode !== 'public'
                ? (item) => {
                    handleOpenAiCover(item);
                  }
                : undefined
            }
          />
        )}

        {editingItem && (
          <FeedEditNoteModal
            item={editingItem}
            onClose={() => setEditingItem(null)}
            disableEscClose={Boolean(aiCoverItem)}
            onOpenAiCover={(item, templateId) => handleOpenAiCover(item, templateId)}
            onSaved={() => {
              refetch();
            }}
          />
        )}

        {aiCoverItem && (
          <FeedAiCoverModal
            item={aiCoverItem}
            initialTemplateId={aiCoverTemplateId}
            onClose={() => {
              setAiCoverItem(null);
              setAiCoverTemplateId(undefined);
            }}
            onCoverApplied={() => {
              refetch();
            }}
          />
        )}

        {isLemonSeasonsModalOpen && (
          <LemonSeasonsModal
            isOpen={isLemonSeasonsModalOpen}
            onClose={() => setIsLemonSeasonsModalOpen(false)}
          />
        )}

        {isFeedEntityModalOpen && (
          <FeedEntityModal
            feedTab={editingFeedTab}
            feedData={editingDbFeed}
            isOpen={isFeedEntityModalOpen}
            onClose={() => {
              setIsFeedEntityModalOpen(false);
              setEditingFeedTab(null);
              setEditingDbFeed(null);
            }}
            onSaved={() => {
              refetch();
            }}
          />
        )}

        {isSourceTabModalOpen && (
          <FeedSourceTabModal
            tab={editingSourceTab}
            isOpen={isSourceTabModalOpen}
            onClose={() => {
              setIsSourceTabModalOpen(false);
              setEditingSourceTab(null);
            }}
            onSave={handleSaveSourceTab}
            onDelete={handleDeleteSourceTab}
          />
        )}
      </Suspense>

      {/* Mobile Bottom Navigation Bar */}
      <FeedBottomNav
        activeTab={activeMobileNav}
        onSelectTab={(tab) => {
          if (tab === 'search') {
            setActiveMobileNav('stream');
          } else {
            setActiveMobileNav(tab);
          }
        }}
        onOpenCalendar={handleOpenCalendar}
        onOpenLemonSeasons={() => setIsLemonSeasonsModalOpen(true)}
      />
    </div>
  );
};
