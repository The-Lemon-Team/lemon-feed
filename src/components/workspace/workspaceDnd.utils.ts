import {
  CollisionDetection,
  closestCenter,
  closestCorners,
  rectIntersection,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { WorkspacePin, WorkspaceTrack, ReorderPinItemInput } from '@lenta/shared';

export const GENERAL_CONTAINER_ID = 'container:general';
export const FOCUS_CONTAINER_ID = 'container:focus';
export const FOCUS_PILL_CONTAINER_ID = 'container:focus-pill';
const TRACK_CONTAINER_PREFIX = 'container:track:';

export type DraftContainers = Record<string, string[]>;

export function toTrackContainerId(trackId: string): string {
  return `${TRACK_CONTAINER_PREFIX}${trackId}`;
}

export function isFocusContainerId(id: string): boolean {
  return id === FOCUS_CONTAINER_ID || id === FOCUS_PILL_CONTAINER_ID;
}

export function isWorkbenchContainerId(id: string): boolean {
  return id === GENERAL_CONTAINER_ID || id.startsWith(TRACK_CONTAINER_PREFIX);
}

export function containerIdToTrackId(containerId: string): string | null {
  if (containerId === GENERAL_CONTAINER_ID) return null;
  if (containerId.startsWith(TRACK_CONTAINER_PREFIX)) {
    return containerId.slice(TRACK_CONTAINER_PREFIX.length);
  }
  return null;
}

export function trackIdToContainerId(trackId: string | null | undefined): string {
  return trackId ? toTrackContainerId(trackId) : GENERAL_CONTAINER_ID;
}

/**
 * Builds the container -> pinIds map from visible pins and workspace tracks.
 * All visible pins remain in their origin containers during drag so zero DOM nodes
 * are mounted or unmounted on dragStart / dragOver (0.00px list size shift).
 */
export function buildInitialDraftContainers(
  visiblePins: WorkspacePin[],
  tracks: WorkspaceTrack[] | undefined
): DraftContainers {
  const containers: DraftContainers = {
    [GENERAL_CONTAINER_ID]: [],
  };

  if (tracks) {
    for (const t of tracks) {
      containers[toTrackContainerId(t.id)] = [];
    }
  }

  for (const pin of visiblePins) {
    const key = trackIdToContainerId(pin.trackId);
    if (!containers[key]) {
      containers[key] = [];
    }
    containers[key].push(pin.id);
  }

  return containers;
}

/**
 * Finds which container owns a given droppable/sortable ID.
 * If `id` itself is a container ID, returns `id`.
 */
export function findContainerOfId(
  containers: DraftContainers,
  id: string
): string | null {
  if (id in containers) return id;
  for (const containerId of Object.keys(containers)) {
    if (containers[containerId].includes(id)) {
      return containerId;
    }
  }
  return null;
}

/**
 * Custom collision detection tailored for vertically stacked workspace lists:
 * 1. Syncs live DOM element refs (`droppableNodesRef`) for live card slot measurements.
 * 2. Filters out hidden card droppables inside collapsed CSS-grid tracks so 0-height rects never steal hits.
 * 3. Prioritizes Focus drop targets (`FocusSlotsSection` or `FocusDropPill`) when cursor `(px, py)` enters them.
 * 4. Resolves the hovered track/general container using the floating card's visual center `(cx, cy)`
 *    against live DOM container rects so grabbing a card near its top or bottom edge never blocks
 *    reaching the first or last slot of a list.
 * 5. Scopes `closestCenter` strictly to the hovered track's own sortable items, compensating for any
 *    live vertical container offset (`deltaY`) caused by smooth track expansions above it.
 */
export function createWorkspaceCollisionDetection(
  getDraftContainers: () => DraftContainers | null,
  getCollapsedTracks: () => Set<string>,
  droppableNodesRef?: { current: Map<string, HTMLElement> }
): CollisionDetection {
  return (baseArgs) => {
    if (droppableNodesRef) {
      const nodeMap = droppableNodesRef.current;
      nodeMap.clear();
      for (const c of baseArgs.droppableContainers) {
        if (c.node.current) {
          nodeMap.set(String(c.id), c.node.current);
        }
      }
    }

    const draft = getDraftContainers();
    const collapsed = getCollapsedTracks();

    let hiddenCollapsedItemIds: Set<string> | null = null;
    if (draft && collapsed.size > 0) {
      hiddenCollapsedItemIds = new Set<string>();
      for (const trackId of collapsed) {
        const ids = draft[toTrackContainerId(trackId)];
        if (ids) {
          for (const id of ids) hiddenCollapsedItemIds.add(id);
        }
      }
    }

    const args =
      hiddenCollapsedItemIds && hiddenCollapsedItemIds.size > 0
        ? {
            ...baseArgs,
            droppableContainers: baseArgs.droppableContainers.filter(
              (c) => !hiddenCollapsedItemIds!.has(String(c.id))
            ),
          }
        : baseArgs;

    const getLiveRect = (c: (typeof args.droppableContainers)[number]) => {
      const el = c.node.current;
      return el ? el.getBoundingClientRect() : args.droppableRects.get(c.id);
    };

    // 1. Focus drop zone takes top priority when cursor points directly inside it
    if (args.pointerCoordinates) {
      const { x: px, y: py } = args.pointerCoordinates;
      for (const c of args.droppableContainers) {
        const cid = String(c.id);
        if (c.disabled || !isFocusContainerId(cid)) continue;
        const rect = getLiveRect(c);
        if (!rect || rect.width <= 0 || rect.height <= 0) continue;
        const pad = cid === FOCUS_PILL_CONTAINER_ID ? 4 : 0;
        if (
          px >= rect.left - pad &&
          px <= rect.right + pad &&
          py >= rect.top - pad &&
          py <= rect.bottom + pad
        ) {
          return [{ id: c.id, data: { droppableContainer: c, value: 0 } }];
        }
      }
    }

    // 2. Find hovered workbench container using the floating card's visual center `(cx, cy)`
    if (args.pointerCoordinates || args.collisionRect) {
      const cx = args.collisionRect
        ? args.collisionRect.left + args.collisionRect.width / 2
        : args.pointerCoordinates!.x;
      const cy = args.collisionRect
        ? args.collisionRect.top + args.collisionRect.height / 2
        : args.pointerCoordinates!.y;

      let matchedContainer: (typeof args.droppableContainers)[number] | null = null;
      let nearestEdgeContainer: (typeof args.droppableContainers)[number] | null = null;
      let nearestEdgeDist = 48;

      for (const c of args.droppableContainers) {
        if (c.disabled || !isWorkbenchContainerId(String(c.id))) continue;
        const rect = getLiveRect(c);
        if (!rect || rect.width <= 0 || rect.height <= 0) continue;

        if (cx >= rect.left - 24 && cx <= rect.right + 24 && cy >= rect.top && cy <= rect.bottom) {
          matchedContainer = c;
          break;
        }

        if (cx >= rect.left - 32 && cx <= rect.right + 32) {
          const vDist = cy < rect.top ? rect.top - cy : cy > rect.bottom ? cy - rect.bottom : 0;
          if (vDist < nearestEdgeDist) {
            nearestEdgeDist = vDist;
            nearestEdgeContainer = c;
          }
        }
      }

      const targetContainer = matchedContainer ?? nearestEdgeContainer;
      if (targetContainer && draft) {
        const containerId = String(targetContainer.id);
        const trackId = containerIdToTrackId(containerId);

        if (trackId && collapsed.has(trackId)) {
          return [
            {
              id: targetContainer.id,
              data: { droppableContainer: targetContainer, value: 0 },
            },
          ];
        }

        const itemIds = draft[containerId] || [];
        if (itemIds.length > 0) {
          const itemIdSet = new Set(itemIds);
          const scopedDroppables = args.droppableContainers.filter((c) =>
            itemIdSet.has(String(c.id))
          );
          if (scopedDroppables.length > 0) {
            const liveContainerRect = getLiveRect(targetContainer);
            const cachedContainerRect = args.droppableRects.get(targetContainer.id);
            const deltaY =
              liveContainerRect && cachedContainerRect
                ? liveContainerRect.top - cachedContainerRect.top
                : 0;

            const adjustedCollisionRect =
              deltaY !== 0
                ? {
                    ...args.collisionRect,
                    top: args.collisionRect.top - deltaY,
                    bottom: args.collisionRect.bottom - deltaY,
                  }
                : args.collisionRect;

            return closestCenter({
              ...args,
              collisionRect: adjustedCollisionRect,
              droppableContainers: scopedDroppables,
            });
          }
        }

        return [
          {
            id: targetContainer.id,
            data: { droppableContainer: targetContainer, value: 0 },
          },
        ];
      }
    }

    // Fallback for keyboard navigation or wide out-of-bounds drag
    const intersectionHits = rectIntersection(args);
    if (intersectionHits.length > 0) {
      return intersectionHits;
    }

    return closestCorners(args);
  };
}

/**
 * Computes the atomic `ReorderPinItemInput[]` commit payload from the finalized draft containers,
 * expanding multi-selected companion cards at the primary card's landing position and preserving
 * any pins currently hidden by search/attention filters.
 */
export function computeReorderPayloadFromDraft(
  finalDraft: DraftContainers,
  allPins: WorkspacePin[],
  primaryPinId: string,
  movingPinIds: string[]
): ReorderPinItemInput[] {
  const movingSet = new Set(movingPinIds);
  const visibleManagedIds = new Set<string>(movingPinIds);

  for (const ids of Object.values(finalDraft)) {
    for (const id of ids) {
      visibleManagedIds.add(id);
    }
  }

  const updates: ReorderPinItemInput[] = [];

  for (const [containerId, draftIds] of Object.entries(finalDraft)) {
    const targetTrackId = containerIdToTrackId(containerId);

    // Expand primaryPinId into all movingPinIds at the exact landing slot
    const expandedVisibleIds: string[] = [];
    for (const id of draftIds) {
      if (id === primaryPinId) {
        expandedVisibleIds.push(...movingPinIds);
      } else if (!movingSet.has(id)) {
        expandedVisibleIds.push(id);
      }
    }

    // Preserve any pins in this track that were hidden by search/attention filters
    const hiddenPinsInTrack = allPins.filter((p) => {
      const pTrack = p.trackId ?? null;
      return pTrack === targetTrackId && !visibleManagedIds.has(p.id);
    });

    const fullTrackPinIds = [
      ...expandedVisibleIds,
      ...hiddenPinsInTrack.map((p) => p.id),
    ];

    fullTrackPinIds.forEach((id, idx) => {
      updates.push({
        id,
        trackId: targetTrackId,
        order: idx * 10,
      });
    });
  }

  return updates;
}

export { arrayMove };
