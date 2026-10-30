import React, { useState, useEffect, useMemo } from 'react';
import {
  Pin,
  X,
  Plus,
  AlertCircle,
  Link2,
  Trash2,
  Layers,
  CheckSquare,
  Square,
  Search,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { WorkspacePin } from '@lenta/shared';
import { BatchLinkModal } from './BatchLinkModal';
import { PinCardItem } from './PinCardItem';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { FocusSlotsSection } from './FocusSlotsSection';
import { WorkspaceTrackItem } from './WorkspaceTrackItem';

interface PinnedNotesDockProps {
  onOpenNoteDetail?: (noteId: string) => void;
}

export const PinnedNotesDock: React.FC<PinnedNotesDockProps> = ({ onOpenNoteDetail }) => {
  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    setActiveWorkspaceId,
    pins,
    isDockOpen,
    setIsDockOpen,
    unpinNote,
    updatePin,
    togglePinFocus,
    createTrack,
  } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAttentionOnly, setFilterAttentionOnly] = useState(false);
  const [selectedPinIds, setSelectedPinIds] = useState<Set<string>>(new Set());
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [collapsedTracks, setCollapsedTracks] = useState<Set<string>>(new Set());
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const [newTrackTitle, setNewTrackTitle] = useState('');

  // Escape key handling per AGENTS.md
  useEffect(() => {
    if (!isDockOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLinkModalOpen && !isCreateWorkspaceOpen) {
        setIsDockOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDockOpen, isLinkModalOpen, isCreateWorkspaceOpen, setIsDockOpen]);

  // Counts
  const attentionCount = useMemo(() => {
    return pins.filter((p) => p.status === 'NEEDS_ATTENTION').length;
  }, [pins]);

  // Filtered pins
  const filteredPins = useMemo(() => {
    return pins.filter((p) => {
      if (filterAttentionOnly && p.status !== 'NEEDS_ATTENTION') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = p.note?.title?.toLowerCase().includes(q);
        const commentMatch = p.comment?.toLowerCase().includes(q);
        if (!titleMatch && !commentMatch) return false;
      }
      return true;
    });
  }, [pins, filterAttentionOnly, searchQuery]);

  // Focus pins (isPinned: true)
  const focusPins = useMemo(() => {
    return filteredPins.filter((p) => p.isPinned);
  }, [filteredPins]);

  // Grouped by track for the workbench area
  const { generalPins, pinsByTrack } = useMemo(() => {
    const general: WorkspacePin[] = [];
    const byTrack: Record<string, WorkspacePin[]> = {};

    for (const pin of filteredPins) {
      if (!pin.trackId) {
        general.push(pin);
      } else {
        if (!byTrack[pin.trackId]) byTrack[pin.trackId] = [];
        byTrack[pin.trackId].push(pin);
      }
    }
    return { generalPins: general, pinsByTrack: byTrack };
  }, [filteredPins]);

  const toggleSelectPin = (id: string) => {
    setSelectedPinIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedPinIds.size === filteredPins.length) {
      setSelectedPinIds(new Set());
    } else {
      setSelectedPinIds(new Set(filteredPins.map((p) => p.id)));
    }
  };

  const toggleTrackCollapse = (trackId: string) => {
    setCollapsedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  };

  const handleToggleAttention = async (pin: WorkspacePin, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = pin.status === 'NEEDS_ATTENTION' ? 'ACTIVE' : 'NEEDS_ATTENTION';
    await updatePin(pin.id, { status: newStatus });
  };

  const handleToggleFocus = async (pin: WorkspacePin, e: React.MouseEvent) => {
    e.stopPropagation();
    await togglePinFocus(pin.id, !pin.isPinned);
  };

  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackTitle.trim()) return;
    try {
      await createTrack(newTrackTitle.trim());
      setNewTrackTitle('');
      setIsAddingTrack(false);
    } catch (err) {
      console.error('Failed to create track:', err);
    }
  };

  const handleBatchUnpin = async () => {
    for (const id of Array.from(selectedPinIds)) {
      await unpinNote(id);
    }
    setSelectedPinIds(new Set());
  };

  const handleBatchAttention = async () => {
    for (const id of Array.from(selectedPinIds)) {
      await updatePin(id, { status: 'NEEDS_ATTENTION' });
    }
  };

  const handleBatchFocus = async () => {
    const selectedList = pins.filter((p) => selectedPinIds.has(p.id));
    const allPinned = selectedList.every((p) => p.isPinned);
    const targetState = !allPinned;
    for (const id of Array.from(selectedPinIds)) {
      await togglePinFocus(id, targetState);
    }
  };

  const selectedPinsList = useMemo(() => {
    return pins.filter((p) => selectedPinIds.has(p.id));
  }, [pins, selectedPinIds]);

  return (
    <>
      {/* 1. Floating Pill Button */}
      <button
        type="button"
        onClick={() => setIsDockOpen(true)}
        className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-lg border transition-all duration-200 cursor-pointer select-none ${
          pins.length > 0
            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-700/50 hover:scale-105 shadow-xl'
            : 'bg-white dark:bg-[#18222d] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300'
        }`}
        title="Открыть рабочее пространство & Фокусные слоты"
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: activeWorkspace?.color || '#3b82f6' }}
        />
        <Layers className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold max-w-[120px] truncate">
          {activeWorkspace?.title || 'Воркспейс'}
        </span>
        <span
          className="text-xs px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 font-mono font-bold"
          title="Всего заметок в воркспейсе"
        >
          {pins.length}
        </span>
        {focusPins.length > 0 && (
          <span
            className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/25 text-amber-500 dark:text-amber-300 border border-amber-500/40 font-mono font-bold"
            title="В фокусных слотах"
          >
            📌 {focusPins.length}
          </span>
        )}
        {attentionCount > 0 && (
          <span
            className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-mono font-bold animate-pulse"
            title="Требуют внимания"
          >
            <AlertCircle className="w-2.5 h-2.5" />
            {attentionCount}
          </span>
        )}
      </button>

      {/* 2. Slide-over Drawer Backdrop */}
      {isDockOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex justify-end animate-fadeIn"
          onClick={() => setIsDockOpen(false)}
        >
          {/* Drawer Card */}
          <div
            className="w-full sm:w-[460px] max-w-full h-full bg-white dark:bg-[#151e27] border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col animate-slideInRight"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Workspaces Tabs */}
            <div className="p-3.5 border-b border-slate-100 dark:border-white/10 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {activeWorkspace?.title || 'Воркспейс'}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {pins.length} заметок • {focusPins.length} в фокусе
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDockOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  title="Закрыть (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Workspace Switcher Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {workspaces.map((w) => {
                  const isActive = w.id === activeWorkspaceId;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setActiveWorkspaceId(w.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: w.color || '#3b82f6' }}
                      />
                      <span>{w.title}</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        ({w._count?.pins || 0})
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setIsCreateWorkspaceOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer border border-dashed border-slate-300 dark:border-white/10 shrink-0"
                  title="Создать новое рабочее пространство"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Новый</span>
                </button>
              </div>

              {/* Subheader: Search & Filter */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Поиск по заметкам воркспейса..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setFilterAttentionOnly((prev) => !prev)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    filterAttentionOnly
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
                      : 'border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                  title="Показать только требующие внимания"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Внимание</span>
                  {attentionCount > 0 && <span className="font-mono">({attentionCount})</span>}
                </button>
              </div>
            </div>

            {/* Body: Focus Slots & Workbench */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
              {filteredPins.length === 0 ? (
                <div className="text-center py-12 px-4 text-slate-400 dark:text-slate-500">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">В этом воркспейсе пока нет заметок</p>
                  <p className="text-[11px] mt-1 max-w-xs mx-auto">
                    Нажимайте иконку воркспейса в карточках заметок ленты, чтобы добавлять их сюда для работы.
                  </p>
                </div>
              ) : (
                <>
                  {/* Select All row */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      {selectedPinIds.size === filteredPins.length ? (
                        <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                      <span>Выбрать все ({filteredPins.length})</span>
                    </button>
                    {selectedPinIds.size > 0 && (
                      <span className="font-mono font-bold text-blue-500">
                        Выбрано: {selectedPinIds.size}
                      </span>
                    )}
                  </div>

                  {/* 1. FOCUS SLOTS SECTION (📌) */}
                  <FocusSlotsSection
                    focusPins={focusPins}
                    selectedPinIds={selectedPinIds}
                    onToggleSelectPin={toggleSelectPin}
                    onToggleFocus={handleToggleFocus}
                    onToggleAttention={handleToggleAttention}
                    onUnpin={unpinNote}
                    onOpenDetail={onOpenNoteDetail}
                  />

                  {/* 2. WORKBENCH SECTION */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                        <span>📚 Рабочий стол воркспейса</span>
                        <span className="text-[10px] text-slate-400">({filteredPins.length})</span>
                      </div>
                    </div>

                    {/* General notes (without track) */}
                    {generalPins.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span>⭐ Общие заметки</span>
                          <span className="font-mono text-[10px]">({generalPins.length})</span>
                        </div>
                        <div className="space-y-2">
                          {generalPins.map((pin) => (
                            <PinCardItem
                              key={pin.id}
                              pin={pin}
                              isSelected={selectedPinIds.has(pin.id)}
                              onToggleSelect={() => toggleSelectPin(pin.id)}
                              onToggleFocus={(e) => handleToggleFocus(pin, e)}
                              onToggleAttention={(e) => handleToggleAttention(pin, e)}
                              onUnpin={() => unpinNote(pin.id)}
                              onOpenDetail={() => onOpenNoteDetail?.(pin.noteId)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Track groups */}
                    {activeWorkspace?.tracks?.map((track) => (
                      <WorkspaceTrackItem
                        key={track.id}
                        track={track}
                        pins={pinsByTrack[track.id] || []}
                        isCollapsed={collapsedTracks.has(track.id)}
                        selectedPinIds={selectedPinIds}
                        onToggleCollapse={() => toggleTrackCollapse(track.id)}
                        onToggleSelectPin={toggleSelectPin}
                        onToggleFocus={handleToggleFocus}
                        onToggleAttention={handleToggleAttention}
                        onUnpin={unpinNote}
                        onOpenDetail={onOpenNoteDetail}
                      />
                    ))}

                    {/* Add Track Form */}
                    <div className="pt-2">
                      {isAddingTrack ? (
                        <form onSubmit={handleCreateTrack} className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Название нового трека..."
                            value={newTrackTitle}
                            onChange={(e) => setNewTrackTitle(e.target.value)}
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
                            onClick={() => setIsAddingTrack(false)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAddingTrack(true)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Добавить трек в воркспейс</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Batch Bar */}
            {selectedPinIds.size > 0 && (
              <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1a2530] flex items-center justify-between gap-2 shrink-0 animate-fadeIn">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                  Выбрано: {selectedPinIds.size}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsLinkModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Связать</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchFocus}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
                    title="Закрепить в фокус / Снять фокус"
                  >
                    <Pin className="w-3.5 h-3.5 fill-current" />
                    <span>
                      {selectedPinsList.every((p) => p.isPinned) ? 'Снять фокус' : 'В фокус'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchAttention}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition-colors cursor-pointer"
                    title="Отметить: Требует внимания"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchUnpin}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Удалить выбранные из воркспейса"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Batch Link Modal */}
      <BatchLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        selectedPins={selectedPinsList}
        onSuccess={() => setSelectedPinIds(new Set())}
      />

      {/* 4. Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={isCreateWorkspaceOpen}
        onClose={() => setIsCreateWorkspaceOpen(false)}
      />
    </>
  );
};
