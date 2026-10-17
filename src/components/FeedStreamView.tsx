import React, { RefObject } from 'react';
import dayjs from 'dayjs';
import { Radio, Inbox } from 'lucide-react';
import { FeedSourceMode, UnifiedFeedItem } from '../adapters/feeds/types';
import { FeedPostCard } from './FeedPostCard';
import { TelegramStreamView } from './TelegramStreamView';

export interface FeedStreamViewProps {
  streamSource: FeedSourceMode;
  feedItems: UnifiedFeedItem[];
  visibleFeedItems: UnifiedFeedItem[];
  selectedFeedSlug?: string;
  onSelectFeed: (slug?: string) => void;
  isLoading: boolean;
  searchQuery?: string;
  isMonthFilterActive?: boolean;
  selectedMonth: dayjs.Dayjs;
  onResetMonthFilter: () => void;
  onOpenDetail: (item: UnifiedFeedItem) => void;
  onSelectTag: (tag: string) => void;
  visibleCount: number;
  loadMoreRef?: RefObject<HTMLDivElement>;
  layoutMode?: 'split' | 'stream';
}

/**
 * Standalone feed stream component.
 * Can be exported and embedded anywhere with configurable layoutMode (split vs stream-only).
 */
export const FeedStreamView: React.FC<FeedStreamViewProps> = ({
  streamSource,
  feedItems,
  visibleFeedItems,
  selectedFeedSlug,
  onSelectFeed,
  isLoading,
  searchQuery,
  isMonthFilterActive,
  selectedMonth,
  onResetMonthFilter,
  onOpenDetail,
  onSelectTag,
  visibleCount,
  loadMoreRef,
  layoutMode = 'split',
}) => {
  const isStreamOnly = layoutMode === 'stream';

  return (
    <section
      className={`w-full space-y-3.5 min-w-0 transition-all duration-150 ${
        isStreamOnly
          ? 'max-w-3xl mx-auto'
          : 'flex-1 max-w-2xl md:mx-0 mx-auto'
      }`}
    >
      {streamSource === 'telegram' ? (
        <TelegramStreamView
          selectedFolderSlug={selectedFeedSlug}
          onSelectFolderSlug={onSelectFeed}
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
                  : isMonthFilterActive
                  ? `В ${selectedMonth.format('MMMM YYYY')} нет записей для этой папки.`
                  : 'В выбранной ленте пока нет записей.'}
              </p>
              {isMonthFilterActive && !searchQuery && (
                <button
                  type="button"
                  onClick={onResetMonthFilter}
                  className="mt-2 px-3 py-1.5 rounded-xl bg-[#2481cc]/15 hover:bg-[#2481cc]/25 text-[#2481cc] dark:text-[#64b5f6] text-xs font-semibold transition-colors"
                >
                  Показать все даты
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleFeedItems.map((item) => (
                <FeedPostCard
                  key={item.id}
                  item={item}
                  onOpenDetail={onOpenDetail}
                  onSelectTag={onSelectTag}
                />
              ))}

              {visibleCount < feedItems.length && (
                <div
                  ref={loadMoreRef}
                  className="py-4 text-center text-xs font-mono text-slate-400 dark:text-slate-500 animate-pulse flex items-center justify-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5 text-[#2481cc]" />
                  <span>
                    Показано {visibleFeedItems.length} из {feedItems.length} публикаций...
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
};
