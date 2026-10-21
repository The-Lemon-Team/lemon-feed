import React, { useState, useMemo, useEffect, useCallback, useRef, useDeferredValue } from 'react';
import dayjs from 'dayjs';
import { useFeedNotes, useFeedSources } from './api/queries';
import { feedApi } from './api/client';
import {
  FEED_ADAPTERS,
  FeedSourceMode,
  UnifiedFeedItem,
  UnifiedFeedTab,
} from './adapters/feeds';
import { FeedToolbar } from './components/FeedToolbar';
import { FeedStreamView } from './components/FeedStreamView';
import { FeedDesktopRail } from './components/FeedDesktopRail';
import { FeedBottomNav } from './components/FeedBottomNav';
import { FeedDetailModal } from './components/FeedDetailModal';
import { LemonSeasonsModal } from './components/LemonSeasonsModal';
import { X } from 'lucide-react';
import { useFeedRouter } from './utils/feedRouter';
import { useFeedAuthSync } from './hooks/useFeedAuthSync';

export const App: React.FC = () => {
  const {
    streamSource,
    selectedFeedSlug,
    layoutMode,
    isEmbed,
    setStreamSource,
    setSelectedFeedSlug,
    toggleLayoutMode,
  } = useFeedRouter();

  // Synchronize authentication token and session from parent host via postMessage
  const authSync = useFeedAuthSync(isEmbed);

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

  const [activeMobileNav, setActiveMobileNav] = useState<'stream' | 'categories' | 'search'>('stream');
  const [selectedDetailItem, setSelectedDetailItem] = useState<UnifiedFeedItem | null>(null);
  const [isLemonSeasonsModalOpen, setIsLemonSeasonsModalOpen] = useState(false);

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

  // Data fetching
  const { data: notes = [], isLoading, refetch, isRefetching } = useFeedNotes();
  const { data: allFeeds = [] } = useFeedSources();

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
    return FEED_ADAPTERS[streamSource] || FEED_ADAPTERS.spark;
  }, [streamSource]);

  // Thematic tabs
  const activeTabs: UnifiedFeedTab[] = useMemo(() => {
    return activeAdapter.getTabs({ allFeeds, notes });
  }, [activeAdapter, allFeeds, notes]);

  // Active tab object for sidebar detail
  const activeTabObj: UnifiedFeedTab | null = useMemo(() => {
    if (!selectedFeedSlug) return null;
    return activeTabs.find((t) => t.slug === selectedFeedSlug) || null;
  }, [activeTabs, selectedFeedSlug]);

  // Mode total count
  const totalCount = useMemo(() => {
    return activeAdapter.adaptNotes(notes, undefined, '').length;
  }, [activeAdapter, notes]);

  // Filtered feed items (search query + optional month filter)
  const feedItems: UnifiedFeedItem[] = useMemo(() => {
    let items = activeAdapter.adaptNotes(notes, selectedFeedSlug, deferredSearchQuery);
    if (isMonthFilterActive) {
      items = items.filter((item) => {
        const itemDate = dayjs(item.publishedAt);
        return itemDate.isValid() && itemDate.isSame(selectedMonth, 'month');
      });
    }
    return items;
  }, [activeAdapter, notes, selectedFeedSlug, deferredSearchQuery, isMonthFilterActive, selectedMonth]);

  // Progressive infinite loading
  const BATCH_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [streamSource, selectedFeedSlug, deferredSearchQuery, isMonthFilterActive, selectedMonth]);

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

  const handleOpenDetail = useCallback((item: UnifiedFeedItem) => {
    setSelectedDetailItem(item);
  }, []);

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
    window.open('http://localhost:5174/', '_blank');
  }, []);

  const handleOpenTimeline = useCallback(() => {
    window.open('http://localhost:5174/?view=timeline', '_blank');
  }, []);

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
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onRefresh={() => refetch()}
          isRefreshing={isRefetching}
          onOpenLemonSeasons={() => setIsLemonSeasonsModalOpen(true)}
          onNavigateToCalendar={handleOpenCalendar}
          onNavigateToTimeline={handleOpenTimeline}
          layoutMode={layoutMode}
          onToggleLayoutMode={toggleLayoutMode}
        />

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
            visibleCount={visibleCount}
            loadMoreRef={loadMoreRef}
            layoutMode={layoutMode}
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

      {/* Mobile Detail Modal */}
      <FeedDetailModal
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        onSelectTag={(tag) => {
          setSearchQuery(tag);
        }}
      />

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

      {/* Lemon Seasons Status Modal */}
      <LemonSeasonsModal
        isOpen={isLemonSeasonsModalOpen}
        onClose={() => setIsLemonSeasonsModalOpen(false)}
      />
    </div>
  );
};
