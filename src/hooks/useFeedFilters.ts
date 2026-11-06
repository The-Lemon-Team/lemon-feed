import { useState, useCallback, useDeferredValue } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { FeedHorizon, PeriodFilterMode, PeriodItem } from '../utils/periods';

interface UseFeedFiltersOptions {
  allPeriods: PeriodItem[];
  setSelectedFeedSlug: (slug?: string | ((prev?: string) => string | undefined)) => void;
  onAfterSelectFeed?: () => void;
}

export function useFeedFilters({
  allPeriods,
  setSelectedFeedSlug,
  onAfterSelectFeed,
}: UseFeedFiltersOptions) {
  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Month navigation & filter
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const urlDate = sp.get('startDate') || sp.get('start');
      if (urlDate) {
        const parsed = dayjs(urlDate);
        if (parsed.isValid()) return parsed;
      }
    }
    return dayjs();
  });
  const [isMonthFilterActive, setIsMonthFilterActive] = useState(false);
  const [filterUnassignedOnly, setFilterUnassignedOnly] = useState(false);

  // Notes Privacy Contour ('public' | 'private' | 'all')
  const [notesPrivacy, setNotesPrivacy] = useState<'all' | 'public' | 'private'>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const urlP = (sp.get('notesPrivacy') || sp.get('privacy') || '').toLowerCase();
      if (urlP === 'private' || urlP === 'public' || urlP === 'all') {
        return urlP as 'all' | 'public' | 'private';
      }
      const saved = localStorage.getItem('lenta_notes_privacy')?.toLowerCase();
      if (saved === 'private' || saved === 'public' || saved === 'all') {
        return saved as 'all' | 'public' | 'private';
      }
    }
    return 'all';
  });

  const handleSetNotesPrivacy = useCallback((newPrivacy: 'all' | 'public' | 'private') => {
    setNotesPrivacy(newPrivacy);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lenta_notes_privacy', newPrivacy);
        const url = new URL(window.location.href);
        if (newPrivacy === 'all') {
          url.searchParams.delete('notesPrivacy');
          url.searchParams.delete('privacy');
        } else {
          url.searchParams.set('notesPrivacy', newPrivacy);
        }
        window.history.replaceState({}, '', url.toString());
      } catch (err) {
        console.warn('Failed to update URL notes privacy:', err);
      }
    }
  }, []);

  // Horizon State ('recent' = ⚡ Свежее, 'upcoming' = 🔔 Скоро)
  const [feedHorizon, setFeedHorizon] = useState<FeedHorizon>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const urlH = sp.get('horizon');
      if (urlH === 'upcoming' || urlH === 'recent') return urlH;
      const saved = localStorage.getItem('lenta_feed_horizon');
      if (saved === 'upcoming' || saved === 'recent') return saved as FeedHorizon;
    }
    return 'recent';
  });

  const handleSetHorizon = useCallback((newHorizon: FeedHorizon) => {
    setFeedHorizon(newHorizon);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lenta_feed_horizon', newHorizon);
        const url = new URL(window.location.href);
        if (newHorizon === 'upcoming') {
          url.searchParams.set('horizon', 'upcoming');
        } else {
          url.searchParams.delete('horizon');
        }
        window.history.replaceState({}, '', url.toString());
      } catch (err) {
        console.warn('Failed to update URL horizon:', err);
      }
    }
  }, []);

  // Selected Period state & filter mode ('bound' vs 'all')
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('period') || undefined;
    }
    return undefined;
  });
  const [periodFilterMode, setPeriodFilterMode] = useState<PeriodFilterMode>('bound');

  const handleSelectPeriod = useCallback(
    (periodId?: string) => {
      setSelectedPeriodId(periodId);
      setPeriodFilterMode('bound'); // Auto-reset to bound notes as per spec

      if (typeof window !== 'undefined') {
        try {
          const url = new URL(window.location.href);
          if (periodId) {
            url.searchParams.set('period', periodId);
          } else {
            url.searchParams.delete('period');
          }
          window.history.replaceState({}, '', url.toString());
        } catch {
          // ignore
        }
      }

      if (periodId) {
        const targetPeriod = allPeriods.find((p) => p.id === periodId);
        if (targetPeriod?.feedSlug) {
          setSelectedFeedSlug(targetPeriod.feedSlug);
        }
        if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
          try {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } catch {
            // ignore jsdom or unsupported environments
          }
        }
      }
    },
    [allPeriods, setSelectedFeedSlug]
  );

  const handleSelectTag = useCallback((tag: string) => {
    setSearchQuery(tag);
  }, []);

  const handleSelectFeed = useCallback(
    (slug?: string) => {
      setSelectedFeedSlug((prev) => (prev === slug ? undefined : slug));
      onAfterSelectFeed?.();
      if (searchQuery) {
        setSearchQuery('');
      }
    },
    [setSelectedFeedSlug, onAfterSelectFeed, searchQuery]
  );

  const handlePrevMonth = useCallback(() => {
    setSelectedMonth((prev) => prev.subtract(1, 'month'));
    setIsMonthFilterActive(true);
  }, []);

  const handleNextMonth = useCallback(() => {
    setSelectedMonth((prev) => prev.add(1, 'month'));
    setIsMonthFilterActive(true);
  }, []);

  const handleSelectMonth = useCallback((year: number, monthIndex: number) => {
    setSelectedMonth(dayjs().year(year).month(monthIndex));
    setIsMonthFilterActive(true);
  }, []);

  const handleResetMonthFilter = useCallback(() => {
    setIsMonthFilterActive(false);
  }, []);

  const handleToday = useCallback(() => {
    setSelectedMonth(dayjs());
    setIsMonthFilterActive(true);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    deferredSearchQuery,
    selectedMonth,
    setSelectedMonth,
    isMonthFilterActive,
    setIsMonthFilterActive,
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
  };
}
