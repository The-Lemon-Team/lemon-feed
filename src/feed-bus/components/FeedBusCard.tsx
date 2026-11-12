import React, { useState } from 'react';
import { LemonModerationItem } from '@lenta/lemon-bus';
import {
  Check,
  X,
  Edit2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Flame,
  Globe,
  Tag,
  Clock,
} from 'lucide-react';
import dayjs from 'dayjs';

interface FeedBusCardProps {
  item: LemonModerationItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (item: LemonModerationItem) => void;
  onEdit: (item: LemonModerationItem) => void;
}

export const FeedBusCard: React.FC<FeedBusCardProps> = ({
  item,
  isSelected,
  onToggleSelect,
  onApprove,
  onReject,
  onEdit,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPending = item.status === 'PENDING';
  const isApproved = item.status === 'APPROVED';
  const isRejected = item.status === 'REJECTED';

  const formattedDate = item.startDate
    ? dayjs(item.startDate).format('DD.MM.YYYY HH:mm')
    : dayjs(item.createdAt).format('DD.MM.YYYY HH:mm');

  return (
    <article
      className={`relative rounded-xl border p-4 transition-all ${
        isSelected
          ? 'bg-primary/5 border-primary shadow-sm'
          : isApproved
            ? 'bg-emerald-500/5 border-emerald-500/30'
            : isRejected
              ? 'bg-rose-500/5 border-rose-500/30 opacity-75'
              : 'bg-surface-container/70 border-outline-variant/30 hover:border-outline-variant/60 shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Selection Checkbox */}
        <div className="pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(item.id)}
            className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
          />
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Metadata Pill Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category */}
            {item.category && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider bg-surface-container-highest text-primary border border-outline-variant/30">
                {item.category}
              </span>
            )}

            {/* Author / Source */}
            <span className="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium">
              <Globe className="w-3 h-3 text-outline" />
              <span>{item.author || item.sourceType || 'Вотчер'}</span>
            </span>

            {/* Date */}
            <span className="flex items-center gap-1 text-[11px] text-outline font-mono">
              <Clock className="w-3 h-3" />
              <span>{formattedDate}</span>
            </span>

            {/* Resonance Score */}
            {item.resonanceScore != null && item.resonanceScore > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 ml-auto">
                <Flame className="w-3 h-3" />
                <span>{item.resonanceScore}</span>
              </span>
            )}

            {/* Status indicator badge (if not pending) */}
            {isApproved && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 ml-auto">
                ОДОБРЕНО
              </span>
            )}
            {isRejected && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 ml-auto">
                ОТКЛОНЕНО
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-sm sm:text-base font-semibold text-on-surface hover:text-primary leading-snug">
            {item.sourceLink ? (
              <a
                href={item.sourceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline flex items-baseline gap-1.5"
              >
                <span>{item.title}</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
              </a>
            ) : (
              item.title
            )}
          </h2>

          {/* AI Summary / Digest */}
          {item.summary && (
            <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
              {item.summary}
            </p>
          )}

          {/* Rejection reason (if rejected) */}
          {isRejected && item.rejectReason && (
            <div className="text-xs font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
              Причина отклонения: {item.rejectReason}
            </div>
          )}

          {/* Expanded raw content preview */}
          {isExpanded && item.rawContent && (
            <div className="mt-2 p-3 rounded-lg bg-surface-container-highest/80 border border-outline-variant/30 text-xs text-on-surface font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
              {item.rawContent}
            </div>
          )}

          {/* Tags & expand toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-outline-variant/20">
            {/* Hashtags */}
            <div className="flex flex-wrap items-center gap-1.5">
              {item.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-container-highest text-on-surface-variant"
                >
                  <Tag className="w-2.5 h-2.5 text-outline" />
                  <span>#{tag.replace(/^#/, '')}</span>
                </span>
              ))}
            </div>

            {/* Expand / Collapse Button */}
            {item.rawContent && (
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className="flex items-center gap-1 text-[11px] text-outline hover:text-on-surface transition-colors"
              >
                {isExpanded ? (
                  <>
                    <span>Свернуть</span>
                    <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span>Полный текст</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Moderation Actions Footer (Sticky/Prominent) */}
      <div className="mt-3 pt-2.5 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] font-mono text-outline">
          ID: {item.id.slice(0, 10)}...
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Edit button */}
          <button
            onClick={() => onEdit(item)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-variant text-on-surface-variant hover:text-on-surface text-xs font-medium border border-outline-variant/30 transition-all"
            title="Отредактировать заголовок, теги или summary перед публикацией"
          >
            <Edit2 className="w-3.5 h-3.5 text-primary" />
            <span>Править</span>
          </button>

          {/* Reject button */}
          {item.status !== 'REJECTED' && (
            <button
              onClick={() => onReject(item)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-500/30 transition-all"
              title="Отклонить заметку"
            >
              <X className="w-3.5 h-3.5" />
              <span>Отклонить</span>
            </button>
          )}

          {/* Approve button */}
          {item.status !== 'APPROVED' && (
            <button
              onClick={() => onApprove(item.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all"
              title="Одобрить заметку и опубликовать в боевую ленту"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Одобрить</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
