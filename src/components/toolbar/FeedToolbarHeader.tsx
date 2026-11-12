import React from 'react';
import {
  Radio,
  Sun,
  Moon,
  Clock,
  RotateCw,
  Columns,
  Maximize2,
  Calendar as CalendarIcon,
  Pencil,
  Check,
  Plus,
  Shield,
} from 'lucide-react';
import { FeedAppRuntimeMode } from '../../utils/appMode';
import { LemonLogo } from '../LemonLogo';
import { NotesPrivacyContourSwitcher, NotesPrivacyFilter } from './NotesPrivacyContourSwitcher';

export interface FeedToolbarHeaderProps {
  appMode?: FeedAppRuntimeMode;
  onSetAppMode?: (mode: FeedAppRuntimeMode) => void;
  isPublicMode?: boolean;

  // Notes Privacy Contour ('public' | 'private' | 'all')
  notesPrivacy?: NotesPrivacyFilter;
  onSetNotesPrivacy?: (privacy: NotesPrivacyFilter) => void;

  // Edit Mode Toggle
  isEditMode?: boolean;
  onToggleEditMode?: () => void;

  // Actions
  onCreateNote?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  layoutMode?: 'split' | 'stream';
  onToggleLayoutMode?: () => void;
  onNavigateToTimeline?: () => void;
  onNavigateToCalendar?: () => void;
  onOpenLemonSeasons?: () => void;
  onOpenFeedBus?: () => void;
}

export const FeedToolbarHeader: React.FC<FeedToolbarHeaderProps> = ({
  appMode = 'dev',
  onSetAppMode,
  isPublicMode = false,
  notesPrivacy,
  onSetNotesPrivacy,
  isEditMode = false,
  onToggleEditMode,
  onCreateNote,
  onRefresh,
  isRefreshing,
  isDarkMode,
  onToggleTheme,
  layoutMode = 'split',
  onToggleLayoutMode,
  onNavigateToTimeline,
  onNavigateToCalendar,
  onOpenLemonSeasons,
  onOpenFeedBus,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-white/[0.06]">
      {/* Left: Branding & App Mode Switcher */}
      <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#2481cc]/10 dark:bg-[#3390ec]/15 border border-[#2481cc]/20 flex items-center justify-center text-[#2481cc] dark:text-[#64b5f6] shrink-0">
            <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
          </div>

          <div>
            <h1 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
              <span>
                {isPublicMode || appMode === 'public'
                  ? 'Публичная лента'
                  : appMode === 'staging'
                  ? 'Стейджинг'
                  : 'Лента событий (Dev)'}
              </span>
              {!isPublicMode && (
                <span
                  className={`text-[9px] sm:text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full ${
                    appMode === 'public'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : appMode === 'staging'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  {appMode === 'public' ? 'Public' : appMode === 'staging' ? 'Staging' : 'Dev'}
                </span>
              )}
            </h1>
            <p className="hidden md:block text-[11px] text-slate-500 dark:text-[#8292a2] mt-0.5">
              {isPublicMode || appMode === 'public'
                ? 'Одобренные новости в формате Telegram и Lemon Seasons'
                : appMode === 'staging'
                ? 'Стейджинг премодерации перед публикацией в паблик'
                : 'Интерактивная лента событий и заметок Lemon Seasons (режим разработки)'}
            </p>
          </div>
        </div>

        {/* App Runtime Mode Switcher: Dev | Staging | Public - Hidden in Public Mode */}
        {onSetAppMode && !isPublicMode && (
          <div className="inline-flex p-0.5 rounded-xl bg-slate-200/80 dark:bg-[#111923] border border-slate-300/60 dark:border-white/10 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => onSetAppMode('dev')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                appMode === 'dev'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Режим Dev: все заметки (приватные и рабочие)"
            >
              <span>💻 Dev</span>
            </button>
            <button
              type="button"
              onClick={() => onSetAppMode('staging')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                appMode === 'staging'
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Режим Staging: хаб премодерации перед публикацией"
            >
              <span>🛡️ Staging</span>
            </button>
            <button
              type="button"
              onClick={() => onSetAppMode('public')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                appMode === 'public'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Режим Public: только одобренные новости"
            >
              <span>🌐 Public</span>
            </button>
          </div>
        )}

        {/* Notes Privacy Contour Switcher: Public | Private | All */}
        {onSetNotesPrivacy && !isPublicMode && (
          <NotesPrivacyContourSwitcher
            privacy={notesPrivacy || 'all'}
            onChange={onSetNotesPrivacy}
            isPublicMode={isPublicMode}
          />
        )}
      </div>

      {/* Right: Theme Switcher & Navigation Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto shrink-0 flex-wrap">
        {/* Refresh button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
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
            title={
              layoutMode === 'stream'
                ? 'Режим: Только лента (нажмите, чтобы открыть сайдбар)'
                : 'Режим: Сетка с сайдбаром (нажмите, чтобы оставить только ленту)'
            }
          >
            {layoutMode === 'stream' ? <Maximize2 className="w-3.5 h-3.5" /> : <Columns className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Edit Mode Toggle Icon Button (Placed alongside Refresh, Theme, Layout icons) */}
        {appMode === 'dev' && onToggleEditMode && !isPublicMode && (
          <button
            type="button"
            onClick={onToggleEditMode}
            className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl border transition-colors cursor-pointer ${
              isEditMode
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-600 dark:text-amber-400 shadow-2xs'
                : 'border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
            title={
              isEditMode
                ? 'Режим редактирования активен (нажмите, чтобы выйти)'
                : 'Включить режим редактирования табов и лент'
            }
            aria-label="Режим редактирования"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Lemon-Bus Moderation Button */}
        {!isPublicMode && onOpenFeedBus && (
          <button
            type="button"
            onClick={onOpenFeedBus}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg sm:rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] sm:text-xs font-mono font-medium transition-all cursor-pointer"
            title="Перейти в режим модерации заметок Lemon-Bus (feed-bus)"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Feed-Bus</span>
          </button>
        )}

        {/* Create Note Action */}
        {!isPublicMode && onCreateNote && (
          <button
            type="button"
            onClick={onCreateNote}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-[11px] sm:text-xs font-semibold shadow-xs shadow-emerald-600/20 transition-all cursor-pointer"
            title="Создать новую запись в ленту"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Заметка</span>
            <span className="xs:hidden">Запись</span>
          </button>
        )}

        {/* Timeline & Calendar Navigation - Hidden in Public Mode */}
        {!isPublicMode && onNavigateToTimeline && (
          <button
            type="button"
            onClick={onNavigateToTimeline}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#243343] dark:hover:bg-[#2d3e52] dark:text-white text-[11px] sm:text-xs font-medium transition-colors"
          >
            <Clock className="w-3 h-3 text-[#2481cc]" />
            <span>Таймлайн</span>
          </button>
        )}

        {!isPublicMode && onNavigateToCalendar && (
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
  );
};
