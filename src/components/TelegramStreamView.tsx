import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  telegramReaderApi,
  TelegramFolderFeed,
  TelegramFeedPost,
} from '../api/telegramReaderApi';
import {
  RefreshCw,
  Radio,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { getThematicCategoryBadge } from '../utils/sparkFeeds';
import { TelegramPostCard } from './TelegramPostCard';

const PAGE_SIZE = 25;

export interface TelegramStreamViewProps {
  selectedFolderSlug?: string;
  onSelectFolderSlug?: (slug?: string) => void;
}

export const TelegramStreamView: React.FC<TelegramStreamViewProps> = ({
  selectedFolderSlug,
  onSelectFolderSlug,
}) => {
  const [folders, setFolders] = useState<TelegramFolderFeed[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [posts, setPosts] = useState<TelegramFeedPost[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Load available Telegram folders on mount
  const loadFolders = async () => {
    setIsLoadingFolders(true);
    try {
      const data = await telegramReaderApi.getFeeds();
      setFolders(data);
      if (data.length > 0 && !activeFolderId) {
        // Resolve initial active folder if slug is provided
        if (selectedFolderSlug) {
          const matched = findFolderBySlug(data, selectedFolderSlug);
          setActiveFolderId(matched ? matched.id : data[0].id);
        } else {
          setActiveFolderId(data[0].id);
        }
      }
    } catch {
      // Offline fallback
    } finally {
      setIsLoadingFolders(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  // Helper to map external feed slug to folder
  const findFolderBySlug = (folderList: TelegramFolderFeed[], slug: string) => {
    const clean = slug.replace(/^tg-/, '').toLowerCase();
    return (
      folderList.find((f) => f.id === slug) ||
      folderList.find((f) => f.name.toLowerCase() === clean) ||
      folderList.find((f) => f.name.toLowerCase().includes(clean))
    );
  };

  // Sync external folder selection if changed from sidebar
  useEffect(() => {
    if (!selectedFolderSlug || folders.length === 0) return;
    const matched = findFolderBySlug(folders, selectedFolderSlug);
    if (matched && matched.id !== activeFolderId) {
      setActiveFolderId(matched.id);
    }
  }, [selectedFolderSlug, folders]);

  // Handle folder switch
  const handleSelectFolder = (folderId: string) => {
    setActiveFolderId(folderId);
    if (onSelectFolderSlug) {
      const folder = folders.find((f) => f.id === folderId);
      if (folder) {
        onSelectFolderSlug(`tg-${folder.name.toLowerCase()}`);
      }
    }
  };

  // Initial fetch for the active folder (Page 1)
  useEffect(() => {
    if (!activeFolderId) return;

    let isMounted = true;
    setIsLoadingPosts(true);
    setIsLoadingMore(false);
    setHasMore(false);
    setNextCursor(null);

    telegramReaderApi
      .getFeedPosts(activeFolderId, PAGE_SIZE)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.posts) {
          setPosts(res.posts);
          setHasMore(Boolean(res.hasMore && res.nextCursor));
          setNextCursor(res.nextCursor || null);
        } else {
          setPosts([]);
          setHasMore(false);
          setNextCursor(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPosts([]);
          setHasMore(false);
          setNextCursor(null);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingPosts(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeFolderId]);

  // Load next page of posts (Page 2+)
  const loadMorePosts = useCallback(async () => {
    if (!activeFolderId || !hasMore || isLoadingMore || isLoadingPosts || !nextCursor) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const res = await telegramReaderApi.getFeedPosts(activeFolderId, PAGE_SIZE, nextCursor);
      if (res && res.posts && res.posts.length > 0) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const incoming = res.posts.filter((p) => !existingIds.has(p.id));
          return [...prev, ...incoming];
        });
        setHasMore(Boolean(res.hasMore && res.nextCursor));
        setNextCursor(res.nextCursor || null);
      } else {
        setHasMore(false);
        setNextCursor(null);
      }
    } catch (err) {
      console.warn('[TelegramStreamView] Failed to load more posts', err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeFolderId, hasMore, isLoadingMore, isLoadingPosts, nextCursor]);

  // Infinite scroll trigger via IntersectionObserver
  useEffect(() => {
    if (!hasMore || isLoadingMore || isLoadingPosts) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
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
  }, [hasMore, isLoadingMore, isLoadingPosts, loadMorePosts]);

  const activeFolder = folders.find((f) => f.id === activeFolderId);

  return (
    <div className="space-y-4">
      {/* 1. Header & Live Connection Status */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200/60 dark:border-white/[0.08]">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Telegram Web Reader
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2481cc]/10 text-[#2481cc] dark:text-[#64b5f6] border border-[#2481cc]/20">
            Live Bridge
          </span>
        </div>

        <button
          type="button"
          onClick={loadFolders}
          disabled={isLoadingFolders || isLoadingPosts}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isLoadingFolders ? 'animate-spin' : ''}`} />
          <span>Обновить</span>
        </button>
      </div>

      {/* 2. Folder Tabs */}
      <div
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        className="w-full max-w-full min-w-0 flex items-center gap-2 overflow-x-auto no-scrollbar touch-scroll py-1"
      >
        {folders.map((f) => {
          const isSelected = f.id === activeFolderId;
          const badge = getThematicCategoryBadge(f.name);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => handleSelectFolder(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150 select-none cursor-pointer ${
                isSelected
                  ? 'bg-[#2481cc] text-white border-[#2481cc] shadow-xs'
                  : 'bg-white/80 dark:bg-[#18222d]/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:border-slate-300'
              }`}
            >
              <span>{badge.emoji}</span>
              <span>{f.name}</span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full leading-tight font-medium ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500'
                }`}
              >
                {f.unreadCount || f.channelCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Folder Sub-info */}
      {activeFolder && (
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
          <span>
            {activeFolder.name} • {activeFolder.channels?.length || activeFolder.channelCount} каналов
            {posts.length > 0 && ` • ${posts.length} сообщений`}
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Источник: Telegram Web Reader
          </span>
        </div>
      )}

      {/* 4. Posts Stream */}
      {isLoadingPosts ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Radio className="w-5 h-5 animate-pulse text-[#2481cc]" />
          <span className="text-xs font-mono">Синхронизация постов Telegram...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center text-slate-400 space-y-1">
          <p className="text-xs font-medium">Нет постов в выбранной папке</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <TelegramPostCard
              key={post.id}
              post={post}
              folderName={activeFolder?.name}
            />
          ))}

          {/* Pagination: Loading next page */}
          {isLoadingMore && (
            <div className="py-4 text-center text-xs font-mono text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2481cc]" />
              <span>Загрузка следующих публикаций Telegram...</span>
            </div>
          )}

          {/* Pagination: Observer anchor + manual button */}
          {hasMore && !isLoadingMore && (
            <div ref={loadMoreRef} className="py-2 flex justify-center">
              <button
                type="button"
                onClick={loadMorePosts}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-white dark:bg-[#18222d] border border-slate-200/80 dark:border-white/10 hover:border-[#2481cc]/40 text-slate-700 dark:text-slate-300 hover:text-[#2481cc] dark:hover:text-[#64b5f6] shadow-xs transition-colors cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5 text-[#2481cc]" />
                <span>Загрузить ещё публикации</span>
              </button>
            </div>
          )}

          {/* Pagination: All posts loaded indicator */}
          {!hasMore && posts.length > 0 && !isLoadingPosts && (
            <div className="py-4 text-center text-[11px] font-mono text-slate-400 dark:text-slate-500 border-t border-slate-200/40 dark:border-white/5 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/80" />
              <span>Все публикации в папке загружены ({posts.length})</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
