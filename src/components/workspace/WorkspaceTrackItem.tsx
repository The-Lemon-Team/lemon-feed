import React, { memo, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, Trash2 } from 'lucide-react';
import { WorkspacePin, WorkspaceTrack } from '@lenta/shared';
import { SortablePinList } from './SortablePinList';
import { toTrackContainerId } from './workspaceDnd.utils';

export interface WorkspaceTrackItemProps {
  track: WorkspaceTrack;
  pins: WorkspacePin[];
  isCollapsed: boolean;
  selectedPinIds: Set<string>;
  companionPinIds?: Set<string> | null;
  settlingPinId?: string | null;
  crossInsertIndex: number | null;
  activeCardHeight?: number;
  isDragging: boolean;
  isOverContainer: boolean;
  onToggleCollapse: (trackId: string) => void;
  onToggleSelectPin: (id: string) => void;
  onToggleFocus: (pin: WorkspacePin, e: React.MouseEvent) => void;
  onToggleAttention: (pin: WorkspacePin, e: React.MouseEvent) => void;
  onUnpin: (id: string) => void;
  onOpenDetail?: (noteId: string) => void;
  onDeleteTrack?: (track: WorkspaceTrack) => void;
}

export const WorkspaceTrackItem: React.FC<WorkspaceTrackItemProps> = memo(
  ({
    track,
    pins,
    isCollapsed,
    selectedPinIds,
    companionPinIds,
    settlingPinId,
    crossInsertIndex,
    activeCardHeight,
    isDragging,
    isOverContainer,
    onToggleCollapse,
    onToggleSelectPin,
    onToggleFocus,
    onToggleAttention,
    onUnpin,
    onOpenDetail,
    onDeleteTrack,
  }) => {
    const containerId = toTrackContainerId(track.id);
    const { setNodeRef } = useDroppable({
      id: containerId,
    });

    const itemIds = useMemo(() => pins.map((p) => p.id), [pins]);

    return (
      <div
        ref={setNodeRef}
        className={`rounded-xl p-1 -mx-1 transition-colors duration-200 ${
          isDragging && isOverContainer
            ? isCollapsed
              ? 'bg-blue-500/[0.12] dark:bg-blue-500/20 ring-2 ring-blue-500/50'
              : 'bg-blue-500/[0.06] dark:bg-blue-400/[0.08] ring-1 ring-blue-500/35'
            : ''
        }`}
      >
        <div
          onClick={() => onToggleCollapse(track.id)}
          className="group/track h-8 flex items-center justify-between px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors select-none"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                isCollapsed ? '-rotate-90' : 'rotate-0'
              }`}
            />
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: track.color || '#f59e0b' }}
            />
            <span className="font-semibold truncate">{track.title}</span>
            <span className="text-[10px] text-slate-400 font-mono shrink-0">
              ({pins.length})
            </span>
          </div>

          <div className="relative flex items-center justify-end shrink-0">
            <span
              className={`text-[10px] leading-none text-blue-600 dark:text-blue-400 font-mono font-semibold px-1.5 py-1 rounded bg-blue-500/10 transition-opacity duration-150 ${
                isDragging && isOverContainer ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {isCollapsed ? 'Раскрыть / сюда' : 'В этот трек'}
            </span>

            {onDeleteTrack && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTrack(track);
                }}
                className={`absolute right-0 p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-opacity cursor-pointer ${
                  isDragging
                    ? 'invisible pointer-events-none'
                    : 'opacity-0 group-hover/track:opacity-100'
                }`}
                title="Удалить трек"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
            isCollapsed
              ? 'grid-rows-[0fr] opacity-0 pointer-events-none'
              : 'grid-rows-[1fr] opacity-100'
          }`}
        >
          <div className="overflow-hidden">
            <div className="pt-2 pb-1.5 pl-2 pr-0.5 ml-1.5 border-l-2 border-slate-100 dark:border-white/10">
              <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                {pins.length === 0 ? (
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
                        ? 'Отпустите, чтобы переместить в этот трек'
                        : 'В этом треке пока нет заметок'}
                    </p>
                  </div>
                ) : (
                  <SortablePinList
                    pins={pins}
                    disabled={isCollapsed}
                    selectedPinIds={selectedPinIds}
                    companionPinIds={companionPinIds}
                    settlingPinId={settlingPinId}
                    crossInsertIndex={isCollapsed ? null : crossInsertIndex}
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
          </div>
        </div>
      </div>
    );
  }
);

WorkspaceTrackItem.displayName = 'WorkspaceTrackItem';
