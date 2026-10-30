import React from 'react';
import { Zap, Bell } from 'lucide-react';
import { FeedHorizon } from '../../utils/periods';

export interface FeedHorizonSwitcherProps {
  horizon: FeedHorizon;
  onChangeHorizon: (horizon: FeedHorizon) => void;
  upcomingCount?: number;
}

export const FeedHorizonSwitcher: React.FC<FeedHorizonSwitcherProps> = ({
  horizon,
  onChangeHorizon,
  upcomingCount,
}) => {
  return (
    <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100/90 dark:bg-[#131b24] border border-slate-200/70 dark:border-white/[0.08] text-xs font-medium select-none shrink-0">
      <button
        type="button"
        onClick={() => onChangeHorizon('recent')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
          horizon === 'recent'
            ? 'bg-white dark:bg-[#1f2b38] text-slate-900 dark:text-white shadow-xs font-semibold'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
        }`}
        title="Свежие публикации и уже наступившие события (новые сверху)"
      >
        <Zap className={`w-3.5 h-3.5 ${horizon === 'recent' ? 'text-amber-500 fill-amber-500/20' : ''}`} />
        <span>Свежее</span>
      </button>

      <button
        type="button"
        onClick={() => onChangeHorizon('upcoming')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
          horizon === 'upcoming'
            ? 'bg-white dark:bg-[#1f2b38] text-[#2481cc] dark:text-[#64b5f6] shadow-xs font-semibold'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
        }`}
        title="Предстоящие события, даты и релизы (хронологически вперед)"
      >
        <Bell className={`w-3.5 h-3.5 ${horizon === 'upcoming' ? 'text-[#2481cc] fill-[#2481cc]/20' : ''}`} />
        <span>Скоро</span>
        {typeof upcomingCount === 'number' && upcomingCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#2481cc]/15 text-[#2481cc] dark:text-[#64b5f6] font-mono">
            {upcomingCount}
          </span>
        )}
      </button>
    </div>
  );
};
