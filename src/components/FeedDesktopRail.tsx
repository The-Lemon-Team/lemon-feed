import React from 'react';
import {
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Tag,
} from 'lucide-react';
import { FeedSourceMode, UnifiedFeedTab } from '../adapters/feeds/types';
import { LemonLogo } from './LemonLogo';

export interface FeedDesktopRailProps {
  sourceType: FeedSourceMode;
  activeFeed: UnifiedFeedTab | null;
  tabs: UnifiedFeedTab[];
  selectedFeedSlug?: string;
  onSelectFeed: (slug?: string) => void;
  totalCount: number;
  availableTags?: string[];
  onSelectTag?: (tag: string) => void;
  onOpenLemonSeasons?: () => void;
  onNavigateToCalendar?: () => void;
  currentMonthName?: string;
  isPublicMode?: boolean;
}

export const FeedDesktopRail: React.FC<FeedDesktopRailProps> = ({
  sourceType,
  activeFeed,
  tabs,
  selectedFeedSlug,
  onSelectFeed,
  totalCount,
  availableTags = [],
  onSelectTag,
  onOpenLemonSeasons,
  onNavigateToCalendar,
  currentMonthName = 'октябрь 2026',
  isPublicMode = false,
}) => {
  const isAll = sourceType === 'all';
  const isItDev = sourceType === 'it_dev' || sourceType === 'spark' || sourceType === 'dev';
  const isSeasons = sourceType === 'seasons';
  const isEntertainment = sourceType === 'entertainment';
  const isHolidays = sourceType === 'holidays' || sourceType === 'classic';
  const isTelegram = sourceType === 'telegram';

  const headerCategory = activeFeed
    ? activeFeed.category
    : isAll
    ? 'Все потоки'
    : isItDev
    ? 'IT & Dev'
    : isSeasons
    ? 'Lemon Seasons'
    : isEntertainment
    ? 'Развлечения'
    : isHolidays
    ? 'Праздники'
    : isTelegram
    ? 'Telegram'
    : 'Все потоки';

  const headerEmoji = activeFeed
    ? activeFeed.emoji
    : isAll
    ? '🌐'
    : isItDev
    ? '💻'
    : isSeasons
    ? '🍋'
    : isEntertainment
    ? '🍿'
    : isHolidays
    ? '🎉'
    : isTelegram
    ? '✈️'
    : '📡';

  const headerTitle = activeFeed
    ? activeFeed.title
    : isAll
    ? 'Все ленты и события'
    : isItDev
    ? 'IT & Dev — Центр технологий'
    : isSeasons
    ? 'Lemon Seasons & Дневник'
    : isEntertainment
    ? 'Развлечения & Поп-культура'
    : isHolidays
    ? 'Праздники и Памятные даты'
    : isTelegram
    ? 'Telegram Live Reader'
    : 'Все публикации';

  const headerDescription = activeFeed
    ? activeFeed.description
    : isAll
    ? 'Сквозной хронологический поток всех публикаций, новостей, дневников и дат'
    : isItDev
    ? 'Реактивные потоки: релизы моделей, changelog вендоров, кибербезопасность и статьи'
    : isSeasons
    ? 'Официальные хроники Lemon Seasons, ежедневный журнал, архитектура и вехи'
    : isEntertainment
    ? 'Киновселенная Marvel, мировые премьеры фильмов, сериалы и музыкальные релизы'
    : isHolidays
    ? 'Хронологический поток государственных, религиозных и мировых праздничных дат'
    : isTelegram
    ? 'Живой синхронизированный поток внешних каналов по тематическим папкам'
    : 'Объединенный новостной поток';

  const selectedSubtopic = activeFeed?.subtopics?.find((s) => s.slug === selectedFeedSlug);
  const displayCount = isTelegram
    ? 624
    : selectedSubtopic
    ? selectedSubtopic.count
    : activeFeed
    ? activeFeed.count
    : totalCount;
  const categoriesLabel = isItDev
    ? 'тем'
    : isSeasons
    ? 'хроник'
    : isEntertainment
    ? 'разделов'
    : isHolidays
    ? 'групп'
    : 'потоков';
  const widgetTitle = isAll
    ? 'Разделы всех лент'
    : isItDev
    ? 'Темы IT & Dev'
    : isSeasons
    ? 'Разделы Seasons'
    : isEntertainment
    ? 'Сферы развлечений'
    : isHolidays
    ? 'Категории праздников'
    : isTelegram
    ? 'Папки Telegram'
    : 'Темы потока';
  const allLabel = isAll
    ? 'Все публикации'
    : isItDev
    ? 'Все IT темы'
    : isSeasons
    ? 'Все хроники'
    : isEntertainment
    ? 'Все релизы'
    : isHolidays
    ? 'Все праздники'
    : isTelegram
    ? 'Все папки'
    : 'Все каналы';

  return (
    <aside className="w-72 xl:w-80 shrink-0 hidden md:flex flex-col space-y-3.5 select-none text-xs sticky top-20">
      {/* 1. Channel Overview Card */}
      <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#18222d]/95 border border-slate-200/80 dark:border-white/[0.08] shadow-soft space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500">
            О канале / ленте
          </span>
          <div className="flex items-center gap-1.5">
            {activeFeed?.badgeLabel ? (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 font-mono font-semibold border border-orange-500/30">
                {activeFeed.badgeLabel}
              </span>
            ) : activeFeed?.isHot ? (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 font-mono font-semibold border border-orange-500/30">
                🔥 Daily
              </span>
            ) : null}
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#2481cc]/10 text-[#2481cc] dark:text-[#64b5f6] font-mono font-semibold">
              {headerCategory}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-base shrink-0">
            {headerEmoji}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-slate-900 dark:text-white truncate leading-tight">
              {headerTitle}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-[#8292a2] mt-0.5 line-clamp-2 leading-relaxed">
              {headerDescription}
            </p>
          </div>
        </div>

        {/* Quick metrics */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] text-[11px]">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5">
            <span className="text-slate-400 block text-[10px]">Публикаций</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
              {displayCount}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5">
            <span className="text-slate-400 block text-[10px]">
              {activeFeed ? 'Всего в ленте' : 'Категории'}
            </span>
            <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
              {activeFeed ? totalCount : `${tabs.length} ${categoriesLabel}`}
            </span>
          </div>
        </div>

        {/* Subtopics Chips (e.g. for Changelogs) */}
        {activeFeed?.subtopics && activeFeed.subtopics.length > 0 && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-white/[0.06] space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-[#2481cc]" />
                <span>Подтемы {activeFeed.shortTitle}</span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/10 text-slate-500">
                {activeFeed.subtopics.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => onSelectFeed(activeFeed.slug)}
                className={`px-2 py-0.5 rounded-full font-mono text-[10px] transition-colors cursor-pointer ${
                  !selectedFeedSlug || selectedFeedSlug === activeFeed.slug
                    ? 'bg-[#2481cc]/20 text-[#2481cc] dark:text-[#64b5f6] font-semibold border border-[#2481cc]/30 shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-transparent'
                }`}
              >
                Все ({activeFeed.count})
              </button>

              {activeFeed.subtopics.map((sub) => {
                const isSubActive = selectedFeedSlug === sub.slug;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => onSelectFeed(isSubActive ? activeFeed.slug : sub.slug)}
                    className={`px-2 py-0.5 rounded-full font-mono text-[10px] transition-colors cursor-pointer ${
                      isSubActive
                        ? 'bg-[#2481cc]/20 text-[#2481cc] dark:text-[#64b5f6] font-semibold border border-[#2481cc]/30 shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-transparent'
                    }`}
                  >
                    {sub.title} ({sub.count})
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Folders Widget */}
      <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#18222d]/95 border border-slate-200/80 dark:border-white/[0.08] shadow-soft space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-[#2481cc]" />
            <span>{widgetTitle}</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {tabs.length}
          </span>
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelectFeed(undefined)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors duration-150 text-left font-medium ${
              !selectedFeedSlug
                ? 'bg-[#2481cc]/10 text-[#2481cc] dark:text-[#64b5f6] font-semibold border border-[#2481cc]/25'
                : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span>{headerEmoji}</span>
              <span className="truncate">{allLabel}</span>
            </div>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 opacity-80">
              {totalCount}
            </span>
          </button>

          {tabs.map((tab) => {
            const isSelected =
              selectedFeedSlug === tab.slug ||
              Boolean(tab.subtopics && tab.subtopics.some((s) => s.slug === selectedFeedSlug));
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectFeed(tab.slug)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors duration-150 text-left font-medium ${
                  isSelected
                    ? 'bg-[#2481cc]/10 text-[#2481cc] dark:text-[#64b5f6] font-semibold border border-[#2481cc]/25'
                    : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span>{tab.emoji}</span>
                  <span className="truncate">{tab.shortTitle}</span>
                  {tab.badgeLabel ? (
                    <span
                      title={tab.badgeLabel === '(daily)' ? 'Лента из ежедневного каталога (daily sync)' : tab.badgeLabel}
                      className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full border border-orange-500/30 bg-orange-500/15 text-orange-600 dark:text-orange-400 shrink-0 font-mono"
                    >
                      {tab.badgeLabel}
                    </span>
                  ) : tab.isHot ? (
                    <span
                      title="Горячая лента: ежедневная синхронизация"
                      className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full border border-orange-500/30 bg-orange-500/15 text-orange-600 dark:text-orange-400 shrink-0"
                    >
                      🔥 Daily
                    </span>
                  ) : null}
                </div>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected
                    ? 'bg-[#2481cc]/20 text-[#2481cc] dark:text-[#64b5f6]'
                    : 'bg-slate-100 dark:bg-white/10 opacity-80'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Link to Calendar (Календарная сетка - Hidden in Public Mode) */}
      {!isPublicMode && onNavigateToCalendar && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2481cc]/10 to-indigo-500/10 border border-[#2481cc]/25 shadow-soft space-y-2">
          <div className="flex items-center gap-2 text-[#2481cc] font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Календарная сетка</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Просматривайте эти же даты, распределенные по дням в <span className="font-semibold">{currentMonthName}</span>.
          </p>
          <a
            href="http://localhost:5174/calendar"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                if (onNavigateToCalendar) {
                  e.preventDefault();
                  onNavigateToCalendar();
                }
              }
            }}
            className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#2481cc] hover:bg-[#1e6cb0] text-white font-medium shadow-xs transition-colors duration-150 cursor-pointer no-underline"
          >
            <span>Открыть месяц</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* 4. Trending Tags */}
      {availableTags.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-[#18222d]/95 border border-slate-200/80 dark:border-white/[0.08] shadow-soft space-y-2">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">
            <TrendingUp className="w-3 h-3 text-[#2481cc]" />
            <span>Темы и теги</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {availableTags.slice(0, 8).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onSelectTag?.(t)}
                className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-mono text-[10px] transition-colors"
              >
                #{t.replace(/^#/, '')}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
