import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { WorkspacePin, WorkspaceTrack } from '@lenta/shared';
import { PinCardItem } from './PinCardItem';

export interface WorkspaceTrackItemProps {
  track: WorkspaceTrack;
  pins: WorkspacePin[];
  isCollapsed: boolean;
  selectedPinIds: Set<string>;
  onToggleCollapse: () => void;
  onToggleSelectPin: (id: string) => void;
  onToggleFocus: (pin: WorkspacePin, e: React.MouseEvent) => void;
  onToggleAttention: (pin: WorkspacePin, e: React.MouseEvent) => void;
  onUnpin: (id: string) => void;
  onOpenDetail?: (noteId: string) => void;
}

export const WorkspaceTrackItem: React.FC<WorkspaceTrackItemProps> = ({
  track,
  pins,
  isCollapsed,
  selectedPinIds,
  onToggleCollapse,
  onToggleSelectPin,
  onToggleFocus,
  onToggleAttention,
  onUnpin,
  onOpenDetail,
}) => {
  return (
    <div className="space-y-2">
      <div
        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-1.5">
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: track.color || '#f59e0b' }}
          />
          <span>{track.title}</span>
          <span className="text-[10px] text-slate-400 font-mono">({pins.length})</span>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-2 pl-2 border-l border-slate-100 dark:border-white/10">
          {pins.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic py-1 pl-2">
              В этом треке пока нет заметок
            </p>
          ) : (
            pins.map((pin) => (
              <PinCardItem
                key={pin.id}
                pin={pin}
                isSelected={selectedPinIds.has(pin.id)}
                onToggleSelect={() => onToggleSelectPin(pin.id)}
                onToggleFocus={(e) => onToggleFocus(pin, e)}
                onToggleAttention={(e) => onToggleAttention(pin, e)}
                onUnpin={() => onUnpin(pin.id)}
                onOpenDetail={() => onOpenDetail?.(pin.noteId)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
