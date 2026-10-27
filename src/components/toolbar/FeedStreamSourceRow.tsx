import React from 'react';
import { Plus, Pencil } from 'lucide-react';
import { FeedSourceMode } from '../../adapters/feeds/types';
import { FeedModeOption, DEFAULT_FEED_MODES } from './types';

export interface FeedStreamSourceRowProps {
  streamSource: FeedSourceMode;
  onSetStreamSource: (source: FeedSourceMode) => void;
  sourceModes?: FeedModeOption[];

  // Edit Mode Props
  isEditMode?: boolean;
  onEditSourceTab?: (tab: FeedModeOption) => void;
  onAddSourceTab?: () => void;
}

export const FeedStreamSourceRow: React.FC<FeedStreamSourceRowProps> = ({
  streamSource,
  onSetStreamSource,
  sourceModes = DEFAULT_FEED_MODES,
  isEditMode = false,
  onEditSourceTab,
  onAddSourceTab,
}) => {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar touch-scroll pt-2 pb-1 px-1 -mt-1">
      <div className="inline-flex items-center p-0.5 rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-100/90 dark:bg-[#131b24] text-[11px] sm:text-xs font-medium">
        {sourceModes.map((mode) => {
          const isActive = streamSource === mode.id;

          const handleClick = () => {
            if (isEditMode && onEditSourceTab) {
              onEditSourceTab(mode);
            } else {
              onSetStreamSource(mode.id as FeedSourceMode);
            }
          };

          return (
            <button
              key={mode.id}
              type="button"
              onClick={handleClick}
              className={`relative px-3 py-1.5 rounded-lg transition-colors duration-150 flex items-center gap-1.5 font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-[#243343] text-[#2481cc] dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={
                isEditMode
                  ? `Редактировать раздел: ${mode.label}`
                  : `Переключить на: ${mode.label}`
              }
            >
              <span>{mode.emoji}</span>
              <span>{mode.label}</span>

              {mode.badge && (
                <span className="text-[9px] px-1 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#2481cc] dark:text-blue-300 font-mono font-bold">
                  {mode.badge}
                </span>
              )}

              {/* Edit Mode Pencil Badge - Positioned absolutely to avoid layout shift */}
              {isEditMode && (
                <span
                  className="absolute -top-1 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs pointer-events-none z-10 ring-1 ring-white dark:ring-[#18222d]"
                  title="Нажмите для редактирования"
                >
                  <Pencil className="w-2 h-2" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Add New Section/Tab Chip (Visible in Edit Mode) */}
      {isEditMode && onAddSourceTab && (
        <button
          type="button"
          onClick={onAddSourceTab}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-dashed border-amber-500/40 hover:border-amber-500 transition-all cursor-pointer shadow-2xs"
          title="Добавить новый раздел/таб в верхнюю панель"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Таб</span>
        </button>
      )}
    </div>
  );
};
