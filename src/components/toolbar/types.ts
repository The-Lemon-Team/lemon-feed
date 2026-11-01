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
  {
    id: 'it_dev',
    label: 'IT & Dev',
    emoji: '💻',
    description: 'IT-новости, релизы моделей, статьи с Хабра и AppSec',
    filterConfig: {
      feedSlugs: [
        'spark-ai',
        'spark-habr',
        'spark-changelogsfeed',
        'spark-notebooklmai',
        'spark-xakep',
        'spark-cyber-security',
        'spark-youtube-oneday',
      ],
      tags: ['ai', 'dev', 'habr', 'changelog', 'security'],
      folderPaths: ['spark/'],
    },
  },
  {
    id: 'seasons',
    label: 'Seasons',
    emoji: '🍋',
    description: 'Хроники Lemon Seasons, ежедневные логи, стратегия и майлстоуны',
    filterConfig: {
      feedSlugs: ['daily-logs', 'tech-strategy', 'product-milestones', 'community-stories'],
      tags: ['season', 'seasons', 'daily', 'strategy'],
      folderPaths: ['01_daily_logs/', 'seasons/'],
    },
  },
  {
    id: 'entertainment',
    label: 'Развлечения',
    emoji: '🍿',
    description: 'Киновселенная Marvel, игры, киноновинки и музыкальные релизы',
    filterConfig: {
      feedSlugs: ['marvel', 'cinema', 'games', 'music'],
      tags: ['marvel', 'cinema', 'games', 'кино', 'игры', 'музыка'],
      folderPaths: ['entertainment/'],
    },
  },
  {
    id: 'holidays',
    label: 'Праздники',
    emoji: '🎉',
    description: 'Официальные, православные, международные и необычные праздники',
    filterConfig: {
      feedSlugs: [
        'russian-holidays',
        'orthodox-holidays',
        'world-holidays',
        'fun-holidays',
        'slavic-holidays',
      ],
      tags: ['holiday', 'праздник'],
      folderPaths: ['holidays/', 'calendar/'],
    },
  },
  {
    id: 'private_feeds',
    label: 'Private feeds',
    emoji: '🔮',
    description: 'Только приватные ленты и защищенный контур',
    filterConfig: {
      privacy: 'private',
      folderPaths: ['private/'],
    },
  },
  {
    id: 'telegram',
    label: 'TG Live',
    emoji: '✈️',
    badge: 'live',
    description: 'Внешние папки и каналы из telegram-web-reader',
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
  onCreateNote?: () => void;
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
