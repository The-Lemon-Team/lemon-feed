import React from 'react';
import { Pin } from 'lucide-react';
import { WorkspacePin } from '@lenta/shared';
import { PinCardItem } from './PinCardItem';

export interface FocusSlotsSectionProps {
  focusPins: WorkspacePin[];
  selectedPinIds: Set<string>;
  onToggleSelectPin: (id: string) => void;
  onToggleFocus: (pin: WorkspacePin, e: React.MouseEvent) => void;
  onToggleAttention: (pin: WorkspacePin, e: React.MouseEvent) => void;
  onUnpin: (id: string) => void;
  onOpenDetail?: (noteId: string) => void;
}

export const FocusSlotsSection: React.FC<FocusSlotsSectionProps> = ({
  focusPins,
  selectedPinIds,
  onToggleSelectPin,
  onToggleFocus,
  onToggleAttention,
  onUnpin,
  onOpenDetail,
}) => {
  if (focusPins.length === 0) return null;

  return (
    <div className="space-y-2 p-3 rounded-2xl bg-amber-500/[0.07] dark:bg-amber-500/[0.08] border border-amber-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Pin className="w-3 h-3 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider font-mono">
                Фокусные слоты
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300">
                {focusPins.length}
              </span>
            </div>
            <p className="text-[10px] text-amber-800/70 dark:text-amber-300/60 leading-tight">
              Заметки под особым вниманием в этом воркспейсе
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {focusPins.map((pin) => (
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
        ))}
      </div>
    </div>
  );
};
