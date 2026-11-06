import React from 'react';
import { FeedToolbarProps } from './toolbar/types';
import { FeedToolbarHeader } from './toolbar/FeedToolbarHeader';
import { FeedStreamSourceRow } from './toolbar/FeedStreamSourceRow';
import { FeedCategoryTabsRow } from './toolbar/FeedCategoryTabsRow';
import { FeedSearchBar } from './toolbar/FeedSearchBar';

export * from './toolbar/types';
export * from './toolbar/FeedToolbarHeader';
export * from './toolbar/FeedStreamSourceRow';
export * from './toolbar/FeedCategoryTabsRow';
export * from './toolbar/FeedSearchBar';

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
  horizon,
  onChangeHorizon,
  upcomingCount,
  isDarkMode,
  onToggleTheme,
  onCreateNote,
  onRefresh,
  isRefreshing,
  onOpenLemonSeasons,
  onNavigateToCalendar,
  onNavigateToTimeline,
  layoutMode = 'split',
  onToggleLayoutMode,
  appMode = 'dev',
  onSetAppMode,
  isPublicMode = false,
  notesPrivacy,
  onSetNotesPrivacy,
  filterUnassigned = false,
  onToggleFilterUnassigned,

  // Edit Mode Props
  isEditMode = false,
  onToggleEditMode,
  sourceModes,
  onEditSourceTab,
  onAddSourceTab,
  onReorderSourceModes,
  onEditFeed,
  onAddFeed,
  onReorderTabs,
}) => {
  return (
    <div className="relative z-20 shrink-0 w-full rounded-2xl bg-white/95 dark:bg-[#18222d]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] p-3 sm:p-4.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3 transition-colors select-none">
      {/* 1. Upper Header Row: Brand + Dev/Staging/Public + Edit Mode + Right Action Buttons */}
      <FeedToolbarHeader
        appMode={appMode}
        onSetAppMode={onSetAppMode}
        isPublicMode={isPublicMode}
        notesPrivacy={notesPrivacy}
        onSetNotesPrivacy={onSetNotesPrivacy}
        isEditMode={isEditMode}
        onToggleEditMode={onToggleEditMode}
        onCreateNote={onCreateNote}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
        layoutMode={layoutMode}
        onToggleLayoutMode={onToggleLayoutMode}
        onNavigateToTimeline={onNavigateToTimeline}
        onNavigateToCalendar={onNavigateToCalendar}
        onOpenLemonSeasons={onOpenLemonSeasons}
      />

      {/* 2. Stream Mode Switcher Row (All, IT & Dev, Seasons, Entertainment, Holidays, TG Live) */}
      <FeedStreamSourceRow
        streamSource={streamSource}
        onSetStreamSource={onSetStreamSource}
        sourceModes={sourceModes}
        isEditMode={isEditMode}
        onEditSourceTab={onEditSourceTab}
        onAddSourceTab={onAddSourceTab}
        onReorderSourceModes={onReorderSourceModes}
      />

      {/* 3. Thematic Tabs Row (Category & Folder chips) */}
      {streamSource !== 'telegram' && (
        <FeedCategoryTabsRow
          streamSource={streamSource}
          activeMode={sourceModes?.find((m) => m.id === streamSource)}
          tabs={tabs}
          activeFeedSlug={activeFeedSlug}
          isAllSelected={isAllSelected}
          onSelectFeed={onSelectFeed}
          totalCount={totalCount}
          isEditMode={isEditMode}
          onEditFeed={onEditFeed}
          onAddFeed={onAddFeed}
          onReorderTabs={onReorderTabs}
        />
      )}

      {/* 4. Search & Period Navigation Controls Toolbar */}
      <FeedSearchBar
        streamSource={streamSource}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedMonth={selectedMonth}
        isMonthFilterActive={isMonthFilterActive}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onSelectMonth={onSelectMonth}
        onResetMonthFilter={onResetMonthFilter}
        onToday={onToday}
        horizon={horizon}
        onChangeHorizon={onChangeHorizon}
        upcomingCount={upcomingCount}
        appMode={appMode}
        filterUnassigned={filterUnassigned}
        onToggleFilterUnassigned={onToggleFilterUnassigned}
      />
    </div>
  );
};
