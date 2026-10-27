import dayjs from 'dayjs';
import { FeedSourceMode, UnifiedFeedTab } from '../../adapters/feeds/types';
import { FeedAppRuntimeMode } from '../../utils/appMode';

export interface FeedModeOption {
  id: FeedSourceMode | string;
  label: string;
  emoji: string;
  badge?: string;
  description?: string;
}

export const DEFAULT_FEED_MODES: FeedModeOption[] = [
  { id: 'all', label: 'Все ленты', emoji: '🌐' },
  { id: 'it_dev', label: 'IT & Dev', emoji: '💻' },
  { id: 'seasons', label: 'Seasons', emoji: '🍋' },
  { id: 'entertainment', label: 'Развлечения', emoji: '🍿' },
  { id: 'holidays', label: 'Праздники', emoji: '🎉' },
  { id: 'telegram', label: 'TG Live', emoji: '✈️', badge: 'live' },
];

export interface FeedToolbarProps {
  streamSource: FeedSourceMode;
  onSetStreamSource: (source: FeedSourceMode) => void;

  tabs: UnifiedFeedTab[];
  activeFeedSlug?: string;
  isAllSelected: boolean;
  onSelectFeed: (slug?: string) => void;
  totalCount: number;

  searchQuery: string;
  onSearchChange: (q: string) => void;

  selectedMonth: dayjs.Dayjs;
  isMonthFilterActive: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectMonth: (year: number, monthIndex: number) => void;
  onResetMonthFilter: () => void;
  onToday: () => void;

  isDarkMode: boolean;
  onToggleTheme: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenLemonSeasons?: () => void;
  onNavigateToCalendar?: () => void;
  onNavigateToTimeline?: () => void;

  layoutMode?: 'split' | 'stream';
  onToggleLayoutMode?: () => void;
  appMode?: FeedAppRuntimeMode;
  onSetAppMode?: (mode: FeedAppRuntimeMode) => void;
  isPublicMode?: boolean;
  filterUnassigned?: boolean;
  onToggleFilterUnassigned?: () => void;

  // Edit Mode Props
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
  sourceModes?: FeedModeOption[];
  onEditSourceTab?: (tab: FeedModeOption) => void;
  onAddSourceTab?: () => void;
  onEditFeed?: (tab: UnifiedFeedTab) => void;
  onAddFeed?: () => void;
}
