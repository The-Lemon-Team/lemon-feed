import React, { useState, useEffect } from 'react';
import { LemonModerationItem } from '@lenta/lemon-bus';
import { X, AlertTriangle } from 'lucide-react';

interface FeedBusRejectModalProps {
  item: LemonModerationItem | null;
  onClose: () => void;
  onConfirm: (id: string, reason: string) => void;
}

const PRESET_REASONS = [
  'Дубликат уже опубликованной новости',
  'Низкая информативность / кликбейт',
  'Офтопик для тематики ленты',
  'Рекламный контент или спам',
  'Устаревшая новость',
];

export const FeedBusRejectModal: React.FC<FeedBusRejectModalProps> = ({
  item,
  onClose,
  onConfirm,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');

  // Handle Escape key to close modal (Rule #7)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customReason.trim() || selectedPreset;
    onConfirm(item.id, finalReason);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-surface-container border border-outline-variant/30 shadow-xl p-5 space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-500 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Отклонение заметки</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-variant text-outline hover:text-on-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Note title preview */}
        <div className="p-3 rounded-lg bg-surface-container-highest/60 border border-outline-variant/30">
          <div className="text-[11px] font-mono text-outline">Заметка:</div>
          <div className="text-xs font-medium text-on-surface line-clamp-2 mt-0.5">
            {item.title}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-xs font-medium text-on-surface">
            Выберите причину отклонения:
          </label>

          <div className="space-y-1.5">
            {PRESET_REASONS.map((reason) => (
              <label
                key={reason}
                className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-highest/40 hover:bg-surface-container-highest text-xs text-on-surface cursor-pointer border border-transparent hover:border-outline-variant/30 transition-all"
              >
                <input
                  type="radio"
                  name="rejectPreset"
                  value={reason}
                  checked={selectedPreset === reason && !customReason}
                  onChange={() => {
                    setSelectedPreset(reason);
                    setCustomReason('');
                  }}
                  className="w-3.5 h-3.5 text-rose-500 focus:ring-rose-500"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          <div className="pt-1">
            <label className="block text-[11px] font-medium text-outline mb-1">
              Или введите свою причину:
            </label>
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Дополнительный комментарий..."
              className="w-full px-3 py-1.5 rounded-lg bg-surface-container-highest border border-outline-variant/40 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-variant transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors"
            >
              Подтвердить отклонение
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
