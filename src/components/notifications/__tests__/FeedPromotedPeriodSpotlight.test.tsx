import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedPromotedPeriodSpotlight } from '../FeedPromotedPeriodSpotlight';
import { PeriodItem } from '../../../utils/periods';

describe('FeedPromotedPeriodSpotlight', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  const mkPeriod = (over: Partial<PeriodItem> = {}): PeriodItem => ({
    id: 'p-wow',
    feedId: 'f-wow',
    feedSlug: 'spark-world-of-warcraft',
    feedTitle: 'World of Warcraft',
    title: 'Сезон бета-тестирования World of Warcraft: Forever',
    emoji: '⚔️',
    color: '#f59e0b',
    startDate: '2026-10-15T00:00:00',
    endDate: '2026-11-03T12:00:00',
    status: 'active',
    isEndingSoon: true,
    progressPercent: 95,
    timeRemainingText: '3 дн.',
    hashtags: ['wow'],
    scope: 'local',
    isPromoted: true,
    rawNote: {} as any,
    ...over,
  });

  it('renders promoted period banner on main stream', () => {
    const onSelectFeed = vi.fn();
    const onSelectPeriod = vi.fn();

    render(
      <FeedPromotedPeriodSpotlight
        periods={[mkPeriod()]}
        onSelectFeed={onSelectFeed}
        onSelectPeriod={onSelectPeriod}
      />
    );

    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByText('Анонс из шины')).toBeInTheDocument();
    expect(screen.getByText('В ленте World of Warcraft')).toBeInTheDocument();
    expect(screen.getByText('Сезон бета-тестирования World of Warcraft: Forever')).toBeInTheDocument();
    expect(screen.getByText('Осталось 3 дн.')).toBeInTheDocument();
  });

  it('does not render when period is not promoted', () => {
    const onSelectFeed = vi.fn();
    render(
      <FeedPromotedPeriodSpotlight
        periods={[mkPeriod({ isPromoted: false })]}
        onSelectFeed={onSelectFeed}
      />
    );

    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('clicking "Перейти в ленту" triggers navigation to source feed and period', () => {
    const onSelectFeed = vi.fn();
    const onSelectPeriod = vi.fn();

    render(
      <FeedPromotedPeriodSpotlight
        periods={[mkPeriod()]}
        onSelectFeed={onSelectFeed}
        onSelectPeriod={onSelectPeriod}
      />
    );

    fireEvent.click(screen.getByText('Перейти в ленту'));
    expect(onSelectFeed).toHaveBeenCalledWith('spark-world-of-warcraft');
    expect(onSelectPeriod).toHaveBeenCalledWith('p-wow');
  });

  it('clicking close button dismisses and persists to sessionStorage', () => {
    const onSelectFeed = vi.fn();

    render(
      <FeedPromotedPeriodSpotlight
        periods={[mkPeriod()]}
        onSelectFeed={onSelectFeed}
      />
    );

    fireEvent.click(screen.getByTitle('Скрыть анонс'));
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('lemon_dismissed_promoted_period_p-wow')).toBe('1');
  });
});
