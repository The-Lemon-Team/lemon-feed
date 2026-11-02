import React from 'react';
import dayjs from 'dayjs';
import { Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { PeriodItem } from '../../utils/periods';
import { SymbolIcon } from '../common/SymbolIcon';

export interface FeedActivitiesRailSectionProps {
  periods: PeriodItem[];
  selectedPeriodId?: string;
  onSelectPeriod: (periodId?: string) => void;
  feedTitle?: string;
}

export const FeedActivitiesRailSection: React.FC<FeedActivitiesRailSectionProps> = ({
  periods,
  selectedPeriodId,
  onSelectPeriod,
}) => {
  if (periods.length === 0) return null;

  return (
    <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-[#18222d]/95 border border-slate-200/80 dark:border-white/[0.08] shadow-soft space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-violet-500" />
          Активности канала ({periods.length})
        </span>
      </div>

      <div className="space-y-1.5">
        {periods.map((p) => {
          const isSelected = p.id === selectedPeriodId;
          const startDateStr = dayjs(p.startDate).format('D MMM');
          const endDateStr = p.endDate ? dayjs(p.endDate).format('D MMM') : 'открытый';

          const isEnding = Boolean(p.isEndingSoon);

          const statusBadge =
            p.status === 'active'
              ? isEnding
                ? {
                    text: `⚠️ Завершается (${p.timeRemainingText || `${p.progressPercent}%`})`,
                    class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse',
                  }
                : { text: '🟢 Идёт сейчас', class: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' }
              : p.status === 'upcoming'
              ? { text: '⏳ Скоро', class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' }
              : { text: '⚪ Завершён', class: 'bg-slate-500/15 text-slate-500 dark:text-slate-400' };

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPeriod(isSelected ? undefined : p.id)}
              className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                isSelected
                  ? 'bg-violet-500/15 border-violet-500/40 text-violet-900 dark:text-white shadow-xs'
                  : 'bg-slate-50/80 dark:bg-white/[0.03] border-slate-200/60 dark:border-white/[0.06] hover:bg-slate-100/80 dark:hover:bg-white/[0.06]'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <SymbolIcon icon={p.emoji} fallback="⏱️" className="text-base shrink-0" />
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${statusBadge.class}`}>
                    {statusBadge.text}
                  </span>
                </div>
                <h5 className="font-semibold text-slate-900 dark:text-white truncate mt-1 text-xs">
                  {p.title}
                </h5>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  <Calendar className="w-2.5 h-2.5 shrink-0" />
                  <span>
                    {startDateStr} — {endDateStr}
                  </span>
                </div>

                {typeof p.progressPercent === 'number' && (
                  <div className="w-full mt-1.5 flex items-center gap-1.5">
                    <div className="flex-1 h-1 bg-slate-200/80 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isEnding ? 'bg-amber-500' : 'bg-violet-500'
                        }`}
                        style={{ width: `${p.progressPercent}%` }}
                      />
                    </div>
                    <span className={`text-[9px] font-mono font-bold ${isEnding ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                      {p.progressPercent}%
                    </span>
                  </div>
                )}
              </div>

              <ChevronRight
                className={`w-3.5 h-3.5 mt-2 shrink-0 transition-transform ${
                  isSelected ? 'rotate-90 text-violet-600 dark:text-violet-400' : 'text-slate-400'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
