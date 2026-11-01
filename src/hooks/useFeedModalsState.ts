import { useState, useCallback, useEffect, useRef } from 'react';
import { Note } from '@lenta/shared';
import { UnifiedFeedItem, FeedAdapter, FEED_ADAPTERS } from '../adapters/feeds';
import { useUpdateNote } from '../api/queries';
import { feedApi } from '../api/client';
import { useLiveNoteSubscription } from './useLiveNoteSubscription';
import { FeedAppRuntimeMode } from '../utils/appMode';

interface UseFeedModalsStateOptions {
  noteId?: string;
  openNote: (id: string) => void;
  closeNote: () => void;
  allMappedNotes: any[];
  activeAdapter: FeedAdapter;
  isPublicMode: boolean;
  appMode: FeedAppRuntimeMode;
  refetch: () => void;
  isSourceTabModalOpen?: boolean;
  isFeedEntityModalOpen?: boolean;
}

export function useFeedModalsState({
  noteId,
  openNote,
  closeNote,
  allMappedNotes,
  activeAdapter,
  isPublicMode,
  appMode,
  refetch,
  isSourceTabModalOpen = false,
  isFeedEntityModalOpen = false,
}: UseFeedModalsStateOptions) {
  const updateNoteMutation = useUpdateNote();

  const [selectedDetailItem, setSelectedDetailItem] = useState<UnifiedFeedItem | null>(null);
  const [editingItem, setEditingItem] = useState<UnifiedFeedItem | null>(null);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [aiCoverItem, setAiCoverItem] = useState<UnifiedFeedItem | null>(null);
  const [aiCoverTemplateId, setAiCoverTemplateId] = useState<string | undefined>(undefined);
  const [isLemonSeasonsModalOpen, setIsLemonSeasonsModalOpen] = useState(false);

  const handleOpenDetail = useCallback(
    (item: UnifiedFeedItem) => {
      setSelectedDetailItem(item);
      openNote(item.id);
    },
    [openNote]
  );

  const handleOpenNoteById = useCallback(
    async (id: string, initialNote?: Note) => {
      openNote(id);

      // 1. Check in-memory allMappedNotes first for complete note data
      const inMemory = allMappedNotes.find(
        (n) => n.id === id || n.externalId === id || (n.metadata && (n.metadata as any).slug === id)
      );
      const targetNote = inMemory || initialNote;

      if (targetNote) {
        const adapted =
          activeAdapter.adaptNotes([targetNote])[0] ||
          FEED_ADAPTERS.all.adaptNotes([targetNote])[0];
        if (adapted) {
          setSelectedDetailItem(adapted);

          // If initialNote was partial (not in inMemory), fetch full note in background
          if (!inMemory) {
            feedApi
              .getNoteById?.(id)
              ?.then((fullNote) => {
                if (fullNote) {
                  const [fullAdapted] = FEED_ADAPTERS.all.adaptNotes([fullNote]);
                  if (fullAdapted) {
                    setSelectedDetailItem((curr) =>
                      curr && curr.id === fullAdapted.id ? { ...curr, ...fullAdapted } : fullAdapted
                    );
                  }
                }
              })
              ?.catch?.(() => {});
          }
          return;
        }
      }

      // 2. Fallback: Fetch directly from API by ID
      try {
        const fullNote = await feedApi.getNoteById(id);
        if (fullNote) {
          const [adapted] = FEED_ADAPTERS.all.adaptNotes([fullNote]);
          if (adapted) {
            setSelectedDetailItem(adapted);
          }
        }
      } catch (err) {
        console.warn('[useFeedModalsState] Failed to fetch note by id:', err);
      }
    },
    [openNote, activeAdapter, allMappedNotes]
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedDetailItem(null);
    closeNote();
  }, [closeNote]);

  const handleOpenEdit = useCallback((item: UnifiedFeedItem) => {
    setEditingItem(item);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingItem(null);
  }, []);

  const handleOpenCreateNote = useCallback(() => {
    setIsCreateNoteOpen(true);
  }, []);

  const handleCloseCreateNote = useCallback(() => {
    setIsCreateNoteOpen(false);
  }, []);

  const handleOpenAiCover = useCallback((item: UnifiedFeedItem, templateId?: string) => {
    setAiCoverTemplateId(templateId);
    setAiCoverItem(item);
  }, []);

  const handleCloseAiCover = useCallback(() => {
    setAiCoverItem(null);
    setAiCoverTemplateId(undefined);
  }, []);

  const handleOpenLemonSeasons = useCallback(() => {
    setIsLemonSeasonsModalOpen(true);
  }, []);

  const handleCloseLemonSeasons = useCallback(() => {
    setIsLemonSeasonsModalOpen(false);
  }, []);

  // Live subscription for open note
  useLiveNoteSubscription(selectedDetailItem?.id, {
    enabled: Boolean(selectedDetailItem),
    intervalMs: 2500,
    onUpdate: (updatedNote) => {
      const adapted =
        activeAdapter.adaptNotes([updatedNote])[0] ||
        FEED_ADAPTERS.all.adaptNotes([updatedNote])[0];
      if (adapted) {
        setSelectedDetailItem((prev) => (prev && prev.id === adapted.id ? { ...prev, ...adapted } : prev));
      }
    },
  });

  const lastRouteNoteIdRef = useRef<string | undefined>(noteId);

  // Synchronize open note modal with route query param (?note=...)
  useEffect(() => {
    const prevRouteNoteId = lastRouteNoteIdRef.current;
    lastRouteNoteIdRef.current = noteId;

    if (!noteId) {
      if (prevRouteNoteId && selectedDetailItem) {
        setSelectedDetailItem(null);
      }
      return;
    }

    if (selectedDetailItem && selectedDetailItem.id === noteId) {
      return;
    }

    const targetNote = allMappedNotes.find(
      (n) => n.id === noteId || n.externalId === noteId || (n.metadata && (n.metadata as any).slug === noteId)
    );
    if (targetNote) {
      const adapted =
        activeAdapter.adaptNotes([targetNote])[0] ||
        FEED_ADAPTERS.all.adaptNotes([targetNote])[0];
      if (adapted) {
        setSelectedDetailItem(adapted);
        return;
      }
    }

    // Fallback: Fetch directly from API by ID
    let cancelled = false;
    feedApi
      .getNoteById?.(noteId)
      ?.then((fullNote) => {
        if (!cancelled && fullNote) {
          const [adapted] = FEED_ADAPTERS.all.adaptNotes([fullNote]);
          if (adapted) {
            setSelectedDetailItem(adapted);
          }
        }
      })
      ?.catch?.((err) => {
        console.warn('[useFeedModalsState] Failed to fetch note by id for modal:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [noteId, allMappedNotes, activeAdapter, selectedDetailItem]);

  const handleAiCoverApplied = useCallback(
    (newCoverUrl: string) => {
      refetch();
      if (selectedDetailItem && aiCoverItem && selectedDetailItem.id === aiCoverItem.id) {
        const mainImg = {
          id: `img-ai-${Date.now()}`,
          url: newCoverUrl,
          isMain: true,
        };
        const otherImgs = (selectedDetailItem.rawPayload?.images || [])
          .map((img: any) => ({ ...img, isMain: false }));

        setSelectedDetailItem({
          ...selectedDetailItem,
          coverUrl: newCoverUrl,
          rawPayload: {
            ...(selectedDetailItem.rawPayload || {}),
            images: [mainImg, ...otherImgs],
          },
        });
      }
    },
    [refetch, selectedDetailItem, aiCoverItem]
  );

  const isAnyModalOpen = Boolean(
    selectedDetailItem ||
    noteId ||
    editingItem ||
    aiCoverItem ||
    isCreateNoteOpen ||
    isLemonSeasonsModalOpen ||
    isSourceTabModalOpen ||
    isFeedEntityModalOpen
  );

  // Keyboard shortcut: Press 'c' or 'n' to quickly open create note modal
  useEffect(() => {
    if (isPublicMode || appMode === 'public') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key shortcuts if any modifier is pressed (e.g. Ctrl+C for copy, Cmd+C, Alt+...)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const hasOpenDialog =
        typeof document !== 'undefined' &&
        Boolean(document.querySelector('[role="dialog"], [aria-modal="true"]'));
      if (isAnyModalOpen || hasOpenDialog) {
        return;
      }

      if (e.key === 'c' || e.key === 'n' || e.key === 'с' || e.key === 'т') {
        e.preventDefault();
        setIsCreateNoteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPublicMode, appMode, isAnyModalOpen]);

  // Moderation Mutations
  const handleApprovePublish = useCallback(
    async (item: UnifiedFeedItem) => {
      await updateNoteMutation.mutateAsync({
        id: item.id,
        data: {
          privacy: 'public',
          status: 'PUBLISHED',
          publishAt: new Date().toISOString(),
        },
      });
    },
    [updateNoteMutation]
  );

  const handleUnpublishToStaging = useCallback(
    async (item: UnifiedFeedItem) => {
      await updateNoteMutation.mutateAsync({
        id: item.id,
        data: {
          privacy: 'public',
          status: 'DRAFT',
        },
      });
    },
    [updateNoteMutation]
  );

  const handleReturnToPrivate = useCallback(
    async (item: UnifiedFeedItem) => {
      await updateNoteMutation.mutateAsync({
        id: item.id,
        data: {
          privacy: 'private',
          status: 'DRAFT',
        },
      });
    },
    [updateNoteMutation]
  );

  return {
    selectedDetailItem,
    editingItem,
    isCreateNoteOpen,
    aiCoverItem,
    aiCoverTemplateId,
    isLemonSeasonsModalOpen,
    isAnyModalOpen,
    isMutating: updateNoteMutation.isPending,
    handleOpenDetail,
    handleOpenNoteById,
    handleCloseDetail,
    handleOpenEdit,
    handleCloseEdit,
    handleOpenCreateNote,
    handleCloseCreateNote,
    handleOpenAiCover,
    handleCloseAiCover,
    handleOpenLemonSeasons,
    handleCloseLemonSeasons,
    handleAiCoverApplied,
    handleApprovePublish,
    handleUnpublishToStaging,
    handleReturnToPrivate,
  };
}
