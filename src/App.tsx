import React, { useState, useMemo, useEffect, useCallback, useRef, useDeferredValue } from 'react';
import { useFeedNotes, useFeedSources } from './api/queries';
import {
  FEED_ADAPTERS,
  FeedSourceMode,
  UnifiedFeedItem,
  UnifiedFeedTab,
} from './adapters/feeds';
import { FeedTopBar } from './components/FeedTopBar';
import { FeedTabsBar } from './components/FeedTabsBar';
import { FeedPostCard } from './components/FeedPostCard';
import { FeedDesktopRail } from './components/FeedDesktopRail';
import { FeedBottomNav } from './components/FeedBottomNav';
import { FeedDetailModal } from './components/FeedDetailModal';
import { LemonSeasonsModal } from './components/LemonSeasonsModal';
import { TelegramStreamView } from './components/TelegramStreamView';
import { Radio, Inbox, X } from 'lucide-react';

export const App: React.FC = () => {
  const [streamSource, setStreamSource] = useState<FeedSourceMode>('spark');
  const [selectedFeedSlug, setSelectedFeedSlug] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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

  // Filtered feed items (uses deferredSearchQuery so typing never lags)
  const feedItems: UnifiedFeedItem[] = useMemo(() => {
    return activeAdapter.adaptNotes(notes, selectedFeedSlug, deferredSearchQuery);
  }, [activeAdapter, notes, selectedFeedSlug, deferredSearchQuery]);

  // Progressive infinite loading (render in lightweight 24-item batches)
  const BATCH_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [streamSource, selectedFeedSlug, deferredSearchQuery]);

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
    setIsSearchOpen(true);
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

  const handleOpenCalendar = () => {
    window.open('http://localhost:5174/', '_blank');
  };

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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0e1621] text-slate-800 dark:text-[#e2e2e2] flex flex-col transition-colors pb-16 sm:pb-8 w-full max-w-full overflow-x-hidden">
      {/* 1. Header (Sticky Top Bar) */}
      <FeedTopBar
        streamSource={streamSource}
        onSetStreamSource={handleSelectSource}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearchOpen={isSearchOpen}
        onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
        onRefresh={() => refetch()}
        isRefreshing={isRefetching}
        onOpenLemonSeasons={() => setIsLemonSeasonsModalOpen(true)}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-5xl xl:max-w-6xl mx-auto w-full min-w-0 px-4 sm:px-6 py-4 flex justify-center gap-6 xl:gap-8 items-start">
        {/* Left/Center Stream Column (Reading width) */}
        <section className="flex-1 max-w-2xl w-full space-y-3.5 min-w-0">
          {/* Filter Chips Bar (Spark & Classic modes) */}
          {streamSource !== 'telegram' && (
            <FeedTabsBar
              streamSource={streamSource}
              tabs={activeTabs}
              activeFeedSlug={selectedFeedSlug}
              isAllSelected={!selectedFeedSlug}
              onSelectFeed={handleSelectFeed}
              totalCount={totalCount}
            />
          )}

          {streamSource === 'telegram' ? (
            <TelegramStreamView
              selectedFolderSlug={selectedFeedSlug}
              onSelectFolderSlug={handleSelectFeed}
            />
          ) : (
            <>
              {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Radio className="w-5 h-5 animate-pulse text-[#2481cc]" />
                  <span className="text-xs font-mono">Загрузка ленты...</span>
                </div>
              ) : feedItems.length === 0 ? (
                <div className="p-10 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-center text-slate-400 space-y-2">
                  <Inbox className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Нет публикаций
                  </h4>
                  <p className="text-xs max-w-sm mx-auto text-slate-500">
                    {searchQuery
                      ? 'По вашему запросу ничего не найдено.'
                      : 'В выбранной ленте пока нет записей.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleFeedItems.map((item) => (
                    <FeedPostCard
                      key={item.id}
                      item={item}
                      onOpenDetail={handleOpenDetail}
                      onSelectTag={handleSelectTag}
                    />
                  ))}

                  {visibleCount < feedItems.length && (
                    <div
                      ref={loadMoreRef}
                      className="py-4 text-center text-xs font-mono text-slate-400 dark:text-slate-500 animate-pulse flex items-center justify-center gap-1.5"
                    >
                      <Radio className="w-3.5 h-3.5 text-[#2481cc]" />
                      <span>Показано {visibleFeedItems.length} из {feedItems.length} публикаций...</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* Right Desktop Rail */}
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
            setIsSearchOpen(true);
          }}
          onOpenLemonSeasons={() => setIsLemonSeasonsModalOpen(true)}
        />
      </main>

      {/* 4. Mobile Bottom Sheet for Categories (when 'categories' tab is selected) */}
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

      {/* 5. Mobile Detail Modal */}
      <FeedDetailModal
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        onSelectTag={(tag) => {
          setSearchQuery(tag);
          setIsSearchOpen(true);
        }}
      />

      {/* 6. Mobile Bottom Navigation Bar */}
      <FeedBottomNav
        activeTab={activeMobileNav}
        onSelectTab={(tab) => {
          if (tab === 'search') {
            setIsSearchOpen(true);
            setActiveMobileNav('stream');
          } else {
            setActiveMobileNav(tab);
          }
        }}
        onOpenCalendar={handleOpenCalendar}
        onOpenLemonSeasons={() => setIsLemonSeasonsModalOpen(true)}
      />

      {/* 7. Lemon Seasons Status Modal */}
      <LemonSeasonsModal
        isOpen={isLemonSeasonsModalOpen}
        onClose={() => setIsLemonSeasonsModalOpen(false)}
      />
    </div>
  );
};
