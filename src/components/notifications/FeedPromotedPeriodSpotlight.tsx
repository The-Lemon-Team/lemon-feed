import React, { useState } from 'react';
import { PeriodItem } from '../../utils/periods';
import { SymbolIcon } from '../common/SymbolIcon';
import { Radio, ArrowRight, X, Clock, Sparkles } from 'lucide-react';

export interface FeedPromotedPeriodSpotlightProps {
  periods: PeriodItem[];
  onSelectFeed: (feedSlug: string) => void;
  onSelectPeriod?: (periodId: string) => void;
}

const STORAGE_PREFIX = 'lemon_dismissed_promoted_period_';

export const FeedPromotedPeriodSpotlight: React.FC<FeedPromotedPeriodSpotlightProps> = ({
  periods,
  onSelectFeed,
  onSelectPeriod,
}) => {
  const [dismissedMap, setDismissedMap] = useState<Record<string, boolean>>({});

  // Active promoted periods that haven't been dismissed
  const activePromoted = periods.filter(
    (p) =>
      p.isPromoted &&
      (p.status === 'active' || p.status === 'upcoming') &&
      !dismissedMap[p.id] &&
      (typeof window === 'undefined' || !sessionStorage.getItem(`${STORAGE_PREFIX}${p.id}`))
  );

  if (activePromoted.length === 0) return null;

  const handleDismiss = (periodId: string) => {
    setDismissedMap((prev) => ({ ...prev, [periodId]: true }));
    try {
      sessionStorage.setItem(`${STORAGE_PREFIX}${periodId}`, '1');
    } catch {
      // Ignore quota error
    }
  };

  const handleGoToFeed = (period: PeriodItem) => {
    if (period.feedSlug) {
      onSelectFeed(period.feedSlug);
    }
    if (onSelectPeriod) {
      onSelectPeriod(period.id);
    }
  };

  return (
    <div className="w-full mb-3.5 space-y-2.5">
      {activePromoted.map((p) => {
        const feedLabel = p.feedTitle || p.feedSlug || 'Тематическая лента';

        return (
          <div
            key={p.id}
            role="region"
            aria-label={`Анонс периода: ${p.title}`}
            className="w-full p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 dark:from-amber-500/20 dark:via-orange-500/20 dark:to-indigo-500/20 border border-amber-500/30 dark:border-amber-400/30 shadow-sm backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all animate-fadeIn"
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
                <SymbolIcon icon={p.emoji} fallback="⏳" className="text-lg" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono mb-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/20">
                    <Radio className="w-3 h-3 animate-pulse text-amber-500" />
                    <span>Анонс из шины</span>
                  </span>

                  <span className="text-slate-400 dark:text-slate-500">•</span>

                  <span className="text-slate-600 dark:text-slate-300 font-semibold">
                    В ленте {feedLabel}
                  </span>

                  {p.timeRemainingText && (
                    <>
                      <span className="text-slate-400 dark:text-slate-500">•</span>
                      <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Осталось {p.timeRemainingText}</span>
                      </span>
                    </>
                  )}
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
                  {p.title}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => handleGoToFeed(p)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span>Перейти в ленту</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleDismiss(p.id)}
                title="Скрыть анонс"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
