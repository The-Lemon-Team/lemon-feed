import React, { useEffect } from 'react';
import { X, Sparkles, ExternalLink, Calendar, RefreshCw } from 'lucide-react';
import { LemonLogo } from './LemonLogo';

export interface LemonSeasonsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LemonSeasonsModal: React.FC<LemonSeasonsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#18222d] border border-amber-500/30 dark:border-amber-400/20 rounded-3xl p-6 sm:p-7 shadow-2xl relative space-y-5 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Lemon Glow in Background */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-yellow-400/15 dark:bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Lemon Logo */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <LemonLogo size={58} animated={true} />
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-800 dark:text-yellow-300 font-mono text-[10px] uppercase font-bold tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-amber-500 dark:text-yellow-400" />
              <span>Календарь • В разработке</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Lemon Seasons
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Хронологический календарь и синхронизация заметок
            </p>
          </div>
        </div>

        {/* Development Context */}
        <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-400/5 border border-amber-400/20 space-y-2.5">
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            Основное веб-приложение календаря Lemon Calendarium сейчас находится в активной разработке.
            Мы готовим обновлённый дизайн сетки, плавную навигацию по месяцам и прямую интеграцию с этой лентой публикаций.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
              <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Сетка событий и дат</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
              <RefreshCw className="w-4 h-4 text-lime-500 shrink-0" />
              <span>Двусторонний Obsidian Sync</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
          <a
            href="http://localhost:5174/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
            title="Открыть dev-версию на порту 5174"
          >
            <span>Открыть локальный сервер (:5174)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md transition-all duration-150 cursor-pointer"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
