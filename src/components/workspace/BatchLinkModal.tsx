import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Link2, Check, ArrowRight } from 'lucide-react';
import { WorkspacePin } from '@lenta/shared';
import { useWorkspace } from '../../context/WorkspaceContext';

interface BatchLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPins: WorkspacePin[];
  onSuccess?: () => void;
}

export const BatchLinkModal: React.FC<BatchLinkModalProps> = ({
  isOpen,
  onClose,
  selectedPins,
  onSuccess,
}) => {
  const { batchLinkNotes } = useWorkspace();
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize selected parent to the first PERIOD note, or the first note
  useEffect(() => {
    if (selectedPins.length > 0) {
      const periodNote = selectedPins.find((p) => p.note?.type === 'PERIOD');
      setSelectedParentId(periodNote?.noteId || selectedPins[0].noteId);
      setError(null);
    }
  }, [selectedPins, isOpen]);

  // Escape key handler per AGENTS.md
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || selectedPins.length === 0) return null;

  const childPins = selectedPins.filter((p) => p.noteId !== selectedParentId);
  const parentPin = selectedPins.find((p) => p.noteId === selectedParentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentId) {
      setError('Выберите родительскую заметку или период');
      return;
    }
    if (childPins.length === 0) {
      setError('Выберите как минимум 1 дочернюю заметку для связывания');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await batchLinkNotes(
        selectedParentId,
        childPins.map((p) => p.noteId)
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Ошибка связывания');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#18222d] border border-slate-200 dark:border-white/10 shadow-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Связать заметки (Parent-Child)
              </h3>
              <p className="text-[11px] text-slate-500">
                Объединение {selectedPins.length} заметок в единую смысловую ветку
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Parent Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              1. Выберите родительскую заметку (Период или Главная):
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {selectedPins.map((pin) => {
                const isSelected = pin.noteId === selectedParentId;
                const isPeriod = pin.note?.type === 'PERIOD';
                return (
                  <button
                    key={`parent-${pin.id}`}
                    type="button"
                    onClick={() => setSelectedParentId(pin.noteId)}
                    className={`w-full p-2 rounded-xl text-left border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isPeriod && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-600 font-mono">
                            ПЕРИОД
                          </span>
                        )}
                        <span className="text-xs font-medium truncate block">
                          {pin.note?.title || 'Без названия'}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Child Notes summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              2. Дочерние заметки ({childPins.length}):
            </label>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 space-y-1 max-h-28 overflow-y-auto text-xs text-slate-600 dark:text-slate-400">
              {childPins.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 truncate">
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{c.note?.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || childPins.length === 0}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Связывание...' : 'Подтвердить связку'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
