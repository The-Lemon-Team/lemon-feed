import React, { useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Pencil, X, GripVertical } from 'lucide-react';
import { FeedSourceMode, UnifiedFeedTab } from '../../adapters/feeds/types';
import { FeedModeOption } from './types';
import { SymbolIcon } from '../common/SymbolIcon';

export interface FeedCategoryTabsRowProps {
  streamSource: FeedSourceMode;
  activeMode?: FeedModeOption;
  tabs: UnifiedFeedTab[];
  activeFeedSlug?: string;
  isAllSelected: boolean;
  onSelectFeed: (slug?: string) => void;
  totalCount: number;

  // Edit Mode Props
  isEditMode?: boolean;
  onEditFeed?: (tab: UnifiedFeedTab) => void;
  onAddFeed?: () => void;
  onReorderTabs?: (tabs: UnifiedFeedTab[]) => void;
}

interface SortableCategoryTabItemProps {
  tab: UnifiedFeedTab;
  isSelected: boolean;
  isEditMode: boolean;
  onClick: () => void;
  activeTabRef?: React.RefObject<HTMLButtonElement | null>;
}

const SortableCategoryTabItem: React.FC<SortableCategoryTabItemProps> = ({
  tab,
  isSelected,
  isEditMode,
  onClick,
  activeTabRef,
}) => {
  const tabId = tab.id || tab.slug;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tabId,
    disabled: !isEditMode,
  });

  const horizontalTransform = transform
    ? { ...transform, y: 0, scaleX: 1, scaleY: 1 }
    : null;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(horizontalTransform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  const setMergedRef = (el: HTMLButtonElement | null) => {
    setNodeRef(el);
    if (isSelected && activeTabRef) {
      (activeTabRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
    }
  };

  return (
    <button
      ref={setMergedRef}
      style={style}
      {...attributes}
      {...listeners}
      type="button"
      onClick={onClick}
      title={
        isEditMode
          ? `Редактировать ленту: ${tab.title}`
          : tab.description || tab.title
      }
      className={`group relative shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150 select-none ${
        isEditMode
          ? 'cursor-grab active:cursor-grabbing hover:bg-slate-200/60 dark:hover:bg-[#1f2b38]'
          : 'cursor-pointer'
      } ${
        isSelected
          ? 'bg-[#2481cc] text-white border-[#2481cc] shadow-xs font-medium'
          : 'bg-white/90 dark:bg-[#18222d]/90 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:border-[#2481cc]/40 dark:hover:border-white/25 hover:bg-slate-50 dark:hover:bg-[#1f2b38]'
      } ${isDragging ? 'ring-2 ring-[#2481cc] shadow-md bg-white dark:bg-[#243343]' : ''}`}
    >
      {isEditMode && (
        <GripVertical className="w-3 h-3 text-slate-400 dark:text-slate-500 -ml-0.5 opacity-60 group-hover:opacity-100" />
      )}
      <SymbolIcon icon={tab.emoji} fallback="📁" className="text-xs" />
      <span>{tab.shortTitle}</span>

      {tab.badgeLabel ? (
        <span
          title={tab.badgeLabel}
          className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border leading-tight font-mono ${
            isSelected
              ? 'bg-orange-500 text-white border-orange-400'
              : 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30'
          }`}
        >
          {tab.badgeLabel}
        </span>
      ) : tab.isHot ? (
        <span
          title="Ежедневная синхронизация (горячая лента)"
          className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border leading-tight ${
            isSelected
              ? 'bg-orange-500 text-white border-orange-400'
              : 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30'
          }`}
        >
          🔥 Daily
        </span>
      ) : null}

      {/* Note Count Badge */}
      <span
        className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full leading-tight font-medium ${
          isSelected
            ? 'bg-white/20 text-white'
            : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
        }`}
      >
        {tab.count}
      </span>

      {/* Edit Mode Pencil Badge */}
      {isEditMode && (
        <span
          className="absolute -top-1 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs pointer-events-none z-10 ring-1 ring-white dark:ring-[#18222d]"
          title="Редактировать параметры ленты"
        >
          <Pencil className="w-2 h-2" />
        </span>
      )}
    </button>
  );
};

export const FeedCategoryTabsRow: React.FC<FeedCategoryTabsRowProps> = ({
  streamSource,
  activeMode,
  tabs,
  activeFeedSlug,
  isAllSelected,
  onSelectFeed,
  totalCount,
  isEditMode = false,
  onEditFeed,
  onAddFeed,
  onReorderTabs,
}) => {
  const isAll = streamSource === 'all';
  const isPrivateFeeds = streamSource === 'private_feeds';
  const isItDev = streamSource === 'it_dev' || streamSource === 'spark' || streamSource === 'dev';
  const isSeasons = streamSource === 'seasons';
  const isEntertainment = streamSource === 'entertainment';
  const isHolidays = streamSource === 'holidays' || streamSource === 'classic';

  const tagsFilter = activeMode?.filterConfig?.tags;
  const isTagSandbox = tagsFilter && tagsFilter.length > 0;

  const allLabel = isAll
    ? 'Все публикации'
    : isPrivateFeeds
    ? 'Все приватные'
    : isTagSandbox
    ? `Все (${tagsFilter.map((t) => `#${t}`).join(' ')})`
    : isItDev
    ? 'Все IT потоки'
    : isSeasons
    ? 'Все хроники Seasons'
    : isEntertainment
    ? 'Все релизы'
    : isHolidays
    ? 'Все праздники'
    : activeMode?.label
    ? `Все ${activeMode.label}`
    : 'Все каналы';

  const allEmoji = isTagSandbox
    ? activeMode?.emoji || '📥'
    : isAll
    ? '🌐'
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
    : activeMode?.emoji || '📡';

  const activeTabWithSubtopics = tabs.find(
    (t) =>
      t.subtopics &&
      t.subtopics.length > 0 &&
      (activeFeedSlug === t.slug ||
        (t.slug === 'spark-changelogsfeed' && (activeFeedSlug === 'changelogs' || activeFeedSlug === 'changelog')) ||
        (t.slug === 'spark-notebooklmai' && (activeFeedSlug === 'notebooklm' || activeFeedSlug === 'notebooklmai')) ||
        t.subtopics.some(
          (s) =>
            s.slug === activeFeedSlug ||
            s.subfolder === activeFeedSlug ||
            (s.subfolder && activeFeedSlug?.endsWith(`-${s.subfolder}`))
        ))
  );

  const activeTabRef = useRef<HTMLButtonElement | null>(null);
  const activeSubtopicRef = useRef<HTMLButtonElement | null>(null);
  const isDraggingRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragCancel = () => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);

    const { active, over } = event;
    if (!over || active.id === over.id || !onReorderTabs) return;

    const oldIndex = tabs.findIndex((t) => (t.id || t.slug) === active.id);
    const newIndex = tabs.findIndex((t) => (t.id || t.slug) === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(tabs, oldIndex, newIndex);
      onReorderTabs(reordered);
    }
  };

  const itemIds = React.useMemo(() => tabs.map((t) => t.id || t.slug), [tabs]);

  // Auto-scroll horizontal row smoothly to the selected feed tab
  useEffect(() => {
    if (activeFeedSlug && activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeFeedSlug, streamSource]);

  // Auto-scroll horizontal subtopics row smoothly to the selected subtopic
  useEffect(() => {
    if (activeFeedSlug && activeSubtopicRef.current) {
      activeSubtopicRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeFeedSlug]);

  return (
    <div className="space-y-1.5 w-full">
      {/* Thematic Tabs Row */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto overflow-y-hidden pt-2.5 pb-1.5 px-1 no-scrollbar touch-scroll -mt-1">
        {/* All Channels Option */}
        <button
          type="button"
          onClick={() => onSelectFeed(undefined)}
          className={`relative group shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150 select-none ${
            isAllSelected
              ? 'bg-[#2481cc] text-white border-[#2481cc] shadow-xs font-medium'
              : 'bg-white/90 dark:bg-[#18222d]/90 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:border-[#2481cc]/40 dark:hover:border-white/25 hover:bg-slate-50 dark:hover:bg-[#1f2b38]'
          }`}
        >
          <SymbolIcon icon={allEmoji} fallback="📡" className="text-xs" />
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

        {/* Individual Thematic Feed Tabs with DnD Sortable Support */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={itemIds} strategy={horizontalListSortingStrategy}>
            {tabs.map((tab) => {
              const isSelected =
                activeFeedSlug === tab.slug ||
                (tab.slug === 'spark-changelogsfeed' && (activeFeedSlug === 'changelogs' || activeFeedSlug === 'changelog')) ||
                (tab.slug === 'spark-notebooklmai' && (activeFeedSlug === 'notebooklm' || activeFeedSlug === 'notebooklmai')) ||
                Boolean(
                  tab.subtopics &&
                    tab.subtopics.some(
                      (s) =>
                        s.slug === activeFeedSlug ||
                        s.subfolder === activeFeedSlug ||
                        (s.subfolder && activeFeedSlug?.endsWith(`-${s.subfolder}`))
                    )
                );

              const handleClick = () => {
                if (isDraggingRef.current) return;
                if (isEditMode && onEditFeed) {
                  onEditFeed(tab);
                } else {
                  onSelectFeed(tab.slug);
                }
              };

              return (
                <SortableCategoryTabItem
                  key={tab.id || tab.slug}
                  tab={tab}
                  isSelected={isSelected}
                  isEditMode={isEditMode}
                  onClick={handleClick}
                  activeTabRef={isSelected ? activeTabRef : undefined}
                />
              );
            })}
          </SortableContext>
        </DndContext>

        {/* Clear filter button (only in normal mode when filtered) */}
        {!isEditMode && !isAllSelected && (
          <button
            type="button"
            onClick={() => onSelectFeed(undefined)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
            title="Сбросить фильтр папок"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Add New Feed Chip (Permanently accessible when adding feeds is supported) */}
        {onAddFeed && (
          <button
            type="button"
            onClick={onAddFeed}
            className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              isEditMode
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-dashed border-amber-500/40 hover:border-amber-500'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-dashed border-slate-300 dark:border-white/20 hover:border-[#2481cc] hover:text-[#2481cc] dark:hover:text-[#64b5f6]'
            }`}
            title="Создать новую ленту / фид"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Фид лента</span>
          </button>
        )}
      </div>

      {/* Subtopics Row (e.g. for Changelogs) */}
      {streamSource !== 'telegram' && activeTabWithSubtopics && activeTabWithSubtopics.subtopics && activeTabWithSubtopics.subtopics.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar touch-scroll pl-2 sm:pl-3 border-l-2 border-[#2481cc]/40 dark:border-[#2481cc]/50 my-0.5 animate-fadeIn">
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1 font-semibold">
            <span>🏷️</span>
            <span>Подтемы:</span>
          </span>

          <button
            type="button"
            onClick={() => onSelectFeed(activeTabWithSubtopics.slug)}
            className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors select-none ${
              activeFeedSlug === activeTabWithSubtopics.slug ||
              (activeTabWithSubtopics.slug === 'spark-changelogsfeed' && (activeFeedSlug === 'changelogs' || activeFeedSlug === 'changelog')) ||
              (activeTabWithSubtopics.slug === 'spark-notebooklmai' && (activeFeedSlug === 'notebooklm' || activeFeedSlug === 'notebooklmai'))
                ? 'bg-[#2481cc] text-white shadow-xs font-medium'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
            }`}
          >
            <span>Все {activeTabWithSubtopics.shortTitle}</span>
            <span className="font-mono text-[9px] opacity-80">
              {activeTabWithSubtopics.count}
            </span>
          </button>

          {activeTabWithSubtopics.subtopics.map((sub) => {
            const isSubSelected =
              activeFeedSlug === sub.slug ||
              (sub.subfolder && activeFeedSlug?.endsWith(`-${sub.subfolder}`));
            return (
              <button
                key={sub.id}
                ref={isSubSelected ? activeSubtopicRef : undefined}
                type="button"
                onClick={() => onSelectFeed(sub.slug)}
                className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors select-none ${
                  isSubSelected
                    ? 'bg-[#2481cc] text-white shadow-xs font-medium'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                <SymbolIcon icon={sub.emoji} fallback="📁" className="text-xs" />
                <span>{sub.title}</span>
                <span className="font-mono text-[9px] opacity-80">
                  {sub.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
