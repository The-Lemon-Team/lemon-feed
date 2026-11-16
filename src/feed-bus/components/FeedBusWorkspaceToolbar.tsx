import React from 'react';
import { DownloadCloud, RefreshCw, Search, X } from 'lucide-react';

export interface FeedBusWorkspaceToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onImportWatchers: () => void;
  isLoading: boolean;
}

/**
 * Workspace-level controls for searching, importing watcher batches, and refreshing
 * the moderation queue without crowding the top header bar.
 */
export const FeedBusWorkspaceToolbar: React.FC<FeedBusWorkspaceToolbarProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  onImportWatchers,
  isLoading,
}) => {
  return (
    <div className="bg-white/95 dark:bg-[#18222d]/95 rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-white/[0.08] shadow-soft flex flex-col sm:flex-row sm:items-center gap-2.5">
      {/* Search input */}
      <div className="relative flex-1 min-w-0">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Поиск по заметкам..."
          aria-label="Поиск по заметкам"
          className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-surface-container-highest border border-outline-variant/40 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
        />
        {searchQuery.length > 0 && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-outline hover:text-on-surface hover:bg-surface-variant/60 transition-colors"
            title="Очистить поиск"
            aria-label="Очистить поиск"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Queue actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onImportWatchers}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-highest hover:bg-surface-variant text-on-surface-variant hover:text-on-surface text-xs font-medium border border-outline-variant/30 transition-all whitespace-nowrap cursor-pointer"
          title="Импортировать новости из собранных вотчерами"
        >
          <DownloadCloud className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>Импорт вотчеров</span>
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-highest hover:bg-surface-variant text-on-surface-variant hover:text-on-surface text-xs font-medium border border-outline-variant/30 transition-all whitespace-nowrap disabled:opacity-60 cursor-pointer"
          title="Обновить список"
          aria-label="Обновить список"
        >
          <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          <span className="hidden sm:inline">Обновить</span>
        </button>
      </div>
    </div>
  );
};
