import React from 'react';
import { UnifiedFeedItem } from '../adapters/feeds/types';
import {
  CheckCircle2,
  Clock,
  Globe,
  RotateCcw,
  Lock,
  ArrowRight,
} from 'lucide-react';

export interface StagingCardModerationBarProps {
  item: UnifiedFeedItem;
  onApprovePublish?: (item: UnifiedFeedItem) => void;
  onUnpublishToStaging?: (item: UnifiedFeedItem) => void;
  onReturnToPrivate?: (item: UnifiedFeedItem) => void;
  isMutating?: boolean;
}

export const StagingCardModerationBar: React.FC<StagingCardModerationBarProps> = ({
  item,
  onApprovePublish,
  onUnpublishToStaging,
  onReturnToPrivate,
  isMutating = false,
}) => {
  const isPublished = item.status === 'PUBLISHED';
  const meta = (item.rawPayload?.metadata as any) || {};
  const adminFeedTitle = meta.adminFeedTitle || null;
  const publicFeedTitle = meta.publicFeedTitle || item.channelTitle;
  const hasDistinctAdminFeed = Boolean(
    adminFeedTitle && adminFeedTitle !== publicFeedTitle
  );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`mb-3 px-3 py-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs transition-colors ${
        isPublished
          ? 'bg-emerald-500/10 dark:bg-emerald-950/35 border-emerald-500/35 dark:border-emerald-500/30'
          : 'bg-amber-500/10 dark:bg-amber-950/35 border-amber-500/35 dark:border-amber-500/30'
      }`}
    >
      {/* Left: Status Mark & Feed Origin Mapping */}
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        {isPublished ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-bold shadow-xs">
            <CheckCircle2 className="w-3 h-3" />
            <span>✓ ОПУБЛИКОВАНО В ПАБЛИКЕ</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-mono font-bold shadow-xs">
            <Clock className="w-3 h-3" />
            <span>⏳ НА ПРЕМОДЕРАЦИИ (СТЕЙДЖИНГ)</span>
          </span>
        )}

        {hasDistinctAdminFeed && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-black/25 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-white/10">
            <span className="truncate max-w-[120px]" title={`Админ-лента: ${adminFeedTitle}`}>
              {adminFeedTitle}
            </span>
            <ArrowRight className="w-2.5 h-2.5 text-[#2481cc] shrink-0" />
            <span className="font-semibold text-[#2481cc] dark:text-[#64b5f6] truncate max-w-[130px]">
              {publicFeedTitle}
            </span>
          </span>
        )}
      </div>

      {/* Right: Quick Staging Moderation Buttons */}
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        {!isPublished && onApprovePublish && (
          <button
            type="button"
            disabled={isMutating}
            onClick={() => onApprovePublish(item)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Одобрить и опубликовать в публичную ленту (:5176)"
          >
            <Globe className="w-3 h-3" />
            <span>Опубликовать</span>
          </button>
        )}

        {isPublished && onUnpublishToStaging && (
          <button
            type="button"
            disabled={isMutating}
            onClick={() => onUnpublishToStaging(item)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 border border-amber-500/40 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Снять с публикации обратно в черновик стейджинга"
          >
            <RotateCcw className="w-3 h-3" />
            <span>В стейджинг</span>
          </button>
        )}

        {onReturnToPrivate && (
          <button
            type="button"
            disabled={isMutating}
            onClick={() => onReturnToPrivate(item)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-300/70 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-[11px] font-mono transition-colors cursor-pointer disabled:opacity-50"
            title="Вернуть заметку в приватный контур (privacy = private)"
          >
            <Lock className="w-3 h-3" />
            <span className="hidden sm:inline">В приват</span>
          </button>
        )}
      </div>
    </div>
  );
};
