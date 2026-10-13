import React from 'react';
import {
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Sparkles,
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
}) => {
  const isClassic = sourceType === 'classic';
  const isTelegram = sourceType === 'telegram';

  const headerCategory = activeFeed
    ? activeFeed.category
    : isClassic
    ? 'Все события'
    : isTelegram
    ? 'Telegram'
    : 'Все потоки';

  const headerEmoji = activeFeed
    ? activeFeed.emoji
    : isClassic
    ? '🏛️'
    : isTelegram
    ? '✈️'
    : '📡';

  const headerTitle = activeFeed
    ? activeFeed.title
    : isClassic
    ? 'Все календари и праздники'
    : isTelegram
    ? 'Telegram Web Reader'
    : 'Все каналы Spark';

  const headerDescription = activeFeed
    ? activeFeed.description
    : isClassic
    ? 'Хронологический поток государственных, религиозных и мировых дат'
    : isTelegram
    ? 'Живой синхронизированный поток внешних каналов по тематическим папкам'
    : 'Объединенный новостной поток всех тематических папок Spark';

  const displayCount = isTelegram ? 624 : (activeFeed ? activeFeed.count : totalCount);
  const categoriesLabel = isClassic ? 'тем' : 'папок';
  const widgetTitle = isClassic
    ? 'Категории календаря'
    : isTelegram
    ? 'Папки Telegram'
    : 'Папки в Spark';
  const allLabel = isClassic ? 'Все события' : isTelegram ? 'Все папки' : 'Все каналы';

  return (
    <aside className="w-72 xl:w-80 shrink-0 hidden lg:flex flex-col space-y-3.5 select-none text-xs sticky top-20">
      {/* 1. Channel Overview Card */}
      <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#18222d]/95 border border-slate-200/80 dark:border-white/[0.08] shadow-soft space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500">
            О канале / ленте
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#2481cc]/10 text-[#2481cc] dark:text-[#64b5f6] font-mono font-semibold">
            {headerCategory}
          </span>
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
            const isSelected = selectedFeedSlug === tab.slug;
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

      {/* 3. Link to Calendar (Временно закомментирована оригинальная ссылка на localhost:5174, пока календарь в разработке) */}
      {/*
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2481cc]/10 to-indigo-500/10 border border-[#2481cc]/25 shadow-soft space-y-2">
        <div className="flex items-center gap-2 text-[#2481cc] font-semibold">
          <Calendar className="w-3.5 h-3.5" />
          <span>Календарная сетка</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
          Просматривайте эти же заметки, распределенные по дням в основном календаре.
        </p>
        <a
          href="http://localhost:5174/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#2481cc] hover:bg-[#1e6cb0] text-white font-medium shadow-xs transition-colors duration-150"
        >
          <span>Открыть календарь</span>
          <ArrowRight className="w-3 h-3" />
        </a>
      </div>
      */}

      {/* 3. Блок Lemon Seasons в фирменном стиле с логотипом */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-lime-500/10 border border-amber-400/30 dark:border-yellow-500/20 shadow-soft space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 dark:text-yellow-200 font-semibold text-xs">
            <LemonLogo size={20} glow={false} />
            <span>Lemon Seasons</span>
          </div>
          <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-yellow-300 border border-amber-500/20">
            В разработке
          </span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
          Календарная сетка и хроника заметок сейчас обновляются и готовятся к релизу.
        </p>
        <button
          type="button"
          onClick={onOpenLemonSeasons}
          className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-xs transition-all duration-150 cursor-pointer"
        >
          <Sparkles className="w-3 h-3" />
          <span>Подробнее о календаре</span>
        </button>
      </div>

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
