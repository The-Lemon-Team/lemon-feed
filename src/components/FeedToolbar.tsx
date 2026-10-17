import React, { useRef, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Radio,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  Sun,
  Moon,
  Clock,
  RotateCw,
  Columns,
  Maximize2,
} from 'lucide-react';
import { FeedSourceMode, UnifiedFeedTab } from '../adapters/feeds/types';
import { FeedMonthPicker } from './FeedMonthPicker';
import { LemonLogo } from './LemonLogo';

export interface FeedToolbarProps {
  streamSource: FeedSourceMode;
  onSetStreamSource: (source: FeedSourceMode) => void;

  tabs: UnifiedFeedTab[];
  activeFeedSlug?: string;
  isAllSelected: boolean;
  onSelectFeed: (slug?: string) => void;
  totalCount: number;

  searchQuery: string;
  onSearchChange: (q: string) => void;

  selectedMonth: dayjs.Dayjs;
  isMonthFilterActive: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectMonth: (year: number, monthIndex: number) => void;
  onResetMonthFilter: () => void;
  onToday: () => void;

  isDarkMode: boolean;
  onToggleTheme: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenLemonSeasons?: () => void;
  onNavigateToCalendar?: () => void;
  onNavigateToTimeline?: () => void;

  layoutMode?: 'split' | 'stream';
  onToggleLayoutMode?: () => void;
}

const FEED_MODES: Array<{ id: FeedSourceMode; label: string; emoji: string; badge?: string }> = [
  { id: 'spark', label: 'Spark', emoji: '✨' },
  { id: 'seasons', label: 'Seasons', emoji: '🍋' },
  { id: 'classic', label: 'Classic', emoji: '🏛️' },
  { id: 'telegram', label: 'TG', emoji: '✈️', badge: 'live' },
];

export const FeedToolbar: React.FC<FeedToolbarProps> = ({
  streamSource,
  onSetStreamSource,
  tabs,
  activeFeedSlug,
  isAllSelected,
  onSelectFeed,
  totalCount,
  searchQuery,
  onSearchChange,
  selectedMonth,
  isMonthFilterActive,
  onPrevMonth,
  onNextMonth,
  onSelectMonth,
  onResetMonthFilter,
  onToday,
  isDarkMode,
  onToggleTheme,
  onRefresh,
  isRefreshing,
  onOpenLemonSeasons,
  onNavigateToCalendar,
  onNavigateToTimeline,
  layoutMode = 'split',
  onToggleLayoutMode,
}) => {
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  // Close month picker on outside click
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

  const allLabel = streamSource === 'classic' ? 'Все события' : streamSource === 'seasons' ? 'Все ленты' : 'Все каналы';
  const allEmoji = streamSource === 'classic' ? '🏛️' : streamSource === 'seasons' ? '🍋' : '📡';

  return (
    <div className="shrink-0 w-full rounded-2xl bg-white/95 dark:bg-[#18222d]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] p-3 sm:p-4.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3 transition-colors select-none">
      {/* 1. Upper Header Row: Brand + Segmented Mode Switcher + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-white/[0.06]">
        {/* Left: Branding & Segmented Switcher */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#2481cc]/10 dark:bg-[#3390ec]/15 border border-[#2481cc]/20 flex items-center justify-center text-[#2481cc] dark:text-[#64b5f6] shrink-0">
              <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
            </div>

            <div>
              <h1 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
                <span>Ленты новостей</span>
                <span className="text-[9px] sm:text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                  Lenta Feeds
                </span>
              </h1>
              <p className="hidden md:block text-[11px] text-slate-500 dark:text-[#8292a2] mt-0.5">
                Компактный дайджест по тематическим направлениям
              </p>
            </div>
          </div>

          {/* Segmented Mode Switcher */}
          <div className="inline-flex p-0.5 rounded-xl bg-slate-100/90 dark:bg-[#131b24] border border-slate-200/60 dark:border-white/5 text-[11px] sm:text-xs font-medium">
            {FEED_MODES.map((mode) => {
              const isActive = streamSource === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onSetStreamSource(mode.id)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg transition-colors duration-150 flex items-center gap-1 sm:gap-1.5 font-medium ${
                    isActive
                      ? 'bg-white dark:bg-[#243343] text-[#2481cc] dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{mode.emoji}</span>
                  <span>{mode.label}</span>
                  {mode.badge && (
                    <span className="text-[9px] sm:text-[10px] px-1 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#2481cc] dark:text-blue-300 font-mono font-bold">
                      {mode.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Theme Switcher & Navigation Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto shrink-0 flex-wrap">
          {/* Refresh button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
              title="Обновить ленту"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#2481cc]' : ''}`} />
            </button>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            title={isDarkMode ? 'Светлая тема' : 'Тёмная тема'}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
          </button>

          {/* Layout Mode (Split with Sidebar vs Stream-Only) */}
          {onToggleLayoutMode && (
            <button
              type="button"
              onClick={onToggleLayoutMode}
              className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl border transition-colors ${
                layoutMode === 'stream'
                  ? 'bg-[#2481cc]/15 border-[#2481cc]/40 text-[#2481cc] dark:text-[#64b5f6]'
                  : 'border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
              title={layoutMode === 'stream' ? 'Режим: Только лента (нажмите, чтобы открыть сайдбар)' : 'Режим: Сетка с сайдбаром (нажмите, чтобы оставить только ленту)'}
            >
              {layoutMode === 'stream' ? (
                <Maximize2 className="w-3.5 h-3.5" />
              ) : (
                <Columns className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Timeline & Calendar Navigation */}
          {onNavigateToTimeline && (
            <button
              type="button"
              onClick={onNavigateToTimeline}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#243343] dark:hover:bg-[#2d3e52] dark:text-white text-[11px] sm:text-xs font-medium transition-colors"
            >
              <Clock className="w-3 h-3 text-[#2481cc]" />
              <span>Таймлайн</span>
            </button>
          )}

          {onNavigateToCalendar && (
            <button
              type="button"
              onClick={onNavigateToCalendar}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-[#2481cc] hover:bg-[#1e6cb0] text-white text-[11px] sm:text-xs font-medium transition-colors shadow-xs"
            >
              <CalendarIcon className="w-3 h-3" />
              <span>Календарь</span>
            </button>
          )}

          {/* Lemon Seasons Button */}
          {onOpenLemonSeasons && (
            <button
              type="button"
              onClick={onOpenLemonSeasons}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-400/20 to-lime-500/15 hover:from-amber-500/25 border border-amber-400/40 dark:border-yellow-400/30 text-amber-950 dark:text-yellow-200 text-xs font-semibold transition-all group"
            >
              <LemonLogo size={16} glow={false} />
              <span className="tracking-tight text-[11px]">Seasons</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Thematic Tabs Row (Category & Folder chips) */}
      {streamSource !== 'telegram' && (
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar touch-scroll">
          {/* All Channels Option */}
          <button
            type="button"
            onClick={() => onSelectFeed(undefined)}
            className={`group shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150 select-none ${
              isAllSelected
                ? 'bg-[#2481cc] text-white border-[#2481cc] shadow-xs font-semibold'
                : 'bg-white/90 dark:bg-[#18222d]/90 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:border-[#2481cc]/40 dark:hover:border-white/25 hover:bg-slate-50 dark:hover:bg-[#1f2b38]'
            }`}
          >
            <span>{allEmoji}</span>
            <span>{allLabel}</span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full leading-tight font-medium ${
                isAllSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
              }`}
            >
              {totalCount}
            </span>
          </button>

          {/* Individual Thematic Feed Tabs */}
          {tabs.map((tab) => {
            const isSelected = activeFeedSlug === tab.slug;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectFeed(tab.slug)}
                title={tab.description || tab.title}
                className={`group shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150 select-none ${
                  isSelected
                    ? 'bg-[#2481cc] text-white border-[#2481cc] shadow-xs font-semibold'
                    : 'bg-white/90 dark:bg-[#18222d]/90 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:border-[#2481cc]/40 dark:hover:border-white/25 hover:bg-slate-50 dark:hover:bg-[#1f2b38]'
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.shortTitle}</span>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full leading-tight font-medium ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}

          {!isAllSelected && (
            <button
              type="button"
              onClick={() => onSelectFeed(undefined)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
              title="Сбросить фильтр папок"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 3. Search & Period Navigation Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
        {/* Search Input Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              streamSource === 'classic'
                ? 'Поиск по праздникам, памятным датам...'
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
    </div>
  );
};
