import React, { useState, useRef, useEffect } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useDeleteNote } from '../api/queries';

export interface FeedNoteDeleteButtonProps {
  noteId: string;
  noteTitle?: string;
  onDeleted?: () => void;
  variant?: 'icon' | 'button' | 'ghost';
  size?: 'sm' | 'md';
  className?: string;
  title?: string;
  showLabel?: boolean;
  confirmPlacement?: 'top' | 'bottom' | 'left' | 'right';
}

export const FeedNoteDeleteButton: React.FC<FeedNoteDeleteButtonProps> = ({
  noteId,
  noteTitle,
  onDeleted,
  variant = 'button',
  size = 'sm',
  className = '',
  title = 'Удалить запись',
  showLabel = true,
  confirmPlacement = 'top',
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const deleteNoteMutation = useDeleteNote();

  // Close on outside click or Escape (captured phase prevents closing parent modals)
  useEffect(() => {
    if (!isConfirmOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsConfirmOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsConfirmOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isConfirmOpen]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteError(null);
    try {
      await deleteNoteMutation.mutateAsync(noteId);
      setIsConfirmOpen(false);
      onDeleted?.();
    } catch (err: any) {
      console.error('Failed to delete note:', err);
      setDeleteError(err.response?.data?.message || err.message || 'Ошибка удаления записи');
    }
  };

  const isDeleting = deleteNoteMutation.isPending;

  const placementClasses = {
    top: 'bottom-full mb-1.5 right-0',
    bottom: 'top-full mt-1.5 right-0',
    left: 'right-full mr-1.5 top-0',
    right: 'left-full ml-1.5 top-0',
  }[confirmPlacement];

  return (
    <div className="relative inline-flex items-center shrink-0" ref={popoverRef}>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsConfirmOpen((prev) => !prev);
          }}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ${className}`}
          title={title}
          aria-label={title}
        >
          <Trash2 className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        </button>
      ) : variant === 'ghost' ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsConfirmOpen((prev) => !prev);
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer ${className}`}
          title={title}
        >
          <Trash2 className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          {showLabel && <span>{title}</span>}
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsConfirmOpen((prev) => !prev);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer ${className}`}
          title={title}
        >
          <Trash2 className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          {showLabel && <span>{title}</span>}
        </button>
      )}

      {/* Confirmation Floating Popover */}
      {isConfirmOpen && (
        <div
          className={`absolute z-[1200] p-3 rounded-xl bg-white dark:bg-[#1a232f] border border-rose-300 dark:border-rose-800/60 shadow-2xl flex flex-col gap-2.5 min-w-[220px] max-w-[280px] text-left select-none animate-in fade-in zoom-in-95 duration-100 ${placementClasses}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">
              <div className="text-xs font-sans font-semibold text-slate-900 dark:text-rose-200">
                Удалить эту заметку?
              </div>
              {noteTitle && (
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[190px] mt-0.5">
                  «{noteTitle}»
                </div>
              )}
            </div>
          </div>

          {deleteError && (
            <div className="text-[11px] font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded border border-rose-200 dark:border-rose-800/40">
              {deleteError}
            </div>
          )}

          <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsConfirmOpen(false);
              }}
              disabled={isDeleting}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
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
      )}
    </div>
  );
};
