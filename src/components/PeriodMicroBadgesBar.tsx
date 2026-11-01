import React, { useState, useRef, useEffect } from 'react';
import { PeriodMicroBadge } from '../utils/periods';
import { X } from 'lucide-react';
import { SymbolIcon } from './common/SymbolIcon';

export interface PeriodMicroBadgesBarProps {
  badges: PeriodMicroBadge[];
  overflowBadges?: PeriodMicroBadge[];
  onSelectPeriod?: (periodId: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

export const PeriodMicroBadgesBar: React.FC<PeriodMicroBadgesBarProps> = ({
  badges,
  overflowBadges = [],
  onSelectPeriod,
  onOpenChange,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const togglePopover = (open: boolean) => {
    setIsPopoverOpen(open);
    onOpenChange?.(open);
  };

  useEffect(() => {
    if (!isPopoverOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        togglePopover(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        togglePopover(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPopoverOpen]);

  if (badges.length === 0 && overflowBadges.length === 0) return null;

  const allCount = badges.length + overflowBadges.length;

  return (
    <div className="relative flex items-center gap-1 flex-wrap text-[10px]">
      {badges.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectPeriod?.(b.id);
          }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/10 dark:bg-violet-500/15 border border-violet-500/30 text-violet-700 dark:text-violet-300 font-mono hover:bg-violet-500/20 transition-colors cursor-pointer"
          title={`Период: ${b.title}${b.isBound ? ' (связанная публикация)' : ''}`}
        >
          <SymbolIcon icon={b.emoji} fallback="⏱️" className="text-xs" />
          <span className="max-w-[110px] truncate">{b.title}</span>
        </button>
      ))}

      {overflowBadges.length > 0 && (
        <div className="relative inline-block" ref={popoverRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePopover(!isPopoverOpen);
            }}
            className={`px-1.5 py-0.5 rounded-md border font-mono transition-colors cursor-pointer ${
              isPopoverOpen
                ? 'bg-violet-600 text-white border-violet-700 shadow-xs'
                : 'bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20'
            }`}
            title="Показать все периоды"
          >
            +{overflowBadges.length}...
          </button>

          {isPopoverOpen && (
            <div
              className="absolute right-0 top-full mt-1.5 z-50 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] p-2.5 rounded-xl bg-white dark:bg-[#18222d] border border-slate-200/90 dark:border-white/15 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 space-y-1.5 text-left animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-white/10">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Все периоды заметки ({allCount})
                </span>
                <button
                  type="button"
                  onClick={() => togglePopover(false)}
                  className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded"
                  title="Закрыть"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5">
                {[...badges, ...overflowBadges].map((b) => (
                  <button
                    key={`popover-${b.id}`}
                    type="button"
                    onClick={() => {
                      togglePopover(false);
                      onSelectPeriod?.(b.id);
                    }}
                    className="w-full flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-violet-500/10 dark:hover:bg-violet-500/20 text-left transition-colors cursor-pointer border border-transparent hover:border-violet-500/20"
                  >
                    <span className="flex items-center gap-1.5 truncate text-slate-800 dark:text-slate-200 font-medium text-[11px] min-w-0 flex-1">
                      <SymbolIcon icon={b.emoji} fallback="⏱️" className="text-sm shrink-0" />
                      <span className="truncate">{b.title}</span>
                    </span>
                    <div className="flex items-center gap-1 shrink-0 ml-1.5">
                      {b.isBound ? (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-600 dark:text-violet-400 font-mono font-medium whitespace-nowrap">
                          Связь
                        </span>
                      ) : (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 font-mono whitespace-nowrap">
                          Даты
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
