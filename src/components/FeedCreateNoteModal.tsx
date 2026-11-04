import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Note, PendingPosterItem } from '@lenta/shared';
import { useCreateNote, useFeedSources } from '../api/queries';
import { feedApi } from '../api/client';
import { FeedAppRuntimeMode } from '../utils/appMode';
import { useModalBackdrop } from '../hooks/useModalBackdrop';
import dayjs from 'dayjs';
import { FeedAiDescriptionAssistant } from './FeedAiDescriptionAssistant';
import { NotePosterPicker } from './notes/NotePosterPicker';
import {
  X,
  PlusCircle,
  Check,
  Calendar,
  Hash,
  Link as LinkIcon,
  User,
  Radio,
  FileText,
  Lock,
  Globe,
  Pin,
  CalendarRange,
  Film,
  AtSign,
  CheckCircle2,
} from 'lucide-react';

export interface FeedCreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFeedSlug?: string;
  defaultDate?: string;
  appMode?: FeedAppRuntimeMode;
  onCreated?: (newNote: Note) => void;
}

const NOTE_TYPES = [
  { value: 'SINGLE', label: 'Точечная заметка (SINGLE)', icon: Pin },
  { value: 'EVENT', label: 'Событие календаря (EVENT)', icon: Calendar },
  { value: 'PERIOD', label: 'Временной отрезок (PERIOD)', icon: CalendarRange },
  { value: 'FILM_RELEASE', label: 'Релиз / Премьера (FILM_RELEASE)', icon: Film },
  { value: 'MENTION', label: 'Упоминание (MENTION)', icon: AtSign },
  { value: 'DONE', label: 'Выполненная цель (DONE)', icon: CheckCircle2 },
] as const;

const EMPTY_FEEDS: any[] = [];

export const FeedCreateNoteModal: React.FC<FeedCreateNoteModalProps> = ({
  isOpen,
  onClose,
  defaultFeedSlug,
  defaultDate,
  appMode = 'dev',
  onCreated,
}) => {
  const { data: feeds = EMPTY_FEEDS } = useFeedSources();
  const createNoteMutation = useCreateNote();
  const { backdropProps } = useModalBackdrop(onClose);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState('');
  const [author, setAuthor] = useState('Admin');
  const [sourceLink, setSourceLink] = useState('');
  const [hashtagsStr, setHashtagsStr] = useState('');
  const [type, setType] = useState<'SINGLE' | 'PERIOD' | 'EVENT' | 'FILM_RELEASE' | 'MENTION' | 'DONE'>('SINGLE');
  const [feedId, setFeedId] = useState<string>('');
  const [startDate, setStartDate] = useState(() => defaultDate || dayjs().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState('');
  const [targetPrivacy, setTargetPrivacy] = useState<'private' | 'public'>(() =>
    appMode === 'staging' ? 'public' : 'private'
  );
  const [targetStatus, setTargetStatus] = useState<'DRAFT' | 'PUBLISHED'>(() =>
    appMode === 'staging' ? 'DRAFT' : 'PUBLISHED'
  );
  const [pendingPosters, setPendingPosters] = useState<PendingPosterItem[]>([]);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Initialize or reset form on open
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setSummary('');
      setAuthor('Admin');
      setSourceLink('');
      setHashtagsStr('');
      setType('SINGLE');
      setStartDate(defaultDate || dayjs().format('YYYY-MM-DD'));
      setEndDate('');
      setTargetPrivacy(appMode === 'staging' ? 'public' : 'private');
      setTargetStatus(appMode === 'staging' ? 'DRAFT' : 'PUBLISHED');
      setPendingPosters([]);
      setFeedback(null);

      // Pre-select feed if matching defaultFeedSlug
      if (defaultFeedSlug && feeds.length > 0) {
        const matched = feeds.find((f) => f.slug === defaultFeedSlug);
        if (matched) {
          setFeedId(matched.id);
        } else {
          setFeedId('');
        }
      } else {
        setFeedId('');
      }
    }
  }, [isOpen, defaultDate, defaultFeedSlug, appMode, feeds]);

  // Escape key handler complying with AGENTS.md rule 7
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFeedback({ text: 'Укажите заголовок записи', type: 'error' });
      return;
    }

    try {
      const hashtags = hashtagsStr
        .split(/[\s,]+/)
        .map((t) => t.replace(/^#/, '').trim())
        .filter(Boolean);

      const newNote = await createNoteMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        summary: summary.trim() || undefined,
        type,
        feedId: feedId || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        endDate: type === 'PERIOD' && endDate ? new Date(endDate).toISOString() : undefined,
        privacy: targetPrivacy,
        status: targetStatus,
        author: author.trim() || undefined,
        curator: author.trim() || undefined,
        sourceLink: sourceLink.trim() || undefined,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        publishAt: targetStatus === 'PUBLISHED' ? new Date().toISOString() : null,
      });

      // Attach pending posters if selected during creation
      if (pendingPosters.length > 0) {
        try {
          const items = pendingPosters.map((p) => ({
            url: p.url,
            caption: p.title,
            alt: p.title,
            isMain: p.isMain,
          }));
          await feedApi.attachImagesFromUrls(newNote.id, items);
        } catch (e) {
          console.warn('[FeedCreateNoteModal] Could not attach posters:', e);
        }
      }

      setFeedback({ text: 'Запись успешно создана!', type: 'success' });
      if (onCreated) onCreated(newNote);

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Ошибка создания записи';
      setFeedback({ text: String(msg), type: 'error' });
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in"
      style={{ zIndex: 10000 }}
      {...backdropProps}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-[#17212b] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-none">
                Новая запись в ленту
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Добавление хронологической записи или новости
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 touch-scroll">
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
              }`}
            >
              {feedback.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Заголовок <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите заголовок события или статьи..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#121922] border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Posters & Media */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#121923]">
            <NotePosterPicker
              noteTitle={title}
              pendingPosters={pendingPosters}
              onPendingPostersChange={setPendingPosters}
            />
          </div>

          {/* Type & Feed Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Тип записи
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#121922] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                {NOTE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#2481cc]" />
                <span>Лента / Поток</span>
              </label>
              <select
                value={feedId}
                onChange={(e) => setFeedId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#121922] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Без ленты (общий поток)</option>
                {feeds.map((f) => {
                  const isLigature = f.icon && /^[a-z0-9_-]+$/i.test(f.icon.trim());
                  const displayIcon = !f.icon || isLigature ? (f.privacy === 'private' ? '🔒' : '📁') : f.icon;
                  return (
                    <option key={f.id} value={f.id}>
                      {displayIcon} {f.title} ({f.slug})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Date & Privacy Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Дата события</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#121922] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Binary Privacy Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Контур приватности
              </label>
              <div className="flex rounded-xl bg-slate-100 dark:bg-[#121922] p-0.5 border border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setTargetPrivacy('private')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-medium transition-colors ${
                    targetPrivacy === 'private'
                      ? 'bg-white dark:bg-[#202b38] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span>Private</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetPrivacy('public')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-medium transition-colors ${
                    targetPrivacy === 'public'
                      ? 'bg-white dark:bg-[#202b38] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Globe className="w-3 h-3 text-emerald-500" />
                  <span>Public</span>
                </button>
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Статус
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#121922] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="PUBLISHED">Опубликовано (PUBLISHED)</option>
                <option value="DRAFT">Черновик (DRAFT)</option>
              </select>
            </div>
          </div>

          {/* Author & Source Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Автор / Куратор</span>
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Имя автора..."
                className="w-full px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#121922] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>Ссылка на первоисточник</span>
              </label>
              <input
                type="url"
                value={sourceLink}
                onChange={(e) => setSourceLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#121922] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-indigo-400" />
              <span>Теги / Хэштеги</span>
            </label>
            <input
              type="text"
              value={hashtagsStr}
              onChange={(e) => setHashtagsStr(e.target.value)}
              placeholder="#технологии #ai #новости"
              className="w-full px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#121922] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Summary / Lead */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Краткий анонс / Лид (Summary)</span>
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Короткая выжимка или анонс события для карточки ленты..."
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#121922] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Full Content / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Основной текст заметки (Markdown)
            </label>

            <FeedAiDescriptionAssistant
              title={title}
              eventDate={startDate}
              noteType={type}
              category={feeds.find((f) => f.id === feedId)?.title || undefined}
              currentDescription={description}
              onDescriptionGenerated={setDescription}
              onSummaryGenerated={(newSum) => {
                setSummary((prev) => (prev.trim() ? prev : newSum));
              }}
              onHashtagsSuggested={(newTags) => {
                setHashtagsStr((prev) => {
                  const existing = prev
                    .split(/[,\s]+/)
                    .map((h) => h.trim().replace(/^#/, ''))
                    .filter(Boolean);
                  const combined = Array.from(new Set([...existing, ...newTags.map((t) => t.replace(/^#/, ''))]));
                  return combined.map((h) => `#${h}`).join(' ');
                });
              }}
            />

            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробный текст записи, разметка Markdown, списки или цитаты..."
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#121922] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-y"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={createNoteMutation.isPending}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={createNoteMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{createNoteMutation.isPending ? 'Создание...' : 'Создать запись'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
