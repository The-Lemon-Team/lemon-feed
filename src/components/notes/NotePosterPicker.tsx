import React, { useState, useRef } from 'react';
import { Search, Image as ImageIcon, Upload, Star, X, Layers, Sparkles, Trash2, ZoomIn, Loader2 } from 'lucide-react';
import { NoteImage, PendingPosterItem, WebImageResult } from '@lenta/shared';
import { feedApi, resolveMediaUrl } from '../../api/client';
import { WebPosterSearchModal } from './WebPosterSearchModal';

export interface NotePosterPickerProps {
  noteId?: string;
  noteTitle?: string;
  existingImages?: NoteImage[];
  pendingPosters?: PendingPosterItem[];
  onPendingPostersChange?: (posters: PendingPosterItem[]) => void;
  onImagesUpdated?: () => void;
  onOpenAiCover?: () => void;
  readOnly?: boolean;
}

export const NotePosterPicker: React.FC<NotePosterPickerProps> = ({
  noteId,
  noteTitle = '',
  existingImages = [],
  pendingPosters = [],
  onPendingPostersChange,
  onImagesUpdated,
  onOpenAiCover,
  readOnly = false,
}) => {
  const isExistingNote = Boolean(noteId && noteId !== 'new');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);

  const allCount = isExistingNote ? existingImages.length : pendingPosters.length;

  const showFeedback = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Handle Google Serper Web Images selection
  const handleSelectWebImages = async (webImages: WebImageResult[]) => {
    if (webImages.length === 0) return;

    if (isExistingNote && noteId) {
      setIsProcessing(true);
      try {
        const items = webImages.map((img, idx) => ({
          url: img.imageUrl,
          caption: img.title,
          alt: img.title,
          isMain: existingImages.length === 0 && idx === 0,
        }));
        await feedApi.attachImagesFromUrls(noteId, items);
        showFeedback(`Добавлено постеров: ${webImages.length}`);
        onImagesUpdated?.();
      } catch (err: any) {
        showFeedback(err?.response?.data?.message || err?.message || 'Ошибка сохранения постеров');
      } finally {
        setIsProcessing(false);
      }
    } else if (onPendingPostersChange) {
      const hasMain = pendingPosters.some((p) => p.isMain);
      const newPending: PendingPosterItem[] = webImages.map((img, idx) => ({
        id: `web-${Date.now()}-${idx}`,
        url: img.imageUrl,
        thumbnailUrl: img.thumbnailUrl || img.imageUrl,
        title: img.title,
        isMain: !hasMain && idx === 0,
        width: img.width,
        height: img.height,
        source: img.source,
      }));
      onPendingPostersChange([...pendingPosters, ...newPending]);
      showFeedback(`Выбрано постеров: ${webImages.length}`);
    }
  };

  // Handle local files
  const handleFilesAdded = async (filesList: FileList | File[]) => {
    const validFiles: File[] = [];
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
      }
    }
    if (validFiles.length === 0) return;

    if (isExistingNote && noteId) {
      setIsProcessing(true);
      try {
        await feedApi.uploadImages(noteId, validFiles);
        showFeedback(`Загружено файлов: ${validFiles.length}`);
        onImagesUpdated?.();
      } catch (err: any) {
        showFeedback(err?.response?.data?.message || err?.message || 'Ошибка загрузки файлов');
      } finally {
        setIsProcessing(false);
      }
    } else if (onPendingPostersChange) {
      const hasMain = pendingPosters.some((p) => p.isMain);
      const newPending: PendingPosterItem[] = validFiles.map((file, idx) => ({
        id: `file-${Date.now()}-${idx}`,
        url: URL.createObjectURL(file),
        thumbnailUrl: URL.createObjectURL(file),
        title: file.name,
        isMain: !hasMain && idx === 0,
        file,
      }));
      onPendingPostersChange([...pendingPosters, ...newPending]);
    }
  };

  // Set Main Cover
  const handleSetMain = async (idOrIndex: string | number) => {
    if (readOnly) return;
    if (isExistingNote && noteId && typeof idOrIndex === 'string') {
      setIsProcessing(true);
      try {
        await feedApi.setMainImage(noteId, idOrIndex);
        showFeedback('Главная обложка обновлена');
        onImagesUpdated?.();
      } catch (err: any) {
        showFeedback(err?.response?.data?.message || 'Ошибка смены обложки');
      } finally {
        setIsProcessing(false);
      }
    } else if (onPendingPostersChange && typeof idOrIndex === 'number') {
      const updated = pendingPosters.map((p, idx) => ({
        ...p,
        isMain: idx === idOrIndex,
      }));
      onPendingPostersChange(updated);
    }
  };

  // Delete Image
  const handleDelete = async (idOrIndex: string | number) => {
    if (readOnly) return;
    if (isExistingNote && noteId && typeof idOrIndex === 'string') {
      setIsProcessing(true);
      try {
        await feedApi.deleteImage(noteId, idOrIndex);
        showFeedback('Постер удален');
        onImagesUpdated?.();
      } catch (err: any) {
        showFeedback(err?.response?.data?.message || 'Ошибка удаления');
      } finally {
        setIsProcessing(false);
      }
    } else if (onPendingPostersChange && typeof idOrIndex === 'number') {
      const updated = pendingPosters.filter((_, idx) => idx !== idOrIndex);
      if (updated.length > 0 && !updated.some((p) => p.isMain)) {
        updated[0].isMain = true;
      }
      onPendingPostersChange(updated);
    }
  };

  return (
    <div className="space-y-2.5 text-xs">
      {/* Header Strip with Label & Action Buttons */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          <Layers className="w-3.5 h-3.5 text-[#2481cc]" />
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
            Постеры и изображения
          </span>
          {allCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#2481cc]/15 text-[#2481cc] dark:text-[#52a5e8] font-bold font-mono">
              {allCount}
            </span>
          )}
          {statusMessage && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md ml-1 truncate">
              {statusMessage}
            </span>
          )}
          {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2481cc] ml-1" />}
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              disabled={isProcessing}
              className="px-2.5 py-1.5 rounded-xl bg-[#2481cc]/10 hover:bg-[#2481cc]/20 border border-[#2481cc]/30 text-[#2481cc] dark:text-[#52a5e8] text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Найти постер (Google)</span>
            </button>

            {onOpenAiCover && (
              <button
                type="button"
                onClick={onOpenAiCover}
                disabled={isProcessing}
                className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>AI Cover</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Загрузить локальное изображение"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Файл</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFilesAdded(e.target.files);
                e.target.value = '';
              }}
            />
          </div>
        )}
      </div>

      {/* Thumbnails Row or Empty Banner */}
      {allCount === 0 ? (
        <div
          onClick={() => !readOnly && setIsSearchModalOpen(true)}
          className={`p-3.5 rounded-xl border border-dashed transition-all flex items-center justify-between gap-3 ${
            readOnly
              ? 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]'
              : 'border-slate-300 dark:border-white/15 hover:border-[#2481cc]/60 bg-slate-50/70 hover:bg-slate-100/70 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2481cc]/10 border border-[#2481cc]/20 flex items-center justify-center text-[#2481cc] shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Постеры не добавлены</p>
              <p className="text-[11px] text-slate-400">
                Нажмите для поиска постера к фильму или новости через Google Images (Serper)
              </p>
            </div>
          </div>

          {!readOnly && (
            <span className="text-xs text-[#2481cc] font-semibold hover:underline flex items-center gap-1 shrink-0">
              <Search className="w-3.5 h-3.5" />
              <span>Найти постер</span>
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 touch-scroll">
          {isExistingNote
            ? existingImages.map((img) => {
                const fullUrl = resolveMediaUrl(img.thumbnailUrl || img.url);
                return (
                  <div
                    key={img.id}
                    className={`group relative w-24 h-32 rounded-xl overflow-hidden border shrink-0 bg-slate-100 dark:bg-white/5 transition-all ${
                      img.isMain
                        ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                        : 'border-slate-200 dark:border-white/10 hover:border-[#2481cc]/50'
                    }`}
                  >
                    <img
                      src={fullUrl}
                      alt={img.caption || 'Poster'}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setZoomedUrl(resolveMediaUrl(img.url))}
                    />

                    {/* Main cover badge / button */}
                    <button
                      type="button"
                      disabled={readOnly || isProcessing}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetMain(img.id);
                      }}
                      className={`absolute top-1 left-1 p-1 rounded-md transition-colors cursor-pointer ${
                        img.isMain
                          ? 'bg-amber-400 text-black shadow'
                          : 'bg-black/60 text-white/70 hover:text-white hover:bg-black/80'
                      }`}
                      title={img.isMain ? 'Главная обложка' : 'Сделать главной обложкой'}
                    >
                      <Star className={`w-3 h-3 ${img.isMain ? 'fill-current' : ''}`} />
                    </button>

                    {/* Zoom button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomedUrl(resolveMediaUrl(img.url));
                      }}
                      className="absolute bottom-1 left-1 p-1 rounded-md bg-black/60 text-white/80 hover:text-white hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Увеличить"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>

                    {/* Delete button */}
                    {!readOnly && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(img.id);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-rose-400 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Удалить постер"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}

                    {img.isMain && (
                      <div className="absolute bottom-0 inset-x-0 bg-amber-400/90 text-black text-[9px] font-bold text-center py-0.5">
                        Обложка
                      </div>
                    )}
                  </div>
                );
              })
            : pendingPosters.map((poster, idx) => {
                const fullUrl = poster.thumbnailUrl || poster.url;
                return (
                  <div
                    key={poster.id}
                    className={`group relative w-24 h-32 rounded-xl overflow-hidden border shrink-0 bg-slate-100 dark:bg-white/5 transition-all ${
                      poster.isMain
                        ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                        : 'border-slate-200 dark:border-white/10 hover:border-[#2481cc]/50'
                    }`}
                  >
                    <img
                      src={fullUrl}
                      alt={poster.title || 'Poster'}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setZoomedUrl(poster.url)}
                    />

                    {/* Main cover button */}
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetMain(idx);
                      }}
                      className={`absolute top-1 left-1 p-1 rounded-md transition-colors cursor-pointer ${
                        poster.isMain
                          ? 'bg-amber-400 text-black shadow'
                          : 'bg-black/60 text-white/70 hover:text-white hover:bg-black/80'
                      }`}
                      title={poster.isMain ? 'Главная обложка' : 'Сделать главной обложкой'}
                    >
                      <Star className={`w-3 h-3 ${poster.isMain ? 'fill-current' : ''}`} />
                    </button>

                    {/* Zoom button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomedUrl(poster.url);
                      }}
                      className="absolute bottom-1 left-1 p-1 rounded-md bg-black/60 text-white/80 hover:text-white hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Увеличить"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>

                    {/* Delete button */}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(idx);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-rose-400 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Удалить"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}

                    {poster.isMain && (
                      <div className="absolute bottom-0 inset-x-0 bg-amber-400/90 text-black text-[9px] font-bold text-center py-0.5">
                        Обложка
                      </div>
                    )}
                  </div>
                );
              })}
        </div>
      )}

      {/* Web Poster Search Modal */}
      <WebPosterSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        initialQuery={noteTitle}
        onSelectImages={handleSelectWebImages}
        zIndex={10600}
      />

      {/* Lightbox Zoom */}
      {zoomedUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-[11000] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomedUrl(null)}
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
    </div>
  );
};
