import React, { memo, useCallback } from 'react';
import {
  useSortable,
  defaultAnimateLayoutChanges,
  AnimateLayoutChanges,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, ExternalLink, X, Pin, GripVertical } from 'lucide-react';
import { WorkspacePin } from '@lenta/shared';

export interface PinCardItemProps {
  pin: WorkspacePin;
  isSelected: boolean;
  onToggleSelectPin: (pinId: string) => void;
  onToggleFocus?: (pin: WorkspacePin, e: React.MouseEvent) => void;
  onToggleAttention: (pin: WorkspacePin, e: React.MouseEvent) => void;
  onUnpin: (pinId: string) => void;
  onOpenDetail?: (noteId: string) => void;

  // DnD / Visual state
  showDragHandle?: boolean;
  isDragging?: boolean;
  isCompanionDragging?: boolean;
  isSettling?: boolean;
  nudgeY?: number;
  disableNudgeTransition?: boolean;
  isOverlay?: boolean;
  dragCount?: number;
  sortableAttributes?: React.HTMLAttributes<HTMLElement>;
  sortableListeners?: Record<string, any>;
  containerRef?: (node: HTMLElement | null) => void;
  containerStyle?: React.CSSProperties;
  isSortableSlot?: boolean;
}

const stopPointerPropagation = (e: React.PointerEvent) => {
  e.stopPropagation();
};

export const PinCardItem: React.FC<PinCardItemProps> = memo(
  ({
    pin,
    isSelected,
    onToggleSelectPin,
    onToggleFocus,
    onToggleAttention,
    onUnpin,
    onOpenDetail,
    showDragHandle = true,
    isDragging = false,
    isCompanionDragging = false,
    isSettling = false,
    nudgeY = 0,
    disableNudgeTransition = false,
    isOverlay = false,
    dragCount = 1,
    sortableAttributes,
    sortableListeners,
    containerRef,
    containerStyle,
    isSortableSlot = false,
  }) => {
    const isAttention = pin.status === 'NEEDS_ATTENTION';
    const isPeriod = pin.note?.type === 'PERIOD';
    const isPlaceholderSlot = (isDragging || isCompanionDragging) && !isOverlay;

    return (
      <div
        ref={containerRef}
        data-pin-card={isSortableSlot ? 'true' : undefined}
        style={containerStyle}
        {...sortableAttributes}
        {...sortableListeners}
        onClick={() => {
          if (!isOverlay) onToggleSelectPin(pin.id);
        }}
        className={`group relative rounded-xl select-none touch-manipulation ${
          isOverlay ? 'animate-dnd-lift cursor-grabbing z-50' : ''
        }`}
      >
        {/* Multi-drag physical card stack layers underneath overlay */}
        {isOverlay && dragCount > 1 && (
          <>
            {dragCount > 2 && (
              <div
                aria-hidden="true"
                className="absolute inset-x-3.5 -bottom-2.5 h-full rounded-xl bg-slate-100 dark:bg-[#16202a] border border-blue-400/40 shadow-md pointer-events-none"
              />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-x-1.5 -bottom-1.5 h-full rounded-xl bg-slate-50 dark:bg-[#192430] border border-blue-400/60 shadow-md pointer-events-none"
            />
          </>
        )}

        <div
          style={
            !isOverlay && nudgeY !== 0
              ? { transform: `translate3d(0, ${nudgeY}px, 0)` }
              : undefined
          }
          className={`relative p-2.5 rounded-xl border text-left ${
            isSettling && !isOverlay ? 'opacity-0' : ''
          } ${
            disableNudgeTransition
              ? 'transition-[background-color,border-color,box-shadow] duration-150'
              : 'transition-[transform,background-color,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]'
          } ${
            isOverlay
              ? 'bg-white dark:bg-[#1d2a37] border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/25 shadow-elevated'
              : isPlaceholderSlot
              ? 'border-dashed border-blue-400/50 dark:border-blue-400/40 bg-blue-500/[0.04] dark:bg-blue-400/[0.06]'
              : isSelected
              ? 'bg-blue-50/80 dark:bg-blue-900/15 border-blue-400/80 cursor-grab active:cursor-grabbing'
              : pin.isPinned
              ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.06] border-amber-500/30 dark:border-amber-500/20 cursor-grab active:cursor-grabbing'
              : 'bg-white dark:bg-[#1a2530] border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 cursor-grab active:cursor-grabbing'
          }`}
        >
          <div className={`space-y-1.5 ${isPlaceholderSlot ? 'invisible pointer-events-none' : ''}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {showDragHandle && (
                <div
                  className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors p-0.5 -ml-1 shrink-0"
                  title="Перетащить карточку"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
              )}

              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelectPin(pin.id)}
                onPointerDown={stopPointerPropagation}
                onClick={(e) => e.stopPropagation()}
                className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer shrink-0"
              />

              {isPeriod ? (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-600 dark:text-violet-400 font-bold shrink-0">
                  ПЕРИОД
                </span>
              ) : (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 shrink-0">
                  {pin.note?.type || 'EVENT'}
                </span>
              )}

              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {pin.note?.title || 'Заметка'}
              </span>

              {isOverlay && dragCount > 1 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-bold shrink-0 shadow-sm">
                  ×{dragCount}
                </span>
              )}
            </div>

            <div
              className="flex items-center gap-0.5 shrink-0"
              onPointerDown={stopPointerPropagation}
            >
              {onToggleFocus && (
                <button
                  type="button"
                  onClick={(e) => onToggleFocus(pin, e)}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    pin.isPinned
                      ? 'text-amber-500 bg-amber-500/15'
                      : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                  title={pin.isPinned ? 'Снять из фокусных слотов' : 'Закрепить в фокусные слоты'}
                >
                  <Pin className={`w-3.5 h-3.5 ${pin.isPinned ? 'fill-current' : ''}`} />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => onToggleAttention(pin, e)}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isAttention
                    ? 'text-amber-500 bg-amber-500/15'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
                title={isAttention ? 'Снять статус внимания' : 'Отметить: Требует внимания'}
              >
                <AlertCircle className="w-3.5 h-3.5" />
              </button>

              {onOpenDetail && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetail(pin.noteId);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                  title="Открыть заметку"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnpin(pin.id);
                }}
                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                title="Удалить из воркспейса"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {pin.comment && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-black/20 px-2 py-0.5 rounded font-mono truncate">
              💬 {pin.comment}
            </p>
          )}

          {pin.note?.feed?.title && (
            <div className="text-[10px] text-slate-400 font-mono truncate">
              Лента: {pin.note.feed.title}
            </div>
          )}
          </div>
        </div>
      </div>
    );
  }
);

PinCardItem.displayName = 'PinCardItem';

export interface SortablePinCardItemProps {
  pin: WorkspacePin;
  isSelected: boolean;
  disabled?: boolean;
  isCompanionDragging?: boolean;
  isSettling?: boolean;
  nudgeY?: number;
  disableNudgeTransition?: boolean;
  onToggleSelectPin: (pinId: string) => void;
  onToggleFocus?: (pin: WorkspacePin, e: React.MouseEvent) => void;
  onToggleAttention: (pin: WorkspacePin, e: React.MouseEvent) => void;
  onUnpin: (pinId: string) => void;
  onOpenDetail?: (noteId: string) => void;
}

const SORTABLE_TRANSITION = {
  duration: 210,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
};

export const SortablePinCardItem: React.FC<SortablePinCardItemProps> = memo((props) => {
  const animateLayoutChanges: AnimateLayoutChanges = useCallback(
    (args) => {
      if (props.disableNudgeTransition) return false;
      return defaultAnimateLayoutChanges(args);
    },
    [props.disableNudgeTransition]
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.pin.id,
    disabled: props.disabled,
    transition: SORTABLE_TRANSITION,
    animateLayoutChanges,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition || undefined,
    willChange: transform ? 'transform' : undefined,
  };

  return (
    <PinCardItem
      {...props}
      isSortableSlot={true}
      isDragging={isDragging}
      containerRef={setNodeRef}
      containerStyle={style}
      sortableAttributes={attributes}
      sortableListeners={listeners}
    />
  );
});

SortablePinCardItem.displayName = 'SortablePinCardItem';
