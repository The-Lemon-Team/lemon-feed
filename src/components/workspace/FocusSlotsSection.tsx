import React, { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Pin } from 'lucide-react';
import { WorkspacePin } from '@lenta/shared';
import { PinCardItem } from './PinCardItem';
import { FOCUS_CONTAINER_ID, FOCUS_PILL_CONTAINER_ID } from './workspaceDnd.utils';

export interface FocusDropPillProps {
  isDragging: boolean;
  isOverFocus: boolean;
}

/**
 * Zero-layout-shift inline drop target pill rendered inside the fixed `h-8` Workbench header
 * when `focusPins.length === 0`. Stays mounted in layout and toggles via opacity so starting
 * or ending a drag causes 0.00px vertical shift across the entire list.
 */
export const FocusDropPill: React.FC<FocusDropPillProps> = memo(
  ({ isDragging, isOverFocus }) => {
    const { setNodeRef } = useDroppable({
      id: FOCUS_PILL_CONTAINER_ID,
      disabled: !isDragging,
    });

    return (
      <div
        ref={setNodeRef}
        aria-hidden={!isDragging}
        className={`h-6 flex items-center gap-1 px-2.5 rounded-full text-[10px] leading-none font-mono font-bold border transition-[opacity,transform,background-color,border-color,color] duration-150 select-none shrink-0 ${
          !isDragging
            ? 'opacity-0 pointer-events-none border-transparent'
            : isOverFocus
            ? 'opacity-100 bg-amber-500 text-white border-amber-500 scale-105 shadow-sm'
            : 'opacity-100 bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40 border-dashed'
        }`}
      >
        <Pin className="w-3 h-3 fill-current shrink-0" />
        <span>{isOverFocus ? 'Закрепить в фокус' : 'В фокус'}</span>
      </div>
    );
  }
);

FocusDropPill.displayName = 'FocusDropPill';

export interface FocusSlotsSectionProps {
  focusPins: WorkspacePin[];
  selectedPinIds: Set<string>;
  isDragging: boolean;
  isOverFocus: boolean;
  onToggleSelectPin: (id: string) => void;
  onToggleFocus: (pin: WorkspacePin, e: React.MouseEvent) => void;
  onToggleAttention: (pin: WorkspacePin, e: React.MouseEvent) => void;
  onUnpin: (id: string) => void;
  onOpenDetail?: (noteId: string) => void;
}

export const FocusSlotsSection: React.FC<FocusSlotsSectionProps> = memo(
  ({
    focusPins,
    selectedPinIds,
    isDragging,
    isOverFocus,
    onToggleSelectPin,
    onToggleFocus,
    onToggleAttention,
    onUnpin,
    onOpenDetail,
  }) => {
    const hasFocusPins = focusPins.length > 0;
    const { setNodeRef } = useDroppable({
      id: FOCUS_CONTAINER_ID,
      disabled: !hasFocusPins,
    });

    if (!hasFocusPins) return null;

    return (
      <div
        ref={setNodeRef}
        className={`space-y-2 p-3 rounded-2xl border transition-colors duration-200 ${
          isDragging && isOverFocus
            ? 'bg-amber-500/[0.18] dark:bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40'
            : 'bg-amber-500/[0.07] dark:bg-amber-500/[0.08] border-amber-500/30'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Pin className="w-3 h-3 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider font-mono">
                  Фокусные слоты
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300">
                  {focusPins.length}
                </span>
              </div>
              <p className="text-[10px] text-amber-800/70 dark:text-amber-300/60 leading-tight truncate">
                {isDragging && isOverFocus
                  ? 'Отпустите, чтобы закрепить в фокусные слоты'
                  : 'Заметки под особым вниманием в этом воркспейсе'}
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] leading-none text-amber-600 dark:text-amber-300 font-mono font-bold px-1.5 py-1 rounded bg-amber-500/15 shrink-0 transition-opacity duration-150 ${
              isDragging ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            📌 Сюда в фокус
          </span>
        </div>

        <div className="space-y-2 pt-1">
          {focusPins.map((pin) => (
            <PinCardItem
              key={pin.id}
              pin={pin}
              showDragHandle={false}
              isSelected={selectedPinIds.has(pin.id)}
              onToggleSelectPin={onToggleSelectPin}
              onToggleFocus={onToggleFocus}
              onToggleAttention={onToggleAttention}
              onUnpin={onUnpin}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      </div>
    );
  }
);

FocusSlotsSection.displayName = 'FocusSlotsSection';
