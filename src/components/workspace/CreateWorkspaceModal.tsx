import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Check } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
];

const PRESET_ICONS = ['🏠', '🎨', '📊', '🚀', '💡', '📚', '🔬', '🛡️', '💼', '⚡'];

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ isOpen, onClose }) => {
  const { createWorkspace, createTrack } = useWorkspace();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState(PRESET_ICONS[0]);
  const [initialTrackTitle, setInitialTrackTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
      setIcon(PRESET_ICONS[Math.floor(Math.random() * PRESET_ICONS.length)]);
      setInitialTrackTitle('');
      setError(null);
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Введите название воркспейса');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createWorkspace({
        title: title.trim(),
        description: description.trim() || undefined,
        color,
        icon,
      });

      // Optionally create initial track if specified
      if (initialTrackTitle.trim() && created?.id) {
        try {
          await createTrack(initialTrackTitle.trim(), color, undefined, created.id);
        } catch (tErr) {
          console.warn('Initial track creation skipped:', tErr);
        }
      }

      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Не удалось создать воркспейс');
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
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#18222d] border border-slate-200 dark:border-white/10 shadow-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 shadow-xs"
              style={{ backgroundColor: `${color}25`, color }}
            >
              {icon}
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Новое рабочее пространство
              </h3>
              <p className="text-[11px] text-slate-400">
                Независимый контекст для фокусных заметок и треков
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* 1. Title */}
          <div>
            <label className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1 font-semibold">
              НАЗВАНИЕ ВОРКСПЕЙСА *
            </label>
            <input
              type="text"
              placeholder="например: Стартап, Крипта, Хобби, Учеба..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#10171e] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2481cc]/50"
              autoFocus
            />
          </div>

          {/* 2. Color Palette */}
          <div>
            <label className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1 font-semibold">
              ЦВЕТ АКЦЕНТА
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-[#18222d]' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Icon / Emoji Selector */}
          <div>
            <label className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1 font-semibold">
              ИКОНКА
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-8 h-8 rounded-xl text-sm flex items-center justify-center border transition-all cursor-pointer ${
                    icon === emoji
                      ? 'border-[#2481cc] bg-[#2481cc]/15 shadow-xs'
                      : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Description */}
          <div>
            <label className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1 font-semibold">
              ОПИСАНИЕ (ОПЦИОНАЛЬНО)
            </label>
            <input
              type="text"
              placeholder="Краткое назначение пространства..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#10171e] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2481cc]/50"
            />
          </div>

          {/* 5. Initial Track (Optional) */}
          <div>
            <label className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1 font-semibold">
              ПЕРВЫЙ ТЕМАТИЧЕСКИЙ ТРЕК (ОПЦИОНАЛЬНО)
            </label>
            <input
              type="text"
              placeholder="например: Черновики, Идеи, Задачи..."
              value={initialTrackTitle}
              onChange={(e) => setInitialTrackTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#10171e] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2481cc]/50"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#2481cc] hover:bg-[#1e6cb0] disabled:opacity-50 text-white shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Создание...' : 'Создать воркспейс'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
