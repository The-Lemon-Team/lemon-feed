import React from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  XCircle,
  LucideIcon,
} from 'lucide-react';
import { ModerationStats } from '@lenta/lemon-bus';

export interface FeedBusHeaderProps {
  stats: ModerationStats | null;
  onExitFeedBus: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

interface StatBadgeConfig {
  key: keyof Pick<ModerationStats, 'pendingCount' | 'approvedCount' | 'rejectedCount'>;
  label: string;
  icon: LucideIcon;
  badgeClass: string;
}

const STAT_BADGES: StatBadgeConfig[] = [
  {
    key: 'pendingCount',
    label: 'В очереди',
    icon: Clock,
    badgeClass: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
  },
  {
    key: 'approvedCount',
    label: 'Одобрено',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'rejectedCount',
    label: 'Отклонено',
    icon: XCircle,
    badgeClass: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
  },
];

export const FeedBusHeader: React.FC<FeedBusHeaderProps> = ({
  stats,
  onExitFeedBus,
  isDarkMode,
  toggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-surface-container/95 backdrop-blur-md border-b border-outline-variant/30 px-3 sm:px-6 py-2.5 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {/* Left: Back to Standard Feed & Branding */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onExitFeedBus}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-variant text-on-surface-variant hover:text-on-surface text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer"
            title="Вернуться к стандартной ленте"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">К ленте</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500 border border-emerald-500/25 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-mono font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  FEED-BUS
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-medium whitespace-nowrap">
                  РЕЖИМ МОДЕРАЦИИ
                </span>
              </div>
              <h1 className="text-sm font-semibold text-on-surface leading-tight truncate">
                Шлюз модерации Lemon-Bus
              </h1>
            </div>
          </div>
        </div>

        {/* Center / Right: Live Stats Counters */}
        <div className="order-3 min-[860px]:order-2 w-full min-[860px]:w-auto min-[860px]:ml-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
          {STAT_BADGES.map(({ key, label, icon: Icon, badgeClass }) => (
            <div
              key={key}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono whitespace-nowrap shrink-0 ${badgeClass}`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{label}:</span>
              <span className="font-bold">{stats?.[key] ?? '—'}</span>
            </div>
          ))}
        </div>

        {/* Far Right: Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="order-2 min-[860px]:order-3 p-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-variant text-on-surface-variant hover:text-on-surface border border-outline-variant/30 transition-all shrink-0 cursor-pointer"
          title={isDarkMode ? 'Включить светлую тему' : 'Включить тёмную тему'}
          aria-label={isDarkMode ? 'Включить светлую тему' : 'Включить тёмную тему'}
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
