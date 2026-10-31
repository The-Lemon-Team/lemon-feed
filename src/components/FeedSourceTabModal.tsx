import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FeedModeOption } from './toolbar/types';
import { X, Save, Trash2, Sparkles, Tag, Info } from 'lucide-react';

export interface FeedSourceTabModalProps {
  tab?: FeedModeOption | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (tab: FeedModeOption) => void;
  onDelete?: (tabId: string) => void;
}

const PRESET_EMOJIS = ['🌐', '💻', '🍋', '🍿', '🎉', '✈️', '📈', '🔬', '🎮', '⚡', '🧠', '🎧'];

export const FeedSourceTabModal: React.FC<FeedSourceTabModalProps> = ({
  tab,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditing = Boolean(tab);

  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('📁');
  const [id, setId] = useState('');
  const [badge, setBadge] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (tab) {
        setLabel(tab.label || '');
        setEmoji(tab.emoji || '📁');
        setId(tab.id || '');
        setBadge(tab.badge || '');
        setDescription(tab.description || '');
      } else {
        setLabel('');
        setEmoji('✨');
        setId('');
        setBadge('');
        setDescription('');
      }
      setErrorMsg(null);
    }
  }, [isOpen, tab]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleLabelChange = (val: string) => {
    setLabel(val);
    if (!isEditing || !id) {
      const slug = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '_');
      setId(slug);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setErrorMsg('Укажите название раздела');
      return;
    }
    const finalId = id.trim() || label.toLowerCase().replace(/\s+/g, '_');

    onSave({
      id: finalId,
      label: label.trim(),
      emoji: emoji || '📁',
      badge: badge.trim() || undefined,
      description: description.trim() || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#18222d] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-lg">
              <span>{emoji}</span>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {isEditing ? 'Настройка раздела (таба)' : 'Новый раздел (таб)'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Верхняя панель переключения потоков
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Label & ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Название раздела <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="IT & Dev"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#2481cc]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Идентификатор ID
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="it_dev"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono placeholder-slate-400 outline-none focus:border-[#2481cc]"
              />
            </div>
          </div>

          {/* Emoji & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Эмодзи</span>
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-10 text-center py-1.5 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-white/10 text-base outline-none focus:border-[#2481cc]"
                />
                <div className="flex items-center gap-1 flex-wrap">
                  {PRESET_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center transition-all ${
                        emoji === e
                          ? 'bg-[#2481cc]/20 border border-[#2481cc]'
                          : 'hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#2481cc]" />
                <span>Бейдж (опционально)</span>
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="live, hot, new"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#2481cc]"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1 pt-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Описание раздела
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание потока..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#2481cc] resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.08]">
            {isEditing && onDelete && tab && tab.id !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  if (tab && window.confirm(`Удалить раздел "${label}"?`)) {
                    onDelete(tab.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Удалить</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#2481cc] hover:bg-[#1e6cb0] text-white shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Сохранить</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
