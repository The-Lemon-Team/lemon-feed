import React, { useRef } from 'react';
import { UnifiedFeedTab, FeedSourceMode } from '../adapters/feeds/types';
import { X } from 'lucide-react';

export interface FeedTabsBarProps {
  streamSource: FeedSourceMode;
  tabs: UnifiedFeedTab[];
  activeFeedSlug?: string;
  isAllSelected: boolean;
  onSelectFeed: (slug?: string) => void;
  totalCount: number;
}

export const FeedTabsBar: React.FC<FeedTabsBarProps> = ({
  streamSource,
  tabs,
  activeFeedSlug,
  isAllSelected,
  onSelectFeed,
  totalCount,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const allLabel = streamSource === 'classic' ? 'Все события' : 'Все каналы';
  const allEmoji = streamSource === 'classic' ? '🏛️' : '📡';

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="w-full min-w-0 select-none pb-1">
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="w-full overflow-x-auto no-scrollbar touch-scroll py-1 flex items-center gap-1.5 sm:gap-2"
      >
        {/* All Channels Tab */}
        <button
          type="button"
          onClick={() => onSelectFeed(undefined)}
          className={`group shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150 select-none ${
            isAllSelected
              ? 'bg-[#2481cc] text-white border-[#2481cc] shadow-xs font-semibold'
              : 'bg-white/90 dark:bg-[#18222d]/90 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:border-[#2481cc]/40 dark:hover:border-white/25 hover:bg-slate-50 dark:hover:bg-[#1f2b38]'
          }`}
        >
          <span>{allEmoji}</span>
          <span>{allLabel}</span>
          <span
            className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full leading-tight font-medium ${
              isAllSelected
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* Individual Thematic Tabs */}
        {tabs.map((tab) => {
          const isSelected = activeFeedSlug === tab.slug;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectFeed(tab.slug)}
              title={tab.description || tab.title}
              className={`group shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150 select-none ${
                isSelected
                  ? 'bg-[#2481cc] text-white border-[#2481cc] shadow-xs font-semibold'
                  : 'bg-white/90 dark:bg-[#18222d]/90 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:border-[#2481cc]/40 dark:hover:border-white/25 hover:bg-slate-50 dark:hover:bg-[#1f2b38]'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.shortTitle}</span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full leading-tight font-medium ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}

        {!isAllSelected && (
          <button
            type="button"
            onClick={() => onSelectFeed(undefined)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100/80 hover:bg-rose-50 dark:bg-white/5 dark:hover:bg-rose-950/30 border border-slate-200/60 dark:border-white/10 transition-colors shrink-0"
            title="Сбросить фильтр каналов"
          >
            <X className="w-3 h-3" />
            <span>Сбросить</span>
          </button>
        )}
      </div>
    </div>
  );
};
