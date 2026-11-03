import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { UnifiedFeedItem } from '../adapters/feeds/types';
import { resolveMediaUrl } from '../api/client';
import { cleanNoteMarkdown } from '@lenta/shared';
import { useModalBackdrop } from '../hooks/useModalBackdrop';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X,
  Clock,
  Flame,
  ExternalLink,
  Sparkles,
  Edit3,
  Link2,
  ArrowRight,
  ArrowLeft,
  CornerDownRight,
} from 'lucide-react';
import { SymbolIcon } from './common/SymbolIcon';

export interface FeedDetailModalProps {
  item: UnifiedFeedItem | null;
  onClose: () => void;
  onSelectTag?: (tag: string) => void;
  onEditNote?: (item: UnifiedFeedItem) => void;
  onAiCover?: (item: UnifiedFeedItem) => void;
  onOpenNoteById?: (noteId: string) => void;
  disableEscClose?: boolean;
}

export const FeedDetailModal: React.FC<FeedDetailModalProps> = ({
  item,
  onClose,
  onSelectTag,
  onEditNote,
  onAiCover,
  onOpenNoteById,
  disableEscClose = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // In-modal navigation history stack
  const [historyStack, setHistoryStack] = useState<UnifiedFeedItem[]>(() => (item ? [item] : []));
  const [direction, setDirection] = useState<'forward' | 'backward' | 'none'>('none');

  // Sync incoming item with history stack
  useEffect(() => {
    if (!item) {
      setHistoryStack([]);
      setDirection('none');
      return;
    }

    setHistoryStack((prev) => {
      if (prev.length === 0) return [item];

      const current = prev[prev.length - 1];
      if (current.id === item.id) {
        // Update current item in-place (e.g. metadata or background refetch)
        return [...prev.slice(0, -1), item];
      }

      // Check if item is already in earlier history (e.g. went back)
      const existingIdx = prev.findIndex((h) => h.id === item.id);
      if (existingIdx >= 0) {
        return prev.slice(0, existingIdx + 1);
      }

      // Pushed new related item
      return [...prev, item];
    });
  }, [item]);

  const activeItem = historyStack[historyStack.length - 1] || item;

  useEffect(() => {
    setImageError(false);
  }, [activeItem?.id]);

  useEffect(() => {
    if (!activeItem) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableEscClose) {
        e.stopImmediatePropagation();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [activeItem, onClose, disableEscClose]);

  const canGoBack = historyStack.length > 1;

  const handleGoBack = () => {
    if (!canGoBack) return;
    const target = historyStack[historyStack.length - 2];
    setDirection('backward');
    setHistoryStack((prev) => prev.slice(0, -1));
    if (onOpenNoteById && target) {
      onOpenNoteById(target.id);
    }
  };

  // Resolve parent note context for direct link entry
  const parentMilestone = useMemo(() => {
    if (!activeItem) return null;
    const related = (activeItem.rawPayload?.metadata as any)?.relatedNotes;
    if (Array.isArray(related)) {
      const parentRel = related.find((r: any) => r.isParent && r.resolved && r.targetNoteId);
      if (parentRel) return parentRel;
    }
    if (activeItem.rawPayload?.parentNoteId) {
      return {
        targetNoteId: activeItem.rawPayload.parentNoteId,
        targetTitle: 'Родительский дайджест',
        isParent: true,
      };
    }
    return null;
  }, [activeItem]);

  const { backdropProps } = useModalBackdrop(onClose);

  if (!activeItem) return null;

  const coverUrl =
    activeItem.coverUrl ||
    (activeItem.rawPayload?.images?.find((img: any) => img.isMain)?.url) ||
    activeItem.rawPayload?.images?.[0]?.url ||
    null;

  const formattedDate = new Date(activeItem.publishedAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in"
      style={{ zIndex: 9999 }}
      {...backdropProps}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full sm:max-w-2xl max-h-[90vh] bg-white dark:bg-[#17212b] rounded-t-3xl sm:rounded-2xl shadow-elevated border border-slate-200/80 dark:border-white/10 flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Breadcrumb for Direct Link entry (when no local history exists) */}
        {!canGoBack && parentMilestone && (
          <div className="px-4 py-2 bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent dark:from-violet-500/15 dark:via-indigo-500/10 border-b border-violet-500/20 flex items-center justify-between text-xs select-none shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <CornerDownRight className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-violet-600 dark:text-violet-400 font-bold shrink-0">
                Входит в сюжет:
              </span>
              <button
                type="button"
                onClick={() => {
                  setDirection('backward');
                  onOpenNoteById?.(parentMilestone.targetNoteId);
                }}
                className="font-semibold text-slate-800 dark:text-slate-100 hover:text-violet-600 dark:hover:text-violet-300 truncate underline decoration-violet-500/30 hover:decoration-violet-500 transition-colors cursor-pointer text-left"
                title="Перейти к родительской заметке"
              >
                {parentMilestone.targetTitle || parentMilestone.cleanTitle}
              </button>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-violet-500 shrink-0 ml-2" />
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-100 dark:border-white/[0.08] shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Back button when stack has history */}
            {canGoBack && (
              <button
                type="button"
                onClick={handleGoBack}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                title={`Назад к: ${historyStack[historyStack.length - 2]?.title || 'предыдущей записи'}`}
                aria-label="Назад к предыдущей новости"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-semibold hidden sm:inline">Назад</span>
              </button>
            )}

            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-sm font-bold text-[#2481cc] overflow-hidden shrink-0">
              <SymbolIcon icon={activeItem.avatarIcon} fallback="✨" className="text-base" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {activeItem.channelTitle}
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                @{activeItem.channelHandle.replace(/^@+/, '')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${activeItem.category.colorClass}`}>
              {activeItem.category.emoji} {activeItem.category.label}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content with Telegram-style horizontal slide */}
        <div
          key={activeItem.id}
          className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 touch-scroll ${
            direction === 'forward'
              ? 'animate-telegram-forward'
              : direction === 'backward'
              ? 'animate-telegram-backward'
              : ''
          }`}
        >
          {coverUrl && !imageError && (
            <div className="relative w-full h-52 sm:h-64 overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 shrink-0">
              <img
                src={resolveMediaUrl(coverUrl)}
                alt={activeItem.title}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
            {activeItem.title}
          </h2>

          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 pb-2 border-b border-slate-100 dark:border-white/[0.06] flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </span>

            {typeof activeItem.resonanceScore === 'number' && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>Резонанс {activeItem.resonanceScore}%</span>
              </span>
            )}
          </div>

          {/* Full Markdown Text */}
          <div className="feed-prose text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {cleanNoteMarkdown(activeItem.description, { title: activeItem.title })}
            </ReactMarkdown>
          </div>

          {/* Related Notes / Story Links (Jira-style connections) */}
          {Array.isArray(activeItem.rawPayload?.metadata?.relatedNotes) &&
            activeItem.rawPayload.metadata.relatedNotes.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-violet-500" />
                    Связанные записи ({activeItem.rawPayload.metadata.relatedNotes.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeItem.rawPayload.metadata.relatedNotes.map((rel: any, idx: number) => {
                    const isResolved = rel.resolved && rel.targetNoteId;
                    return (
                      <div
                        key={`${rel.targetNoteId || rel.cleanTitle}-${idx}`}
                        onClick={() => {
                          if (isResolved && onOpenNoteById) {
                            setDirection('forward');
                            onOpenNoteById(rel.targetNoteId);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isResolved
                            ? 'bg-slate-50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5 cursor-pointer group shadow-2xs hover:shadow-xs'
                            : 'bg-slate-50/50 dark:bg-white/[0.01] border-slate-200/40 dark:border-white/5 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-sm shrink-0">{rel.targetIcon || '📄'}</span>
                          {rel.role === 'podcast' ? (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
                              🎧 Подкаст
                            </span>
                          ) : rel.relation ? (
                            <span
                              className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold truncate max-w-[120px]"
                              title={rel.relation}
                            >
                              {rel.relation}
                            </span>
                          ) : rel.targetType && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold">
                              {rel.targetType}
                            </span>
                          )}
                          {isResolved && (
                            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-transform ml-auto" />
                          )}
                        </div>
                        <h6 className="font-medium text-xs text-slate-900 dark:text-white truncate mt-1">
                          {rel.targetTitle || rel.cleanTitle}
                        </h6>
                        {rel.targetDate && (
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            {new Date(rel.targetDate).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Tags */}
          {activeItem.hashtags && activeItem.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              {activeItem.hashtags.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    onSelectTag?.(h);
                    onClose();
                  }}
                  className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer"
                >
                  #{h.replace(/^#/, '')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-[#131b24] border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-2">
            {onAiCover && (
              <button
                type="button"
                onClick={() => onAiCover(activeItem)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Обложка</span>
              </button>
            )}

            {onEditNote && (
              <button
                type="button"
                onClick={() => onEditNote(activeItem)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#2481cc]" />
                <span>Редактировать</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeItem.curator && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-[#2481cc]" />
                <span>Автор: {activeItem.curator}</span>
              </div>
            )}

            {activeItem.sourceLink && (
              <a
                href={activeItem.sourceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2481cc] hover:bg-[#1e6cb0] text-white text-xs font-medium transition-colors shadow-xs"
              >
                <span>Открыть оригинал</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
