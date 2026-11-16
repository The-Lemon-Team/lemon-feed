import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedBusView } from '../FeedBusView';
import { FeedBusSidebar } from '../components/FeedBusSidebar';
import { feedBusApi } from '../api/feedBusApi';
import { LemonModerationItem } from '@lenta/lemon-bus';

// Mock feedBusApi
vi.mock('../api/feedBusApi', () => ({
  feedBusApi: {
    getStats: vi.fn(),
    queryItems: vi.fn(),
    approveItem: vi.fn(),
    rejectItem: vi.fn(),
    updateItem: vi.fn(),
    batchApprove: vi.fn(),
    batchReject: vi.fn(),
    importWatcherItems: vi.fn(),
  },
}));

const mockItems: LemonModerationItem[] = [
  {
    id: 'candidate-1',
    title: 'Тестовая заметка от вотчера',
    summary: 'Краткая выжимка для тестирования модерации',
    rawContent: 'Полный текст новости',
    category: 'ai',
    feedSlug: 'spark-ai',
    type: 'SINGLE',
    privacy: 'public',
    author: 'DeepMind Blog',
    sourceType: 'LEMON_WATCHERS',
    origin: 'CODING_AGENT',
    sourceLink: 'https://deepmind.google/blog/test',
    resonanceScore: 85,
    hashtags: ['ai', 'frontier'],
    status: 'PENDING',
    deviceId: 'home-watcher',
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('FeedBusView (Dedicated Lemon-Bus Moderation Mode)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(feedBusApi.getStats).mockResolvedValue({
      totalCount: 1,
      pendingCount: 1,
      approvedCount: 0,
      rejectedCount: 0,
    });

    vi.mocked(feedBusApi.queryItems).mockResolvedValue({
      items: mockItems,
      total: 1,
      limit: 30,
      offset: 0,
      hasMore: false,
    });

    vi.mocked(feedBusApi.approveItem).mockResolvedValue({
      ok: true,
      action: 'APPROVED',
      item: { ...mockItems[0], status: 'APPROVED' },
      publishedEvent: {
        eventId: 'evt-1',
        entityType: 'NOTE',
        action: 'UPSERT',
        origin: 'CODING_AGENT',
        transportVia: 'cloud',
        deviceId: 'bus',
        privacy: 'public',
        timestamp: new Date().toISOString(),
        payload: { ...mockItems[0], status: 'PUBLISHED' },
      },
    });

    vi.mocked(feedBusApi.rejectItem).mockResolvedValue({
      ok: true,
      action: 'REJECTED',
      item: { ...mockItems[0], status: 'REJECTED', rejectReason: 'Дубликат' },
    });
  });

  it('renders the Feed-Bus header, branding and counters', async () => {
    const handleExit = vi.fn();
    render(
      <FeedBusView
        onExitFeedBus={handleExit}
        isDarkMode={false}
        toggleTheme={vi.fn()}
      />
    );

    expect(screen.getByText('FEED-BUS')).toBeInTheDocument();
    expect(screen.getByText('Шлюз модерации Lemon-Bus')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Тестовая заметка от вотчера')).toBeInTheDocument();
    });

    expect(screen.getByText('DeepMind Blog')).toBeInTheDocument();
    expect(screen.getByText('#ai')).toBeInTheDocument();
  });

  it('approves a note when the user clicks Одобрить', async () => {
    const handleExit = vi.fn();
    render(
      <FeedBusView
        onExitFeedBus={handleExit}
        isDarkMode={false}
        toggleTheme={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Тестовая заметка от вотчера')).toBeInTheDocument();
    });

    const approveBtn = screen.getByRole('button', { name: /Одобрить/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(feedBusApi.approveItem).toHaveBeenCalledWith('candidate-1', undefined, 'curator');
    });
  });

  it('opens rejection modal and closes on Escape (Rule #7)', async () => {
    const handleExit = vi.fn();
    render(
      <FeedBusView
        onExitFeedBus={handleExit}
        isDarkMode={false}
        toggleTheme={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Тестовая заметка от вотчера')).toBeInTheDocument();
    });

    const rejectBtn = screen.getByRole('button', { name: /Отклонить/i });
    fireEvent.click(rejectBtn);

    // Modal should be open
    expect(screen.getByText('Отклонение заметки')).toBeInTheDocument();
    expect(screen.getByText('Выберите причину отклонения:')).toBeInTheDocument();

    // Press Escape to dismiss (Modal keyboard rule)
    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Отклонение заметки')).not.toBeInTheDocument();
    });
  });

  it('exits Feed-Bus mode back to standard feed when button clicked', async () => {
    const handleExit = vi.fn();
    render(
      <FeedBusView
        onExitFeedBus={handleExit}
        isDarkMode={false}
        toggleTheme={vi.fn()}
      />
    );

    const exitBtn = screen.getByTitle('Вернуться к стандартной ленте');
    fireEvent.click(exitBtn);

    expect(handleExit).toHaveBeenCalledTimes(1);
  });

  it('switches status and category items smoothly in FeedBusSidebar', () => {
    const onStatusChange = vi.fn();
    const onCategoryChange = vi.fn();

    const { rerender } = render(
      <FeedBusSidebar
        selectedStatus="PENDING"
        onStatusChange={onStatusChange}
        selectedCategory="ALL"
        onCategoryChange={onCategoryChange}
        pendingCount={12}
      />
    );

    const pendingBtn = screen.getByRole('button', { name: /На модерации/i });
    const approvedBtn = screen.getByRole('button', { name: /Одобренные/i });
    const allCatBtn = screen.getByRole('button', { name: /Все категории/i });
    const aiCatBtn = screen.getByRole('button', { name: /AI & Нейросети/i });

    expect(pendingBtn).toHaveAttribute('aria-pressed', 'true');
    expect(approvedBtn).toHaveAttribute('aria-pressed', 'false');
    expect(allCatBtn).toHaveAttribute('aria-pressed', 'true');
    expect(aiCatBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('12')).toBeInTheDocument();

    fireEvent.click(approvedBtn);
    expect(onStatusChange).toHaveBeenCalledWith('APPROVED');

    fireEvent.click(aiCatBtn);
    expect(onCategoryChange).toHaveBeenCalledWith('ai');

    rerender(
      <FeedBusSidebar
        selectedStatus="APPROVED"
        onStatusChange={onStatusChange}
        selectedCategory="ai"
        onCategoryChange={onCategoryChange}
        pendingCount={12}
      />
    );

    expect(pendingBtn).toHaveAttribute('aria-pressed', 'false');
    expect(approvedBtn).toHaveAttribute('aria-pressed', 'true');
    expect(allCatBtn).toHaveAttribute('aria-pressed', 'false');
    expect(aiCatBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders workspace toolbar controls (search, import watchers, refresh) and handles interactions', async () => {
    vi.mocked(feedBusApi.importWatcherItems).mockResolvedValue({
      ok: true,
      imported: 5,
      skipped: 0,
    });

    render(
      <FeedBusView
        onExitFeedBus={vi.fn()}
        isDarkMode={false}
        toggleTheme={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText('Поиск по заметкам...');
    fireEvent.change(searchInput, { target: { value: 'DeepMind' } });
    expect(searchInput).toHaveValue('DeepMind');

    const clearBtn = screen.getByRole('button', { name: 'Очистить поиск' });
    fireEvent.click(clearBtn);
    expect(searchInput).toHaveValue('');

    const importBtn = screen.getByRole('button', { name: /Импорт вотчеров/i });
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(feedBusApi.importWatcherItems).toHaveBeenCalledWith(50);
    });

    const refreshBtn = screen.getByRole('button', { name: /Обновить список/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(feedBusApi.queryItems).toHaveBeenCalled();
    });
  });
});
