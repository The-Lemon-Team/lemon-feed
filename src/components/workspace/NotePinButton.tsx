import React, { useState, useRef, useEffect } from 'react';
import { Pin, Plus, Check, X, Layers, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

interface NotePinButtonProps {
  noteId: string;
}

export const NotePinButton: React.FC<NotePinButtonProps> = ({ noteId }) => {
  const {
    workspaces,
    memberships,
    addToWorkspace,
    removeFromWorkspace,
    isNoteInWorkspace,
    isNotePinnedInWorkspace,
  } = useWorkspace();

  const [isOpen, setIsOpen] = useState(false);
  const [loadingWorkspaceId, setLoadingWorkspaceId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // All memberships for this note
  const noteMemberships = memberships.filter((m) => m.noteId === noteId);
  const isInAnyWorkspace = noteMemberships.length > 0;
  const isAnyPinned = noteMemberships.some((m) => m.isPinned);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggleWorkspace = async (workspaceId: string, inWorkspace: boolean) => {
    setLoadingWorkspaceId(workspaceId);
    try {
      if (inWorkspace) {
        await removeFromWorkspace(workspaceId, noteId);
      } else {
        await addToWorkspace(workspaceId, noteId, { isPinned: false });
      }
    } catch (err) {
      console.error('Failed to toggle workspace:', err);
    } finally {
      setLoadingWorkspaceId(null);
    }
  };

  const handleToggleFocus = async (workspaceId: string, currentPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingWorkspaceId(workspaceId);
    try {
      await addToWorkspace(workspaceId, noteId, { isPinned: !currentPinned });
    } catch (err) {
      console.error('Failed to toggle focus:', err);
    } finally {
      setLoadingWorkspaceId(null);
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`relative p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
          isInAnyWorkspace
            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/25'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
        }`}
        title={
          isInAnyWorkspace
            ? `В воркспейсах (${noteMemberships.length})${isAnyPinned ? ' • Закреплено в фокусе' : ''}`
            : 'Добавить в воркспейс'
        }
      >
        <Layers className={`w-3.5 h-3.5 ${isInAnyWorkspace ? 'fill-current opacity-80' : ''}`} />
        {isAnyPinned && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#17212b]" />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 w-72 p-3 rounded-2xl bg-white dark:bg-[#17212b] border border-slate-200 dark:border-white/15 shadow-2xl shadow-slate-900/30 dark:shadow-black/70 space-y-2.5 text-left animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-white/10">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                Добавить в воркспейс
              </h4>
              <p className="text-[10px] text-slate-400">
                Сборка заметки в рабочие пространства
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Workspaces List */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
            {workspaces.map((w) => {
              const inWs = isNoteInWorkspace(w.id, noteId);
              const isPinned = isNotePinnedInWorkspace(w.id, noteId);
              const isLoading = loadingWorkspaceId === w.id;

              return (
                <div
                  key={w.id}
                  className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all ${
                    inWs
                      ? 'bg-blue-50/70 dark:bg-blue-900/15 border-blue-500/30'
                      : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: w.color || '#3b82f6' }}
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {w.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {inWs ? (
                      <>
                        {/* Toggle Focus Pin */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleFocus(w.id, isPinned, e)}
                          disabled={isLoading}
                          className={`p-1 rounded-lg transition-colors cursor-pointer ${
                            isPinned
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold'
                              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/10'
                          }`}
                          title={isPinned ? 'Снять из фокусных слотов' : 'Закрепить в фокусные слоты'}
                        >
                          <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                        </button>

                        {/* Remove from workspace */}
                        <button
                          type="button"
                          onClick={() => handleToggleWorkspace(w.id, true)}
                          disabled={isLoading}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Удалить из этого воркспейса"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleWorkspace(w.id, false)}
                        disabled={isLoading}
                        className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Добавить</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
