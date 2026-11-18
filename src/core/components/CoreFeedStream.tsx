import React, { RefObject } from 'react';
import { Inbox, Radio } from 'lucide-react';
import { FeedCardSlots, FeedEntry } from '../types';
import { CoreFeedCard } from './CoreFeedCard';

export interface CoreFeedStreamProps<TEntry extends FeedEntry<any> = FeedEntry> {
  entries: TEntry[];
  isLoading: boolean;
  loadingLabel?: string;
  emptyState?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  cardSlots?: FeedCardSlots<TEntry>;
  onOpenDetail?: (entry: TEntry) => void;
  onSelectTag?: (tag: string) => void;
  resolveImageUrl?: (url: string) => string;
  formatSnippet?: (markdown: string, entry: TEntry) => string;
  formatMarkdown?: (markdown: string, entry: TEntry) => string;
  onMarkdownLinkClick?: (href: string, e: React.MouseEvent) => boolean | void;
  selectable?: boolean;
  isSelected?: (id: string) => boolean;
  onToggleSelect?: (id: string) => void;
  loadMoreRef?: RefObject<HTMLDivElement>;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  className?: string;
  renderCard?: (entry: TEntry) => React.ReactNode;
}

/**
 * Domain-agnostic feed stream container.
 * Renders any FeedEntry[] with optional card slots, selection, and infinite scroll sentinel.
 */
export function CoreFeedStream<TEntry extends FeedEntry<any> = FeedEntry>({
  entries,
  isLoading,
  loadingLabel = 'Загрузка ленты...',
  emptyState,
  emptyTitle = 'Нет публикаций',
  emptyDescription = 'В выбранной ленте пока нет записей.',
  cardSlots,
  onOpenDetail,
  onSelectTag,
  resolveImageUrl,
  formatSnippet,
  formatMarkdown,
  onMarkdownLinkClick,
  selectable = false,
  isSelected,
  onToggleSelect,
  loadMoreRef,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  className = '',
  renderCard,
}: CoreFeedStreamProps<TEntry>) {
  if (isLoading && entries.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Radio className="w-5 h-5 animate-pulse text-[#2481cc]" />
        <span className="text-xs font-mono">{loadingLabel}</span>
      </div>
    );
  }

  if (entries.length === 0) {
    if (emptyState) return <>{emptyState}</>;
    return (
      <div className="p-10 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] text-center space-y-2.5">
        <Inbox className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {emptyTitle}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3.5 ${className}`}>
      {entries.map((entry) =>
        renderCard ? (
          <React.Fragment key={entry.id}>{renderCard(entry)}</React.Fragment>
        ) : (
          <CoreFeedCard
            key={entry.id}
            entry={entry}
            slots={cardSlots}
            onOpenDetail={onOpenDetail}
            onSelectTag={onSelectTag}
            resolveImageUrl={resolveImageUrl}
            formatSnippet={formatSnippet}
            formatMarkdown={formatMarkdown}
            onMarkdownLinkClick={onMarkdownLinkClick}
            selectable={selectable}
            isSelected={isSelected ? isSelected(entry.id) : false}
            onToggleSelect={onToggleSelect}
          />
        )
      )}

      {(hasNextPage || isFetchingNextPage) && (
        <div
          ref={loadMoreRef}
          className="py-4 flex items-center justify-center text-xs text-slate-400"
        >
          {isFetchingNextPage ? (
            <span className="font-mono flex items-center gap-2">
              <Radio className="w-4 h-4 animate-pulse text-[#2481cc]" />
              Загрузка...
            </span>
          ) : onLoadMore ? (
            <button
              type="button"
              onClick={onLoadMore}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
            >
              Загрузить ещё
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
