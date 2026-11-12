import React from 'react';
import { FeedCategoriesSheet } from './navigation/FeedCategoriesSheet';
import { FeedBottomNav } from './FeedBottomNav';
import { FeedPeriodEndingSoonToast } from './notifications/FeedPeriodEndingSoonToast';
import { PinnedNotesDock } from './workspace/PinnedNotesDock';

export interface FeedOverlaysClusterProps {
  activeMobileNav: 'stream' | 'categories' | 'search';
  onSelectMobileNav: (tab: 'stream' | 'categories' | 'search') => void;
  activeTabs: any[];
  selectedFeedSlug?: string;
  onSelectFeed: (slug?: string) => void;
  totalCount: number;
  onAddFeed?: () => void;
  isPublicMode: boolean;
  onOpenCalendar: () => void;
  onOpenLemonSeasons: () => void;
  onCreateNote?: () => void;
  periods: any[];
  selectedPeriodId?: string;
  onSelectPeriod: (id?: string) => void;
  onOpenNoteById: (id: string) => void;
  disableEscClose: boolean;
}

export const FeedOverlaysCluster: React.FC<FeedOverlaysClusterProps> = ({
  activeMobileNav,
  onSelectMobileNav,
  activeTabs,
  selectedFeedSlug,
  onSelectFeed,
  totalCount,
  onAddFeed,
  isPublicMode,
  onOpenCalendar,
  onOpenLemonSeasons,
  onCreateNote,
  periods,
  selectedPeriodId,
  onSelectPeriod,
  onOpenNoteById,
  disableEscClose,
}) => {
  return (
    <>
      {/* Mobile Categories Bottom Sheet */}
      <FeedCategoriesSheet
        isOpen={activeMobileNav === 'categories'}
        onClose={() => onSelectMobileNav('stream')}
        activeTabs={activeTabs}
        selectedFeedSlug={selectedFeedSlug}
        onSelectFeed={onSelectFeed}
        totalCount={totalCount}
        onAddFeed={onAddFeed}
        isPublicMode={isPublicMode}
      />

      {/* Mobile Bottom Navigation Bar */}
      <FeedBottomNav
        activeTab={activeMobileNav}
        onSelectTab={onSelectMobileNav}
        onOpenCalendar={onOpenCalendar}
        onOpenLemonSeasons={onOpenLemonSeasons}
        onCreateNote={onCreateNote}
        isPublicMode={isPublicMode}
      />

      {/* Floating Period Ending Soon Notification */}
      <FeedPeriodEndingSoonToast
        periods={periods}
        selectedPeriodId={selectedPeriodId}
        onSelectPeriod={onSelectPeriod}
      />

      {/* Floating Workspace Pinned Notes & Period Tracker Dock */}
      <PinnedNotesDock
        onOpenNoteDetail={onOpenNoteById}
        onSelectPeriod={onSelectPeriod}
        disableEscClose={disableEscClose}
      />
    </>
  );
};
