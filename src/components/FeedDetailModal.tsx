import React, { useEffect, useRef } from 'react';
import { UnifiedFeedItem } from '../adapters/feeds/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X,
  Clock,
  Flame,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export interface FeedDetailModalProps {
  item: UnifiedFeedItem | null;
  onClose: () => void;
  onSelectTag?: (tag: string) => void;
}

export const FeedDetailModal: React.FC<FeedDetailModalProps> = ({
  item,
  onClose,
  onSelectTag,
}) => {
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    if (!item) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [item, onClose]);

  if (!item) return null;

  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    mouseDownTargetRef.current = e.target;
  };

  const handleOverlayTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    mouseDownTargetRef.current = e.target;
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      e.target === e.currentTarget &&
      (!mouseDownTargetRef.current || mouseDownTargetRef.current === e.currentTarget)
    ) {
      onClose();
    }
    mouseDownTargetRef.current = null;
  };

  const formattedDate = new Date(item.publishedAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in"
      onMouseDown={handleOverlayMouseDown}
      onTouchStart={handleOverlayTouchStart}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl max-h-[90vh] bg-white dark:bg-[#17212b] rounded-t-3xl sm:rounded-2xl shadow-elevated border border-slate-200/80 dark:border-white/10 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-sm font-bold text-[#2481cc]">
              {item.avatarIcon}
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {item.channelTitle}
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                @{item.channelHandle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${item.category.colorClass}`}>
              {item.category.emoji} {item.category.label}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 touch-scroll">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {item.title}
          </h2>

          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </span>

            {typeof item.resonanceScore === 'number' && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>Резонанс {item.resonanceScore}%</span>
              </span>
            )}
          </div>

          {/* Full Markdown Text */}
          <div className="feed-prose text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {item.description}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          {item.hashtags && item.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              {item.hashtags.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    onSelectTag?.(h);
                    onClose();
                  }}
                  className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                >
                  #{h.replace(/^#/, '')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-[#131b24] border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            {item.curator && (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#2481cc]" />
                <span>Автор: {item.curator}</span>
              </>
            )}
          </div>

          {item.sourceLink && (
            <a
              href={item.sourceLink}
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
  );
};
