import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { Layers, CheckSquare, Square, Search } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Workspace, WorkspacePin, WorkspaceTrack } from '@lenta/shared';
import { FocusSlotsSection, FocusDropPill } from './FocusSlotsSection';
import { WorkspaceTrackItem } from './WorkspaceTrackItem';
import { WorkspaceBatchBar } from './WorkspaceBatchBar';
import { GeneralNotesSection } from './GeneralNotesSection';
import { WorkspaceFloatingButton } from './WorkspaceFloatingButton';
import { WorkspaceDockHeader } from './WorkspaceDockHeader';
import { PinCardItem } from './PinCardItem';
import { AddTrackInlineControl, WorkspaceDockModals } from './WorkspaceDockExtras';
import { useWorkspaceDnd, WORKSPACE_DROP_ANIMATION } from './useWorkspaceDnd';
import {
  FOCUS_CONTAINER_ID,
  GENERAL_CONTAINER_ID,
  toTrackContainerId,
} from './workspaceDnd.utils';

export interface PinnedNotesDockProps {
  onOpenNoteDetail?: (noteId: string, note?: any) => void;
  onSelectPeriod?: (periodId?: string) => void;
  disableEscClose?: boolean;
}

export const PinnedNotesDock: React.FC<PinnedNotesDockProps> = ({
  onOpenNoteDetail,
  onSelectPeriod,
  disableEscClose = false,
}) => {
  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    setActiveWorkspaceId,
    pins,
    isDockOpen,
    setIsDockOpen,
    unpinNote,
    updatePin,
    commitPinsLayout,
    togglePinFocus,
    batchToggleFocus,
    createTrack,
    deleteTrack,
    deleteWorkspace,
  } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAttentionOnly, setFilterAttentionOnly] = useState(false);
  const [selectedPinIds, setSelectedPinIds] = useState<Set<string>>(new Set());
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [trackToDelete, setTrackToDelete] = useState<WorkspaceTrack | null>(null);
  const [collapsedTracks, setCollapsedTracks] = useState<Set<string>>(new Set());

  // Filtered pins (already deterministically sorted by `order` in WorkspaceContext)
  const filteredPins = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!filterAttentionOnly && !trimmed) return pins;

    return pins.filter((p) => {
      if (filterAttentionOnly && p.status !== 'NEEDS_ATTENTION') return false;
      if (trimmed) {
        const titleMatch = p.note?.title?.toLowerCase().includes(trimmed);
        const commentMatch = p.comment?.toLowerCase().includes(trimmed);
        if (!titleMatch && !commentMatch) return false;
      }
      return true;
    });
  }, [pins, filterAttentionOnly, searchQuery]);

  const attentionCount = useMemo(
    () => pins.reduce((acc, p) => acc + (p.status === 'NEEDS_ATTENTION' ? 1 : 0), 0),
    [pins]
  );

  const focusPins = useMemo(
    () => filteredPins.filter((p) => p.isPinned),
    [filteredPins]
  );

  const selectedPinsList = useMemo(
    () => pins.filter((p) => selectedPinIds.has(p.id)),
    [pins, selectedPinIds]
  );

  const handleAutoExpandTrack = useCallback((trackId: string) => {
    setCollapsedTracks((prev) => {
      if (!prev.has(trackId)) return prev;
      const next = new Set(prev);
      next.delete(trackId);
      return next;
    });
  }, []);

  const {
    sensors,
    collisionDetection,
    activePin,
    settlingPinId,
    activeCardHeight,
    movingPinIds,
    companionPinIds,
    isDragging,
    overContainerId,
    crossInsertTarget,
    renderedGeneralPins,
    renderedPinsByTrack,
    handleDragStart,
    handleDragMove,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useWorkspaceDnd({
    allPins: pins,
    visiblePins: filteredPins,
    tracks: activeWorkspace?.tracks,
    selectedPinIds,
    collapsedTracks,
    commitPinsLayout,
    batchToggleFocus,
    onAutoExpandTrack: handleAutoExpandTrack,
  });

  // Escape key handling per AGENTS.md (defers to @dnd-kit cancel while actively dragging or when nested modal is open)
  useEffect(() => {
    if (!isDockOpen || disableEscClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        !disableEscClose &&
        !isDragging &&
        !isLinkModalOpen &&
        !isCreateWorkspaceOpen &&
        !workspaceToDelete &&
        !trackToDelete
      ) {
        setIsDockOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isDockOpen,
    disableEscClose,
    isDragging,
    isLinkModalOpen,
    isCreateWorkspaceOpen,
    workspaceToDelete,
    trackToDelete,
    setIsDockOpen,
  ]);

  const toggleSelectPin = useCallback((id: string) => {
    setSelectedPinIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedPinIds((prev) =>
      prev.size === filteredPins.length
        ? new Set()
        : new Set(filteredPins.map((p) => p.id))
    );
  }, [filteredPins]);

  const toggleTrackCollapse = useCallback((trackId: string) => {
    setCollapsedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  }, []);

  const handleToggleAttention = useCallback(
    async (pin: WorkspacePin, e: React.MouseEvent) => {
      e.stopPropagation();
      const newStatus = pin.status === 'NEEDS_ATTENTION' ? 'ACTIVE' : 'NEEDS_ATTENTION';
      await updatePin(pin.id, { status: newStatus });
    },
    [updatePin]
  );

  const handleToggleFocus = useCallback(
    async (pin: WorkspacePin, e: React.MouseEvent) => {
      e.stopPropagation();
      await togglePinFocus(pin.id, !pin.isPinned);
    },
    [togglePinFocus]
  );

  const handleOpenDock = useCallback(() => setIsDockOpen(true), [setIsDockOpen]);
  const handleCloseDock = useCallback(() => setIsDockOpen(false), [setIsDockOpen]);
  const handleToggleFilterAttention = useCallback(
    () => setFilterAttentionOnly((prev) => !prev),
    []
  );
  const handleOpenCreateWorkspace = useCallback(() => setIsCreateWorkspaceOpen(true), []);
  const handleCloseCreateWorkspace = useCallback(() => setIsCreateWorkspaceOpen(false), []);
  const handleOpenLinkModal = useCallback(() => setIsLinkModalOpen(true), []);
  const handleCloseLinkModal = useCallback(() => setIsLinkModalOpen(false), []);
  const handleClearSelection = useCallback(() => setSelectedPinIds(new Set()), []);
  const handleCloseDeleteWorkspace = useCallback(() => setWorkspaceToDelete(null), []);
  const handleCloseDeleteTrack = useCallback(() => setTrackToDelete(null), []);

  const handleBatchUnpin = useCallback(async () => {
    await Promise.all(Array.from(selectedPinIds).map((id) => unpinNote(id)));
    setSelectedPinIds(new Set());
  }, [selectedPinIds, unpinNote]);

  const handleBatchAttention = useCallback(async () => {
    await Promise.all(
      Array.from(selectedPinIds).map((id) => updatePin(id, { status: 'NEEDS_ATTENTION' }))
    );
  }, [selectedPinIds, updatePin]);

  const handleBatchFocus = useCallback(async () => {
    const allPinned = selectedPinsList.every((p) => p.isPinned);
    await batchToggleFocus(Array.from(selectedPinIds), !allPinned);
  }, [selectedPinsList, selectedPinIds, batchToggleFocus]);

  const hasTracks = Boolean(activeWorkspace?.tracks && activeWorkspace.tracks.length > 0);
  const showGeneralSection = renderedGeneralPins.length > 0 || hasTracks || isDragging;

  return (
    <>
      <WorkspaceFloatingButton
        onClick={handleOpenDock}
        workspaceColor={activeWorkspace?.color}
        workspaceTitle={activeWorkspace?.title}
        pinsCount={pins.length}
        focusCount={focusPins.length}
        attentionCount={attentionCount}
      />

      {isDockOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex justify-end animate-fadeIn"
          onClick={handleCloseDock}
        >
          <div
            className="w-full sm:w-[460px] max-w-full h-full bg-white dark:bg-[#151e27] border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col animate-slideInRight"
            onClick={(e) => e.stopPropagation()}
          >
            <WorkspaceDockHeader
              activeWorkspace={activeWorkspace}
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              pinsCount={pins.length}
              focusCount={focusPins.length}
              searchQuery={searchQuery}
              filterAttentionOnly={filterAttentionOnly}
              attentionCount={attentionCount}
              onSearchChange={setSearchQuery}
              onToggleFilterAttention={handleToggleFilterAttention}
              onSelectWorkspace={setActiveWorkspaceId}
              onOpenCreateWorkspace={handleOpenCreateWorkspace}
              onDeleteWorkspace={setWorkspaceToDelete}
              onClose={handleCloseDock}
            />

            <DndContext
              sensors={sensors}
              collisionDetection={collisionDetection}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable] p-3.5 space-y-4">
                {filteredPins.length === 0 && (searchQuery.trim() || filterAttentionOnly) ? (
                  <div className="text-center py-10 px-4 text-slate-400 dark:text-slate-500">
                    <Search className="w-7 h-7 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-medium">Ничего не найдено</p>
                    <p className="text-[11px] mt-1">
                      Попробуйте изменить поисковый запрос или фильтры
                    </p>
                  </div>
                ) : (
                  <>
                    {filteredPins.length > 0 && (
                      <div className="h-5 flex items-center justify-between text-[11px] leading-none text-slate-500 pb-1">
                        <button
                          type="button"
                          onClick={selectAll}
                          className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          {selectedPinIds.size === filteredPins.length ? (
                            <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                          <span>Выбрать все ({filteredPins.length})</span>
                        </button>
                        {selectedPinIds.size > 0 && (
                          <span className="font-mono font-bold text-blue-500">
                            Выбрано: {selectedPinIds.size}
                          </span>
                        )}
                      </div>
                    )}

                    <FocusSlotsSection
                      focusPins={focusPins}
                      selectedPinIds={selectedPinIds}
                      isDragging={isDragging}
                      isOverFocus={overContainerId === FOCUS_CONTAINER_ID}
                      onToggleSelectPin={toggleSelectPin}
                      onToggleFocus={handleToggleFocus}
                      onToggleAttention={handleToggleAttention}
                      onUnpin={unpinNote}
                      onOpenDetail={onOpenNoteDetail}
                    />

                    <div className="space-y-3 pt-1">
                      <div className="h-8 flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                          <span>📚 Рабочий стол воркспейса</span>
                          <span className="text-[10px] text-slate-400">
                            ({filteredPins.length})
                          </span>
                        </div>

                        {focusPins.length === 0 && (
                          <FocusDropPill
                            isDragging={isDragging}
                            isOverFocus={overContainerId === FOCUS_CONTAINER_ID}
                          />
                        )}
                      </div>

                      {pins.length === 0 && !searchQuery.trim() && !filterAttentionOnly && (
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-dashed border-slate-200 dark:border-white/10 text-center space-y-1">
                          <Layers className="w-6 h-6 mx-auto text-slate-400 dark:text-slate-500 opacity-50 mb-1" />
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            В этом воркспейсе пока нет заметок
                          </p>
                          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                            Нажимайте иконку воркспейса в карточках заметок ленты, чтобы добавлять их сюда для работы.
                          </p>
                        </div>
                      )}

                      {showGeneralSection && (
                        <GeneralNotesSection
                          generalPins={renderedGeneralPins}
                          selectedPinIds={selectedPinIds}
                          companionPinIds={companionPinIds}
                          settlingPinId={settlingPinId}
                          crossInsertIndex={
                            crossInsertTarget?.containerId === GENERAL_CONTAINER_ID
                              ? crossInsertTarget.index
                              : null
                          }
                          activeCardHeight={activeCardHeight}
                          isDragging={isDragging}
                          isOverContainer={overContainerId === GENERAL_CONTAINER_ID}
                          onToggleSelectPin={toggleSelectPin}
                          onToggleFocus={handleToggleFocus}
                          onToggleAttention={handleToggleAttention}
                          onUnpin={unpinNote}
                          onOpenDetail={onOpenNoteDetail}
                        />
                      )}

                      {activeWorkspace?.tracks?.map((track) => {
                        const trackPins = renderedPinsByTrack[track.id] || [];
                        const trackContainerId = toTrackContainerId(track.id);
                        return (
                          <WorkspaceTrackItem
                            key={track.id}
                            track={track}
                            pins={trackPins}
                            isCollapsed={collapsedTracks.has(track.id)}
                            selectedPinIds={selectedPinIds}
                            companionPinIds={companionPinIds}
                            settlingPinId={settlingPinId}
                            crossInsertIndex={
                              crossInsertTarget?.containerId === trackContainerId
                                ? crossInsertTarget.index
                                : null
                            }
                            activeCardHeight={activeCardHeight}
                            isDragging={isDragging}
                            isOverContainer={overContainerId === trackContainerId}
                            onToggleCollapse={toggleTrackCollapse}
                            onToggleSelectPin={toggleSelectPin}
                            onToggleFocus={handleToggleFocus}
                            onToggleAttention={handleToggleAttention}
                            onUnpin={unpinNote}
                            onOpenDetail={onOpenNoteDetail}
                            onDeleteTrack={setTrackToDelete}
                          />
                        );
                      })}

                      <AddTrackInlineControl onCreateTrack={createTrack} />
                    </div>
                  </>
                )}
              </div>

              {typeof document !== 'undefined' &&
                createPortal(
                  <DragOverlay dropAnimation={WORKSPACE_DROP_ANIMATION} zIndex={100}>
                    {activePin ? (
                      <PinCardItem
                        pin={activePin}
                        isOverlay={true}
                        dragCount={movingPinIds.length}
                        isSelected={selectedPinIds.has(activePin.id)}
                        onToggleSelectPin={toggleSelectPin}
                        onToggleFocus={handleToggleFocus}
                        onToggleAttention={handleToggleAttention}
                        onUnpin={unpinNote}
                        onOpenDetail={onOpenNoteDetail}
                      />
                    ) : null}
                  </DragOverlay>,
                  document.body
                )}
            </DndContext>

            <WorkspaceBatchBar
              selectedCount={selectedPinIds.size}
              allSelectedPinned={selectedPinsList.every((p) => p.isPinned)}
              onOpenLinkModal={handleOpenLinkModal}
              onBatchFocus={handleBatchFocus}
              onBatchAttention={handleBatchAttention}
              onBatchUnpin={handleBatchUnpin}
            />
          </div>
        </div>
      )}

      <WorkspaceDockModals
        isLinkModalOpen={isLinkModalOpen}
        onCloseLinkModal={handleCloseLinkModal}
        selectedPins={selectedPinsList}
        onBatchLinkSuccess={handleClearSelection}
        isCreateWorkspaceOpen={isCreateWorkspaceOpen}
        onCloseCreateWorkspace={handleCloseCreateWorkspace}
        workspaceToDelete={workspaceToDelete}
        onCloseDeleteWorkspace={handleCloseDeleteWorkspace}
        onConfirmDeleteWorkspace={deleteWorkspace}
        trackToDelete={trackToDelete}
        onCloseDeleteTrack={handleCloseDeleteTrack}
        onConfirmDeleteTrack={deleteTrack}
      />
    </>
  );
};
