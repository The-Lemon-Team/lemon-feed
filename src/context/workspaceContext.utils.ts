import { WorkspacePin, ReorderPinItemInput } from '@lenta/shared';
import type { NoteMembership } from './WorkspaceContext';

/**
 * Deterministically sorts workspace pins by explicit `order` ASC,
 * falling back to `createdAt` ASC and `id` ASC to prevent ties from shuffling.
 */
export function sortPinsDeterministically(pins: WorkspacePin[]): WorkspacePin[] {
  return [...pins].sort((a, b) => {
    const orderDiff = (a.order ?? 0) - (b.order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    if (a.createdAt && b.createdAt && a.createdAt !== b.createdAt) {
      return a.createdAt < b.createdAt ? -1 : 1;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Filters layout updates down to only those pins whose `trackId` or `order`
 * actually changed compared to current state. Prevents redundant API calls.
 */
export function diffPinLayoutUpdates(
  currentPins: WorkspacePin[],
  updates: ReorderPinItemInput[]
): ReorderPinItemInput[] {
  if (updates.length === 0) return [];

  const currentById = new Map<string, WorkspacePin>();
  for (const pin of currentPins) {
    currentById.set(pin.id, pin);
  }

  return updates.filter((u) => {
    const existing = currentById.get(u.id);
    if (!existing) return false;

    const currentTrackId = existing.trackId ?? null;
    const nextTrackId = u.trackId !== undefined ? (u.trackId ?? null) : currentTrackId;
    const trackChanged = nextTrackId !== currentTrackId;
    const orderChanged = u.order !== (existing.order ?? 0);

    return trackChanged || orderChanged;
  });
}

/**
 * Applies batch layout updates (`trackId` & `order`) in a single O(N) pass
 * and returns a deterministically sorted `WorkspacePin[]` array.
 */
export function applyOptimisticLayoutUpdates(
  prevPins: WorkspacePin[],
  updates: ReorderPinItemInput[]
): WorkspacePin[] {
  if (updates.length === 0) return prevPins;

  const updateMap = new Map<string, ReorderPinItemInput>();
  for (const u of updates) {
    updateMap.set(u.id, u);
  }

  let mutated = false;
  const next = prevPins.map((pin) => {
    const u = updateMap.get(pin.id);
    if (!u) return pin;

    const nextTrackId = u.trackId !== undefined ? (u.trackId ?? null) : (pin.trackId ?? null);
    if (nextTrackId === (pin.trackId ?? null) && u.order === pin.order) {
      return pin;
    }

    mutated = true;
    return {
      ...pin,
      trackId: nextTrackId,
      order: u.order,
    };
  });

  return mutated ? sortPinsDeterministically(next) : prevPins;
}

/**
 * Syncs `NoteMembership[]` track assignments in O(N) when pins move across tracks.
 */
export function syncMembershipsWithLayoutUpdates(
  prevMemberships: NoteMembership[],
  activeWorkspaceId: string,
  currentPins: WorkspacePin[],
  updates: ReorderPinItemInput[]
): NoteMembership[] {
  const trackByNoteId = new Map<string, string | null>();
  const pinById = new Map<string, WorkspacePin>();

  for (const pin of currentPins) {
    pinById.set(pin.id, pin);
  }

  for (const u of updates) {
    if (u.trackId === undefined) continue;
    const pin = pinById.get(u.id);
    if (pin) {
      trackByNoteId.set(pin.noteId, u.trackId ?? null);
    }
  }

  if (trackByNoteId.size === 0) return prevMemberships;

  let changed = false;
  const next = prevMemberships.map((m) => {
    if (m.workspaceId !== activeWorkspaceId) return m;
    if (!trackByNoteId.has(m.noteId)) return m;

    const nextTrackId = trackByNoteId.get(m.noteId) ?? null;
    if (m.trackId === nextTrackId) return m;

    changed = true;
    return { ...m, trackId: nextTrackId };
  });

  return changed ? next : prevMemberships;
}
