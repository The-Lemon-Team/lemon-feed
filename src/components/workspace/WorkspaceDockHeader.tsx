import React, { memo } from 'react';
import { Layers, X, Plus, Trash2, Search, AlertCircle } from 'lucide-react';
import { Workspace } from '@lenta/shared';

export interface WorkspaceDockHeaderProps {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  pinsCount: number;
  focusCount: number;
  searchQuery: string;
  filterAttentionOnly: boolean;
  attentionCount: number;
  onSearchChange: (q: string) => void;
  onToggleFilterAttention: () => void;
  onSelectWorkspace: (id: string) => void;
  onOpenCreateWorkspace: () => void;
  onDeleteWorkspace: (w: Workspace) => void;
  onClose: () => void;
}

export const WorkspaceDockHeader: React.FC<WorkspaceDockHeaderProps> = memo(({
  activeWorkspace,
  workspaces,
  activeWorkspaceId,
  pinsCount,
  focusCount,
  searchQuery,
  filterAttentionOnly,
  attentionCount,
  onSearchChange,
  onToggleFilterAttention,
  onSelectWorkspace,
  onOpenCreateWorkspace,
  onDeleteWorkspace,
  onClose,
}) => {
  return (
    <div className="p-3.5 border-b border-slate-100 dark:border-white/10 space-y-3 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
              {activeWorkspace?.title || 'Воркспейс'}
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              {pinsCount} заметок • {focusCount} в фокусе
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {activeWorkspace && (
            <button
              type="button"
              onClick={() => onDeleteWorkspace(activeWorkspace)}
              className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              title={`Удалить воркспейс «${activeWorkspace.title}»`}
              aria-label={`Удалить воркспейс «${activeWorkspace.title}»`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            title="Закрыть (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workspace Switcher Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-scroll py-1.5 px-1 -mx-1">
        {workspaces.map((w) => {
          const isActive = w.id === activeWorkspaceId;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => onSelectWorkspace(w.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#151e27] ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: w.color || '#3b82f6' }}
              />
              <span>{w.title}</span>
              <span className="text-[10px] opacity-75 font-mono">
                ({w._count?.pins || 0})
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenCreateWorkspace}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer border border-dashed border-slate-300 dark:border-white/15 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#151e27]"
          title="Создать новое рабочее пространство"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Новый</span>
        </button>
      </div>

      {/* Subheader: Search & Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по заметкам воркспейса..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>

        <button
          type="button"
          onClick={onToggleFilterAttention}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
            filterAttentionOnly
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
              : 'border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
          }`}
          title="Показать только требующие внимания"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Внимание</span>
          {attentionCount > 0 && <span className="font-mono">({attentionCount})</span>}
        </button>
      </div>
    </div>
  );
});

WorkspaceDockHeader.displayName = 'WorkspaceDockHeader';
