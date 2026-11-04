import React, { RefObject } from 'react';
import dayjs from 'dayjs';
import { Radio, Inbox, Plus, Settings2 } from 'lucide-react';
import { FeedSourceMode, UnifiedFeedItem } from '../adapters/feeds/types';
import { FeedPostCard } from './FeedPostCard';
import { FeedAppRuntimeMode } from '../utils/appMode';
import { TelegramStreamView } from './TelegramStreamView';
import { PeriodItem } from '../utils/periods';
import { FeedModeOption } from './toolbar/types';
import { SymbolIcon } from './common/SymbolIcon';

export interface FeedStreamViewProps {
  streamSource: FeedSourceMode;
  onSetStreamSource?: (mode: FeedSourceMode) => void;
  activeMode?: FeedModeOption;
  onEditSourceTab?: (tab: FeedModeOption) => void;
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
  onEditNote?: (item: UnifiedFeedItem) => void;
  onDeleteNote?: (item: UnifiedFeedItem) => void;
  onAiCover?: (item: UnifiedFeedItem) => void;
  visibleCount: number;
  loadMoreRef?: RefObject<HTMLDivElement>;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  layoutMode?: 'split' | 'stream';
  appMode?: FeedAppRuntimeMode;
  onCreateNote?: () => void;
  onApprovePublish?: (item: UnifiedFeedItem) => void;
  onUnpublishToStaging?: (item: UnifiedFeedItem) => void;
  onReturnToPrivate?: (item: UnifiedFeedItem) => void;
  isMutating?: boolean;
  allPeriods?: PeriodItem[];
  selectedPeriodId?: string;
  onSelectPeriod?: (periodId: string) => void;
}

/**
 * Standalone feed stream component.
 * Can be exported and embedded anywhere with configurable layoutMode (split vs stream-only).
 */
export const FeedStreamView: React.FC<FeedStreamViewProps> = ({
  streamSource,
  onSetStreamSource,
  activeMode,
  onEditSourceTab,
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
  onEditNote,
  onDeleteNote,
  onAiCover,
  visibleCount,
  loadMoreRef,
  hasNextPage = false,
  isFetchingNextPage = false,
  layoutMode = 'split',
  appMode = 'staging',
  onCreateNote,
  onApprovePublish,
  onUnpublishToStaging,
  onReturnToPrivate,
  isMutating,
  allPeriods,
  selectedPeriodId,
  onSelectPeriod,
}) => {
  const isStreamOnly = layoutMode === 'stream';

  const isCustomSpace = Boolean(
    activeMode &&
      !activeMode.isBuiltin &&
      streamSource !== 'all' &&
      streamSource !== 'spark' &&
      streamSource !== 'telegram' &&
      !selectedFeedSlug &&
      !searchQuery &&
      !isMonthFilterActive
  );

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
            isCustomSpace ? (
              <div className="p-8 sm:p-10 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] text-center space-y-4 shadow-2xs">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/25 flex items-center justify-center text-2xl shadow-xs">
                  <SymbolIcon icon={activeMode?.emoji || '✨'} fallback="📁" className="text-2xl" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                    <span>«{activeMode?.label || 'Рабочее пространство'}» пока пусто</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Таб создан как чистое рабочее пространство. Вы можете писать сюда новые записи, закреплять материалы или подключить фильтры ленты.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2.5 pt-2 flex-wrap">
                  {onCreateNote && appMode !== 'public' && (
                    <button
                      type="button"
                      onClick={onCreateNote}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Новая запись сюда</span>
                    </button>
                  )}

                  {onEditSourceTab && activeMode && (
                    <button
                      type="button"
                      onClick={() => onEditSourceTab(activeMode)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-white/10 transition-colors cursor-pointer"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-[#2481cc]" />
                      <span>Настроить фильтры таба</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-10 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-center text-slate-400 space-y-3">
                <Inbox className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {streamSource === 'spark' && !searchQuery
                    ? 'Приватный контур Spark'
                    : 'Нет публикаций'}
                </h4>
                <p className="text-xs max-w-sm mx-auto text-slate-500">
                  {searchQuery
                    ? 'По вашему запросу ничего не найдено.'
                    : isMonthFilterActive
                    ? `В ${selectedMonth.format('MMMM YYYY')} нет записей для этой папки.`
                    : streamSource === 'spark'
                    ? 'Ленты Spark содержат закрытую внутреннюю информацию и доступны только с токеном администратора. Общедоступные календари открыты в разделе Classic.'
                    : 'В выбранной ленте пока нет записей.'}
                </p>
                {streamSource === 'spark' && onSetStreamSource && !searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSetStreamSource('classic')}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2481cc]/15 hover:bg-[#2481cc]/25 text-[#2481cc] dark:text-[#64b5f6] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Перейти в Classic ленты →
                  </button>
                )}
                {isMonthFilterActive && !searchQuery && streamSource !== 'spark' && (
                  <button
                    type="button"
                    onClick={onResetMonthFilter}
                    className="mt-2 px-3 py-1.5 rounded-xl bg-[#2481cc]/15 hover:bg-[#2481cc]/25 text-[#2481cc] dark:text-[#64b5f6] text-xs font-semibold transition-colors"
                  >
                    Показать все даты
                  </button>
                )}
                {onCreateNote && appMode !== 'public' && !searchQuery && (
                  <div>
                    <button
                      type="button"
                      onClick={onCreateNote}
                      className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Создать первую запись</span>
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="space-y-3">
              {visibleFeedItems.map((item) => (
                <FeedPostCard
                  key={item.id}
                  item={item}
                  onOpenDetail={onOpenDetail}
                  onSelectTag={onSelectTag}
                  onEditNote={appMode !== 'public' ? onEditNote : undefined}
                  onDeleteNote={appMode !== 'public' ? onDeleteNote : undefined}
                  onAiCover={appMode !== 'public' ? onAiCover : undefined}
                  appMode={appMode}
                  onApprovePublish={onApprovePublish}
                  onUnpublishToStaging={onUnpublishToStaging}
                  onReturnToPrivate={onReturnToPrivate}
                  isMutating={isMutating}
                  allPeriods={allPeriods}
                  selectedPeriodId={selectedPeriodId}
                  onSelectPeriod={onSelectPeriod}
                />
              ))}

              {(visibleCount < feedItems.length || hasNextPage) && (
                <div
                  ref={loadMoreRef}
                  className="py-4 text-center text-xs font-mono text-slate-400 dark:text-slate-500 animate-pulse flex items-center justify-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5 text-[#2481cc]" />
                  <span>
                    {isFetchingNextPage
                      ? 'Загрузка следующей страницы...'
                      : `Показано ${visibleFeedItems.length} из ${feedItems.length} публикаций...`}
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
