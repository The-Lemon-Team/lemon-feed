import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFeedFilters } from '../useFeedFilters';

describe('useFeedFilters', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    window.scrollTo = vi.fn();
  });

  it('manages search query and deferred value', () => {
    const setSelectedFeedSlug = vi.fn();
    const { result } = renderHook(() =>
      useFeedFilters({
        allPeriods: [],
        setSelectedFeedSlug,
      })
    );

    expect(result.current.searchQuery).toBe('');

    act(() => {
      result.current.setSearchQuery('test tag');
    });

    expect(result.current.searchQuery).toBe('test tag');
  });

  it('manages month navigation and filter state', () => {
    const setSelectedFeedSlug = vi.fn();
    const { result } = renderHook(() =>
      useFeedFilters({
        allPeriods: [],
        setSelectedFeedSlug,
      })
    );

    const initialMonth = result.current.selectedMonth;

    act(() => {
      result.current.handleNextMonth();
    });

    expect(result.current.isMonthFilterActive).toBe(true);
    expect(result.current.selectedMonth.isAfter(initialMonth)).toBe(true);

    act(() => {
      result.current.handleResetMonthFilter();
    });

    expect(result.current.isMonthFilterActive).toBe(false);
  });

  it('handles horizon switching', () => {
    const setSelectedFeedSlug = vi.fn();
    const { result } = renderHook(() =>
      useFeedFilters({
        allPeriods: [],
        setSelectedFeedSlug,
      })
    );

    expect(result.current.feedHorizon).toBe('recent');

    act(() => {
      result.current.handleSetHorizon('upcoming');
    });

    expect(result.current.feedHorizon).toBe('upcoming');
    expect(localStorage.getItem('lenta_feed_horizon')).toBe('upcoming');
    expect(window.location.search).toContain('horizon=upcoming');
  });

  it('handles period selection and updates feed slug if matching period has feedSlug', () => {
    const setSelectedFeedSlug = vi.fn();
    const mockPeriod = {
      id: 'period-123',
      title: 'Dev Sprint',
      feedSlug: 'it-dev',
      emoji: '⚡',
      color: '#3b82f6',
      status: 'active' as const,
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      hashtags: ['dev'],
      rawNote: {} as any,
    };

    const { result } = renderHook(() =>
      useFeedFilters({
        allPeriods: [mockPeriod],
        setSelectedFeedSlug,
      })
    );

    act(() => {
      result.current.handleSelectPeriod('period-123');
    });

    expect(result.current.selectedPeriodId).toBe('period-123');
    expect(setSelectedFeedSlug).toHaveBeenCalledWith('it-dev');
  });
});
