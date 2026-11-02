import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { X, Target, Globe, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import { PeriodItem, PeriodFilterMode } from '../../utils/periods';
import { SymbolIcon } from '../common/SymbolIcon';

export interface FeedPeriodActiveBannerProps {
  period: PeriodItem;
  mode: PeriodFilterMode;
  onChangeMode: (mode: PeriodFilterMode) => void;
  onClearPeriod: () => void;
  totalPeriodNotesCount?: number;
  onOpenNoteDetail?: (noteId: string) => void;
}

export const FeedPeriodActiveBanner: React.FC<FeedPeriodActiveBannerProps> = ({
  period,
  mode,
  onChangeMode,
  onClearPeriod,
  totalPeriodNotesCount,
  onOpenNoteDetail,
}) => {
  const startDateStr = dayjs(period.startDate).format('D MMM YYYY');
  const endDateStr = period.endDate ? dayjs(period.endDate).format('D MMM YYYY') : 'открытый';

  const isEndingSoon = Boolean(period.isEndingSoon);

  const relatedNotes = (period.rawNote?.metadata as any)?.relatedNotes as any[] | undefined;
  const nextMilestone = useMemo(() => {
    if (!Array.isArray(relatedNotes) || relatedNotes.length === 0) return null;
    return (
      relatedNotes.find(
        (r) =>
          r.resolved &&
          r.targetNoteId &&
          (r.relationType === 'next_milestone' ||
            (r.targetDate && dayjs(r.targetDate).isAfter(dayjs(period.startDate))))
      ) || null
    );
  }, [relatedNotes, period.startDate]);

  const statusLabel =
    period.status === 'active'
      ? isEndingSoon
        ? `⚠️ Завершается скоро`
        : '🟢 Идёт сейчас'
      : period.status === 'upcoming'
      ? '⏳ Скоро'
      : '⚪ Завершён';

  const badgeClass = isEndingSoon
    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
    : 'bg-violet-500/15 text-violet-700 dark:text-violet-300';

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border text-xs select-none transition-all ${
        isEndingSoon
          ? 'bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-transparent dark:from-amber-500/20 dark:via-rose-500/15 border-amber-500/40'
          : 'bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-transparent dark:from-violet-500/15 dark:via-indigo-500/15 border-violet-500/25'
      }`}
    >
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg shrink-0 overflow-hidden ${
            isEndingSoon
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
              : 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
          }`}
        >
          <SymbolIcon icon={period.emoji} fallback="⏱️" className="text-xl" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] uppercase font-mono font-bold tracking-wider ${
                isEndingSoon ? 'text-amber-600 dark:text-amber-400' : 'text-violet-600 dark:text-violet-400'
              }`}
            >
              Период
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${badgeClass}`}>
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
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex-wrap">
            <Calendar className="w-3 h-3 text-violet-500 shrink-0" />
            <span>
              {startDateStr} — {endDateStr}
            </span>
            {typeof totalPeriodNotesCount === 'number' && (
              <span className="text-slate-400">({totalPeriodNotesCount} публикаций)</span>
            )}
          </div>

          {/* Progress bar & completion percentage */}
          {typeof period.progressPercent === 'number' && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <div className="w-24 sm:w-36 h-1.5 bg-slate-200/80 dark:bg-white/10 rounded-full overflow-hidden shrink-0">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isEndingSoon
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : 'bg-violet-600 dark:bg-violet-400'
                  }`}
                  style={{ width: `${period.progressPercent}%` }}
                />
              </div>
              <span
                className={`text-[10px] font-mono font-bold ${
                  isEndingSoon ? 'text-amber-600 dark:text-amber-400' : 'text-violet-600 dark:text-violet-400'
                }`}
              >
                {period.progressPercent}%
              </span>
              {period.timeRemainingText && (
                <span className="text-[10px] font-mono text-slate-400">
                  (осталось {period.timeRemainingText})
                </span>
              )}
            </div>
          )}

          {/* Next Milestone / Continuation Link (Jira-style arc) */}
          {nextMilestone && (
            <div className="flex items-center gap-1.5 pt-1.5 mt-1 border-t border-slate-200/50 dark:border-white/[0.06] flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Следующий этап:
              </span>
              <button
                type="button"
                onClick={() => onOpenNoteDetail?.(nextMilestone.targetNoteId)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-800 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-300 underline decoration-amber-500/40 hover:decoration-amber-500 transition-colors cursor-pointer truncate max-w-[260px] sm:max-w-sm"
                title="Открыть запланированную новость релиза"
              >
                <span>{nextMilestone.targetTitle || nextMilestone.cleanTitle}</span>
                <ArrowRight className="w-3 h-3 text-amber-500 shrink-0" />
              </button>
              {nextMilestone.targetDate && (
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  ({dayjs(nextMilestone.targetDate).format('D MMMM')})
                </span>
              )}
            </div>
          )}
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
