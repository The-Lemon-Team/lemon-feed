import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import { renderWithProviders } from '../../test/renderWithProviders';
import { App } from '../../App';
import {
  TEST_RESERVED_PREFIX,
  createTestFeedSlug,
  createTestFeedTitle,
  createTestNoteTitle,
} from '@lenta/shared';

// Mock workspace context to avoid external storage calls
vi.mock('../../context/WorkspaceContext', () => ({
  useWorkspace: vi.fn(() => ({
    workspaces: [],
    activeWorkspace: null,
    memberships: new Map(),
    pins: [],
    isLoading: false,
    setActiveWorkspace: vi.fn(),
    createWorkspace: vi.fn(),
    deleteWorkspace: vi.fn(),
    addNoteToWorkspace: vi.fn(),
    removeNoteFromWorkspace: vi.fn(),
    isNoteInWorkspace: vi.fn(() => false),
    isNotePinnedInWorkspace: vi.fn(() => false),
  })),
  useWorkspaceMembership: vi.fn(() => ({
    workspaces: [],
    membershipsByNoteId: new Map(),
    addToWorkspace: vi.fn(),
    removeFromWorkspace: vi.fn(),
    isNoteInWorkspace: vi.fn(() => false),
    isNotePinnedInWorkspace: vi.fn(() => false),
  })),
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Feed Tab Editing Flow (Unit & UI Flow with Mock API)', () => {
  let feedsState: any[];
  let notesState: any[];
  let patchHistory: Array<{ id: string; body: any }>;
  let postHistory: any[];

  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    patchHistory = [];
    postHistory = [];

    const initialFeedId = `${TEST_RESERVED_PREFIX.FEED}1`;
    const initialFeedSlug = createTestFeedSlug('main');
    const initialFeedTitle = createTestFeedTitle('Main');

    feedsState = [
      {
        id: initialFeedId,
        slug: initialFeedSlug,
        title: initialFeedTitle,
        description: 'Test feed for tab editing flow verification',
        icon: '📁',
        color: '#2481cc',
        privacy: 'public',
        folderPaths: ['Spark/Test'],
        hashtags: ['test'],
        createdAt: new Date().toISOString(),
      },
    ];

    notesState = [
      {
        id: `${TEST_RESERVED_PREFIX.NOTE}1`,
        title: createTestNoteTitle('Initial Post'),
        description: 'Note body inside test feed',
        status: 'PUBLISHED',
        privacy: 'public',
        startDate: new Date().toISOString(),
        folderPath: 'Spark/Test/item.md',
        feedId: initialFeedId,
        feed: feedsState[0],
        hashtags: [{ id: 'h1', name: 'test' }],
      },
    ];

    server.use(
      http.get('*/feeds', () => {
        return HttpResponse.json(feedsState);
      }),

      http.get('*/notes', () => {
        return HttpResponse.json({
          items: notesState,
          total: notesState.length,
        });
      }),

      http.patch('*/feeds/:id', async ({ request, params }) => {
        const body = (await request.json()) as any;
        const feedId = String(params.id);
        patchHistory.push({ id: feedId, body });

        const feedIndex = feedsState.findIndex((f) => f.id === feedId || f.slug === feedId);
        if (feedIndex >= 0) {
          feedsState[feedIndex] = {
            ...feedsState[feedIndex],
            ...body,
          };
          return HttpResponse.json(feedsState[feedIndex]);
        }
        return HttpResponse.json({ id: feedId, ...body });
      }),

      http.post('*/feeds', async ({ request }) => {
        const body = (await request.json()) as any;
        postHistory.push(body);
        const newFeed = {
          id: `${TEST_RESERVED_PREFIX.FEED}${Date.now()}`,
          ...body,
        };
        feedsState.push(newFeed);
        return HttpResponse.json(newFeed, { status: 201 });
      })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('user clicks edit pencil icon, selects tab, edits title, saves, sends PATCH to API, and tab name updates in UI', async () => {
    renderWithProviders(<App />);

    // 1. Initial tab should be rendered with initial title
    const initialTitle = createTestFeedTitle('Main');
    await waitFor(() => {
      expect(screen.getAllByText(initialTitle).length).toBeGreaterThanOrEqual(1);
    });

    // 2. Click the edit mode pencil toggle in FeedToolbarHeader
    const editModeToggle = screen.getByRole('button', { name: /режим редактирования/i });
    expect(editModeToggle).toBeInTheDocument();
    await userEvent.click(editModeToggle);

    await waitFor(() => {
      expect(screen.getByTitle(/Режим редактирования активен/)).toBeInTheDocument();
    });

    // 3. In edit mode, select the tab to edit
    const tabButton = screen.getByTitle(
      (val) => Boolean(val && val.includes('Редактировать ленту') && val.includes(initialTitle))
    );
    expect(tabButton).toBeInTheDocument();
    await userEvent.click(tabButton);

    // 4. Modal "Настройка ленты (фида)" should open
    await waitFor(() => {
      expect(screen.getByText('Настройка ленты (фида)')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Например: ИИ & Модели');
    await waitFor(() => {
      expect(nameInput).toHaveValue(initialTitle);
    });

    // 5. Edit title using reserved test naming convention
    const newTitle = createTestFeedTitle('Renamed');
    await userEvent.clear(nameInput);
    fireEvent.change(nameInput, { target: { value: newTitle } });

    // 6. Submit the form by clicking "Сохранить ленту"
    const saveButton = screen.getByRole('button', { name: /Сохранить ленту/i });
    await userEvent.click(saveButton);

    // 7. Verify API PATCH request was dispatched with updated title
    await waitFor(() => {
      expect(patchHistory.length).toBeGreaterThanOrEqual(1);
    });

    const lastPatch = patchHistory[patchHistory.length - 1];
    expect(lastPatch.id).toBe(`${TEST_RESERVED_PREFIX.FEED}1`);
    expect(lastPatch.body.title).toBe(newTitle);

    // 8. Verify the tab title in the tabs row is updated with the new title
    await waitFor(() => {
      expect(screen.getAllByText(newTitle).length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.queryByText(initialTitle)).toBeNull();
  });

  it('user edits icon and color parameters of a tab and updates are reflected via API', async () => {
    renderWithProviders(<App />);

    const initialTitle = createTestFeedTitle('Main');
    await waitFor(() => {
      expect(screen.getAllByText(initialTitle).length).toBeGreaterThanOrEqual(1);
    });

    // Toggle edit mode and open tab editor
    await userEvent.click(screen.getByRole('button', { name: /режим редактирования/i }));
    await waitFor(() => {
      expect(screen.getByTitle(/Режим редактирования активен/)).toBeInTheDocument();
    });

    const tabButton = screen.getByTitle(
      (val) => Boolean(val && val.includes('Редактировать ленту') && val.includes(initialTitle))
    );
    await userEvent.click(tabButton);

    await waitFor(() => {
      expect(screen.getByText('Настройка ленты (фида)')).toBeInTheDocument();
    });

    // Select preset emoji (e.g. 🚀)
    const rocketEmojiBtn = screen.getByRole('button', { name: '🚀' });
    await userEvent.click(rocketEmojiBtn);

    // Save
    await userEvent.click(screen.getByRole('button', { name: /Сохранить ленту/i }));

    await waitFor(() => {
      expect(patchHistory.length).toBeGreaterThanOrEqual(1);
    });

    const lastPatch = patchHistory[patchHistory.length - 1];
    expect(lastPatch.body.icon).toBe('🚀');
  });

  it('user can create a new tab/feed in edit mode via "+ Таб" button', async () => {
    renderWithProviders(<App />);

    const initialTitle = createTestFeedTitle('Main');
    await waitFor(() => {
      expect(screen.getAllByText(initialTitle).length).toBeGreaterThanOrEqual(1);
    });

    // Toggle edit mode
    await userEvent.click(screen.getByRole('button', { name: /режим редактирования/i }));
    await waitFor(() => {
      expect(screen.getByTitle(/Режим редактирования активен/)).toBeInTheDocument();
    });

    // Find and click the "+ Таб" / add tab chip in FeedStreamSourceRow or category row
    const addFeedBtn = screen.getByTitle('Создать новую ленту / фид');
    expect(addFeedBtn).toBeInTheDocument();
    await userEvent.click(addFeedBtn);

    // Modal opens in create mode
    await waitFor(() => {
      expect(screen.getByText('Создание новой ленты (фида)')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Например: ИИ & Модели');
    const newFeedTitle = createTestFeedTitle('Newly Added');
    fireEvent.change(nameInput, { target: { value: newFeedTitle } });

    // Click Save
    await userEvent.click(screen.getByRole('button', { name: /Сохранить ленту/i }));

    await waitFor(() => {
      expect(postHistory.length).toBe(1);
    });

    expect(postHistory[0].title).toBe(newFeedTitle);

    // The newly created tab must immediately appear in the UI tabs!
    await waitFor(() => {
      expect(screen.getAllByText(/Newly/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('user in "Развлечения" can create a new music feed and see it immediately in the tab row', async () => {
    renderWithProviders(<App />);

    // Switch to "Развлечения"
    const entertainmentTab = screen.getByRole('button', { name: /Развлечения/i });
    expect(entertainmentTab).toBeInTheDocument();
    await userEvent.click(entertainmentTab);

    // Click "+ Фид лента"
    const addFeedBtn = screen.getByTitle('Создать новую ленту / фид');
    expect(addFeedBtn).toBeInTheDocument();
    await userEvent.click(addFeedBtn);

    // Modal opens
    await waitFor(() => {
      expect(screen.getByText('Создание новой ленты (фида)')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Например: ИИ & Модели');
    fireEvent.change(nameInput, { target: { value: 'My Music' } });

    // Save
    await userEvent.click(screen.getByRole('button', { name: /Сохранить ленту/i }));

    await waitFor(() => {
      expect(postHistory.length).toBe(1);
    });

    // The newly created "My Music" feed tab must be immediately visible in "Развлечения"!
    await waitFor(() => {
      expect(screen.getAllByText('My Music').length).toBeGreaterThanOrEqual(1);
    });

    // The user must be redirected directly to the newly created feed page
    expect(window.location.pathname).toBe('/entertainment/my-music');
  });

  it('redirects to the newly created feed page and syncs route after creation', async () => {
    renderWithProviders(<App />);

    await waitFor(() => {
      expect(screen.getAllByText(createTestFeedTitle('Main')).length).toBeGreaterThanOrEqual(1);
    });

    // Click "+ Фид лента"
    const addFeedBtn = screen.getByTitle('Создать новую ленту / фид');
    await userEvent.click(addFeedBtn);

    await waitFor(() => {
      expect(screen.getByText('Создание новой ленты (фида)')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Например: ИИ & Модели');
    fireEvent.change(nameInput, { target: { value: 'Cyberpunk Beats' } });

    await userEvent.click(screen.getByRole('button', { name: /Сохранить ленту/i }));

    await waitFor(() => {
      expect(postHistory.length).toBe(1);
    });

    // Check redirect URL to the new feed slug in 'all'
    await waitFor(() => {
      expect(window.location.pathname).toBe('/all/cyberpunk-beats');
    });

    // Tab must be rendered in toolbar
    expect(screen.getAllByText('Cyberpunk Beats').length).toBeGreaterThanOrEqual(1);
  });
});
