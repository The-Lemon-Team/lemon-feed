import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Image as ImageIcon, Check, X, Loader2, ZoomIn } from 'lucide-react';
import { WebImageResult } from '@lenta/shared';
import { feedApi } from '../../api/client';
import { useModalBackdrop } from '../../hooks/useModalBackdrop';

export interface WebPosterSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onSelectImages: (images: WebImageResult[]) => Promise<void> | void;
  zIndex?: number;
}

const QUICK_CHIPS = [
  { label: '🎬 Постер', querySuffix: 'постер' },
  { label: '📰 Новость', querySuffix: 'новость' },
  { label: '⚡ Презентация', querySuffix: 'презентация' },
  { label: '🎮 Игра', querySuffix: 'game poster' },
  { label: '📐 16:9', querySuffix: 'wallpaper 16:9' },
];

export const WebPosterSearchModal: React.FC<WebPosterSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  onSelectImages,
  zIndex = 10500,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<WebImageResult[]>([]);
  const [selectedMap, setSelectedMap] = useState<Map<string, WebImageResult>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { backdropProps } = useModalBackdrop(onClose);
  const { backdropProps: zoomBackdropProps } = useModalBackdrop(() => setZoomedUrl(null));

  // Keyboard Escape handler (Rule 7) — capture phase prevents closing parent modals
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        e.stopPropagation();
        if (zoomedUrl) {
          setZoomedUrl(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, zoomedUrl, onClose]);

  // Reset or run initial search
  useEffect(() => {
    if (isOpen) {
      setSelectedMap(new Map());
      setError(null);
      const cleanInitial = initialQuery.trim();
      setQuery(cleanInitial);
      if (cleanInitial) {
        performSearch(cleanInitial);
      } else {
        setResults([]);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialQuery]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await feedApi.searchWebImages(searchQuery.trim(), { num: 24 });
      setResults(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Ошибка поиска в Google');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    performSearch(query);
  };

  const handleChipClick = (suffix: string) => {
    const base = initialQuery.trim() || query.trim();
    const newQuery = base ? `${base} ${suffix}` : suffix;
    setQuery(newQuery);
    performSearch(newQuery);
  };

  const toggleSelect = (item: WebImageResult) => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(item.imageUrl)) {
        next.delete(item.imageUrl);
      } else {
        next.set(item.imageUrl, item);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    const selectedList = Array.from(selectedMap.values());
    if (selectedList.length === 0) return;
    setIsSubmitting(true);
    try {
      await onSelectImages(selectedList);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Не удалось прикрепить изображения');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedCount = selectedMap.size;
  const selectedArray = Array.from(selectedMap.keys());

  return createPortal(
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      style={{ zIndex }}
      {...backdropProps}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-[#17212b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs sm:text-sm"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-[#121923]/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2481cc]/15 text-[#2481cc] flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>Поиск постеров (Google)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#2481cc]/10 text-[#2481cc] dark:text-[#52a5e8] border border-[#2481cc]/20 font-mono">
                  Serper • Google Images
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Выберите один или несколько постеров к фильму, новости или релизу
              </p>
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

        {/* Search Bar & Quick Chips */}
        <div className="p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/30 dark:bg-[#121923]/40 space-y-2.5">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    performSearch(query);
                  }
                }}
                placeholder="Введите название фильма, игры, персоны или новости..."
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-[#2481cc] dark:focus:border-[#2481cc] rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-4 py-2 bg-[#2481cc] hover:bg-[#1f72b5] text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Найти</span>
            </button>
          </form>

          {/* Quick chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">Быстрые фильтры:</span>
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleChipClick(chip.querySuffix)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/5 hover:bg-[#2481cc]/15 border border-slate-200 dark:border-white/10 hover:border-[#2481cc]/40 text-slate-600 dark:text-slate-300 hover:text-[#2481cc] dark:hover:text-[#52a5e8] text-[11px] font-medium transition-all cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        <div className="p-4 overflow-y-auto flex-1 min-h-[300px] max-h-[55vh] touch-scroll">
          {error && (
            <div className="p-3 mb-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => performSearch(query)}
                className="underline hover:text-rose-900 dark:hover:text-rose-200 ml-3 cursor-pointer"
              >
                Повторить
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#2481cc]" />
              <span className="text-xs">Ищем постеры в Google Images...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 text-center p-6 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
              <ImageIcon className="w-10 h-10 text-slate-300 dark:text-white/20" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Постеры не найдены</p>
              <p className="text-[11px] text-slate-400 max-w-sm">
                Попробуйте изменить запрос или уточнить название на английском/русском
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {results.map((item) => {
                const isSelected = selectedMap.has(item.imageUrl);
                const selectionIndex = selectedArray.indexOf(item.imageUrl);
                const isMainBadge = selectionIndex === 0;

                return (
                  <div
                    key={item.imageUrl}
                    onClick={() => toggleSelect(item)}
                    className={`group relative rounded-xl overflow-hidden border transition-all cursor-pointer bg-slate-50 dark:bg-white/5 flex flex-col ${
                      isSelected
                        ? 'border-[#2481cc] ring-2 ring-[#2481cc]/30 shadow-md scale-[1.01]'
                        : 'border-slate-200/80 dark:border-white/10 hover:border-[#2481cc]/50 hover:shadow-sm'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="relative aspect-[3/4] bg-slate-100 dark:bg-black/40 overflow-hidden">
                      <img
                        src={item.thumbnailUrl || item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Selection checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[#2481cc] text-white font-bold shadow-md'
                              : 'bg-black/50 border border-white/60 text-transparent hover:border-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>

                      {/* Main cover indicator badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 z-10">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow ${
                              isMainBadge
                                ? 'bg-amber-400 text-black'
                                : 'bg-[#2481cc] text-white'
                            }`}
                          >
                            {isMainBadge ? '★ Обложка' : `#${selectionIndex + 1}`}
                          </span>
                        </div>
                      )}

                      {/* Zoom button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomedUrl(item.imageUrl);
                        }}
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur-xs transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Увеличить"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>

                      {/* Dimensions chip */}
                      {item.width && item.height && (
                        <div className="absolute bottom-2 left-2 text-[9px] text-white/90 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded border border-white/10 font-mono">
                          {item.width}×{item.height}
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="p-2 border-t border-slate-200/60 dark:border-white/10 bg-white dark:bg-[#17212b] flex flex-col justify-between flex-1">
                      <p className="text-[11px] text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight font-medium" title={item.title}>
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-1">
                        {item.source || item.domain}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-[#121923]/70 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {selectedCount > 0 ? (
              <span className="text-[#2481cc] font-semibold">
                Выбрано: {selectedCount} {selectedCount === 1 ? 'постер' : 'постера'} (первый станет обложкой)
              </span>
            ) : (
              <span>Кликните по постерам для выбора (мультиселект)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedCount === 0 || isSubmitting}
              className="px-4 py-1.5 rounded-xl bg-[#2481cc] hover:bg-[#1f72b5] text-white text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Добавить {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Zoom */}
      {zoomedUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-[11000] flex items-center justify-center p-4 animate-fade-in"
          {...zoomBackdropProps}
        >
          <button
            type="button"
            onClick={() => setZoomedUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
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
};
