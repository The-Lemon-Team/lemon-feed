import React, { memo } from 'react';
import { Pin, AlertCircle, Link2, Trash2 } from 'lucide-react';

interface WorkspaceBatchBarProps {
  selectedCount: number;
  allSelectedPinned: boolean;
  onOpenLinkModal: () => void;
  onBatchFocus: () => void;
  onBatchAttention: () => void;
  onBatchUnpin: () => void;
}

export const WorkspaceBatchBar: React.FC<WorkspaceBatchBarProps> = memo(
  ({
    selectedCount,
    allSelectedPinned,
    onOpenLinkModal,
    onBatchFocus,
    onBatchAttention,
    onBatchUnpin,
  }) => {
    if (selectedCount === 0) return null;

    return (
      <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1a2530] flex items-center justify-between gap-2 shrink-0 animate-fadeIn">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
          Выбрано: {selectedCount}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenLinkModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Связать</span>
          </button>

          <button
            type="button"
            onClick={onBatchFocus}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
            title="Закрепить в фокус / Снять фокус"
          >
            <Pin className="w-3.5 h-3.5 fill-current" />
            <span>{allSelectedPinned ? 'Снять фокус' : 'В фокус'}</span>
          </button>

          <button
            type="button"
            onClick={onBatchAttention}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition-colors cursor-pointer"
            title="Отметить: Требует внимания"
          >
            <AlertCircle className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onBatchUnpin}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Удалить выбранные из воркспейса"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }
);

WorkspaceBatchBar.displayName = 'WorkspaceBatchBar';
