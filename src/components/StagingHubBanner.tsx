import React from 'react';
import { StagingStatusFilter } from '../utils/appMode';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  Layers,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';

export interface StagingHubBannerProps {
  statusFilter: StagingStatusFilter;
  onChangeStatusFilter: (filter: StagingStatusFilter) => void;
  totalCount: number;
  pendingCount: number;
  publishedCount: number;
}

export const StagingHubBanner: React.FC<StagingHubBannerProps> = ({
  statusFilter,
  onChangeStatusFilter,
  totalCount,
  pendingCount,
  publishedCount,
}) => {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-emerald-500/10 dark:from-amber-950/35 dark:via-[#18222d] dark:to-emerald-950/30 border border-amber-400/35 dark:border-amber-500/25 p-3 sm:p-4 shadow-xs space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-300 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Хаб публикаций (Staging • Премодерация)
              </h2>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                Порт :5175
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
              Стейджинг перед публикацией в паблик и Telegram. Одобренные посты помечаются бейджем{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                «✓ Опубликовано»
              </span>{' '}
              и автоматически транслируются на публичный порт{' '}
              <span className="font-mono font-semibold">:5176</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <a
            href="http://localhost:5173/notes"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 text-[11px] font-medium transition-colors"
            title="Открыть приватные Notes в Админке"
          >
            <SlidersHorizontal className="w-3 h-3 text-[#2481cc]" />
            <span>Админка :5173</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          <a
            href="http://localhost:5176"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold shadow-xs transition-colors"
            title="Открыть чистовую публичную ленту на порту 5176"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Публичная лента :5176</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
        </div>
      </div>

      {/* Filter Tabs: All in Hub | Pending Moderation (DRAFT) | Published (PUBLISHED) */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60 dark:border-white/10">
        <button
          type="button"
          onClick={() => onChangeStatusFilter('all')}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-[#2481cc] text-white font-semibold shadow-xs'
              : 'bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/10'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Все в стейджинге</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChangeStatusFilter('pending')}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white font-semibold shadow-xs'
              : 'bg-white/80 dark:bg-white/5 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 border border-amber-300/60 dark:border-amber-500/30'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>На премодерации</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChangeStatusFilter('published')}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            statusFilter === 'published'
              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
              : 'bg-white/80 dark:bg-white/5 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 border border-emerald-300/60 dark:border-emerald-500/30'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Опубликованные (помеченные)</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">
            {publishedCount}
          </span>
        </button>
      </div>
    </div>
  );
};
