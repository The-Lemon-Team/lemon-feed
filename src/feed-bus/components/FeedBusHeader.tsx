import React from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  DownloadCloud,
  Search,
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { ModerationStats } from '@lenta/lemon-bus';

interface FeedBusHeaderProps {
  stats: ModerationStats | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onImportWatchers: () => void;
  onExitFeedBus: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isLoading: boolean;
}

export const FeedBusHeader: React.FC<FeedBusHeaderProps> = ({
  stats,
  searchQuery,
  onSearchChange,
  onRefresh,
  onImportWatchers,
  onExitFeedBus,
  isDarkMode,
  toggleTheme,
  isLoading,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-surface-container/95 backdrop-blur-md border-b border-outline-variant/30 px-3 sm:px-6 py-2.5 shadow-sm transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Branding & Back to Standard Feed */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onExitFeedBus}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-variant text-on-surface-variant hover:text-on-surface text-xs font-medium transition-all"
            title="Вернуться к стандартной ленте"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">К ленте</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500 border border-emerald-500/25">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  FEED-BUS
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                  РЕЖИМ МОДЕРАЦИИ
                </span>
              </div>
              <h1 className="text-sm font-semibold text-on-surface leading-tight">
                Шлюз модерации Lemon-Bus
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Live Stats Counters */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-0.5 scrollbar-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>В очереди:</span>
            <span className="font-bold">{stats?.pendingCount ?? '—'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Одобрено:</span>
            <span className="font-bold">{stats?.approvedCount ?? '—'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono">
            <XCircle className="w-3.5 h-3.5" />
            <span>Отклонено:</span>
            <span className="font-bold">{stats?.rejectedCount ?? '—'}</span>
          </div>
        </div>

        {/* Right: Search, Import Watchers & Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Quick search input */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Поиск по заметкам..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-container-highest border border-outline-variant/40 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          {/* Import raw watcher news */}
          <button
            onClick={onImportWatchers}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-variant text-on-surface-variant hover:text-on-surface text-xs font-medium border border-outline-variant/30 transition-all"
            title="Импортировать новости из собранных вотчерами"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-primary" />
            <span className="hidden lg:inline">Импорт вотчеров</span>
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-variant text-on-surface-variant hover:text-on-surface border border-outline-variant/30 transition-all"
            title="Обновить список"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          </button>

          {/* Theme */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-variant text-on-surface-variant hover:text-on-surface border border-outline-variant/30 transition-all"
            title={isDarkMode ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
