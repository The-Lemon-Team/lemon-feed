import React, { useState, useEffect } from 'react';
import { LemonModerationItem } from '@lenta/lemon-bus';
import { X, Edit3, CheckCircle2 } from 'lucide-react';

interface FeedBusEditModalProps {
  item: LemonModerationItem | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<LemonModerationItem>) => void;
  onSaveAndApprove: (id: string, patch: Partial<LemonModerationItem>) => void;
}

export const FeedBusEditModal: React.FC<FeedBusEditModalProps> = ({
  item,
  onClose,
  onSave,
  onSaveAndApprove,
}) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [feedSlug, setFeedSlug] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setSummary(item.summary || item.description || '');
      setFeedSlug(item.feedSlug || '');
      setCategory(item.category || '');
      setTagsInput((item.hashtags || []).join(', '));
    }
  }, [item]);

  // Handle Escape key to close modal (Rule #7)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const parseTags = (): string[] => {
    return tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
  };

  const getPatch = (): Partial<LemonModerationItem> => ({
    title: title.trim() || item.title,
    summary: summary.trim() || null,
    feedSlug: feedSlug.trim() || item.feedSlug,
    category: category.trim() || item.category,
    hashtags: parseTags(),
  });

  const handleSaveOnly = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(item.id, getPatch());
  };

  const handleApproveImmediate = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAndApprove(item.id, getPatch());
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-surface-container border border-outline-variant/30 shadow-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Edit3 className="w-4 h-4" />
            <span>Редактирование перед публикацией</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-variant text-outline hover:text-on-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Edit Form */}
        <form className="space-y-3.5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Заголовок заметки:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-container-highest border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* AI Summary / Digest */}
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              AI Выжимка (Summary / Digest):
            </label>
            <textarea
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-container-highest border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />
          </div>

          {/* Channel Slug & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-outline mb-1">
                Целевой фид (feedSlug):
              </label>
              <input
                type="text"
                value={feedSlug}
                onChange={(e) => setFeedSlug(e.target.value)}
                placeholder="например, spark-ai"
                className="w-full px-3 py-1.5 rounded-lg bg-surface-container-highest border border-outline-variant/40 text-xs text-on-surface font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-outline mb-1">
                Категория:
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="ai, politics, tech..."
                className="w-full px-3 py-1.5 rounded-lg bg-surface-container-highest border border-outline-variant/40 text-xs text-on-surface"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-medium text-outline mb-1">
              Теги (через запятую):
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="news, llm, release"
              className="w-full px-3 py-1.5 rounded-lg bg-surface-container-highest border border-outline-variant/40 text-xs text-on-surface font-mono"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-variant transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSaveOnly}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container-highest hover:bg-surface-variant text-on-surface border border-outline-variant/40 transition-colors"
            >
              Сохранить черновик
            </button>
            <button
              type="button"
              onClick={handleApproveImmediate}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Сохранить и Одобрить</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
