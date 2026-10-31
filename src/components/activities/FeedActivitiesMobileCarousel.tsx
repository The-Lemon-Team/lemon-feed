import React, { useRef, useEffect } from 'react';
import { PeriodItem } from '../../utils/periods';

export interface FeedActivitiesMobileCarouselProps {
  periods: PeriodItem[];
  selectedPeriodId?: string;
  onSelectPeriod: (periodId?: string) => void;
}

export const FeedActivitiesMobileCarousel: React.FC<FeedActivitiesMobileCarouselProps> = ({
  periods,
  selectedPeriodId,
  onSelectPeriod,
}) => {
  const activePeriodRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (selectedPeriodId && activePeriodRef.current) {
      activePeriodRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedPeriodId]);

  if (periods.length === 0) return null;

  return (
    <div className="md:hidden w-full overflow-hidden select-none py-1">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1 py-0.5">
        <span className="text-[10px] font-mono font-bold uppercase text-slate-400 dark:text-slate-500 whitespace-nowrap pl-1 pr-0.5 shrink-0">
          Активности:
        </span>
        {periods.map((p) => {
          const isSelected = p.id === selectedPeriodId;
          const statusDot =
            p.status === 'active'
              ? 'text-emerald-500'
              : p.status === 'upcoming'
              ? 'text-amber-500'
              : 'text-slate-400';

          return (
            <button
              key={p.id}
              ref={isSelected ? activePeriodRef : undefined}
              type="button"
              onClick={() => onSelectPeriod(isSelected ? undefined : p.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs whitespace-nowrap border transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-violet-600 text-white border-violet-700 shadow-xs font-semibold'
                  : 'bg-white/90 dark:bg-[#18222d] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span>{p.emoji}</span>
              <span className={`text-[9px] ${isSelected ? 'text-white' : statusDot}`}>●</span>
              <span className="max-w-[140px] truncate">{p.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
