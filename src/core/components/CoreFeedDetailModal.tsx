import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X,
  Clock,
  Flame,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  ZoomIn,
  Image as ImageIcon,
} from 'lucide-react';
import { FeedDetailSlots, FeedEntry } from '../types';
import { SymbolIcon } from '../../components/common/SymbolIcon';
import { useModalBackdrop } from '../../hooks/useModalBackdrop';

export interface CoreFeedDetailModalProps<TEntry extends FeedEntry<any> = FeedEntry> {
  entry: TEntry | null;
  onClose: () => void;
  slots?: FeedDetailSlots<TEntry>;
  onSelectTag?: (tag: string) => void;
  onNavigateHistoryBack?: (entry: TEntry) => void;
  resolveImageUrl?: (url: string) => string;
  formatMarkdown?: (markdown: string, entry: TEntry) => string;
  onMarkdownLinkClick?: (href: string, e: React.MouseEvent) => boolean | void;
  disableEscClose?: boolean;
  externalDirection?: 'forward' | 'backward' | 'none';
}

export function CoreFeedDetailModal<TEntry extends FeedEntry<any> = FeedEntry>({
  entry,
  onClose,
  slots,
  onSelectTag,
  onNavigateHistoryBack,
  resolveImageUrl = (u) => u,
  formatMarkdown,
  onMarkdownLinkClick,
  disableEscClose = false,
  externalDirection = 'none',
}: CoreFeedDetailModalProps<TEntry>) {
  const [imageError, setImageError] = useState(false);
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const [historyStack, setHistoryStack] = useState<TEntry[]>(() => (entry ? [entry] : []));
  const [direction, setDirection] = useState<'forward' | 'backward' | 'none'>('none');

  useEffect(() => {
    if (externalDirection !== 'none') {
      setDirection(externalDirection);
    }
  }, [externalDirection]);

  useEffect(() => {
    if (!entry) {
      setHistoryStack([]);
      setDirection('none');
      return;
    }

    setHistoryStack((prev) => {
      if (prev.length === 0) return [entry];
      const current = prev[prev.length - 1];
      if (current.id === entry.id) {
        return [...prev.slice(0, -1), entry];
      }
      const existingIdx = prev.findIndex((h) => h.id === entry.id);
      if (existingIdx >= 0) {
        return prev.slice(0, existingIdx + 1);
      }
      return [...prev, entry];
    });
  }, [entry]);

  const activeEntry = historyStack[historyStack.length - 1] || entry;

  useEffect(() => {
    setImageError(false);
    setSelectedImageIndex(null);
    setZoomedUrl(null);
  }, [activeEntry?.id]);

  useEffect(() => {
    if (!activeEntry) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableEscClose) {
        e.stopImmediatePropagation();
        e.stopPropagation();
        if (zoomedUrl) {
          setZoomedUrl(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [activeEntry, onClose, disableEscClose, zoomedUrl]);

  const canGoBack = historyStack.length > 1;

  const handleGoBack = () => {
    if (!canGoBack) return;
    const target = historyStack[historyStack.length - 2];
    setDirection('backward');
    setHistoryStack((prev) => prev.slice(0, -1));
    if (target) {
      onNavigateHistoryBack?.(target);
    }
  };

  const { backdropProps } = useModalBackdrop(onClose);
  const { backdropProps: zoomBackdropProps } = useModalBackdrop(() => setZoomedUrl(null));

  const coverUrl =
    activeEntry?.coverUrl ||
    activeEntry?.images?.find((img) => img.isMain)?.url ||
    activeEntry?.images?.[0]?.url ||
    null;

  const allImages = useMemo(() => {
    if (!activeEntry) return [];
    if (activeEntry.images && activeEntry.images.length > 0) {
      return activeEntry.images;
    }
    if (coverUrl) {
      return [{ id: 'main', url: coverUrl, isMain: true }];
    }
    return [];
  }, [activeEntry, coverUrl]);

  const activeImageIndex = useMemo(() => {
    if (selectedImageIndex !== null) return selectedImageIndex;
    const mainIdx = allImages.findIndex((img) => img.isMain);
    return mainIdx >= 0 ? mainIdx : 0;
  }, [allImages, selectedImageIndex]);

  if (!activeEntry) return null;

  const activeImage = allImages[activeImageIndex] || allImages[0] || null;
  const currentCoverUrl = activeImage?.url || coverUrl;

  const formattedDate = new Date(activeEntry.publishedAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const markdownSource = activeEntry.bodyMarkdown || activeEntry.excerpt || '';
  const renderedMarkdown = formatMarkdown
    ? formatMarkdown(markdownSource, activeEntry)
    : markdownSource;

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
        {!canGoBack && slots?.renderBreadcrumb?.(activeEntry)}

        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-100 dark:border-white/[0.08] shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
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
              <SymbolIcon
                icon={activeEntry.source.avatarIcon || '✨'}
                fallback="✨"
                className="text-base"
              />
            </div>

            <div className="min-w-0">
              <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {activeEntry.source.title}
              </h4>
              {activeEntry.source.handle && (
                <span className="text-[11px] font-mono text-slate-400">
                  @{activeEntry.source.handle.replace(/^@+/, '')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${activeEntry.category.colorClass}`}
            >
              {activeEntry.category.emoji} {activeEntry.category.label}
            </span>

            {slots?.renderHeaderBadges?.(activeEntry)}

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

        {/* Scrollable Content */}
        <div
          key={activeEntry.id}
          className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 touch-scroll ${
            direction === 'forward'
              ? 'animate-telegram-forward'
              : direction === 'backward'
                ? 'animate-telegram-backward'
                : ''
          }`}
        >
          {currentCoverUrl && !imageError && (
            <div className="space-y-2 shrink-0">
              <div
                className="group relative w-full h-72 sm:h-88 overflow-hidden rounded-2xl bg-slate-900/40 dark:bg-black/60 border border-slate-200/60 dark:border-white/10 cursor-pointer flex items-center justify-center"
                onClick={() => setZoomedUrl(resolveImageUrl(currentCoverUrl))}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center filter blur-2xl scale-125 opacity-40 dark:opacity-50 pointer-events-none transition-all duration-500"
                  style={{ backgroundImage: `url("${resolveImageUrl(currentCoverUrl)}")` }}
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-0 bg-black/15 dark:bg-black/35 pointer-events-none"
                  aria-hidden="true"
                />

                <img
                  src={resolveImageUrl(currentCoverUrl)}
                  alt={activeImage?.caption || activeEntry.title}
                  onError={() => setImageError(true)}
                  className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-[1.01]"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomedUrl(resolveImageUrl(currentCoverUrl));
                  }}
                  className="absolute z-20 bottom-2.5 right-2.5 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                  title="Увеличить постер"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                {allImages.length > 1 && (
                  <div className="absolute z-20 top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[11px] font-mono backdrop-blur-xs flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    <span>
                      {activeImageIndex + 1} / {allImages.length}
                    </span>
                  </div>
                )}
              </div>

              {allImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 touch-scroll">
                  {allImages.map((img, idx) => {
                    const isSelected = idx === activeImageIndex;
                    return (
                      <button
                        key={img.id || idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-14 h-14 rounded-xl overflow-hidden border shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#2481cc] ring-2 ring-[#2481cc]/40 scale-105'
                            : 'border-slate-200 dark:border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={resolveImageUrl(img.thumbnailUrl || img.url)}
                          alt={img.caption || `Poster ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {img.isMain && (
                          <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-amber-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
            {activeEntry.title}
          </h2>

          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 pb-2 border-b border-slate-100 dark:border-white/[0.06] flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </span>

            {typeof activeEntry.score === 'number' && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>Резонанс {activeEntry.score}%</span>
              </span>
            )}
          </div>

          {slots?.renderBodyExtras?.(activeEntry)}

          {renderedMarkdown && (
            <div className="feed-prose text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ node, href, ...props }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (href && onMarkdownLinkClick?.(href, e)) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      {...props}
                    />
                  ),
                }}
              >
                {renderedMarkdown}
              </ReactMarkdown>
            </div>
          )}

          {slots?.renderAfterMarkdown?.(activeEntry)}

          {activeEntry.tags && activeEntry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              {activeEntry.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    onSelectTag?.(tag);
                    onClose();
                  }}
                  className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer"
                >
                  #{tag.replace(/^#/, '')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-[#131b24] border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {slots?.renderFooterLeft?.(activeEntry)}
          </div>

          <div className="flex items-center gap-3 flex-wrap ml-auto">
            {activeEntry.author && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-[#2481cc]" />
                <span>Автор: {activeEntry.author}</span>
              </div>
            )}

            {slots?.renderFooterRight?.(activeEntry)}

            {activeEntry.url && (
              <a
                href={activeEntry.url}
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

      {zoomedUrl && (
        <div
          className="fixed inset-0 bg-black/95 z-[11000] flex items-center justify-center p-4 animate-fade-in"
          {...zoomBackdropProps}
        >
          <button
            type="button"
            onClick={() => setZoomedUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            aria-label="Закрыть полноэкранный просмотр"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={zoomedUrl}
            alt="Zoomed Poster"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>,
    document.body
  );
}
