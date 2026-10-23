import React, { useState, useEffect } from 'react';
import { UnifiedFeedItem } from '../adapters/feeds/types';
import { useUpdateNote } from '../api/queries';
import { resolveMediaUrl } from '../api/client';
import {
  X,
  Edit3,
  Sparkles,
  Save,
  Check,
  RefreshCw,
  Clock,
  Calendar,
  Hash,
  Link as LinkIcon,
  User,
  Image as ImageIcon,
  Cpu,
} from 'lucide-react';
import { FEED_IT_WORKFLOW_TEMPLATES } from './cover-studio/feedCoverStudio.constants';
import { FeedItEditAssistant } from './cover-studio/FeedItEditAssistant';

export interface FeedEditNoteModalProps {
  item: UnifiedFeedItem | null;
  onClose: () => void;
  disableEscClose?: boolean;
  onOpenAiCover?: (item: UnifiedFeedItem, templateId?: string) => void;
  onSaved?: () => void;
}

export const FeedEditNoteModal: React.FC<FeedEditNoteModalProps> = ({
  item,
  onClose,
  disableEscClose = false,
  onOpenAiCover,
  onSaved,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState('');
  const [curator, setCurator] = useState('');
  const [sourceLink, setSourceLink] = useState('');
  const [hashtagsStr, setHashtagsStr] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const updateNoteMutation = useUpdateNote();

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setDescription(item.description || '');
      setSummary(item.summary || (item.rawPayload as any)?.summary || '');
      setCurator(item.curator || '');
      setSourceLink(item.sourceLink || '');
      setHashtagsStr(item.hashtags?.map((h) => `#${h.replace(/^#/, '')}`).join(' ') || '');
      setFeedback(null);
    }
  }, [item]);

  useEffect(() => {
    if (!item || disableEscClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, disableEscClose, onClose]);

  if (!item) return null;

  const currentCoverUrl =
    item.coverUrl ||
    item.rawPayload?.images?.find((img: any) => img.isMain)?.url ||
    item.rawPayload?.images?.[0]?.url ||
    null;

  const formattedEventDate = new Date(item.publishedAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFeedback({ text: 'Заголовок записи не может быть пустым', type: 'error' });
      return;
    }

    const tagsArray = hashtagsStr
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, '').trim())
      .filter(Boolean);

    try {
      await updateNoteMutation.mutateAsync({
        id: item.id,
        data: {
          title: title.trim(),
          description: description.trim(),
          summary: summary.trim() || undefined,
          curator: curator.trim() || undefined,
          sourceLink: sourceLink.trim() || undefined,
          hashtags: tagsArray,
        },
      });

      setFeedback({
        text: 'Запись успешно обновлена! Дата события сохранена, метка времени правки (updatedAt) обновлена.',
        type: 'success',
      });
      if (onSaved) onSaved();

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Ошибка сохранения записи';
      setFeedback({ text: String(msg), type: 'error' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-[#17212b] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2481cc]/10 text-[#2481cc] flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Редактирование записи IT-ленты
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Дата события: {formattedEventDate}</span>
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400">
                  Дата события не изменяется
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSave}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 touch-scroll text-xs sm:text-sm"
        >
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <X className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Cover preview & AI Studio Trigger + Quick IT Presets */}
          <div className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#121923] space-y-2.5">
            <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-3 min-w-0">
                {currentCoverUrl ? (
                  <img
                    src={resolveMediaUrl(currentCoverUrl)}
                    alt="Cover preview"
                    className="w-16 h-12 object-cover rounded-lg border border-slate-200 dark:border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-12 rounded-lg bg-slate-200 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-400 shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    {currentCoverUrl ? 'Обложка записи активна' : 'У записи нет обложки'}
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate">
                    Используется для карточки в IT-лентах, подкастах и дайджестах
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenAiCover?.(item)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{currentCoverUrl ? 'AI Cover Studio (IT)' : 'Создать обложку (AI)'}</span>
              </button>
            </div>

            {/* Quick-Launch IT Cover Scenario Buttons */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-purple-500" />
                <span>Быстрая IT-обложка:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {FEED_IT_WORKFLOW_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    title={tpl.description}
                    onClick={() => onOpenAiCover?.(item, tpl.id)}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#17212b] hover:bg-purple-500/15 border border-slate-200 dark:border-white/10 hover:border-purple-500/40 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>{tpl.icon}</span>
                    <span>{tpl.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Заголовок
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название новости, релиза, подкаста или CVE..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#10171f] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#2481cc]/30 focus:border-[#2481cc]"
            />
          </div>

          {/* IT Markdown Structure Blueprints */}
          <FeedItEditAssistant
            currentTitle={title}
            currentDescription={description}
            currentSummary={summary}
            currentHashtagsStr={hashtagsStr}
            onApplyBlueprint={({ description: nextDesc, summary: nextSum, hashtagsStr: nextTags, label }) => {
              setDescription(nextDesc);
              setSummary(nextSum);
              setHashtagsStr(nextTags);
              setFeedback({
                text: `Применён IT-шаблон «${label}» и добавлены профильные теги`,
                type: 'success',
              });
            }}
          />

          {/* Markdown Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Текст / Markdown описание
              </label>
              <span className="text-[11px] text-slate-400">Поддерживает GFM Markdown</span>
            </div>
            <textarea
              rows={7}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Текст новости, таймкоды подкаста, changelog или разбор CVE..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#10171f] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#2481cc]/30 focus:border-[#2481cc] resize-y"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Краткое резюме / Выжимка (Summary)
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Краткое содержание для карточки в ленте..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#10171f] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#2481cc]/30 focus:border-[#2481cc] resize-none"
            />
          </div>

          {/* Curator & Source Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>Куратор / Автор</span>
              </label>
              <input
                type="text"
                value={curator}
                onChange={(e) => setCurator(e.target.value)}
                placeholder="Имя куратора или канала..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#10171f] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#2481cc]/30 focus:border-[#2481cc]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-slate-400" />
                <span>Ссылка на источник (URL)</span>
              </label>
              <input
                type="text"
                value={sourceLink}
                onChange={(e) => setSourceLink(e.target.value)}
                placeholder="https://t.me/... или https://github.com/..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#10171f] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#2481cc]/30 focus:border-[#2481cc]"
              />
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
              <Hash className="w-3 h-3 text-slate-400" />
              <span>Теги / Хештеги</span>
            </label>
            <input
              type="text"
              value={hashtagsStr}
              onChange={(e) => setHashtagsStr(e.target.value)}
              placeholder="#ai #podcast #changelog #security"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#10171f] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#2481cc]/30 focus:border-[#2481cc]"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-[#131b24] border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Обновится `updatedAt`</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={updateNoteMutation.isPending}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={updateNoteMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#2481cc] hover:bg-[#1e6cb0] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {updateNoteMutation.isPending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Сохранить правки</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
