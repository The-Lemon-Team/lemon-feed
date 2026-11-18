import React from 'react';
import { Radio, RefreshCw, X } from 'lucide-react';

export interface CoreLiveUpdatesBannerProps {
  count: number;
  label?: string;
  onApply: () => void;
  onDismiss: () => void;
}

export const CoreLiveUpdatesBanner: React.FC<CoreLiveUpdatesBannerProps> = ({
  count,
  label,
  onApply,
  onDismiss,
}) => {
  if (count <= 0) return null;

  return (
    <div className="sticky top-2 z-30 flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[#2481cc] text-white shadow-lg border border-white/15 animate-fade-in">
      <div className="flex items-center gap-2 min-w-0">
        <Radio className="w-4 h-4 animate-pulse shrink-0" />
        <span className="text-xs sm:text-sm font-semibold truncate">
          {label || `Поступило новых записей: +${count}`}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onApply}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white text-[#1e6cb0] hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Показать</span>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1.5 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer"
          aria-label="Скрыть уведомление"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
