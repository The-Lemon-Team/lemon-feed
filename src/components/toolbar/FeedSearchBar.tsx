import React, { useRef, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { FeedSourceMode } from '../../adapters/feeds/types';
import { FeedAppRuntimeMode } from '../../utils/appMode';
import { FeedMonthPicker } from '../FeedMonthPicker';

export interface FeedSearchBarProps {
  streamSource: FeedSourceMode;
  searchQuery: string;
  onSearchChange: (q: string) => void;

  selectedMonth: dayjs.Dayjs;
  isMonthFilterActive: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectMonth: (year: number, monthIndex: number) => void;
  onResetMonthFilter: () => void;
  onToday: () => void;

  appMode?: FeedAppRuntimeMode;
  filterUnassigned?: boolean;
  onToggleFilterUnassigned?: () => void;
}

export const FeedSearchBar: React.FC<FeedSearchBarProps> = ({
  streamSource,
  searchQuery,
  onSearchChange,
  selectedMonth,
  isMonthFilterActive,
  onPrevMonth,
  onNextMonth,
  onSelectMonth,
  onResetMonthFilter,
  onToday,
  appMode = 'dev',
  filterUnassigned = false,
  onToggleFilterUnassigned,
}) => {
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMonthPickerOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMonthPickerOpen]);

  const isHolidays = streamSource === 'holidays' || streamSource === 'classic';
  const isEntertainment = streamSource === 'entertainment';
  const isItDev = streamSource === 'it_dev' || streamSource === 'spark' || streamSource === 'dev';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
      {/* Search Input Field & Admin Unassigned Filter */}
      <div className="flex items-center gap-2 flex-1 min-w-0 max-w-lg">
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              isHolidays
                ? 'Поиск по праздникам, памятным датам...'
                : isEntertainment
                ? 'Поиск по Marvel, новинкам кино, музыке...'
                : isItDev
                ? 'Поиск по AI, релизам, статьям...'
                : 'Поиск по заметкам, авторам или тегам...'
            }
            className="w-full pl-8 pr-7 py-1.5 rounded-full text-xs bg-slate-100/80 dark:bg-[#131b24] border border-slate-200/70 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-[#2481cc] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Admin filter for unassigned feeds */}
        {appMode !== 'public' && onToggleFilterUnassigned && (
          <button
            type="button"
            onClick={onToggleFilterUnassigned}
            className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium border whitespace-nowrap transition-all cursor-pointer ${
              filterUnassigned
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title="Фильтровать фиды и материалы без жесткой привязки к категории"
          >
            <span>{filterUnassigned ? '⚠️ Без привязки' : '🏷️ Без привязки'}</span>
          </button>
        )}
      </div>

      {/* Date Month Navigation & Popover Picker */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto" ref={monthPickerRef}>
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          title="Предыдущий месяц"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMonthPickerOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors ${
              isMonthFilterActive
                ? 'border-[#2481cc]/40 bg-[#2481cc]/10 text-[#2481cc] dark:text-[#64b5f6]'
                : 'border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <CalendarIcon className="w-3 h-3 text-[#2481cc]" />
            <span>{isMonthFilterActive ? selectedMonth.format('MMMM YYYY') : 'Все даты'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isMonthPickerOpen && (
            <div className="absolute right-0 top-full mt-2 z-50">
              <FeedMonthPicker
                currentDate={selectedMonth}
                isFilterActive={isMonthFilterActive}
                onSelectMonth={onSelectMonth}
                onResetAllDates={onResetMonthFilter}
                onClose={() => setIsMonthPickerOpen(false)}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          title="Следующий месяц"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onToday}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          Сегодня
        </button>
      </div>
    </div>
  );
};
