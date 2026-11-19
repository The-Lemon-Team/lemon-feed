import React from 'react';

export interface CoreChipItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  title?: string;
}

export interface CoreChipBarProps {
  items: CoreChipItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  allChip?: {
    id?: string;
    label: string;
    icon?: React.ReactNode;
    count?: number;
    title?: string;
  };
  renderChipExtras?: (item: CoreChipItem, isActive: boolean) => React.ReactNode;
  renderEnd?: (selectedId: string) => React.ReactNode;
  endContent?: React.ReactNode;
  wrap?: boolean;
  className?: string;
}

/**
 * Reusable filter chip bar for FeedCore scenarios.
 * Supports an optional "All" leading chip, per-chip extras, and an extensible trailing slot (`renderEnd` / `endContent`).
 */
export const CoreChipBar: React.FC<CoreChipBarProps> = ({
  items,
  selectedId,
  onSelect,
  allChip,
  renderChipExtras,
  renderEnd,
  endContent,
  wrap = true,
  className = '',
}) => {
  const allId = allChip?.id ?? '';

  return (
    <div
      className={`flex items-center gap-1.5 ${
        wrap ? 'flex-wrap' : 'overflow-x-auto pb-0.5 touch-scroll'
      } ${className}`}
    >
      {allChip && (
        <button
          type="button"
          onClick={() => onSelect(allId)}
          title={allChip.title}
          aria-pressed={selectedId === allId}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer border ${
            selectedId === allId
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          {allChip.icon && <span>{allChip.icon}</span>}
          <span>{allChip.label}</span>
          {typeof allChip.count === 'number' && (
            <span className="font-mono text-[10px] opacity-75">{allChip.count}</span>
          )}
        </button>
      )}

      {items.map((item) => {
        const active = selectedId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            title={item.title}
            aria-pressed={active}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer border ${
              active
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            {item.icon && <span>{item.icon}</span>}
            <span>{item.label}</span>
            {typeof item.count === 'number' && (
              <span className="font-mono text-[10px] opacity-75">{item.count}</span>
            )}
            {renderChipExtras?.(item, active)}
          </button>
        );
      })}

      {endContent}
      {renderEnd?.(selectedId)}
    </div>
  );
};
