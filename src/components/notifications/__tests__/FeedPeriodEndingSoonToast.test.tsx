import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedPeriodEndingSoonToast } from '../FeedPeriodEndingSoonToast';
import { PeriodItem } from '../../../utils/periods';

describe('FeedPeriodEndingSoonToast', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  const mkPeriod = (over: Partial<PeriodItem> = {}): PeriodItem => ({
    id: 'p-wow',
    title: 'World of Warcraft: Forever Beta',
    emoji: '⚔️',
    color: '#f59e0b',
    startDate: '2026-10-15T00:00:00',
    endDate: '2026-11-03T12:00:00',
    status: 'active',
    isEndingSoon: true,
    progressPercent: 95,
    timeRemainingText: '18 ч.',
    hashtags: ['wow'],
    rawNote: {} as any,
    ...over,
  });

  it('renders notification when an active period is ending soon', () => {
    const onSelect = vi.fn();
    render(
      <FeedPeriodEndingSoonToast
        periods={[mkPeriod()]}
        onSelectPeriod={onSelect}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('World of Warcraft: Forever Beta')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('Осталось 18 ч.')).toBeInTheDocument();
  });

  it('clicking action button calls onSelectPeriod and dismisses', () => {
    const onSelect = vi.fn();
    render(
      <FeedPeriodEndingSoonToast
        periods={[mkPeriod()]}
        onSelectPeriod={onSelect}
      />
    );

    fireEvent.click(screen.getByText('К материалам'));
    expect(onSelect).toHaveBeenCalledWith('p-wow');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('clicking close button dismisses and sets sessionStorage', () => {
    const onSelect = vi.fn();
    render(
      <FeedPeriodEndingSoonToast
        periods={[mkPeriod()]}
        onSelectPeriod={onSelect}
      />
    );

    fireEvent.click(screen.getByLabelText('Закрыть уведомление'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('lemon_dismissed_period_ending_p-wow')).toBe('1');
  });

  it('does not render if period is not ending soon or already finished', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <FeedPeriodEndingSoonToast
        periods={[mkPeriod({ isEndingSoon: false })]}
        onSelectPeriod={onSelect}
      />
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    rerender(
      <FeedPeriodEndingSoonToast
        periods={[mkPeriod({ status: 'finished' })]}
        onSelectPeriod={onSelect}
      />
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
