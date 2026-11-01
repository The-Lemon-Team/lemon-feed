import React, { memo, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { WorkspacePin } from '@lenta/shared';
import { SortablePinList } from './SortablePinList';
import { GENERAL_CONTAINER_ID } from './workspaceDnd.utils';

export interface GeneralNotesSectionProps {
  generalPins: WorkspacePin[];
  selectedPinIds: Set<string>;
  companionPinIds?: Set<string> | null;
  settlingPinId?: string | null;
  crossInsertIndex: number | null;
  activeCardHeight?: number;
  isDragging: boolean;
  isOverContainer: boolean;
  onToggleSelectPin: (id: string) => void;
  onToggleFocus: (pin: WorkspacePin, e: React.MouseEvent) => void;
  onToggleAttention: (pin: WorkspacePin, e: React.MouseEvent) => void;
  onUnpin: (id: string) => void;
  onOpenDetail?: (noteId: string, note?: any) => void;
}

export const GeneralNotesSection: React.FC<GeneralNotesSectionProps> = memo(
  ({
    generalPins,
    selectedPinIds,
    companionPinIds,
    settlingPinId,
    crossInsertIndex,
    activeCardHeight,
    isDragging,
    isOverContainer,
    onToggleSelectPin,
    onToggleFocus,
    onToggleAttention,
    onUnpin,
    onOpenDetail,
  }) => {
    const { setNodeRef } = useDroppable({
      id: GENERAL_CONTAINER_ID,
    });

    const itemIds = useMemo(() => generalPins.map((p) => p.id), [generalPins]);

    return (
      <div
        ref={setNodeRef}
        className={`space-y-2 rounded-xl p-1 -mx-1 transition-colors duration-200 ${
          isDragging && isOverContainer
            ? 'bg-blue-500/[0.06] dark:bg-blue-400/[0.08] ring-1 ring-blue-500/35'
            : ''
        }`}
      >
        <div className="h-5 flex items-center justify-between px-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <span>⭐ Общие заметки</span>
            <span className="font-mono text-[10px]">({generalPins.length})</span>
          </div>

          <span
            className={`text-[10px] leading-none text-blue-600 dark:text-blue-400 font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 transition-opacity duration-150 ${
              isDragging && isOverContainer ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            В общие заметки
          </span>
        </div>

        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {generalPins.length === 0 ? (
            <div
              className={`h-[65px] px-3 rounded-xl border border-dashed flex flex-col items-center justify-center text-center transition-colors duration-200 ${
                isDragging && isOverContainer
                  ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300'
                  : isDragging
                  ? 'border-blue-400/40 bg-blue-50/20 dark:bg-blue-900/10 text-slate-500 dark:text-slate-400'
                  : 'border-slate-200 dark:border-white/10 text-slate-400'
              }`}
            >
              <p className="text-[11px] font-medium leading-4 transition-colors duration-150">
                {isDragging && isOverContainer
                  ? 'Отпустите, чтобы переместить в общие заметки'
                  : 'В общих заметках пока нет элементов'}
              </p>
            </div>
          ) : (
            <SortablePinList
              pins={generalPins}
              selectedPinIds={selectedPinIds}
              companionPinIds={companionPinIds}
              settlingPinId={settlingPinId}
              crossInsertIndex={crossInsertIndex}
              activeCardHeight={activeCardHeight}
              onToggleSelectPin={onToggleSelectPin}
              onToggleFocus={onToggleFocus}
              onToggleAttention={onToggleAttention}
              onUnpin={onUnpin}
              onOpenDetail={onOpenDetail}
            />
          )}
        </SortableContext>
      </div>
    );
  }
);

GeneralNotesSection.displayName = 'GeneralNotesSection';
