import React, { useState, memo } from 'react';
import { Plus, X } from 'lucide-react';
import { Workspace, WorkspacePin, WorkspaceTrack } from '@lenta/shared';
import { BatchLinkModal } from './BatchLinkModal';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { DeleteWorkspaceModal } from './DeleteWorkspaceModal';
import { DeleteTrackModal } from './DeleteTrackModal';

export interface AddTrackInlineControlProps {
  onCreateTrack: (title: string) => Promise<unknown>;
}

export const AddTrackInlineControl: React.FC<AddTrackInlineControlProps> = memo(
  ({ onCreateTrack }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      try {
        await onCreateTrack(title.trim());
        setTitle('');
        setIsAdding(false);
      } catch (err) {
        console.error('Failed to create track:', err);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsAdding(false);
      }
    };

    return (
      <div className="pt-2">
        {isAdding ? (
          <form onSubmit={handleSubmit} className="flex gap-1.5">
            <input
              type="text"
              placeholder="Название нового трека..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
            >
              Создать
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить трек в воркспейс</span>
          </button>
        )}
      </div>
    );
  }
);

AddTrackInlineControl.displayName = 'AddTrackInlineControl';

export interface WorkspaceDockModalsProps {
  isLinkModalOpen: boolean;
  onCloseLinkModal: () => void;
  selectedPins: WorkspacePin[];
  onBatchLinkSuccess: () => void;
  isCreateWorkspaceOpen: boolean;
  onCloseCreateWorkspace: () => void;
  workspaceToDelete: Workspace | null;
  onCloseDeleteWorkspace: () => void;
  onConfirmDeleteWorkspace: (id: string) => Promise<void>;
  trackToDelete: WorkspaceTrack | null;
  onCloseDeleteTrack: () => void;
  onConfirmDeleteTrack: (id: string) => Promise<void>;
}

export const WorkspaceDockModals: React.FC<WorkspaceDockModalsProps> = memo(
  ({
    isLinkModalOpen,
    onCloseLinkModal,
    selectedPins,
    onBatchLinkSuccess,
    isCreateWorkspaceOpen,
    onCloseCreateWorkspace,
    workspaceToDelete,
    onCloseDeleteWorkspace,
    onConfirmDeleteWorkspace,
    trackToDelete,
    onCloseDeleteTrack,
    onConfirmDeleteTrack,
  }) => (
    <>
      <BatchLinkModal
        isOpen={isLinkModalOpen}
        onClose={onCloseLinkModal}
        selectedPins={selectedPins}
        onSuccess={onBatchLinkSuccess}
      />

      <CreateWorkspaceModal
        isOpen={isCreateWorkspaceOpen}
        onClose={onCloseCreateWorkspace}
      />

      <DeleteWorkspaceModal
        isOpen={!!workspaceToDelete}
        workspace={workspaceToDelete}
        onClose={onCloseDeleteWorkspace}
        onConfirm={async () => {
          if (workspaceToDelete) {
            await onConfirmDeleteWorkspace(workspaceToDelete.id);
          }
        }}
      />

      <DeleteTrackModal
        isOpen={!!trackToDelete}
        track={trackToDelete}
        onClose={onCloseDeleteTrack}
        onConfirm={async () => {
          if (trackToDelete) {
            await onConfirmDeleteTrack(trackToDelete.id);
          }
        }}
      />
    </>
  )
);

WorkspaceDockModals.displayName = 'WorkspaceDockModals';
