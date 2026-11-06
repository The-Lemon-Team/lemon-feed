import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FeedModeOption } from './toolbar/types';
import { FeedTabFilterConfig, FeedPrivacyFilter } from '../adapters/feeds/types';
import { SymbolIcon } from './common/SymbolIcon';
import { useModalBackdrop } from '../hooks/useModalBackdrop';
import {
  X,
  Save,
  Trash2,
  Sparkles,
  Tag,
  Info,
  Filter,
  Lock,
  Globe,
  Hash,
  Search,
  Check,
  Folder,
  Layers,
  Wand2,
} from 'lucide-react';

export interface FeedSourceTabModalProps {
  tab?: FeedModeOption | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (tab: FeedModeOption) => void | Promise<void>;
  onDelete?: (tabId: string) => void;
  allFeeds?: Array<{
    id: string;
    slug: string;
    title: string;
    privacy?: string;
    icon?: string | null;
    color?: string | null;
    count?: number;
  }>;
  availableHashtags?: Array<{ name: string; count: number }>;
}

const PRESET_EMOJIS = ['🌐', '💻', '🍋', '🍿', '🎉', '✈️', '🔮', '🔒', '📈', '🔬', '🎮', '⚡', '🧠', '🎧', '🚀', '🤖'];

const CYRILLIC_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
};

export function slugifyStreamTitle(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .split('')
    .map((char) => CYRILLIC_MAP[char] || char)
    .join('')
    .replace(/[^a-z0-9_\s-]/g, '')
    .replace(/[\s_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export const FeedSourceTabModal: React.FC<FeedSourceTabModalProps> = ({
  tab,
  isOpen,
  onClose,
  onSave,
  onDelete,
  allFeeds = [],
  availableHashtags = [],
}) => {
  const { backdropProps } = useModalBackdrop(onClose);
  const isEditing = Boolean(tab);

  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('📁');
  const [id, setId] = useState('');
  const [badge, setBadge] = useState('');
  const [description, setDescription] = useState('');
  const [privacyContour, setPrivacyContour] = useState<FeedPrivacyFilter>('all');
  const [selectedFeedSlugs, setSelectedFeedSlugs] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [folderPrefixes, setFolderPrefixes] = useState('');
  const [feedSearchQuery, setFeedSearchQuery] = useState('');
  const [feedCategoryFilter, setFeedCategoryFilter] = useState<'all' | 'tech' | 'media' | 'holidays' | 'private'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (tab) {
        setLabel(tab.label || '');
        setEmoji(tab.emoji || '📁');
        setId(tab.id || '');
        setBadge(tab.badge || '');
        setDescription(tab.description || '');
        setPrivacyContour(
          tab.filterConfig?.privacy || (tab.id === 'private_feeds' ? 'private' : 'all')
        );
        setSelectedFeedSlugs(tab.filterConfig?.feedSlugs || []);
        setSelectedTags(tab.filterConfig?.tags || []);
        setFolderPrefixes((tab.filterConfig?.folderPaths || []).join(', '));
      } else {
        setLabel('');
        setEmoji('✨');
        setId('');
        setBadge('');
        setDescription('');
        setPrivacyContour('all');
        setSelectedFeedSlugs([]);
        setSelectedTags([]);
        setFolderPrefixes('');
      }
      setFeedSearchQuery('');
      setFeedCategoryFilter('all');
      setTagInput('');
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
      const slug = slugifyStreamTitle(val);
      setId(slug);
    }
  };

  // Add / remove tag
  const handleAddTag = (rawTag?: string) => {
    const candidate = (rawTag || tagInput).replace(/^#/, '').trim().toLowerCase();
    if (!candidate) return;
    if (!selectedTags.includes(candidate)) {
      setSelectedTags((prev) => [...prev, candidate]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Quick Preset Templates
  const handleApplyTemplate = (type: 'ai' | 'releases' | 'private' | 'daily') => {
    if (type === 'ai') {
      setLabel('AI & Нейросети');
      setEmoji('🤖');
      setId('ai_tab');
      setBadge('ai');
      setDescription('Сводка по искусственному интеллекту, LLM и релизы');
      setSelectedTags(['ai', 'ml', 'llm', 'нейросети']);
      setSelectedFeedSlugs(
        allFeeds.filter((f) => f.slug.includes('ai') || f.slug.includes('spark-ai')).map((f) => f.slug)
      );
    } else if (type === 'releases') {
      setLabel('Релизы & Changelogs');
      setEmoji('🚀');
      setId('releases_tab');
      setBadge('hot');
      setDescription('Официальные релизы моделей, версий и обновлений вендоров');
      setSelectedTags(['release', 'changelog', 'релиз', 'обновление']);
      setSelectedFeedSlugs(
        allFeeds.filter((f) => f.slug.includes('changelog')).map((f) => f.slug)
      );
    } else if (type === 'private') {
      setLabel('Private Vault');
      setEmoji('🔮');
      setId('private_feeds');
      setBadge('private');
      setDescription('Защищенный контур приватных заметок и личных лент');
      setPrivacyContour('private');
      setSelectedFeedSlugs(allFeeds.filter((f) => f.privacy === 'private').map((f) => f.slug));
    } else if (type === 'daily') {
      setLabel('Daily Radar');
      setEmoji('⚡');
      setId('daily_tab');
      setBadge('daily');
      setDescription('Ежедневные сводки, актуальные треки и статус проектов');
      setSelectedTags(['daily', 'radar', 'дайджест']);
    }
  };

  // Filtered feeds list
  const filteredFeeds = useMemo(() => {
    return allFeeds.filter((feed) => {
      // 1. Privacy filter
      if (privacyContour === 'private' && feed.privacy !== 'private') return false;
      if (privacyContour === 'public' && feed.privacy === 'private') return false;

      // 2. Category tab
      if (feedCategoryFilter === 'private' && feed.privacy !== 'private') return false;
      if (feedCategoryFilter === 'tech') {
        const isTech =
          feed.slug.includes('ai') ||
          feed.slug.includes('tech') ||
          feed.slug.includes('habr') ||
          feed.slug.includes('dev') ||
          feed.slug.includes('cyber') ||
          feed.slug.includes('changelog');
        if (!isTech) return false;
      }
      if (feedCategoryFilter === 'media') {
        const isMedia =
          feed.slug.includes('marvel') ||
          feed.slug.includes('cinema') ||
          feed.slug.includes('movie') ||
          feed.slug.includes('music') ||
          feed.slug.includes('game');
        if (!isMedia) return false;
      }
      if (feedCategoryFilter === 'holidays') {
        const isHol =
          feed.slug.includes('holiday') ||
          feed.slug.includes('calendar') ||
          feed.slug.includes('праздник') ||
          feed.slug.includes('orthodox');
        if (!isHol) return false;
      }

      // 3. Search query
      if (feedSearchQuery.trim()) {
        const q = feedSearchQuery.toLowerCase().trim();
        const matchTitle = feed.title?.toLowerCase().includes(q);
        const matchSlug = feed.slug?.toLowerCase().includes(q);
        if (!matchTitle && !matchSlug) return false;
      }

      return true;
    });
  }, [allFeeds, privacyContour, feedCategoryFilter, feedSearchQuery]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setErrorMsg('Укажите название раздела');
      return;
    }
    const finalId = id.trim() || slugifyStreamTitle(label) || 'custom_stream';

    const folderPathsArray = folderPrefixes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const filterConfig: FeedTabFilterConfig = {
      privacy: privacyContour,
      feedSlugs: selectedFeedSlugs.length > 0 ? selectedFeedSlugs : undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      folderPaths: folderPathsArray.length > 0 ? folderPathsArray : undefined,
    };

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await Promise.resolve(
        onSave({
          id: finalId,
          label: label.trim(),
          emoji: emoji || '📁',
          badge: badge.trim() || undefined,
          privacy: privacyContour === 'private' ? 'private' : 'public',
          description: description.trim() || undefined,
          filterConfig,
        })
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Ошибка сохранения стрима');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      style={{ zIndex: 9999 }}
      {...backdropProps}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-[#18222d] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl shadow-2xs">
              <SymbolIcon icon={emoji} fallback="📁" className="text-xl" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                <span>{isEditing ? 'Настройка таба потока' : 'Создать новый таб'}</span>
                {badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#2481cc] dark:text-blue-300 font-mono font-bold">
                    {badge}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Навыбор лент, закрепление хэштегов и правил контура
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
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs overflow-y-auto custom-scrollbar flex-1">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Presets Bar */}
          {!isEditing && (
            <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-100/70 dark:bg-[#121921]/70 border border-slate-200/60 dark:border-white/5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <Wand2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Быстрые шаблоны таба (1 клик):</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setLabel('Working Space');
                    setEmoji('✨');
                    setId('working_space');
                    setBadge('space');
                    setDescription('Личное рабочее пространство');
                    setSelectedFeedSlugs([]);
                    setSelectedTags([]);
                    setFolderPrefixes('');
                    setPrivacyContour('all');
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 dark:bg-amber-500/25 border border-amber-500/40 text-amber-800 dark:text-amber-200 hover:border-amber-500 transition-colors cursor-pointer"
                >
                  ✨ Чистый Working Space
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('ai')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-[#1e2a38] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-[#2481cc] transition-colors cursor-pointer"
                >
                  🤖 AI & Нейросети
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('releases')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-[#1e2a38] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-[#2481cc] transition-colors cursor-pointer"
                >
                  🚀 Релизы & Changelogs
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('private')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-[#1e2a38] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-purple-500 transition-colors cursor-pointer"
                >
                  🔮 Private Vault
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('daily')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-[#1e2a38] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-amber-500 transition-colors cursor-pointer"
                >
                  ⚡ Daily Radar
                </button>
              </div>
            </div>
          )}

          {/* Section 1: Label, ID, Emoji & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Название раздела (таба) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="Например: AI & Технологии"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#2481cc]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Идентификатор ID (URL Slug)
              </label>
              <input
                type="text"
                value={id}
                disabled={isEditing && (tab?.id === 'all' || tab?.id === 'telegram' || tab?.id === 'private_feeds')}
                onChange={(e) => setId(e.target.value)}
                placeholder="ai_tech"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono placeholder-slate-400 outline-none focus:border-[#2481cc] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Emoji & Badge Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  className="w-10 text-center py-1.5 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-white/10 text-base outline-none focus:border-[#2481cc]"
                />
                <div className="flex items-center gap-1 flex-wrap">
                  {PRESET_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer ${
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
                <span>Бейдж таба (опционально)</span>
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="live, hot, beta"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#2481cc]"
              />
            </div>
          </div>

          {/* Section 2: DATA SOURCE 1 — FEEDS SELECTION */}
          <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-[#121921]/90 border border-slate-200/80 dark:border-white/10 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200/50 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#2481cc]" />
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  Навыбор лент (Feeds Source)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[#2481cc] dark:text-blue-300 font-semibold">
                  {selectedFeedSlugs.length > 0 ? `${selectedFeedSlugs.length} выбрано` : 'Без внешних лент (чистый таб)'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedFeedSlugs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedFeedSlugs([])}
                    className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                  >
                    Сбросить выбор
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedFeedSlugs(filteredFeeds.map((f) => f.slug))}
                  className="text-[10px] text-[#2481cc] hover:underline cursor-pointer font-medium"
                >
                  Выбрать все в списке ({filteredFeeds.length})
                </button>
              </div>
            </div>

            {/* Filter toolbar inside feed selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              {/* Search feed input */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={feedSearchQuery}
                  onChange={(e) => setFeedSearchQuery(e.target.value)}
                  placeholder="Поиск по лентам..."
                  className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-white dark:bg-[#18222d] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#2481cc]"
                />
              </div>

              {/* Feed categories filter */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 text-[10px] font-medium">
                {(
                  [
                    { id: 'all', label: 'Все' },
                    { id: 'tech', label: '💻 IT/AI' },
                    { id: 'media', label: '🍿 Медиа' },
                    { id: 'holidays', label: '🎉 Даты' },
                    { id: 'private', label: '🔒 Приват' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFeedCategoryFilter(cat.id)}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      feedCategoryFilter === cat.id
                        ? 'bg-[#2481cc] text-white shadow-2xs font-semibold'
                        : 'bg-white dark:bg-[#18222d] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/5 hover:bg-slate-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feeds Selection Grid */}
            <div className="max-h-36 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 custom-scrollbar p-1 rounded-xl bg-white/60 dark:bg-black/20 border border-slate-200/60 dark:border-white/5">
              {filteredFeeds.length === 0 ? (
                <div className="col-span-2 py-4 text-center text-slate-400 text-xs">
                  Нет лент, соответствующих фильтру
                </div>
              ) : (
                filteredFeeds.map((feed) => {
                  const isSelected = selectedFeedSlugs.includes(feed.slug);
                  return (
                    <button
                      key={feed.slug}
                      type="button"
                      onClick={() => {
                        setSelectedFeedSlugs((prev) =>
                          isSelected ? prev.filter((s) => s !== feed.slug) : [...prev, feed.slug]
                        );
                      }}
                      className={`flex items-center justify-between gap-2 p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#2481cc]/15 border-[#2481cc] text-[#2481cc] dark:text-[#64b5f6] font-semibold shadow-2xs'
                          : 'bg-white dark:bg-[#18222d] border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <SymbolIcon
                          icon={feed.icon}
                          fallback={feed.privacy === 'private' ? '🔒' : '📁'}
                          className="text-base shrink-0"
                          style={feed.color ? { color: feed.color } : undefined}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-[11px] leading-tight font-medium">
                            {feed.title}
                          </div>
                          <div className="truncate text-[10px] text-slate-400 font-mono">
                            {feed.slug}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {feed.count !== undefined && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
                            {feed.count}
                          </span>
                        )}
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-[#2481cc] border-[#2481cc] text-white'
                              : 'border-slate-300 dark:border-white/20'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 3: DATA SOURCE 2 — HASHTAGS SOURCE (КАК ПРИ СОЗДАНИИ FEED) */}
          <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-[#121921]/90 border border-slate-200/80 dark:border-white/10 space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/50 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  Закрепить хэштег как источник данных (Hashtags Source)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedTags.length > 0 ? `${selectedTags.length} тегов` : 'Без привязки к тегам'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Заметки с указанными хэштегами будут автоматически попадать в этот таб и формировать интерактивные под-чипсы для каждого тега.
            </p>

            {/* Tag Input Field */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">
                  #
                </span>
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
                  placeholder="Введите хэштег (например: ai, release, urgent)..."
                  className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#18222d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-emerald-500 text-xs font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                + Добавить
              </button>
            </div>

            {/* Selected Hashtags Chips */}
            {selectedTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-semibold"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-emerald-600/70 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Удалить хэштег"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Popular Hashtags Suggestions */}
            {availableHashtags.length > 0 && (
              <div className="space-y-1.5 pt-1.5 border-t border-slate-200/50 dark:border-white/5">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Популярные хэштеги в ваших заметках (кликните для добавления):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap max-h-20 overflow-y-auto custom-scrollbar">
                  {availableHashtags.slice(0, 15).map(({ name, count }) => {
                    const isAlreadySelected = selectedTags.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleAddTag(name)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                          isAlreadySelected
                            ? 'bg-emerald-500 text-white font-bold'
                            : 'bg-white dark:bg-[#18222d] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-emerald-500'
                        }`}
                      >
                        <span>#{name}</span>
                        <span className="opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: PRIVACY CONTOUR & FOLDER PROJECTIONS */}
          <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-[#121921]/90 border border-slate-200/80 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/50 dark:border-white/5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-purple-500" />
                <span>Контур приватности & Папки</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Дополнительные фильтры</span>
            </div>

            {/* Privacy Contour Segmented Buttons */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Контур приватности:
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-black/20 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setPrivacyContour('all')}
                  className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    privacyContour === 'all'
                      ? 'bg-white dark:bg-[#243343] text-[#2481cc] dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  <span>Все ленты</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrivacyContour('private')}
                  className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    privacyContour === 'private'
                      ? 'bg-purple-600 text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-purple-300" />
                  <span>Только Private</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrivacyContour('public')}
                  className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    privacyContour === 'public'
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Только Public</span>
                </button>
              </div>
            </div>

            {/* Folder Paths */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-amber-500" />
                <span>Префиксы путей к папкам (через запятую, опционально):</span>
              </label>
              <input
                type="text"
                value={folderPrefixes}
                onChange={(e) => setFolderPrefixes(e.target.value)}
                placeholder="private/, 01_daily_logs/, vault/work/"
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#18222d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#2481cc] font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Mode Indicator Callout */}
          {selectedFeedSlugs.length === 0 && selectedTags.length === 0 && !folderPrefixes.trim() ? (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-[11px] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Чистое пространство:</strong> таб будет создан пустым (без записей из общей ленты). Вы сможете писать сюда заметки, прикреплять материалы или добавить фильтры позже.
              </span>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-200 text-[11px] flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#2481cc] shrink-0" />
              <span>
                <strong>Смарт-лента:</strong> в этот таб будут попадать публикации по выбранным источникам ({selectedFeedSlugs.length ? `${selectedFeedSlugs.length} лент` : ''}{selectedTags.length ? `${selectedFeedSlugs.length ? ', ' : ''}${selectedTags.length} тегов` : ''}{folderPrefixes.trim() ? ', папки' : ''}).
              </span>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Описание раздела
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание потока и назначения таба..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#2481cc] resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.08] shrink-0">
            {isEditing && onDelete && tab && tab.id !== 'all' && tab.id !== 'telegram' && tab.id !== 'private_feeds' ? (
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
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#2481cc] hover:bg-[#1e6cb0] disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Сохранение...' : 'Сохранить таб'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
