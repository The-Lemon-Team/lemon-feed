import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Feed } from '@lenta/shared';
import { UnifiedFeedTab } from '../adapters/feeds/types';
import { useCreateFeed, useUpdateFeed, useDeleteFeed } from '../api/queries';
import { SymbolIcon } from './common/SymbolIcon';
import {
  X,
  Save,
  Trash2,
  Folder,
  Hash,
  Globe,
  Lock,
  Palette,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';

export interface FeedEntityModalProps {
  feedTab?: UnifiedFeedTab | null;
  feedData?: Feed | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const PRESET_COLORS = [
  '#8b5cf6', // Violet
  '#f97316', // Orange
  '#ef4444', // Red
  '#0ea5e9', // Sky
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#eab308', // Amber/Yellow
  '#6366f1', // Indigo
  '#2481cc', // Telegram Blue
];

const PRESET_EMOJIS = ['🤖', '🚀', '🛡️', '📰', '🎥', '⚡', '🍋', '🍿', '🎉', '📡', '💡', '📁', '💻', '🔥'];

export const FeedEntityModal: React.FC<FeedEntityModalProps> = ({
  feedTab,
  feedData,
  isOpen,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(feedTab || feedData);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📁');
  const [color, setColor] = useState('#2481cc');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');

  // Folder paths state
  const [folderPaths, setFolderPaths] = useState<string[]>([]);
  const [folderInput, setFolderInput] = useState('');

  // Hashtags state
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createFeedMutation = useCreateFeed();
  const updateFeedMutation = useUpdateFeed();
  const deleteFeedMutation = useDeleteFeed();

  // Populate data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (feedData) {
        setTitle(feedData.title || '');
        setSlug(feedData.slug || '');
        setDescription(feedData.description || '');
        setEmoji(feedData.icon || '📁');
        setColor(feedData.color || '#2481cc');
        setPrivacy(feedData.privacy === 'private' ? 'private' : 'public');
        setFolderPaths(feedData.folderPaths || []);
        setHashtags(feedData.hashtags || []);
      } else if (feedTab) {
        setTitle(feedTab.title || feedTab.shortTitle || '');
        setSlug(feedTab.slug || '');
        setDescription(feedTab.description || '');
        setEmoji(feedTab.emoji || '📁');
        setColor(feedTab.accentColor || '#2481cc');
        setPrivacy('public');
        setFolderPaths([]);
        setHashtags([]);
      } else {
        // Create mode
        setTitle('');
        setSlug('');
        setDescription('');
        setEmoji('📁');
        setColor('#2481cc');
        setPrivacy('public');
        setFolderPaths([]);
        setHashtags([]);
      }
      setErrorMsg(null);
    }
  }, [isOpen, feedTab, feedData]);

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

  // Handle auto-generating slug from title in create mode
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing || !slug) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  const handleAddFolder = () => {
    const trimmed = folderInput.trim();
    if (trimmed && !folderPaths.includes(trimmed)) {
      setFolderPaths((prev) => [...prev, trimmed]);
      setFolderInput('');
    }
  };

  const handleRemoveFolder = (pathToRemove: string) => {
    setFolderPaths((prev) => prev.filter((p) => p !== pathToRemove));
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !hashtags.includes(clean)) {
      setHashtags((prev) => [...prev, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setHashtags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Укажите название фида');
      return;
    }
    const finalSlug = slug.trim() || title.toLowerCase().replace(/\s+/g, '-');

    setErrorMsg(null);
    try {
      const payload = {
        title: title.trim(),
        slug: finalSlug,
        description: description.trim() || undefined,
        icon: emoji,
        color,
        privacy,
        folderPaths,
        hashtags,
      };

      const feedId = feedData?.id || (feedTab && feedTab.id !== feedTab.slug ? feedTab.id : undefined);

      if (feedId) {
        await updateFeedMutation.mutateAsync({ id: feedId, data: payload });
      } else {
        await createFeedMutation.mutateAsync(payload);
      }

      onSaved?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to save feed:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Ошибка сохранения фида');
    }
  };

  const handleDelete = async () => {
    const feedId = feedData?.id || (feedTab && feedTab.id !== feedTab.slug ? feedTab.id : undefined);
    if (!feedId) return;
    if (!window.confirm(`Вы уверены, что хотите удалить ленту "${title}"?`)) return;

    try {
      await deleteFeedMutation.mutateAsync(feedId);
      onSaved?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to delete feed:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Ошибка при удалении');
    }
  };

  if (!isOpen) return null;

  const isSaving = createFeedMutation.isPending || updateFeedMutation.isPending;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#18222d] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-lg border shadow-2xs"
              style={{ backgroundColor: `${color}20`, borderColor: `${color}40` }}
            >
              <SymbolIcon icon={emoji} fallback="📁" className="text-lg" style={{ color }} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {isEditing ? 'Настройка ленты (фида)' : 'Создание новой ленты (фида)'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {isEditing ? `slug: ${slug || 'auto'}` : 'Добавление нового потока в базу данных'}
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 touch-scroll text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Название ленты <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Например: ИИ & Модели"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#2481cc] transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Идентификатор (Slug)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ai-models"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono placeholder-slate-400 outline-none focus:border-[#2481cc] transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Описание потока
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание тематики ленты и источников материалов..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#2481cc] transition-colors resize-none"
            />
          </div>

          {/* Icon / Emoji & Color Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Emoji Selection */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Иконка / Эмодзи</span>
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-12 text-center py-1.5 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-white/10 text-base outline-none focus:border-[#2481cc]"
                />
                <div className="flex items-center gap-1 flex-wrap">
                  {PRESET_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
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

            {/* Color Selection */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#2481cc]" />
                <span>Акцентный цвет</span>
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-white/10 bg-transparent p-0.5"
                />
                <div className="flex items-center gap-1 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-offset-2 ring-[#2481cc]' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Level */}
          <div className="space-y-1.5 pt-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Уровень доступа (Privacy)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPrivacy('public')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                  privacy === 'public'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Публичный поток (Public)</span>
              </button>
              <button
                type="button"
                onClick={() => setPrivacy('private')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                  privacy === 'private'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Приватный / Dev поток</span>
              </button>
            </div>
          </div>

          {/* Folder Projections */}
          <div className="space-y-1.5 pt-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-amber-500" />
              <span>Привязанные папки Obsidian Vault (Folder Projections)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFolder();
                  }
                }}
                placeholder="Например: Spark/AI или Changelogs..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-[#2481cc]"
              />
              <button
                type="button"
                onClick={handleAddFolder}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-white font-medium cursor-pointer"
              >
                Добавить
              </button>
            </div>
            {folderPaths.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {folderPaths.map((path) => (
                  <span
                    key={path}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-mono text-[11px]"
                  >
                    <span>{path}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFolder(path)}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Hashtag Filters */}
          <div className="space-y-1.5 pt-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-[#2481cc]" />
              <span>Фильтр по хэштегам (Hashtags)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Например: #ai, #security..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-[#2481cc]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-white font-medium cursor-pointer"
              >
                Добавить
              </button>
            </div>
            {hashtags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2481cc]/10 text-[#2481cc] dark:text-[#64b5f6] font-mono text-[11px]"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
          {isEditing && (feedData?.id || (feedTab && feedTab.id !== feedTab.slug)) ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteFeedMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Удалить ленту</span>
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
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#2481cc] hover:bg-[#1e6cb0] text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Check className="w-3.5 h-3.5 animate-spin" />
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Сохранить ленту</span>
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
