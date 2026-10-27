import { FeedAdapter, FeedSourceMode } from './types';
import { AllStreamsFeedAdapter } from './allStreamsFeedAdapter';
import { ItDevFeedAdapter } from './itDevFeedAdapter';
import { SeasonsFeedAdapter } from './seasonsFeedAdapter';
import { EntertainmentFeedAdapter } from './entertainmentFeedAdapter';
import { HolidaysFeedAdapter } from './holidaysFeedAdapter';
import { TelegramFeedAdapter } from './telegramFeedAdapter';
import { GeneralFeedAdapter } from './generalFeedAdapter';
import { SparkFeedAdapter } from './sparkFeedAdapter';
import { DevFeedAdapter } from './devFeedAdapter';
import { ClassicFeedAdapter } from './classicFeedAdapter';

export * from './types';
export * from './allStreamsFeedAdapter';
export * from './itDevFeedAdapter';
export * from './seasonsFeedAdapter';
export * from './entertainmentFeedAdapter';
export * from './holidaysFeedAdapter';
export * from './telegramFeedAdapter';
export * from './generalFeedAdapter';
export * from './sparkFeedAdapter';
export * from './devFeedAdapter';
export * from './classicFeedAdapter';

export const FEED_ADAPTERS: Record<FeedSourceMode, FeedAdapter> = {
  all: AllStreamsFeedAdapter,
  it_dev: ItDevFeedAdapter,
  seasons: SeasonsFeedAdapter,
  entertainment: EntertainmentFeedAdapter,
  holidays: HolidaysFeedAdapter,
  telegram: TelegramFeedAdapter,

  // Backward-compatibility legacy aliases
  spark: ItDevFeedAdapter,
  dev: ItDevFeedAdapter,
  classic: HolidaysFeedAdapter,
  general: GeneralFeedAdapter,
};

export const ALL_FEED_SOURCES: FeedSourceMode[] = [
  'all',
  'it_dev',
  'seasons',
  'entertainment',
  'holidays',
  'telegram',
];
