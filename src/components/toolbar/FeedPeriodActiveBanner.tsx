import React from 'react';
import dayjs from 'dayjs';
import { X, Target, Globe, Calendar } from 'lucide-react';
import { PeriodItem, PeriodFilterMode } from '../../utils/periods';
import { SymbolIcon } from '../common/SymbolIcon';

export interface FeedPeriodActiveBannerProps {
  period: PeriodItem;
  mode: PeriodFilterMode;
  onChangeMode: (mode: PeriodFilterMode) => void;
  onClearPeriod: () => void;
  totalPeriodNotesCount?: number;
}

export const FeedPeriodActiveBanner: React.FC<FeedPeriodActiveBannerProps> = ({
  period,
  mode,
  onChangeMode,
  onClearPeriod,
  totalPeriodNotesCount,
}) => {
  const startDateStr = dayjs(period.startDate).format('D MMM YYYY');
  const endDateStr = period.endDate ? dayjs(period.endDate).format('D MMM YYYY') : 'открытый';

  const statusLabel =
    period.status === 'active'
      ? '🟢 Идёт сейчас'
      : period.status === 'upcoming'
      ? '⏳ Скоро'
      : '⚪ Завершён';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-transparent dark:from-violet-500/15 dark:via-indigo-500/15 border border-violet-500/25 text-xs select-none">
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center text-lg shrink-0 overflow-hidden">
          <SymbolIcon icon={period.emoji} fallback="⏱️" className="text-xl" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-violet-600 dark:text-violet-400">
              Период
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 font-mono">
              {statusLabel}
            </span>
            {period.feedTitle && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                из {period.feedTitle}
              </span>
            )}
          </div>
          <h4 className="font-semibold text-slate-900 dark:text-white truncate text-sm mt-0.5">
            {period.title}
          </h4>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            <Calendar className="w-3 h-3 text-violet-500 shrink-0" />
            <span>
              {startDateStr} — {endDateStr}
            </span>
            {typeof totalPeriodNotesCount === 'number' && (
              <span className="text-slate-400">({totalPeriodNotesCount} публикаций)</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        {/* Toggle between Bound and All Notes */}
        <div className="inline-flex items-center p-0.5 rounded-lg bg-white/80 dark:bg-[#131b24] border border-slate-200/80 dark:border-white/10 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => onChangeMode('bound')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              mode === 'bound'
                ? 'bg-violet-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
            title="Показать строго привязанные материалы (по тегам и родительской связи)"
          >
            <Target className="w-3 h-3" />
            <span>Связанные</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeMode('all')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              mode === 'all'
                ? 'bg-violet-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
            title="Показать все заметки ленты в датах этого периода"
          >
            <Globe className="w-3 h-3" />
            <span>Вся лента</span>
          </button>
        </div>

        {/* Clear period filter */}
        <button
          type="button"
          onClick={onClearPeriod}
          className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          title="Сбросить фильтр периода"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
