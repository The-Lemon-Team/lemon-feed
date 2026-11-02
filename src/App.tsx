import React, { useState, useCallback } from 'react';
import { useFeedRouter } from './utils/feedRouter';
import { useFeedAuthSync } from './hooks/useFeedAuthSync';
import { useFeedTheme } from './hooks/useFeedTheme';
import { useFeedAppModeSync } from './hooks/useFeedAppModeSync';
import { useFeedData } from './hooks/useFeedData';
import { useFeedSourceTabs } from './hooks/useFeedSourceTabs';
import { useFeedFilters } from './hooks/useFeedFilters';
import { useFeedItemsPipeline } from './hooks/useFeedItemsPipeline';
import { useFeedModalsState } from './hooks/useFeedModalsState';
import { FeedToolbar } from './components/FeedToolbar';
import { FeedPeriodActiveBanner } from './components/toolbar/FeedPeriodActiveBanner';
import { FeedActivitiesMobileCarousel } from './components/activities/FeedActivitiesMobileCarousel';
import { FeedStreamView } from './components/FeedStreamView';
import { FeedDesktopRail } from './components/FeedDesktopRail';
import { FeedCategoriesSheet } from './components/navigation/FeedCategoriesSheet';
import { FeedModals } from './components/FeedModals';
import { FeedBottomNav } from './components/FeedBottomNav';
import { FeedPeriodEndingSoonToast } from './components/notifications/FeedPeriodEndingSoonToast';
import { PinnedNotesDock } from './components/workspace/PinnedNotesDock';
import { navigateToHostCalendar, navigateToHostTimeline } from './utils/hostNavigation';

export const App: React.FC = () => {
  const {
    streamSource,
    selectedFeedSlug,
    layoutMode,
    isEmbed,
    noteId,
    setStreamSource,
    setSelectedFeedSlug,
    toggleLayoutMode,
    openNote,
    closeNote,
  } = useFeedRouter();

  // Synchronize authentication token and session from parent host via postMessage
  useFeedAuthSync(isEmbed);

  // Theme (Dark / Light)
  const { isDarkMode, toggleTheme } = useFeedTheme();

  // App Runtime Mode ('dev' | 'staging' | 'public') & Edit Mode
  const {
    appMode,
    isPublicMode,
    isEditMode,
    handleSetAppMode,
    handleToggleEditMode,
  } = useFeedAppModeSync(isEmbed);

  // Base Data Fetching & Normalization
  const {
    rawNotes,
    allMappedNotes,
    notes,
    allFeeds,
    isLoading,
    refetch,
    isRefetching,
    allPeriods,
  } = useFeedData(appMode);

  // Source Modes & Tabs Management
  const {
    visibleSourceModes,
    activeAdapter,
    activeTabs,
    activeTabObj,
    editingSourceTab,
    isSourceTabModalOpen,
    handleOpenEditSourceTab,
    handleOpenAddSourceTab,
    handleCloseSourceTabModal,
    handleSaveSourceTab,
    handleDeleteSourceTab,
    editingFeedTab,
    editingDbFeed,
    isFeedEntityModalOpen,
    handleOpenEditFeed,
    handleOpenAddFeed,
    handleCloseFeedEntityModal,
  } = useFeedSourceTabs({
    streamSource,
    setStreamSource,
    selectedFeedSlug,
    setSelectedFeedSlug,
    isPublicMode,
    appMode,
    allFeeds,
    notes,
    isLoading,
  });

  // Mobile navigation active tab
  const [activeMobileNav, setActiveMobileNav] = useState<'stream' | 'categories' | 'search'>('stream');

  // Filters (Search, Month, Period, Horizon, Unassigned)
  const {
    searchQuery,
    setSearchQuery,
    deferredSearchQuery,
    selectedMonth,
    isMonthFilterActive,
    filterUnassignedOnly,
    setFilterUnassignedOnly,
    feedHorizon,
    handleSetHorizon,
    selectedPeriodId,
    periodFilterMode,
    setPeriodFilterMode,
    handleSelectPeriod,
    handleSelectTag,
    handleSelectFeed,
    handlePrevMonth,
    handleNextMonth,
    handleSelectMonth,
    handleResetMonthFilter,
    handleToday,
  } = useFeedFilters({
    allPeriods,
    setSelectedFeedSlug,
    onAfterSelectFeed: () => setActiveMobileNav('stream'),
  });

  // Feed Items Pipeline (Adaptation, Filtering, Pagination, Tag & Feed Aggregation)
  const {
    allAvailableFeeds,
    allAvailableHashtags,
    selectedPeriod,
    activeChannelPeriods,
    feedItems,
    visibleFeedItems,
    totalCount,
    upcomingCount,
    availableTags,
    visibleCount,
    loadMoreRef,
  } = useFeedItemsPipeline({
    notes,
    rawNotes,
    allFeeds,
    allPeriods,
    refetch,
    streamSource,
    selectedFeedSlug,
    deferredSearchQuery,
    isMonthFilterActive,
    selectedMonth,
    filterUnassignedOnly,
    selectedPeriodId,
    periodFilterMode,
    feedHorizon,
    activeAdapter,
  });

  // Modals & Moderation State
  const {
    selectedDetailItem,
    editingItem,
    isCreateNoteOpen,
    aiCoverItem,
    aiCoverTemplateId,
    isLemonSeasonsModalOpen,
    isAnyModalOpen,
    isMutating,
    handleOpenDetail,
    handleOpenNoteById,
    handleCloseDetail,
    handleOpenEdit,
    handleCloseEdit,
    handleOpenCreateNote,
    handleCloseCreateNote,
    handleOpenAiCover,
    handleCloseAiCover,
    handleOpenLemonSeasons,
    handleCloseLemonSeasons,
    handleAiCoverApplied,
    handleApprovePublish,
    handleUnpublishToStaging,
    handleReturnToPrivate,
  } = useFeedModalsState({
    noteId,
    openNote,
    closeNote,
    allMappedNotes,
    activeAdapter,
    isPublicMode,
    appMode,
    refetch,
    isSourceTabModalOpen,
    isFeedEntityModalOpen,
  });

  const handleSelectSource = useCallback(
    (mode: any) => {
      setStreamSource(mode);
      setSelectedFeedSlug(undefined);
    },
    [setStreamSource, setSelectedFeedSlug]
  );

  const isPublicOnly = isPublicMode || appMode === 'public';

  return (
    <div
      className={`min-h-screen bg-[#f8fafc] dark:bg-[#0e1621] text-slate-800 dark:text-[#e2e2e2] flex flex-col transition-colors w-full max-w-full overflow-x-hidden ${
        isEmbed ? 'pb-4' : 'pb-28 sm:pb-8'
      }`}
    >
      <main className="flex-1 max-w-5xl xl:max-w-6xl mx-auto w-full min-w-0 px-3 py-4 sm:px-5 sm:py-5 space-y-4">
        {/* Unified Top Toolbar */}
        <FeedToolbar
          streamSource={streamSource}
          onSetStreamSource={handleSelectSource}
          tabs={activeTabs}
          activeFeedSlug={selectedFeedSlug}
          isAllSelected={!selectedFeedSlug}
          onSelectFeed={handleSelectFeed}
          totalCount={totalCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedMonth={selectedMonth}
          isMonthFilterActive={isMonthFilterActive}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSelectMonth={handleSelectMonth}
          onResetMonthFilter={handleResetMonthFilter}
          onToday={handleToday}
          horizon={feedHorizon}
          onChangeHorizon={handleSetHorizon}
          upcomingCount={upcomingCount}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onRefresh={() => refetch()}
          isRefreshing={isRefetching}
          onOpenLemonSeasons={handleOpenLemonSeasons}
          onNavigateToCalendar={() => navigateToHostCalendar(isEmbed)}
          onNavigateToTimeline={() => navigateToHostTimeline(isEmbed)}
          onCreateNote={!isPublicOnly ? handleOpenCreateNote : undefined}
          layoutMode={layoutMode}
          onToggleLayoutMode={toggleLayoutMode}
          appMode={appMode}
          onSetAppMode={handleSetAppMode}
          isPublicMode={isPublicMode}
          filterUnassigned={filterUnassignedOnly}
          onToggleFilterUnassigned={() => setFilterUnassignedOnly((prev) => !prev)}
          isEditMode={isEditMode}
          onToggleEditMode={handleToggleEditMode}
          sourceModes={visibleSourceModes}
          onEditSourceTab={handleOpenEditSourceTab}
          onAddSourceTab={handleOpenAddSourceTab}
          onEditFeed={handleOpenEditFeed}
          onAddFeed={handleOpenAddFeed}
        />

        {/* Active Period Banner */}
        {selectedPeriod && (
          <FeedPeriodActiveBanner
            period={selectedPeriod}
            mode={periodFilterMode}
            onChangeMode={setPeriodFilterMode}
            onClearPeriod={() => handleSelectPeriod(undefined)}
            totalPeriodNotesCount={feedItems.length}
            onOpenNoteDetail={handleOpenNoteById}
          />
        )}

        {/* Mobile Horizontal Activities Carousel */}
        {activeChannelPeriods.length > 0 && (
          <FeedActivitiesMobileCarousel
            periods={activeChannelPeriods}
            selectedPeriodId={selectedPeriodId}
            onSelectPeriod={handleSelectPeriod}
          />
        )}

        {/* Responsive Body: Stream-only or Split layout with desktop rail */}
        <div
          className={`flex flex-col ${
            layoutMode === 'split' ? 'md:flex-row gap-5 items-start' : 'gap-4 items-center'
          } w-full`}
        >
          {/* Feed Stream Component */}
          <FeedStreamView
            streamSource={streamSource}
            onSetStreamSource={handleSelectSource}
            activeMode={visibleSourceModes.find((m) => m.id === streamSource)}
            onEditSourceTab={handleOpenEditSourceTab}
            feedItems={feedItems}
            visibleFeedItems={visibleFeedItems}
            selectedFeedSlug={selectedFeedSlug}
            onSelectFeed={handleSelectFeed}
            isLoading={isLoading}
            searchQuery={searchQuery}
            isMonthFilterActive={isMonthFilterActive}
            selectedMonth={selectedMonth}
            onResetMonthFilter={handleResetMonthFilter}
            onOpenDetail={handleOpenDetail}
            onSelectTag={handleSelectTag}
            onCreateNote={!isPublicOnly ? handleOpenCreateNote : undefined}
            onEditNote={!isPublicOnly ? handleOpenEdit : undefined}
            onAiCover={!isPublicOnly ? handleOpenAiCover : undefined}
            visibleCount={visibleCount}
            loadMoreRef={loadMoreRef}
            layoutMode={layoutMode}
            appMode={appMode}
            onApprovePublish={!isPublicOnly ? handleApprovePublish : undefined}
            onUnpublishToStaging={!isPublicOnly ? handleUnpublishToStaging : undefined}
            onReturnToPrivate={!isPublicOnly ? handleReturnToPrivate : undefined}
            isMutating={isMutating}
            allPeriods={allPeriods}
            selectedPeriodId={selectedPeriodId}
            onSelectPeriod={handleSelectPeriod}
          />

          {/* Right Desktop Rail */}
          {layoutMode === 'split' && (
            <FeedDesktopRail
              sourceType={streamSource}
              activeMode={visibleSourceModes.find((m) => m.id === streamSource)}
              activeFeed={activeTabObj}
              tabs={activeTabs}
              selectedFeedSlug={selectedFeedSlug}
              onSelectFeed={handleSelectFeed}
              totalCount={totalCount}
              availableTags={availableTags}
              onSelectTag={handleSelectTag}
              onOpenLemonSeasons={handleOpenLemonSeasons}
              onNavigateToCalendar={() => navigateToHostCalendar(isEmbed)}
              currentMonthName={selectedMonth.format('MMMM YYYY')}
              isPublicMode={isPublicMode}
              onCreateNote={!isPublicOnly ? handleOpenCreateNote : undefined}
              periods={activeChannelPeriods}
              selectedPeriodId={selectedPeriodId}
              onSelectPeriod={handleSelectPeriod}
            />
          )}
        </div>
      </main>

      {/* Mobile Categories Bottom Sheet */}
      <FeedCategoriesSheet
        isOpen={activeMobileNav === 'categories'}
        onClose={() => setActiveMobileNav('stream')}
        activeTabs={activeTabs}
        selectedFeedSlug={selectedFeedSlug}
        onSelectFeed={handleSelectFeed}
        totalCount={totalCount}
      />

      {/* Lazy Modals */}
      <FeedModals
        selectedDetailItem={selectedDetailItem}
        onCloseDetail={handleCloseDetail}
        onSelectTag={handleSelectTag}
        onOpenNoteById={handleOpenNoteById}
        editingItem={editingItem}
        onOpenEdit={handleOpenEdit}
        onCloseEdit={handleCloseEdit}
        isCreateNoteOpen={isCreateNoteOpen}
        onCloseCreateNote={handleCloseCreateNote}
        selectedFeedSlug={selectedFeedSlug}
        defaultDate={selectedMonth.format('YYYY-MM-DD')}
        appMode={appMode}
        isPublicMode={isPublicMode}
        aiCoverItem={aiCoverItem}
        aiCoverTemplateId={aiCoverTemplateId}
        onOpenAiCover={handleOpenAiCover}
        onCloseAiCover={handleCloseAiCover}
        onAiCoverApplied={handleAiCoverApplied}
        isLemonSeasonsModalOpen={isLemonSeasonsModalOpen}
        onCloseLemonSeasons={handleCloseLemonSeasons}
        editingFeedTab={editingFeedTab}
        editingDbFeed={editingDbFeed}
        isFeedEntityModalOpen={isFeedEntityModalOpen}
        onCloseFeedEntityModal={handleCloseFeedEntityModal}
        editingSourceTab={editingSourceTab}
        isSourceTabModalOpen={isSourceTabModalOpen}
        onCloseSourceTabModal={handleCloseSourceTabModal}
        onSaveSourceTab={handleSaveSourceTab}
        onDeleteSourceTab={handleDeleteSourceTab}
        allAvailableFeeds={allAvailableFeeds}
        allAvailableHashtags={allAvailableHashtags}
        onRefetch={refetch}
      />

      {/* Mobile Bottom Navigation Bar */}
      <FeedBottomNav
        activeTab={activeMobileNav}
        onSelectTab={(tab) => {
          if (tab === 'search') {
            setActiveMobileNav('stream');
          } else {
            setActiveMobileNav(tab);
          }
        }}
        onOpenCalendar={() => navigateToHostCalendar(isEmbed)}
        onOpenLemonSeasons={handleOpenLemonSeasons}
        onCreateNote={!isPublicOnly ? handleOpenCreateNote : undefined}
        isPublicMode={isPublicMode}
      />

      {/* Floating Period Ending Soon Notification */}
      <FeedPeriodEndingSoonToast
        periods={allPeriods}
        selectedPeriodId={selectedPeriodId}
        onSelectPeriod={handleSelectPeriod}
      />

      {/* Floating Workspace Pinned Notes & Period Tracker Dock */}
      <PinnedNotesDock
        onOpenNoteDetail={handleOpenNoteById}
        onSelectPeriod={handleSelectPeriod}
        disableEscClose={isAnyModalOpen}
      />
    </div>
  );
};
