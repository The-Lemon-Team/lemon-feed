import React, { memo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { WorkspacePin } from '@lenta/shared';
import { SortablePinCardItem } from './PinCardItem';

export interface SortablePinListProps {
  pins: WorkspacePin[];
  selectedPinIds: Set<string>;
  companionPinIds?: Set<string> | null;
  settlingPinId?: string | null;
  crossInsertIndex: number | null;
  activeCardHeight?: number;
  disabled?: boolean;
  onToggleSelectPin: (id: string) => void;
  onToggleFocus: (pin: WorkspacePin, e: React.MouseEvent) => void;
  onToggleAttention: (pin: WorkspacePin, e: React.MouseEvent) => void;
  onUnpin: (id: string) => void;
  onOpenDetail?: (noteId: string) => void;
}

interface SlotVisualState {
  y: number;
  animateMove: boolean;
}

const CARD_GAP_PX = 8; // matches Tailwind `space-y-2`

/**
 * Renders a vertical list of sortable workspace pin cards.
 * During cross-container hover (`crossInsertIndex !== null`), existing cards smoothly glide
 * apart via GPU `translate3d` (`200ms cubic-bezier(0.22, 1, 0.36, 1)`) while a permanently-mounted
 * bottom spacer smoothly expands the track height (`200ms`), revealing a natural card-sized
 * dashed landing slot with zero DOM mount/unmount micro-ticks.
 */
export const SortablePinList: React.FC<SortablePinListProps> = memo(
  ({
    pins,
    selectedPinIds,
    companionPinIds,
    settlingPinId,
    crossInsertIndex,
    activeCardHeight = 65,
    disabled = false,
    onToggleSelectPin,
    onToggleFocus,
    onToggleAttention,
    onUnpin,
    onOpenDetail,
  }) => {
    const listRef = useRef<HTMLDivElement | null>(null);
    const prevInsertIndexRef = useRef<number | null>(null);
    const prevPinsCountRef = useRef<number>(pins.length);
    const wasSlotOpenRef = useRef<boolean>(false);
    const dropFreezeRef = useRef<boolean>(false);
    const [, setFreezeReleaseTick] = useState(0);

    // Latch transition suppression across ALL synchronous pre-paint renders when a cross-dropped
    // card commits into our open slot, releasing only after the browser has painted Frame 1.
    if (crossInsertIndex !== null) {
      wasSlotOpenRef.current = true;
      dropFreezeRef.current = false;
    } else if (wasSlotOpenRef.current && pins.length > prevPinsCountRef.current) {
      dropFreezeRef.current = true;
      wasSlotOpenRef.current = false;
    }

    const suppressDropTransition = dropFreezeRef.current;

    const [slotState, setSlotState] = useState<SlotVisualState>({
      y: 0,
      animateMove: false,
    });

    useLayoutEffect(() => {
      prevPinsCountRef.current = pins.length;
      if (crossInsertIndex === null && !dropFreezeRef.current) {
        wasSlotOpenRef.current = false;
      }
    }, [pins.length, crossInsertIndex]);

    useEffect(() => {
      if (!suppressDropTransition) return;
      let raf2: number | null = null;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          dropFreezeRef.current = false;
          setFreezeReleaseTick((t) => t + 1);
        });
      });
      return () => {
        cancelAnimationFrame(raf1);
        if (raf2 !== null) cancelAnimationFrame(raf2);
      };
    }, [suppressDropTransition]);

    useLayoutEffect(() => {
      const prevIdx = prevInsertIndexRef.current;
      prevInsertIndexRef.current = crossInsertIndex;

      if (crossInsertIndex === null) {
        return;
      }

      const container = listRef.current;
      if (!container) return;

      const cardNodes = container.querySelectorAll<HTMLElement>('[data-pin-card="true"]');
      if (cardNodes.length === 0) return;

      let targetY = 0;
      if (crossInsertIndex <= 0) {
        targetY = cardNodes[0].offsetTop;
      } else if (crossInsertIndex >= cardNodes.length) {
        const last = cardNodes[cardNodes.length - 1];
        targetY = last.offsetTop + last.offsetHeight + CARD_GAP_PX;
      } else {
        targetY = cardNodes[crossInsertIndex].offsetTop;
      }

      const shouldAnimateMove = prevIdx !== null && prevIdx !== crossInsertIndex;
      setSlotState({
        y: targetY,
        animateMove: shouldAnimateMove,
      });
    }, [crossInsertIndex, pins.length]);

    const isSlotOpen = crossInsertIndex !== null;
    const slotStep = activeCardHeight + CARD_GAP_PX;

    return (
      <div ref={listRef} className="relative">
        {/* Permanently-mounted card-sized dashed landing slot (0 DOM mounts on hover) */}
        <div
          aria-hidden="true"
          style={{
            height: activeCardHeight,
            transform: `translate3d(0, ${slotState.y}px, 0)`,
            transition: suppressDropTransition
              ? 'none'
              : isSlotOpen && slotState.animateMove
              ? 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms ease-out'
              : 'opacity 160ms ease-out',
          }}
          className={`pointer-events-none absolute inset-x-0 top-0 rounded-xl border border-dashed border-blue-400/50 dark:border-blue-400/40 bg-blue-500/[0.04] dark:bg-blue-400/[0.06] ${
            isSlotOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div className="space-y-2">
          {pins.map((pin, idx) => {
            const nudgeY = isSlotOpen && idx >= crossInsertIndex ? slotStep : 0;

            return (
              <SortablePinCardItem
                key={pin.id}
                pin={pin}
                disabled={disabled}
                nudgeY={nudgeY}
                disableNudgeTransition={suppressDropTransition}
                isSettling={settlingPinId === pin.id}
                isCompanionDragging={Boolean(companionPinIds?.has(pin.id))}
                isSelected={selectedPinIds.has(pin.id)}
                onToggleSelectPin={onToggleSelectPin}
                onToggleFocus={onToggleFocus}
                onToggleAttention={onToggleAttention}
                onUnpin={onUnpin}
                onOpenDetail={onOpenDetail}
              />
            );
          })}
        </div>

        {/* Permanently-mounted smooth height spacer so track bounds glide instead of snapping */}
        <div
          aria-hidden="true"
          style={{
            height: isSlotOpen ? slotStep : 0,
          }}
          className={`pointer-events-none ${
            suppressDropTransition
              ? ''
              : 'transition-[height] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]'
          }`}
        />
      </div>
    );
  }
);

SortablePinList.displayName = 'SortablePinList';
