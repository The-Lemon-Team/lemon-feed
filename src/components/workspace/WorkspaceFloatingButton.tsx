import React, { memo } from 'react';
import { Layers, AlertCircle } from 'lucide-react';

export interface WorkspaceFloatingButtonProps {
  onClick: () => void;
  workspaceColor?: string | null;
  workspaceTitle?: string;
  pinsCount: number;
  focusCount: number;
  attentionCount: number;
  className?: string;
}

export const WorkspaceFloatingButton: React.FC<WorkspaceFloatingButtonProps> = memo(
  ({
    onClick,
    workspaceColor = '#3b82f6',
    workspaceTitle = 'Воркспейс',
    pinsCount,
    focusCount,
    attentionCount,
    className = '',
  }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`fixed bottom-[calc(4.25rem+max(0.5rem,var(--sab)))] sm:bottom-5 right-3.5 sm:right-5 z-40 flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-full shadow-lg border transition-all duration-200 cursor-pointer select-none ${
          pinsCount > 0
            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-700/50 hover:scale-105 shadow-xl'
            : 'bg-white dark:bg-[#18222d] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300'
        } ${className}`}
        title="Открыть рабочее пространство & Фокусные слоты"
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: workspaceColor || '#3b82f6' }}
        />
        <Layers className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold max-w-[120px] truncate">
          {workspaceTitle}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-bold"
          title="Всего заметок в воркспейсе"
        >
          {pinsCount}
        </span>
        {focusCount > 0 && (
          <span
            className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/25 text-amber-500 dark:text-amber-300 border border-amber-500/40 font-mono font-bold"
            title="В фокусных слотах"
          >
            📌 {focusCount}
          </span>
        )}
        {attentionCount > 0 && (
          <span
            className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-mono font-bold animate-pulse"
            title="Требуют внимания"
          >
            <AlertCircle className="w-2.5 h-2.5" />
            {attentionCount}
          </span>
        )}
      </button>
    );
  }
);

WorkspaceFloatingButton.displayName = 'WorkspaceFloatingButton';
