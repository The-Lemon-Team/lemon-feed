import React from 'react';
import { Check, X, CheckSquare, Square } from 'lucide-react';

interface FeedBusBatchBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBatchApprove: () => void;
  onBatchReject: () => void;
}

export const FeedBusBatchBar: React.FC<FeedBusBatchBarProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBatchApprove,
  onBatchReject,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl animate-in slide-in-from-bottom-4 duration-200">
      <div className="bg-surface-container-highest/95 backdrop-blur-md border border-primary/30 rounded-2xl shadow-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: count & select all/clear */}
        <div className="flex items-center gap-2 font-mono">
          <span className="font-bold text-primary">
            Выбрано: {selectedCount}
          </span>
          <span className="text-outline">/ {totalCount}</span>

          <button
            onClick={selectedCount === totalCount ? onClearSelection : onSelectAll}
            className="flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-on-surface underline ml-2"
          >
            {selectedCount === totalCount ? (
              <>
                <Square className="w-3 h-3" />
                <span>Снять</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-3 h-3" />
                <span>Выбрать все</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBatchReject}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/30 transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span>Отклонить ({selectedCount})</span>
          </button>

          <button
            onClick={onBatchApprove}
            className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs hover:shadow-sm transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Одобрить ({selectedCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
