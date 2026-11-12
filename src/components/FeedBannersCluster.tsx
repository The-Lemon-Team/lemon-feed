import React from 'react';
import { FeedPeriodActiveBanner } from './toolbar/FeedPeriodActiveBanner';
import { FeedActivitiesMobileCarousel } from './activities/FeedActivitiesMobileCarousel';
import { FeedPromotedPeriodSpotlight } from './notifications/FeedPromotedPeriodSpotlight';
import { FeedLiveUpdatesBanner } from './notifications/FeedLiveUpdatesBanner';
import { PeriodFilterMode, PeriodItem } from '../utils/periods';
import { ChannelUpdateGroup } from '../hooks/useFeedLiveEvents';

export interface FeedBannersClusterProps {
  selectedPeriod?: PeriodItem | null;
  periodFilterMode: PeriodFilterMode;
  onChangePeriodMode: (mode: PeriodFilterMode) => void;
  onClearPeriod: () => void;
  totalPeriodNotesCount: number;
  onOpenNoteById: (id: string) => void;
  activeChannelPeriods: PeriodItem[];
  selectedPeriodId?: string;
  onSelectPeriod: (id?: string) => void;
  selectedFeedSlug?: string;
  streamSource?: string;
  promotedPeriods: PeriodItem[];
  onSelectFeed: (slug?: string) => void;
  newEventsCount: number;
  groupedChannels: ChannelUpdateGroup[];
  onApplyLiveUpdates: () => void;
  onDismissLiveUpdates: () => void;
}

export const FeedBannersCluster: React.FC<FeedBannersClusterProps> = ({
  selectedPeriod,
  periodFilterMode,
  onChangePeriodMode,
  onClearPeriod,
  totalPeriodNotesCount,
  onOpenNoteById,
  activeChannelPeriods,
  selectedPeriodId,
  onSelectPeriod,
  selectedFeedSlug,
  streamSource,
  promotedPeriods,
  onSelectFeed,
  newEventsCount,
  groupedChannels,
  onApplyLiveUpdates,
  onDismissLiveUpdates,
}) => {
  return (
    <>
      {/* Active Period Banner */}
      {selectedPeriod && (
        <FeedPeriodActiveBanner
          period={selectedPeriod}
          mode={periodFilterMode}
          onChangeMode={onChangePeriodMode}
          onClearPeriod={onClearPeriod}
          totalPeriodNotesCount={totalPeriodNotesCount}
          onOpenNoteDetail={onOpenNoteById}
        />
      )}

      {/* Mobile Horizontal Activities Carousel */}
      {activeChannelPeriods.length > 0 && (
        <FeedActivitiesMobileCarousel
          periods={activeChannelPeriods}
          selectedPeriodId={selectedPeriodId}
          onSelectPeriod={onSelectPeriod}
        />
      )}

      {/* Promoted Period Spotlight (Broadcasted from the Bus) */}
      {!selectedFeedSlug && (streamSource === 'all' || streamSource === 'classic') && (
        <FeedPromotedPeriodSpotlight
          periods={promotedPeriods}
          onSelectFeed={onSelectFeed}
          onSelectPeriod={onSelectPeriod}
        />
      )}

      {/* Live Real-Time Channel-Grouped Updates Banner */}
      <FeedLiveUpdatesBanner
        newEventsCount={newEventsCount}
        groupedChannels={groupedChannels}
        onApply={onApplyLiveUpdates}
        onDismiss={onDismissLiveUpdates}
        onSelectChannel={(slug) => {
          onSelectFeed(slug);
          onApplyLiveUpdates();
        }}
      />
    </>
  );
};
