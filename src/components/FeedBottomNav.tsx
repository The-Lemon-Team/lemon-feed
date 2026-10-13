import React from 'react';
import {
  Compass,
  Layers,
  Search,
  Calendar,
} from 'lucide-react';
import { LemonLogo } from './LemonLogo';

export interface FeedBottomNavProps {
  activeTab: 'stream' | 'categories' | 'search';
  onSelectTab: (tab: 'stream' | 'categories' | 'search') => void;
  onOpenCalendar?: () => void;
  onOpenLemonSeasons?: () => void;
}

export const FeedBottomNav: React.FC<FeedBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenCalendar,
  onOpenLemonSeasons,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-white/95 dark:bg-[#18222d]/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-white/[0.08] transition-colors pb-[max(0.5rem,var(--sab))]">
      <div className="flex items-center justify-around px-2 pt-1.5">
        {/* 1. Stream */}
        <button
          type="button"
          onClick={() => onSelectTab('stream')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
            activeTab === 'stream'
              ? 'text-[#2481cc] dark:text-[#64b5f6]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none">Поток</span>
        </button>

        {/* 2. Categories */}
        <button
          type="button"
          onClick={() => onSelectTab('categories')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
            activeTab === 'categories'
              ? 'text-[#2481cc] dark:text-[#64b5f6]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none">Категории</span>
        </button>

        {/* 3. Search */}
        <button
          type="button"
          onClick={() => onSelectTab('search')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
            activeTab === 'search'
              ? 'text-[#2481cc] dark:text-[#64b5f6]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none">Поиск</span>
        </button>

        {/* 4. Link to Calendar (Временно закомментировано: старая кнопка календаря, пока в разработке) */}
        {/*
        <button
          type="button"
          onClick={onOpenCalendar}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none">Календарь</span>
        </button>
        */}

        {/* 4. Lemon Seasons (Кнопка в фирменном стиле с логотипом) */}
        <button
          type="button"
          onClick={onOpenLemonSeasons || onOpenCalendar}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-amber-700 dark:text-yellow-400 hover:text-amber-800 dark:hover:text-yellow-300 transition-colors group cursor-pointer"
          title="Lemon Seasons — Календарь (в разработке)"
          aria-label="Lemon Seasons — Календарь (в разработке)"
        >
          <LemonLogo size={20} glow={false} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-semibold leading-none">Seasons</span>
        </button>
      </div>
    </nav>
  );
};
