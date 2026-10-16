import React from 'react';
import {
  Radio,
  Search,
  X,
  Sun,
  Moon,
  ExternalLink,
  RotateCw,
} from 'lucide-react';
import { FeedSourceMode } from '../adapters/feeds/types';
import { LemonLogo } from './LemonLogo';

export interface FeedTopBarProps {
  streamSource: FeedSourceMode;
  onSetStreamSource: (source: FeedSourceMode) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isSearchOpen: boolean;
  onToggleSearch: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenLemonSeasons?: () => void;
}

interface FeedModeOption {
  id: FeedSourceMode;
  label: string;
  emoji: string;
  badge?: string;
}

const FEED_MODES: FeedModeOption[] = [
  { id: 'spark', label: 'Spark', emoji: '✨' },
  { id: 'seasons', label: 'Seasons', emoji: '🍋' },
  { id: 'classic', label: 'Classic', emoji: '🏛️' },
  { id: 'telegram', label: 'TG', emoji: '✈️', badge: 'live' },
];

export const FeedTopBar: React.FC<FeedTopBarProps> = ({
  streamSource,
  onSetStreamSource,
  isDarkMode,
  onToggleTheme,
  searchQuery,
  onSearchChange,
  isSearchOpen,
  onToggleSearch,
  onRefresh,
  isRefreshing,
  onOpenLemonSeasons,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full max-w-full bg-white/90 dark:bg-[#18222d]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] transition-colors pt-[max(0.5rem,var(--sat))]">
      <div className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 py-2 sm:py-2.5 space-y-2">
        {/* Upper Row: Brand + Desktop Switcher + Quick Actions */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#2481cc]/10 dark:bg-[#3390ec]/15 border border-[#2481cc]/25 flex items-center justify-center text-[#2481cc] dark:text-[#64b5f6] shrink-0">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                <span className="truncate">Лента</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-medium shrink-0 hidden sm:inline-block">
                  Web
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-medium shrink-0 sm:hidden">
                  Mobile
                </span>
              </h1>
            </div>
          </div>

          {/* Segmented Mode Switcher (Desktop: sm and above) */}
          <div className="hidden sm:inline-flex p-0.5 rounded-xl bg-slate-100/90 dark:bg-[#131b24] border border-slate-200/60 dark:border-white/5 text-xs font-medium shrink-0">
            {FEED_MODES.map((mode) => {
              const isActive = streamSource === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onSetStreamSource(mode.id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors duration-150 flex items-center gap-1 font-medium ${
                    isActive
                      ? 'bg-white dark:bg-[#243343] text-[#2481cc] dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{mode.emoji}</span>
                  <span>{mode.label}</span>
                  {mode.badge && (
                    <span className="text-[9px] px-1 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#2481cc] dark:text-blue-300 font-mono font-bold">
                      {mode.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions (Search, Refresh, Theme, Calendar link) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onToggleSearch}
              className={`p-1.5 rounded-lg border text-slate-600 dark:text-slate-300 transition-colors ${
                isSearchOpen
                  ? 'bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/20'
                  : 'border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
              title="Поиск"
              aria-label="Поиск"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                title="Обновить ленту"
                aria-label="Обновить ленту"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#2481cc]' : ''}`} />
              </button>
            )}

            <button
              type="button"
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              title={isDarkMode ? 'Светлая тема' : 'Тёмная тема'}
              aria-label={isDarkMode ? 'Светлая тема' : 'Тёмная тема'}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            </button>

            {/* Временно закомментировано: старая кнопка перехода к календарю (порт 5174), пока он в разработке */}
            {/*
            <a
              href="http://localhost:5174/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#243343] dark:hover:bg-[#2d3e52] dark:text-white text-xs font-medium transition-colors"
              title="Перейти к календарю"
            >
              <span>Календарь</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            */}

            {/* Акцентная кнопка в стиле Lemon Seasons с логотипом */}
            <button
              type="button"
              onClick={onOpenLemonSeasons}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-400/20 to-lime-500/15 hover:from-amber-500/25 hover:via-yellow-400/30 hover:to-lime-500/25 border border-amber-400/40 dark:border-yellow-400/30 text-amber-950 dark:text-yellow-200 text-xs font-semibold shadow-xs hover:shadow-[0_0_14px_-2px_rgba(234,179,8,0.35)] transition-all duration-150 group cursor-pointer"
              title="Lemon Seasons — Календарь (в разработке)"
              aria-label="Lemon Seasons — Календарь (в разработке)"
            >
              <LemonLogo size={18} glow={false} className="group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline tracking-tight">Lemon Seasons</span>
              <span className="sm:hidden tracking-tight text-[11px]">Seasons</span>
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded-full bg-amber-500/15 dark:bg-yellow-400/15 text-amber-700 dark:text-yellow-300 border border-amber-500/20">
                Dev
              </span>
            </button>
          </div>
        </div>

        {/* Segmented Mode Switcher (Mobile: below sm) */}
        <div className="sm:hidden grid grid-cols-4 p-0.5 rounded-xl bg-slate-100/90 dark:bg-[#131b24] border border-slate-200/60 dark:border-white/5 text-xs font-medium w-full">
          {FEED_MODES.map((mode) => {
            const isActive = streamSource === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onSetStreamSource(mode.id)}
                className={`py-1.5 px-2 rounded-lg transition-colors duration-150 flex items-center justify-center gap-1 font-medium text-center min-w-0 ${
                  isActive
                    ? 'bg-white dark:bg-[#243343] text-[#2481cc] dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="text-xs">{mode.emoji}</span>
                <span className="truncate">{mode.label}</span>
                {mode.badge && (
                  <span className="text-[8px] px-1 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#2481cc] dark:text-blue-300 font-mono font-bold shrink-0">
                    {mode.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Expandable Search Input Row */}
        {isSearchOpen && (
          <div className="relative w-full pt-1 animate-fade-in">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Поиск по заметкам, тегам или авторам..."
              autoFocus
              className="w-full pl-8 pr-8 py-1.5 rounded-xl text-xs bg-slate-100/80 dark:bg-[#131b24] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-[#2481cc] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
