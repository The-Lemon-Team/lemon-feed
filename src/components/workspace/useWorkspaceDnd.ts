import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  DragStartEvent,
  DragMoveEvent,
  DragOverEvent,
  DragEndEvent,
  DropAnimation,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WorkspacePin, WorkspaceTrack, ReorderPinItemInput } from '@lenta/shared';
import {
  FOCUS_CONTAINER_ID,
  DraftContainers,
  isFocusContainerId,
  containerIdToTrackId,
  buildInitialDraftContainers,
  findContainerOfId,
  createWorkspaceCollisionDetection,
  computeReorderPayloadFromDraft,
  arrayMove,
} from './workspaceDnd.utils';

export const WORKSPACE_DROP_ANIMATION: DropAnimation = {
  duration: 165,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  keyframes({ transform, dragOverlay, active }) {
    const initialTransform = CSS.Transform.toString(transform.initial);
    const finalTransform = CSS.Transform.toString(transform.final);

    // Pure GPU compositor `transform`-only keyframes whenever widths match (0 layout recalcs!)
    if (Math.abs(dragOverlay.rect.width - active.rect.width) <= 1) {
      return [{ transform: initialTransform }, { transform: finalTransform }];
    }

    return [
      {
        transform: initialTransform,
        width: `${dragOverlay.rect.width}px`,
      },
      {
        transform: finalTransform,
        width: `${active.rect.width}px`,
      },
    ];
  },
  sideEffects: defaultDropAnimationSideEffects({
    className: {
      dragOverlay: 'dnd-dropping',
    },
    styles: {
      active: {
        opacity: '0',
      },
    },
  }),
};

export interface CrossInsertTarget {
  containerId: string;
  index: number;
}

export interface UseWorkspaceDndProps {
  allPins: WorkspacePin[];
  visiblePins: WorkspacePin[];
  tracks: WorkspaceTrack[] | undefined;
  selectedPinIds: Set<string>;
  collapsedTracks: Set<string>;
  commitPinsLayout: (updates: ReorderPinItemInput[]) => Promise<void>;
  batchToggleFocus: (pinIds: string[], isPinned: boolean) => Promise<void>;
  onAutoExpandTrack: (trackId: string) => void;
}

const CARD_GAP_PX = 8;
const DEFAULT_CARD_HEIGHT = 65;
const SLOT_HYSTERESIS_PX = 6;

export function useWorkspaceDnd({
  allPins,
  visiblePins,
  tracks,
  selectedPinIds,
  collapsedTracks,
  commitPinsLayout,
  batchToggleFocus,
  onAutoExpandTrack,
}: UseWorkspaceDndProps) {
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [settlingPinId, setSettlingPinId] = useState<string | null>(null);
  const [activeCardHeight, setActiveCardHeight] = useState<number>(DEFAULT_CARD_HEIGHT);
  const [movingPinIds, setMovingPinIds] = useState<string[]>([]);
  const [overContainerId, setOverContainerId] = useState<string | null>(null);
  const [crossInsertTarget, setCrossInsertTarget] = useState<CrossInsertTarget | null>(null);

  // Refs for zero-allocation collision detection & event handlers
  const draftRef = useRef<DraftContainers | null>(null);
  const originContainerRef = useRef<string | null>(null);
  const settlingRafRef = useRef<number | null>(null);
  const droppableNodesRef = useRef<Map<string, HTMLElement>>(new Map());
  const activeCardHeightRef = useRef<number>(DEFAULT_CARD_HEIGHT);
  activeCardHeightRef.current = activeCardHeight;
  const crossInsertRef = useRef<CrossInsertTarget | null>(null);
  crossInsertRef.current = crossInsertTarget;

  const collapsedRef = useRef<Set<string>>(collapsedTracks);
  collapsedRef.current = collapsedTracks;

  const hoverExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverExpandTrackRef = useRef<string | null>(null);

  const clearHoverExpandTimer = useCallback(() => {
    if (hoverExpandTimerRef.current) {
      clearTimeout(hoverExpandTimerRef.current);
      hoverExpandTimerRef.current = null;
    }
    hoverExpandTrackRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearHoverExpandTimer();
      if (settlingRafRef.current !== null) {
        cancelAnimationFrame(settlingRafRef.current);
      }
    };
  }, [clearHoverExpandTimer]);

  // Fast O(1) lookup map of all pins by ID
  const pinById = useMemo(() => {
    const map = new Map<string, WorkspacePin>();
    for (const p of allPins) {
      map.set(p.id, p);
    }
    return map;
  }, [allPins]);

  // Sensors tuned for crisp desktop mouse drag, mobile touch long-press, and keyboard sorting
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const collisionDetection = useMemo(
    () =>
      createWorkspaceCollisionDetection(
        () => draftRef.current,
        () => collapsedRef.current,
        droppableNodesRef
      ),
    []
  );

  const resetDragState = useCallback(() => {
    clearHoverExpandTimer();
    setActivePinId(null);
    setActiveCardHeight(DEFAULT_CARD_HEIGHT);
    setMovingPinIds([]);
    setOverContainerId(null);
    setCrossInsertTarget(null);
    draftRef.current = null;
    originContainerRef.current = null;
    activeCardHeightRef.current = DEFAULT_CARD_HEIGHT;
    crossInsertRef.current = null;
    droppableNodesRef.current.clear();
  }, [clearHoverExpandTimer]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      if (!pinById.has(id)) return;

      if (settlingRafRef.current !== null) {
        cancelAnimationFrame(settlingRafRef.current);
        settlingRafRef.current = null;
      }
      setSettlingPinId(null);

      const measuredHeight =
        event.active.rect.current.initial?.height ??
        droppableNodesRef.current.get(id)?.getBoundingClientRect().height ??
        DEFAULT_CARD_HEIGHT;
      const cardHeight = Math.max(48, Math.round(measuredHeight));

      const isMulti = selectedPinIds.has(id) && selectedPinIds.size > 1;
      const orderedMovingIds = isMulti
        ? [
            id,
            ...visiblePins
              .filter((p) => p.id !== id && selectedPinIds.has(p.id))
              .map((p) => p.id),
          ]
        : [id];

      const initialDraft = buildInitialDraftContainers(visiblePins, tracks);
      const startContainer = findContainerOfId(initialDraft, id);

      draftRef.current = initialDraft;
      originContainerRef.current = startContainer;
      activeCardHeightRef.current = cardHeight;

      setActivePinId(id);
      setActiveCardHeight(cardHeight);
      setMovingPinIds(orderedMovingIds);
      setOverContainerId(startContainer);
      setCrossInsertTarget(null);
    },
    [pinById, selectedPinIds, visiblePins, tracks]
  );

  const handleDragUpdate = useCallback(
    (event: DragMoveEvent | DragOverEvent) => {
      const { active, over, collisions } = event;
      const currentDraft = draftRef.current;
      const rawOverId = collisions?.[0]?.id ?? over?.id;
      if (rawOverId == null || !currentDraft) return;

      const translatedRect = active.rect.current.translated;
      if (translatedRect && translatedRect.height > 0) {
        const liveHeight = Math.max(48, Math.round(translatedRect.height));
        if (liveHeight !== activeCardHeightRef.current) {
          activeCardHeightRef.current = liveHeight;
          setActiveCardHeight(liveHeight);
        }
      }

      const overId = String(rawOverId);

      // 1. Hovering Focus Slots or Focus Drop Pill target
      if (isFocusContainerId(overId)) {
        clearHoverExpandTimer();
        setOverContainerId((prev) => (prev === FOCUS_CONTAINER_ID ? prev : FOCUS_CONTAINER_ID));
        setCrossInsertTarget((prev) => (prev === null ? prev : null));
        return;
      }

      const originContainer = originContainerRef.current;
      const overContainer = findContainerOfId(currentDraft, overId);

      if (!originContainer || !overContainer) return;

      const overTrackId = containerIdToTrackId(overContainer);
      const isOverCollapsed = Boolean(overTrackId && collapsedRef.current.has(overTrackId));

      setOverContainerId((prev) => (prev === overContainer ? prev : overContainer));

      // 2. Hovering collapsed track header -> schedule smooth auto-expand (420ms)
      if (isOverCollapsed && overTrackId) {
        setCrossInsertTarget((prev) => (prev === null ? prev : null));
        if (hoverExpandTrackRef.current !== overTrackId) {
          clearHoverExpandTimer();
          hoverExpandTrackRef.current = overTrackId;
          hoverExpandTimerRef.current = setTimeout(() => {
            onAutoExpandTrack(overTrackId);
            hoverExpandTimerRef.current = null;
            hoverExpandTrackRef.current = null;
          }, 420);
        }
        return;
      }

      clearHoverExpandTimer();

      // 3. Intra-container movement: animated natively by @dnd-kit/sortable transforms
      if (originContainer === overContainer) {
        setCrossInsertTarget((prev) => (prev === null ? prev : null));
        return;
      }

      // 4. Cross-container hover over a foreign container:
      // Evaluated continuously on `onDragMove` + `onDragOver` using the floating card's
      // visual center (`cardCenterY`) against symmetric slot-to-card midpoints (`±6px` hysteresis)
      // so moving to top (0), center (1..N-1), or bottom (N) responds freely without sticking.
      const dstItems = currentDraft[overContainer] || [];
      if (dstItems.length === 0) {
        setCrossInsertTarget((prev) => (prev === null ? prev : null));
        return;
      }

      const cardCenterY = translatedRect
        ? translatedRect.top + translatedRect.height / 2
        : null;

      const activeHeight = activeCardHeightRef.current;
      const prevIdx =
        crossInsertRef.current?.containerId === overContainer
          ? crossInsertRef.current.index
          : null;

      let nextIndex = dstItems.length;
      if (cardCenterY !== null) {
        nextIndex = 0;
        let measuredAny = false;
        for (let i = 0; i < dstItems.length; i++) {
          const node = droppableNodesRef.current.get(dstItems[i]);
          const rect = node ? node.getBoundingClientRect() : null;
          if (!rect || rect.height <= 0) continue;
          measuredAny = true;

          const baseBoundaryY =
            rect.top + (rect.height + activeHeight + CARD_GAP_PX) / 2;
          const thresholdY =
            prevIdx === null
              ? baseBoundaryY
              : prevIdx <= i
              ? baseBoundaryY + SLOT_HYSTERESIS_PX
              : baseBoundaryY - SLOT_HYSTERESIS_PX;

          if (cardCenterY > thresholdY) {
            nextIndex = i + 1;
          } else {
            break;
          }
        }

        if (!measuredAny && over) {
          const midContainerY = over.rect.top + over.rect.height / 2;
          nextIndex = cardCenterY <= midContainerY ? 0 : dstItems.length;
        }
      }

      setCrossInsertTarget((prev) => {
        if (prev?.containerId === overContainer && prev?.index === nextIndex) {
          return prev;
        }
        return { containerId: overContainer, index: nextIndex };
      });
    },
    [clearHoverExpandTimer, onAutoExpandTrack]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, collisions } = event;
      const currentDraft = draftRef.current;
      const primaryId = String(active.id);
      const currentMovingIds = movingPinIds.length > 0 ? movingPinIds : [primaryId];
      const rawOverId = over?.id ?? collisions?.[0]?.id;

      if (rawOverId == null || !currentDraft) {
        resetDragState();
        return;
      }

      const overId = String(rawOverId);

      // 1. Dropped onto Focus Slots / Focus Drop Pill -> pin to focus without losing track assignment
      if (isFocusContainerId(overId)) {
        resetDragState();
        void batchToggleFocus(currentMovingIds, true);
        return;
      }

      const activeContainer = findContainerOfId(currentDraft, primaryId);
      const overContainer = findContainerOfId(currentDraft, overId);

      if (!activeContainer || !overContainer) {
        resetDragState();
        return;
      }

      let finalizedDraft: DraftContainers = currentDraft;
      const overTrackId = containerIdToTrackId(overContainer);
      const isOverCollapsed = Boolean(overTrackId && collapsedRef.current.has(overTrackId));

      if (isOverCollapsed && overTrackId) {
        onAutoExpandTrack(overTrackId);
      }

      if (activeContainer !== overContainer) {
        // 2. Cross-container drop: insert primaryId at the exact crossInsertTarget index
        // (0 = beginning, 1..N-1 = middle, dstItems.length = end)
        const srcItems = (currentDraft[activeContainer] || []).filter((id) => id !== primaryId);
        const dstItems = (currentDraft[overContainer] || []).filter((id) => id !== primaryId);
        const pendingTarget = crossInsertRef.current;
        const insertIndex =
          !isOverCollapsed && pendingTarget?.containerId === overContainer
            ? Math.max(0, Math.min(pendingTarget.index, dstItems.length))
            : dstItems.length;

        finalizedDraft = {
          ...currentDraft,
          [activeContainer]: srcItems,
          [overContainer]: [
            ...dstItems.slice(0, insertIndex),
            primaryId,
            ...dstItems.slice(insertIndex),
          ],
        };
      } else if (!isOverCollapsed) {
        // 3. Intra-container reorder
        const items = currentDraft[overContainer] || [];
        const oldIndex = items.indexOf(primaryId);
        const newIndex = overId in currentDraft ? items.length - 1 : items.indexOf(overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          finalizedDraft = {
            ...currentDraft,
            [overContainer]: arrayMove(items, oldIndex, newIndex),
          };
        }
      }

      const payload = computeReorderPayloadFromDraft(
        finalizedDraft,
        allPins,
        primaryId,
        currentMovingIds
      );

      // Commit optimistic layout & clear drag state in one React 18 automatic batch.
      // `settlingPinId` keeps the target card hidden on Render 1 until @dnd-kit's
      // AnimationManager sets `active.node.style.opacity = '0'` on Render 2.
      setSettlingPinId(primaryId);
      if (settlingRafRef.current !== null) {
        cancelAnimationFrame(settlingRafRef.current);
      }
      settlingRafRef.current = requestAnimationFrame(() => {
        settlingRafRef.current = null;
        setSettlingPinId(null);
      });

      void commitPinsLayout(payload);
      resetDragState();
    },
    [allPins, movingPinIds, batchToggleFocus, commitPinsLayout, onAutoExpandTrack, resetDragState]
  );

  const handleDragCancel = useCallback(() => {
    resetDragState();
  }, [resetDragState]);

  // Static visible lists grouped by container (no mid-drag array churn!)
  const { renderedGeneralPins, renderedPinsByTrack } = useMemo(() => {
    const general: WorkspacePin[] = [];
    const byTrack: Record<string, WorkspacePin[]> = {};

    for (const pin of visiblePins) {
      if (!pin.trackId) {
        general.push(pin);
      } else {
        if (!byTrack[pin.trackId]) byTrack[pin.trackId] = [];
        byTrack[pin.trackId].push(pin);
      }
    }
    return { renderedGeneralPins: general, renderedPinsByTrack: byTrack };
  }, [visiblePins]);

  const companionPinIds = useMemo(() => {
    if (movingPinIds.length <= 1) return null;
    return new Set(movingPinIds.slice(1));
  }, [movingPinIds]);

  const activePin = activePinId ? pinById.get(activePinId) || null : null;

  return {
    sensors,
    collisionDetection,
    activePin,
    activePinId,
    settlingPinId,
    activeCardHeight,
    movingPinIds,
    companionPinIds,
    isDragging: activePinId !== null,
    overContainerId,
    crossInsertTarget,
    renderedGeneralPins,
    renderedPinsByTrack,
    handleDragStart,
    handleDragMove: handleDragUpdate,
    handleDragOver: handleDragUpdate,
    handleDragEnd,
    handleDragCancel,
  };
}
