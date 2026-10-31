import React, { useState, useRef, useEffect } from 'react';
import { Pin, Check, X, Layers, Loader2 } from 'lucide-react';
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
      const current = memberships.find((m) => m.workspaceId === workspaceId && m.noteId === noteId);
      await addToWorkspace(workspaceId, noteId, {
        isPinned: !currentPinned,
        trackId: current?.trackId,
        status: (current?.status as any) || 'ACTIVE',
      });
    } catch (err) {
      console.error('Failed to toggle focus:', err);
    } finally {
      setLoadingWorkspaceId(null);
    }
  };

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" ref={popoverRef}>
      {/* Trigger Button: Strict 28x28px bounding box with 1px border in all states */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`relative w-7 h-7 flex items-center justify-center rounded-lg border transition-colors cursor-pointer shrink-0 ${
          isInAnyWorkspace
            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/25'
            : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
        }`}
        title={
          isInAnyWorkspace
            ? `В воркспейсах (${noteMemberships.length})${isAnyPinned ? ' • Закреплено в фокусе' : ''}`
            : 'Добавить в воркспейс'
        }
      >
        <Layers className="w-3.5 h-3.5 shrink-0" />
        {isAnyPinned && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#17212b]" />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 w-64 p-2.5 rounded-2xl bg-white dark:bg-[#17212b] border border-slate-200 dark:border-white/15 shadow-2xl shadow-slate-900/30 dark:shadow-black/70 space-y-2 text-left animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-white/10">
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Добавить в воркспейс
                </h4>
                {noteMemberships.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    {noteMemberships.length}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Сборка заметки в рабочие пространства
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Workspaces Multiselect List */}
          <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
            {workspaces.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400">
                Нет доступных воркспейсов
              </div>
            ) : (
              workspaces.map((w) => {
                const inWs = isNoteInWorkspace(w.id, noteId);
                const isPinned = isNotePinnedInWorkspace(w.id, noteId);
                const isLoading = loadingWorkspaceId === w.id;

                return (
                  <div
                    key={w.id}
                    role="checkbox"
                    aria-checked={inWs}
                    tabIndex={0}
                    onClick={() => !isLoading && handleToggleWorkspace(w.id, inWs)}
                    onKeyDown={(e) => {
                      if (!isLoading && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleToggleWorkspace(w.id, inWs);
                      }
                    }}
                    className={`group flex items-center justify-between h-8 min-h-[32px] max-h-[32px] px-2 rounded-lg border transition-all cursor-pointer select-none ${
                      inWs
                        ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500/30 text-blue-700 dark:text-blue-300'
                        : 'border-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {/* Left: Checkbox + Color Dot + Title */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-colors border ${
                          inWs
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 dark:border-white/20 group-hover:border-slate-400 dark:group-hover:border-white/40 bg-white/50 dark:bg-white/5'
                        }`}
                      >
                        {isLoading ? (
                          <Loader2 className={`w-2.5 h-2.5 animate-spin ${inWs ? 'text-white' : 'text-blue-500'}`} />
                        ) : inWs ? (
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        ) : null}
                      </div>

                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: w.color || '#3b82f6' }}
                      />

                      <span className="text-xs font-medium truncate">
                        {w.title}
                      </span>
                    </div>

                    {/* Right: Invariant fixed slot for Focus Pin action */}
                    <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                      {inWs && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleFocus(w.id, isPinned, e)}
                          disabled={isLoading}
                          className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
                            isPinned
                              ? 'text-amber-500 hover:text-amber-600 bg-amber-500/15'
                              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-200/60 dark:hover:bg-white/10 opacity-60 hover:opacity-100'
                          }`}
                          title={isPinned ? 'Снять из фокусных слотов' : 'Закрепить в фокусные слоты'}
                        >
                          <Pin className={`w-3 h-3 ${isPinned ? 'fill-current' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
