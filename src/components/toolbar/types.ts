import dayjs from 'dayjs';
import { FeedSourceMode, UnifiedFeedTab, FeedTabFilterConfig } from '../../adapters/feeds/types';
import { FeedAppRuntimeMode } from '../../utils/appMode';
import { FeedHorizon } from '../../utils/periods';

export interface FeedModeOption {
  id: FeedSourceMode | string;
  label: string;
  emoji: string;
  badge?: string;
  description?: string;
  filterConfig?: FeedTabFilterConfig;
  isBuiltin?: boolean;
}

export const DEFAULT_FEED_MODES: FeedModeOption[] = [
  { id: 'all', label: 'Все ленты', emoji: '🌐', isBuiltin: true },
  { id: 'it_dev', label: 'IT & Dev', emoji: '💻', isBuiltin: true },
  { id: 'seasons', label: 'Seasons', emoji: '🍋', isBuiltin: true },
  { id: 'entertainment', label: 'Развлечения', emoji: '🍿', isBuiltin: true },
  { id: 'holidays', label: 'Праздники', emoji: '🎉', isBuiltin: true },
  { id: 'telegram', label: 'TG Live', emoji: '✈️', badge: 'live', isBuiltin: true },
  {
    id: 'private_feeds',
    label: 'Private feeds',
    emoji: '🔮',
    description: 'Только приватные ленты и защищенный контур',
    filterConfig: { privacy: 'private' },
    isBuiltin: true,
  },
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

  horizon?: FeedHorizon;
  onChangeHorizon?: (horizon: FeedHorizon) => void;
  upcomingCount?: number;

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
