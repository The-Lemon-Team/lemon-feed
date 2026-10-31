import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Trash2, X, Loader2 } from 'lucide-react';
import { WorkspaceTrack } from '@lenta/shared';

interface DeleteTrackModalProps {
  isOpen: boolean;
  track: WorkspaceTrack | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteTrackModal: React.FC<DeleteTrackModalProps> = ({
  isOpen,
  track,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen]);

  // Escape key handling per AGENTS.md
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

  if (!isOpen || !track) return null;

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || 'Не удалось удалить трек'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-[#18222d] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-track-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 id="delete-track-title" className="text-sm font-bold text-slate-900 dark:text-white">
                Удалить трек?
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            title="Закрыть"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300">
              {error}
            </div>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Вы уверены, что хотите удалить трек{' '}
            <strong className="text-slate-900 dark:text-white font-semibold">«{track.title}»</strong>?
          </p>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-black/20 p-2.5 rounded-xl border border-slate-200 dark:border-white/10">
            ℹ️ Заметки не пропадут: они останутся в воркспейсе и будут перемещены в раздел «Общие заметки».
          </p>

          {/* Action Buttons: simple "Удалить" and "Отмена" */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Удаление...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Удалить</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
