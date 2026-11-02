import React, { useState, useEffect } from 'react';
import { PeriodItem } from '../../utils/periods';
import { SymbolIcon } from '../common/SymbolIcon';
import { X, ArrowRight, Clock, AlertTriangle } from 'lucide-react';

export interface FeedPeriodEndingSoonToastProps {
  periods: PeriodItem[];
  onSelectPeriod: (periodId: string) => void;
  selectedPeriodId?: string;
}

const STORAGE_PREFIX = 'lemon_dismissed_period_ending_';

export const FeedPeriodEndingSoonToast: React.FC<FeedPeriodEndingSoonToastProps> = ({
  periods,
  onSelectPeriod,
  selectedPeriodId,
}) => {
  const [dismissedMap, setDismissedMap] = useState<Record<string, boolean>>({});

  // Find active period that is ending soon and hasn't been dismissed or currently selected
  const endingSoonPeriod = periods.find(
    (p) =>
      p.status === 'active' &&
      p.isEndingSoon &&
      p.id !== selectedPeriodId &&
      !dismissedMap[p.id] &&
      typeof window !== 'undefined' &&
      !sessionStorage.getItem(`${STORAGE_PREFIX}${p.id}`)
  );

  const handleDismiss = (periodId: string) => {
    setDismissedMap((prev) => ({ ...prev, [periodId]: true }));
    try {
      sessionStorage.setItem(`${STORAGE_PREFIX}${periodId}`, '1');
    } catch {
      // Ignore quota errors
    }
  };

  const handleSelect = (periodId: string) => {
    handleDismiss(periodId);
    onSelectPeriod(periodId);
  };

  if (!endingSoonPeriod) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-[9000] max-w-sm w-[calc(100vw-24px)] sm:w-96 p-3.5 rounded-2xl bg-white/95 dark:bg-[#18222d]/95 backdrop-blur-md border border-amber-500/40 shadow-xl shadow-amber-500/10 animate-fade-in text-xs select-none"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <SymbolIcon icon={endingSoonPeriod.emoji} fallback="⏳" className="text-base" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                Скоро завершится
              </span>
              {typeof endingSoonPeriod.progressPercent === 'number' && (
                <span className="text-[10px] font-mono px-1 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                  {endingSoonPeriod.progressPercent}%
                </span>
              )}
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px] text-xs mt-0.5">
              {endingSoonPeriod.title}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleDismiss(endingSoonPeriod.id)}
          className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Закрыть уведомление"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress & Time Details */}
      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-500" />
          <span>Осталось {endingSoonPeriod.timeRemainingText || 'совсем немного'}</span>
        </div>
        <button
          type="button"
          onClick={() => handleSelect(endingSoonPeriod.id)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-semibold text-[11px] transition-colors cursor-pointer"
        >
          <span>К материалам</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
