import React, { useRef, useEffect } from 'react';
import {
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Tag,
  Plus,
} from 'lucide-react';
import { FeedSourceMode, UnifiedFeedTab } from '../adapters/feeds/types';
import { FeedModeOption, resolveStreamPrivacy } from './toolbar/types';
import { LemonLogo } from './LemonLogo';
import { PeriodItem } from '../utils/periods';
import { FeedActivitiesRailSection } from './activities/FeedActivitiesRailSection';
import { StreamPrivacyBadge } from './common/StreamPrivacyBadge';

export interface FeedDesktopRailProps {
  sourceType: FeedSourceMode;
  activeMode?: FeedModeOption;
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
  onCreateNote?: () => void;
  onAddFeed?: () => void;

  periods?: PeriodItem[];
  selectedPeriodId?: string;
  onSelectPeriod?: (periodId?: string) => void;
}

export const FeedDesktopRail: React.FC<FeedDesktopRailProps> = ({
  sourceType,
  activeMode,
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
  onCreateNote,
  onAddFeed,
  periods = [],
  selectedPeriodId,
  onSelectPeriod,
}) => {
  const isAll = sourceType === 'all';
  const isTelegram = sourceType === 'telegram';
  const isPrivateFeeds = sourceType === 'private_feeds';
  const isItDev = sourceType === 'it_dev' || sourceType === 'spark' || sourceType === 'dev';
  const isSeasons = sourceType === 'seasons';
  const isEntertainment = sourceType === 'entertainment';
  const isHolidays = sourceType === 'holidays' || sourceType === 'classic';

  const activeRailTabRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (selectedFeedSlug && activeRailTabRef.current) {
      activeRailTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedFeedSlug, tabs]);

  const headerCategory = activeFeed
    ? activeFeed.category
    : isAll
    ? 'Все потоки'
    : activeMode?.label
    ? activeMode.label
    : isPrivateFeeds
    ? 'Private Feeds'
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
    : activeMode?.emoji
    ? activeMode.emoji
    : isPrivateFeeds
    ? '🔮'
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
    : activeMode?.label
    ? `${activeMode.label} — Лента`
    : isPrivateFeeds
    ? 'Private Feeds — Защищенный контур'
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
    : activeMode?.description
    ? activeMode.description
    : isPrivateFeeds
    ? 'Приватные ленты, защищенные потоки и внутренние заметки рабочей станции'
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

  const streamPrivacy = activeMode
    ? resolveStreamPrivacy(activeMode)
    : isPrivateFeeds
    ? 'private'
    : 'public';

  return (
    <aside className="w-72 xl:w-80 shrink-0 hidden md:flex flex-col space-y-3.5 select-none text-xs sticky top-20">
      {/* 1. Channel Overview Card */}
      <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#18222d]/95 border border-slate-200/80 dark:border-white/[0.08] shadow-soft space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500">
            О канале / ленте
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <StreamPrivacyBadge privacy={streamPrivacy} size="xs" />
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
                  !selectedFeedSlug ||
                  selectedFeedSlug === activeFeed.slug ||
                  (activeFeed.slug === 'spark-changelogsfeed' && (selectedFeedSlug === 'changelogs' || selectedFeedSlug === 'changelog')) ||
                  (activeFeed.slug === 'spark-notebooklmai' && (selectedFeedSlug === 'notebooklm' || selectedFeedSlug === 'notebooklmai'))
                    ? 'bg-[#2481cc]/20 text-[#2481cc] dark:text-[#64b5f6] font-semibold border border-[#2481cc]/30 shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-transparent'
                }`}
              >
                Все ({activeFeed.count})
              </button>

              {activeFeed.subtopics.map((sub) => {
                const isSubActive =
                  selectedFeedSlug === sub.slug ||
                  (sub.subfolder && selectedFeedSlug?.endsWith(`-${sub.subfolder}`));
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

      {/* Quick Add Note to Feed Button (Hidden in Public Mode) */}
      {!isPublicMode && onCreateNote && (
        <button
          type="button"
          onClick={onCreateNote}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/95 dark:bg-[#18222d]/95 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border border-slate-200/80 dark:border-white/[0.08] hover:border-emerald-500/40 dark:hover:border-emerald-500/30 shadow-soft group transition-all cursor-pointer text-left"
          title="Добавить новую заметку"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>Новая запись</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {activeFeed ? `в ${activeFeed.title}` : 'в общий поток'}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
            + Note
          </span>
        </button>
      )}

      {/* 2. Channel Activities / Periods Section */}
      {onSelectPeriod && periods.length > 0 && (
        <FeedActivitiesRailSection
          periods={periods}
          selectedPeriodId={selectedPeriodId}
          onSelectPeriod={onSelectPeriod}
          feedTitle={activeFeed?.title}
        />
      )}

      {/* 3. Folders Widget */}
      <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#18222d]/95 border border-slate-200/80 dark:border-white/[0.08] shadow-soft space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-[#2481cc]" />
            <span>{widgetTitle}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-400">
              {tabs.length}
            </span>
            {!isPublicMode && onAddFeed && (
              <button
                type="button"
                onClick={onAddFeed}
                className="p-1 rounded-lg text-slate-400 hover:text-[#2481cc] dark:hover:text-[#64b5f6] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Создать новый рабочий фид / проект"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
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
              (tab.slug === 'spark-changelogsfeed' && (selectedFeedSlug === 'changelogs' || selectedFeedSlug === 'changelog')) ||
              (tab.slug === 'spark-notebooklmai' && (selectedFeedSlug === 'notebooklm' || selectedFeedSlug === 'notebooklmai')) ||
              Boolean(
                tab.subtopics &&
                  tab.subtopics.some(
                    (s) =>
                      s.slug === selectedFeedSlug ||
                      s.subfolder === selectedFeedSlug ||
                      (s.subfolder && selectedFeedSlug?.endsWith(`-${s.subfolder}`))
                  )
              );
            return (
              <button
                key={tab.id}
                ref={isSelected ? activeRailTabRef : undefined}
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

          {/* Permanent Add Feed Button at bottom of channel list */}
          {!isPublicMode && onAddFeed && (
            <button
              type="button"
              onClick={onAddFeed}
              className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border border-dashed border-slate-200 dark:border-white/10 hover:border-[#2481cc]/50 dark:hover:border-[#64b5f6]/50 text-slate-500 dark:text-slate-400 hover:text-[#2481cc] dark:hover:text-[#64b5f6] hover:bg-[#2481cc]/5 dark:hover:bg-[#2481cc]/10 transition-all text-xs font-medium cursor-pointer group shadow-2xs"
              title="Создать новый рабочий фид / проект"
            >
              <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-[#2481cc] dark:text-[#64b5f6]" />
              <span>Новый фид / проект</span>
            </button>
          )}
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
