import dayjs from 'dayjs';
import { FeedSourceMode, UnifiedFeedTab, FeedTabFilterConfig } from '../../adapters/feeds/types';
import { FeedAppRuntimeMode } from '../../utils/appMode';
import { FeedHorizon } from '../../utils/periods';

export interface FeedModeOption {
  id: FeedSourceMode | string;
  label: string;
  emoji: string;
  badge?: string;
  privacy?: 'public' | 'private';
  description?: string;
  filterConfig?: FeedTabFilterConfig;
  isBuiltin?: boolean;
}

export function resolveStreamPrivacy(mode?: FeedModeOption | string | null): 'public' | 'private' {
  if (!mode) return 'public';
  if (typeof mode === 'string') {
    if (
      mode === 'private_feeds' ||
      mode === 'personal_notes' ||
      mode === 'work_vault' ||
      mode === 'secure_vault' ||
      mode.startsWith('private')
    ) {
      return 'private';
    }
    const matched = DEFAULT_FEED_MODES.find((m) => m.id === mode);
    if (matched) return resolveStreamPrivacy(matched);
    return 'public';
  }
  if (mode.privacy) return mode.privacy;
  if (
    mode.filterConfig?.privacy === 'private' ||
    mode.id === 'private_feeds' ||
    mode.id === 'personal_notes' ||
    mode.id === 'work_vault' ||
    mode.id === 'secure_vault'
  ) {
    return 'private';
  }
  return 'public';
}

export const PUBLIC_STREAM_PRESETS: FeedModeOption[] = [
  { id: 'all', label: 'Все ленты', emoji: '🌐', privacy: 'public', isBuiltin: true },
  {
    id: 'it_dev',
    label: 'IT & Dev',
    emoji: '💻',
    privacy: 'public',
    description: 'IT-новости, релизы моделей, статьи с Хабра и AppSec',
    filterConfig: {
      privacy: 'public',
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
    privacy: 'public',
    description: 'Хроники Lemon Seasons, ежедневные логи, стратегия и майлстоуны',
    filterConfig: {
      privacy: 'public',
      feedSlugs: ['daily-logs', 'tech-strategy', 'product-milestones', 'community-stories'],
      tags: ['season', 'seasons', 'daily', 'strategy'],
      folderPaths: ['01_daily_logs/', 'seasons/'],
    },
  },
  {
    id: 'entertainment',
    label: 'Развлечения',
    emoji: '🍿',
    privacy: 'public',
    description: 'Киновселенная Marvel, игры, киноновинки и музыкальные релизы',
    filterConfig: {
      privacy: 'public',
      feedSlugs: ['marvel', 'cinema', 'films', 'games', 'music', 'my-music', 'my-films', 'my-movies'],
      tags: ['marvel', 'cinema', 'films', 'games', 'кино', 'игры', 'музыка'],
      folderPaths: ['entertainment/', 'myfilms/', 'MyFilms/'],
    },
  },
  {
    id: 'js_interview',
    label: 'JS Interview',
    emoji: '💡',
    privacy: 'public',
    description: 'Подготовка к собеседованиям по JavaScript, React, архитектуре и алгоритмам',
    filterConfig: {
      privacy: 'public',
      feedSlugs: [
        'daily-questions',
        'advanced-react',
        'advanced-reactx',
        'interesting-questions',
        'react',
        'javascript',
        'interview',
      ],
      tags: ['js', 'javascript', 'react', 'interview', 'questions'],
      folderPaths: ['interview/', 'questions/'],
    },
  },
  {
    id: 'holidays',
    label: 'Праздники',
    emoji: '🎉',
    privacy: 'public',
    description: 'Официальные, православные, международные и необычные праздники',
    filterConfig: {
      privacy: 'public',
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
    id: 'telegram',
    label: 'TG Live',
    emoji: '✈️',
    badge: 'live',
    privacy: 'public',
    description: 'Внешние папки и каналы из telegram-web-reader',
    isBuiltin: true,
  },
];

export const PRIVATE_STREAM_PRESETS: FeedModeOption[] = [
  {
    id: 'private_feeds',
    label: 'Все приватные',
    emoji: '🔮',
    privacy: 'private',
    description: 'Сводный хаб всех приватных заметок, лент и защищенного контура',
    isBuiltin: true,
    filterConfig: {
      privacy: 'private',
    },
  },
];

export const DEFAULT_FEED_MODES: FeedModeOption[] = [
  ...PUBLIC_STREAM_PRESETS,
  ...PRIVATE_STREAM_PRESETS,
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

  // Notes Privacy Contour ('public' | 'private' | 'all')
  notesPrivacy?: 'all' | 'public' | 'private';
  onSetNotesPrivacy?: (privacy: 'all' | 'public' | 'private') => void;

  filterUnassigned?: boolean;
  onToggleFilterUnassigned?: () => void;

  // Edit Mode Props
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
  sourceModes?: FeedModeOption[];
  onEditSourceTab?: (tab: FeedModeOption) => void;
  onAddSourceTab?: () => void;
  onReorderSourceModes?: (modes: FeedModeOption[]) => void;
  onEditFeed?: (tab: UnifiedFeedTab) => void;
  onAddFeed?: () => void;
  onReorderTabs?: (tabs: UnifiedFeedTab[]) => void;
}
