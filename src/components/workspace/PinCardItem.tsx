import React from 'react';
import { AlertCircle, ExternalLink, X, Pin } from 'lucide-react';
import { WorkspacePin } from '@lenta/shared';

export interface PinCardItemProps {
  pin: WorkspacePin;
  isSelected: boolean;
  onToggleSelect: () => void;
  onToggleFocus?: (e: React.MouseEvent) => void;
  onToggleAttention: (e: React.MouseEvent) => void;
  onUnpin: () => void;
  onOpenDetail?: () => void;
}

export const PinCardItem: React.FC<PinCardItemProps> = ({
  pin,
  isSelected,
  onToggleSelect,
  onToggleFocus,
  onToggleAttention,
  onUnpin,
  onOpenDetail,
}) => {
  const isAttention = pin.status === 'NEEDS_ATTENTION';
  const isPeriod = pin.note?.type === 'PERIOD';

  return (
    <div
      onClick={onToggleSelect}
      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none space-y-1.5 ${
        isSelected
          ? 'bg-blue-50/80 dark:bg-blue-900/15 border-blue-400/80'
          : pin.isPinned
          ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.06] border-amber-500/30 dark:border-amber-500/20'
          : 'bg-white dark:bg-[#1a2530] border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0 w-3.5 h-3.5"
            onClick={(e) => e.stopPropagation()}
          />
          {isPeriod ? (
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-600 dark:text-violet-400 font-bold shrink-0">
              ПЕРИОД
            </span>
          ) : (
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/10 text-slate-500 shrink-0">
              {pin.note?.type || 'EVENT'}
            </span>
          )}
          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
            {pin.note?.title || 'Заметка'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Toggle Focus Pin */}
          {onToggleFocus && (
            <button
              type="button"
              onClick={onToggleFocus}
              className={`p-1 rounded transition-colors ${
                pin.isPinned
                  ? 'text-amber-500 bg-amber-500/15'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
              title={pin.isPinned ? 'Снять из фокусных слотов' : 'Закрепить в фокусные слоты'}
            >
              <Pin className={`w-3.5 h-3.5 ${pin.isPinned ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* Toggle Attention */}
          <button
            type="button"
            onClick={onToggleAttention}
            className={`p-1 rounded transition-colors ${
              isAttention
                ? 'text-amber-500 bg-amber-500/15'
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
            title={isAttention ? 'Снять статус внимания' : 'Отметить: Требует внимания'}
          >
            <AlertCircle className="w-3.5 h-3.5" />
          </button>

          {onOpenDetail && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail();
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
              title="Открыть заметку"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUnpin();
            }}
            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/10"
            title="Удалить из воркспейса"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {pin.comment && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-black/20 px-2 py-0.5 rounded font-mono truncate">
          💬 {pin.comment}
        </p>
      )}

      {pin.note?.feed?.title && (
        <div className="text-[10px] text-slate-400 font-mono truncate">
          Лента: {pin.note.feed.title}
        </div>
      )}
    </div>
  );
};
