import React, { useState, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import { useFeedRouter } from '../utils/feedRouter';
import { useFeedAuthSync } from '../hooks/useFeedAuthSync';
import { useFeedAppModeSync } from '../hooks/useFeedAppModeSync';
import { useFeedData } from '../hooks/useFeedData';
import { useFeedPeriods } from '../api/queries';
import { useFeedSourceTabs } from '../hooks/useFeedSourceTabs';
import { useFeedFilters } from '../hooks/useFeedFilters';
import { useFeedItemsPipeline } from '../hooks/useFeedItemsPipeline';
import { useFeedModalsState } from '../hooks/useFeedModalsState';
import { FeedToolbar } from '../components/FeedToolbar';
import { FeedBannersCluster } from '../components/FeedBannersCluster';
import { FeedStreamView } from '../components/FeedStreamView';
import { FeedDesktopRail } from '../components/FeedDesktopRail';
import { FeedModals } from '../components/FeedModals';
import { FeedOverlaysCluster } from '../components/FeedOverlaysCluster';
import { useFeedLiveEvents } from '../hooks/useFeedLiveEvents';
import { navigateToHostCalendar, navigateToHostTimeline } from '../utils/hostNavigation';
import { FeedSourceMode } from '../adapters/feeds/types';

export interface FeedStandardViewProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  onOpenFeedBus: () => void;
}

export const FeedStandardView: React.FC<FeedStandardViewProps> = ({
  isDarkMode,
  toggleTheme,
  onOpenFeedBus,
}) => {
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
    navigateTo,
  } = useFeedRouter();

  // Synchronize authentication token and session from parent host via postMessage
  useFeedAuthSync(isEmbed);

  // App Runtime Mode ('dev' | 'staging' | 'public') & Edit Mode
  const {
    appMode,
    isPublicMode,
    isEditMode,
    handleSetAppMode,
    handleToggleEditMode,
  } = useFeedAppModeSync(isEmbed);

  // Dedicated Lightweight Periods / Channels Rail Data (Fast Boot)
  const { data: allPeriods = [] } = useFeedPeriods(appMode);

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
    notesPrivacy,
    handleSetNotesPrivacy,
  } = useFeedFilters({
    allPeriods,
    setSelectedFeedSlug,
    onAfterSelectFeed: () => setActiveMobileNav('stream'),
  });

  const startDateFrom = useMemo(
    () => (isMonthFilterActive ? selectedMonth.startOf('month').toISOString() : undefined),
    [isMonthFilterActive, selectedMonth]
  );
  const startDateTo = useMemo(
    () => (isMonthFilterActive ? selectedMonth.endOf('month').toISOString() : undefined),
    [isMonthFilterActive, selectedMonth]
  );

  // Base Data Fetching & Normalization (Server-Filtered Stream)
  const {
    rawNotes,
    allMappedNotes,
    notes,
    allFeeds,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    totalNotesCount,
  } = useFeedData({
    appMode,
    notesPrivacy,
    streamSource,
    selectedFeedSlug,
    search: deferredSearchQuery,
    startDateFrom,
    startDateTo,
  });

  const handleNoteDeleted = useCallback(() => {
    refetch();
  }, [refetch]);

  // Live SSE stream & channel-grouped real-time updates
  const {
    newEventsCount,
    groupedChannels,
    applyUpdates: handleApplyLiveUpdates,
    dismissUpdates: handleDismissLiveUpdates,
  } = useFeedLiveEvents();

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
    handleReorderSourceModes,
    editingFeedTab,
    editingDbFeed,
    isFeedEntityModalOpen,
    handleOpenEditFeed,
    handleOpenAddFeed,
    handleCloseFeedEntityModal,
    handleReorderCategoryTabs,
  } = useFeedSourceTabs({
    streamSource,
    setStreamSource,
    selectedFeedSlug,
    setSelectedFeedSlug,
    isPublicMode,
    appMode,
    notesPrivacy,
    allFeeds,
    notes,
    isLoading,
    isEditMode,
  });

  const handleContourPrivacyChange = useCallback(
    (newPrivacy: 'all' | 'public' | 'private') => {
      handleSetNotesPrivacy(newPrivacy);
      if (newPrivacy === 'private') {
        setStreamSource('private_feeds');
      } else if (newPrivacy === 'public' || newPrivacy === 'all') {
        setStreamSource('all');
      }
    },
    [handleSetNotesPrivacy, setStreamSource]
  );

  // Mobile navigation active tab
  const [activeMobileNav, setActiveMobileNav] = useState<'stream' | 'categories' | 'search'>('stream');

  // Feed Items Pipeline (Adaptation, Filtering, Pagination, Tag & Feed Aggregation)
  const {
    allAvailableFeeds,
    allAvailableHashtags,
    selectedPeriod,
    activeChannelPeriods,
    promotedPeriods,
    feedItems,
    visibleFeedItems,
    totalCount: pipelineTotalCount,
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
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    totalNotesCount,
  });

  const totalCount = useMemo(() => {
    const tabsSum = activeTabs.reduce((sum, t) => sum + (t.count || 0), 0);
    if (!selectedFeedSlug) {
      return Math.max(tabsSum, totalNotesCount, pipelineTotalCount);
    }
    return Math.max(tabsSum, pipelineTotalCount);
  }, [selectedFeedSlug, activeTabs, totalNotesCount, pipelineTotalCount]);

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
    },
    [setStreamSource]
  );

  const handleFeedSaved = useCallback(
    (savedFeed?: any, targetModeId?: string) => {
      if (savedFeed) {
        const targetId = (targetModeId || streamSource || 'all') as FeedSourceMode;
        if (targetId && targetId !== 'all') {
          const targetMode = visibleSourceModes.find((m) => m.id === targetId);
          if (targetMode) {
            const currentSlugs = targetMode.filterConfig?.feedSlugs || [];
            if (!currentSlugs.includes(savedFeed.slug)) {
              const updatedMode = {
                ...targetMode,
                filterConfig: {
                  ...targetMode.filterConfig,
                  feedSlugs: [...currentSlugs, savedFeed.slug],
                },
              };
              handleSaveSourceTab(updatedMode, savedFeed);
            }
          }
        }
        if (savedFeed.slug) {
          navigateTo(targetId, savedFeed.slug);
        } else {
          setStreamSource(targetId);
        }
      }
      refetch();
    },
    [streamSource, visibleSourceModes, handleSaveSourceTab, navigateTo, setStreamSource, refetch]
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
          onOpenFeedBus={onOpenFeedBus}
          onCreateNote={!isPublicOnly ? handleOpenCreateNote : undefined}
          layoutMode={layoutMode}
          onToggleLayoutMode={toggleLayoutMode}
          appMode={appMode}
          onSetAppMode={handleSetAppMode}
          notesPrivacy={notesPrivacy}
          onSetNotesPrivacy={handleContourPrivacyChange}
          isPublicMode={isPublicMode}
          filterUnassigned={filterUnassignedOnly}
          onToggleFilterUnassigned={() => setFilterUnassignedOnly((prev) => !prev)}
          isEditMode={isEditMode}
          onToggleEditMode={handleToggleEditMode}
          sourceModes={visibleSourceModes}
          onEditSourceTab={handleOpenEditSourceTab}
          onAddSourceTab={handleOpenAddSourceTab}
          onReorderSourceModes={handleReorderSourceModes}
          onEditFeed={handleOpenEditFeed}
          onAddFeed={handleOpenAddFeed}
          onReorderTabs={handleReorderCategoryTabs}
        />

        {/* Banners Cluster */}
        <FeedBannersCluster
          selectedPeriod={selectedPeriod}
          periodFilterMode={periodFilterMode}
          onChangePeriodMode={setPeriodFilterMode}
          onClearPeriod={() => handleSelectPeriod(undefined)}
          totalPeriodNotesCount={feedItems.length}
          onOpenNoteById={handleOpenNoteById}
          activeChannelPeriods={activeChannelPeriods}
          selectedPeriodId={selectedPeriodId}
          onSelectPeriod={handleSelectPeriod}
          selectedFeedSlug={selectedFeedSlug}
          streamSource={streamSource}
          promotedPeriods={promotedPeriods}
          onSelectFeed={handleSelectFeed}
          newEventsCount={newEventsCount}
          groupedChannels={groupedChannels}
          onApplyLiveUpdates={handleApplyLiveUpdates}
          onDismissLiveUpdates={handleDismissLiveUpdates}
        />

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
            onDeleteNote={!isPublicOnly ? handleNoteDeleted : undefined}
            onAiCover={!isPublicOnly ? handleOpenAiCover : undefined}
            visibleCount={visibleCount}
            loadMoreRef={loadMoreRef}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
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
              onAddFeed={!isPublicOnly ? handleOpenAddFeed : undefined}
              periods={activeChannelPeriods}
              selectedPeriodId={selectedPeriodId}
              onSelectPeriod={handleSelectPeriod}
            />
          )}
        </div>
      </main>

      {/* Modals & Dialogs */}
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
        activeStreamSource={streamSource}
        defaultDate={isMonthFilterActive ? selectedMonth.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')}
        appMode={appMode}
        notesPrivacy={notesPrivacy}
        isPublicMode={isPublicMode}
        aiCoverItem={aiCoverItem}
        aiCoverTemplateId={aiCoverTemplateId}
        onOpenAiCover={handleOpenAiCover}
        onCloseAiCover={handleCloseAiCover}
        onAiCoverApplied={handleAiCoverApplied}
        isLemonSeasonsModalOpen={isLemonSeasonsModalOpen}
        onCloseLemonSeasons={handleCloseLemonSeasons}
        onSelectFeed={handleSelectFeed}
        onSelectStreamSource={handleSelectSource}
        editingFeedTab={editingFeedTab}
        editingDbFeed={editingDbFeed}
        isFeedEntityModalOpen={isFeedEntityModalOpen}
        onCloseFeedEntityModal={handleCloseFeedEntityModal}
        onFeedSaved={handleFeedSaved}
        currentSourceMode={visibleSourceModes.find((m) => m.id === streamSource) || null}
        availableSourceModes={visibleSourceModes}
        editingSourceTab={editingSourceTab}
        isSourceTabModalOpen={isSourceTabModalOpen}
        onCloseSourceTabModal={handleCloseSourceTabModal}
        onSaveSourceTab={handleSaveSourceTab}
        onDeleteSourceTab={handleDeleteSourceTab}
        allAvailableFeeds={allAvailableFeeds}
        allAvailableHashtags={allAvailableHashtags}
        onRefetch={refetch}
      />

      {/* Floating & Mobile Overlays Cluster */}
      <FeedOverlaysCluster
        activeMobileNav={activeMobileNav}
        onSelectMobileNav={(tab) => {
          if (tab === 'search') {
            setActiveMobileNav('stream');
          } else {
            setActiveMobileNav(tab);
          }
        }}
        activeTabs={activeTabs}
        selectedFeedSlug={selectedFeedSlug}
        onSelectFeed={handleSelectFeed}
        totalCount={totalCount}
        onAddFeed={!isPublicOnly ? handleOpenAddFeed : undefined}
        isPublicMode={isPublicMode}
        onOpenCalendar={() => navigateToHostCalendar(isEmbed)}
        onOpenLemonSeasons={handleOpenLemonSeasons}
        onCreateNote={!isPublicOnly ? handleOpenCreateNote : undefined}
        periods={allPeriods}
        selectedPeriodId={selectedPeriodId}
        onSelectPeriod={handleSelectPeriod}
        onOpenNoteById={handleOpenNoteById}
        disableEscClose={isAnyModalOpen}
      />
    </div>
  );
};
