import React from 'react';
import { ArrowUp, X, Sparkles } from 'lucide-react';
import { ChannelUpdateGroup } from '../../hooks/useFeedLiveEvents';

export interface FeedLiveUpdatesBannerProps {
  newEventsCount: number;
  groupedChannels: ChannelUpdateGroup[];
  onApply: () => void;
  onDismiss: () => void;
  onSelectChannel?: (feedSlug: string) => void;
}

export const FeedLiveUpdatesBanner: React.FC<FeedLiveUpdatesBannerProps> = ({
  newEventsCount,
  groupedChannels,
  onApply,
  onDismiss,
  onSelectChannel,
}) => {
  if (newEventsCount === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full mb-3.5 p-3 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 border border-indigo-500/30 dark:border-indigo-400/30 shadow-sm backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all animate-fadeIn"
    >
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
          <span>Новые публикации (+{newEventsCount}):</span>
        </div>

        {/* Grouped channel chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {groupedChannels.map((group) => (
            <button
              key={group.feedSlug}
              type="button"
              onClick={() => onSelectChannel?.(group.feedSlug)}
              title={`Открыть ленту ${group.feedTitle}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-400 transition-colors cursor-pointer"
            >
              <span>{group.feedIcon}</span>
              <span className="truncate max-w-[120px]">{group.feedTitle}</span>
              <span className="text-[10px] opacity-75 font-mono">({group.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
        <button
          type="button"
          onClick={onApply}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>Показать</span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          title="Скрыть оповещение"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
