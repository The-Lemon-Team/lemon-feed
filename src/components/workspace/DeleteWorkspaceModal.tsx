import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { Workspace } from '@lenta/shared';

interface DeleteWorkspaceModalProps {
  isOpen: boolean;
  workspace: Workspace | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteWorkspaceModal: React.FC<DeleteWorkspaceModalProps> = ({
  isOpen,
  workspace,
  onClose,
  onConfirm,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
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

  if (!isOpen || !workspace) return null;

  const targetTitle = workspace.title.trim();
  const isMatch = confirmText.trim() === targetTitle;

  const handleDelete = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isMatch || isDeleting) return;

    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || 'Не удалось удалить рабочее пространство'
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
        className="w-full max-w-md bg-white dark:bg-[#18222d] rounded-2xl shadow-2xl border border-red-200 dark:border-red-900/40 overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-workspace-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/10 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 id="delete-workspace-title" className="text-sm font-bold text-slate-900 dark:text-white">
                Удалить воркспейс
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Подтверждение безвозвратного действия
              </p>
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

        {/* Form Body */}
        <form onSubmit={handleDelete} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Warning Message */}
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <p>
              Вы собираетесь удалить рабочее пространство{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">«{workspace.title}»</strong>.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-black/20 p-2.5 rounded-xl border border-slate-200 dark:border-white/10">
              ⚠️ Все тематические треки этого воркспейса также будут удалены. Сами заметки останутся в ленте, но связь с этим воркспейсом будет потеряна.
            </p>
          </div>

          {/* Confirmation Input Prompt */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Для подтверждения введите название воркспейса:
            </label>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 select-all border border-slate-200 dark:border-white/10">
              {targetTitle}
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Введите название воркспейса"
              autoFocus
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#10171e] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>

          {/* Action Buttons */}
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
              type="submit"
              disabled={!isMatch || isDeleting}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Удаление...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Удалить воркспейс</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
