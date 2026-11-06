import React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Pencil, GripVertical } from 'lucide-react';
import { FeedSourceMode } from '../../adapters/feeds/types';
import { FeedModeOption, DEFAULT_FEED_MODES, resolveStreamPrivacy } from './types';
import { SymbolIcon } from '../common/SymbolIcon';
import { StreamPrivacyBadge } from '../common/StreamPrivacyBadge';

export interface FeedStreamSourceRowProps {
  streamSource: FeedSourceMode;
  onSetStreamSource: (source: FeedSourceMode) => void;
  sourceModes?: FeedModeOption[];

  // Edit Mode Props
  isEditMode?: boolean;
  onEditSourceTab?: (tab: FeedModeOption) => void;
  onAddSourceTab?: () => void;
  onReorderSourceModes?: (modes: FeedModeOption[]) => void;
}

interface SortableStreamTabItemProps {
  mode: FeedModeOption;
  isActive: boolean;
  isEditMode: boolean;
  onClick: () => void;
}

const SortableStreamTabItem: React.FC<SortableStreamTabItemProps> = ({
  mode,
  isActive,
  isEditMode,
  onClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: mode.id,
    disabled: !isEditMode,
  });

  const horizontalTransform = transform
    ? { ...transform, y: 0, scaleX: 1, scaleY: 1 }
    : null;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(horizontalTransform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      type="button"
      onClick={onClick}
      className={`group relative px-3 py-1.5 rounded-lg transition-colors duration-150 flex items-center gap-1.5 font-medium whitespace-nowrap shrink-0 select-none ${
        isEditMode
          ? 'cursor-grab active:cursor-grabbing hover:bg-slate-200/60 dark:hover:bg-[#1f2b38]'
          : 'cursor-pointer'
      } ${
        isActive
          ? 'bg-white dark:bg-[#243343] text-[#2481cc] dark:text-white shadow-xs font-medium'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
      } ${isDragging ? 'ring-2 ring-[#2481cc] shadow-md bg-white dark:bg-[#243343]' : ''}`}
      title={
        isEditMode
          ? `Редактировать раздел: ${mode.label}`
          : `Переключить на: ${mode.label}`
      }
    >
      {isEditMode && (
        <GripVertical className="w-3 h-3 text-slate-400 dark:text-slate-500 -ml-0.5 opacity-60 group-hover:opacity-100" />
      )}
      <SymbolIcon icon={mode.emoji} fallback="📁" className="text-xs" />
      <span>{mode.label}</span>

      {/* Stream Privacy Badge: Public Stream vs Private Stream */}
      <StreamPrivacyBadge privacy={resolveStreamPrivacy(mode)} size="xs" />

      {mode.badge && (
        <span className="text-[9px] px-1 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#2481cc] dark:text-blue-300 font-mono font-bold">
          {mode.badge}
        </span>
      )}

      {/* Edit Mode Pencil Badge */}
      {isEditMode && (
        <span
          className="absolute -top-1 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs pointer-events-none z-10 ring-1 ring-white dark:ring-[#18222d]"
          title="Нажмите для редактирования"
        >
          <Pencil className="w-2 h-2" />
        </span>
      )}
    </button>
  );
};

export const FeedStreamSourceRow: React.FC<FeedStreamSourceRowProps> = ({
  streamSource,
  onSetStreamSource,
  sourceModes = DEFAULT_FEED_MODES,
  isEditMode = false,
  onEditSourceTab,
  onAddSourceTab,
  onReorderSourceModes,
}) => {
  const isDraggingRef = React.useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px threshold prevents accidental drag when simply clicking
      },
    })
  );

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragCancel = () => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);

    const { active, over } = event;
    if (!over || active.id === over.id || !onReorderSourceModes) return;

    const oldIndex = sourceModes.findIndex((m) => m.id === active.id);
    const newIndex = sourceModes.findIndex((m) => m.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(sourceModes, oldIndex, newIndex);
      onReorderSourceModes(reordered);
    }
  };

  const itemIds = React.useMemo(() => sourceModes.map((m) => m.id), [sourceModes]);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto overflow-y-hidden no-scrollbar touch-scroll pt-2 pb-1.5 px-1 -mt-1">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={itemIds} strategy={horizontalListSortingStrategy}>
          <div className="inline-flex items-center p-0.5 rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-100/90 dark:bg-[#131b24] text-[11px] sm:text-xs font-medium">
            {sourceModes.map((mode) => {
              const isActive = streamSource === mode.id;

              const handleClick = () => {
                if (isDraggingRef.current) return;
                if (isEditMode && onEditSourceTab) {
                  onEditSourceTab(mode);
                } else {
                  onSetStreamSource(mode.id as FeedSourceMode);
                }
              };

              return (
                <SortableStreamTabItem
                  key={mode.id}
                  mode={mode}
                  isActive={isActive}
                  isEditMode={isEditMode}
                  onClick={handleClick}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add New Section/Tab Chip (Visible in Edit Mode) */}
      {isEditMode && onAddSourceTab && (
        <button
          type="button"
          onClick={onAddSourceTab}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-dashed border-amber-500/40 hover:border-amber-500 transition-all cursor-pointer shadow-2xs"
          title="Добавить новый раздел/таб в верхнюю панель"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Таб</span>
        </button>
      )}
    </div>
  );
};
