import React from 'react';
import { Globe, Lock } from 'lucide-react';

export type NotesPrivacyFilter = 'all' | 'public' | 'private';

export interface NotesPrivacyContourSwitcherProps {
  privacy: NotesPrivacyFilter;
  onChange: (privacy: NotesPrivacyFilter) => void;
  className?: string;
  isPublicMode?: boolean;
}

export const NotesPrivacyContourSwitcher: React.FC<NotesPrivacyContourSwitcherProps> = ({
  privacy,
  onChange,
  className = '',
  isPublicMode = false,
}) => {
  if (isPublicMode) {
    return null;
  }

  return (
    <div
      role="radiogroup"
      aria-label="Контур приватности заметок"
      data-testid="notes-privacy-contour-switcher"
      className={`inline-flex items-center p-0.5 rounded-xl bg-slate-200/80 dark:bg-[#111923] border border-slate-300/60 dark:border-white/10 text-[11px] font-mono select-none ${className}`}
    >
      <button
        type="button"
        role="radio"
        data-testid="notes-privacy-public-btn"
        aria-checked={privacy === 'public'}
        onClick={() => onChange('public')}
        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
          privacy === 'public'
            ? 'bg-sky-600 text-white font-bold shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
        title="Публичный контур: только публичные заметки (Public notes)"
      >
        <Globe className={`w-3 h-3 ${privacy === 'public' ? 'text-white' : 'text-sky-500'}`} />
        <span>Публичный</span>
      </button>

      <button
        type="button"
        role="radio"
        data-testid="notes-privacy-private-btn"
        aria-checked={privacy === 'private'}
        onClick={() => onChange('private')}
        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
          privacy === 'private'
            ? 'bg-purple-600 text-white font-bold shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
        title="Приватный контур: только приватные заметки (Private notes)"
      >
        <Lock className={`w-3 h-3 ${privacy === 'private' ? 'text-white' : 'text-purple-400'}`} />
        <span>Приватный</span>
      </button>

      <button
        type="button"
        role="radio"
        data-testid="notes-privacy-all-btn"
        aria-checked={privacy === 'all'}
        onClick={() => onChange('all')}
        className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
          privacy === 'all'
            ? 'bg-indigo-600 text-white font-bold shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
        title="Все заметки: общий контур (All notes)"
      >
        <span>Все</span>
      </button>
    </div>
  );
};
