import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { UnifiedFeedTab } from '../../adapters/feeds';

interface FeedCategoriesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeTabs: UnifiedFeedTab[];
  selectedFeedSlug?: string;
  onSelectFeed: (slug?: string) => void;
  totalCount: number;
}

export const FeedCategoriesSheet: React.FC<FeedCategoriesSheetProps> = ({
  isOpen,
  onClose,
  activeTabs,
  selectedFeedSlug,
  onSelectFeed,
  totalCount,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 sm:hidden bg-black/50 backdrop-blur-xs flex items-end animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full bg-white dark:bg-[#18222d] rounded-t-3xl max-h-[75vh] flex flex-col p-4 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Категории и каналы
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 space-y-1 touch-scroll">
          <button
            type="button"
            onClick={() => onSelectFeed(undefined)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium ${
              !selectedFeedSlug ? 'bg-[#2481cc]/10 text-[#2481cc]' : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            <span>Все каналы</span>
            <span className="font-mono text-[10px]">{totalCount}</span>
          </button>

          {activeTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectFeed(t.slug)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium ${
                selectedFeedSlug === t.slug ? 'bg-[#2481cc]/10 text-[#2481cc]' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span>{t.emoji}</span>
                <span className="truncate">{t.title}</span>
              </div>
              <span className="font-mono text-[10px]">{t.count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
