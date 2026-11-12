import React from 'react';
import { ModerationStatus } from '@lenta/lemon-bus';
import {
  Inbox,
  CheckCircle,
  XCircle,
  Layers,
  Sparkles,
  Cpu,
  Globe,
  Radio,
  Shield,
  Coins,
} from 'lucide-react';

interface FeedBusSidebarProps {
  selectedStatus: ModerationStatus | 'ALL';
  onStatusChange: (status: ModerationStatus | 'ALL') => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  pendingCount?: number;
}

const CATEGORIES = [
  { id: 'ALL', label: 'Все категории', icon: Layers },
  { id: 'ai', label: 'AI & Нейросети', icon: Sparkles, color: 'text-purple-500' },
  { id: 'habr', label: 'Хабр & IT Dev', icon: Cpu, color: 'text-sky-500' },
  { id: 'politics', label: 'Политика & Мир', icon: Globe, color: 'text-amber-500' },
  { id: 'frontier', label: 'Фронтир & Наука', icon: Radio, color: 'text-emerald-500' },
  { id: 'cybersec', label: 'Кибербезопасность', icon: Shield, color: 'text-rose-500' },
  { id: 'crypto', label: 'Криптовалюты', icon: Coins, color: 'text-yellow-500' },
];

export const FeedBusSidebar: React.FC<FeedBusSidebarProps> = ({
  selectedStatus,
  onStatusChange,
  selectedCategory,
  onCategoryChange,
  pendingCount = 0,
}) => {
  return (
    <aside className="w-full md:w-60 shrink-0 space-y-4">
      {/* 1. Status Filter Section */}
      <div className="bg-surface-container/60 rounded-xl p-3 border border-outline-variant/30 space-y-1">
        <div className="px-2 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-outline">
          Статус очереди
        </div>

        <button
          onClick={() => onStatusChange('PENDING')}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
            selectedStatus === 'PENDING'
              ? 'bg-primary text-on-primary shadow-sm font-semibold'
              : 'hover:bg-surface-variant text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4" />
            <span>На модерации</span>
          </div>
          {pendingCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                selectedStatus === 'PENDING'
                  ? 'bg-on-primary text-primary'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}
            >
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onStatusChange('APPROVED')}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
            selectedStatus === 'APPROVED'
              ? 'bg-primary text-on-primary shadow-sm font-semibold'
              : 'hover:bg-surface-variant text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Одобренные</span>
          </div>
        </button>

        <button
          onClick={() => onStatusChange('REJECTED')}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
            selectedStatus === 'REJECTED'
              ? 'bg-primary text-on-primary shadow-sm font-semibold'
              : 'hover:bg-surface-variant text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>Отклонённые</span>
          </div>
        </button>

        <button
          onClick={() => onStatusChange('ALL')}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
            selectedStatus === 'ALL'
              ? 'bg-primary text-on-primary shadow-sm font-semibold'
              : 'hover:bg-surface-variant text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>Все статусы</span>
          </div>
        </button>
      </div>

      {/* 2. Category / Channel Filter Section */}
      <div className="bg-surface-container/60 rounded-xl p-3 border border-outline-variant/30 space-y-1">
        <div className="px-2 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-outline">
          Тематические каналы
        </div>

        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-surface-container-highest text-primary font-semibold border border-primary/20 shadow-xs'
                  : 'hover:bg-surface-variant text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${cat.color || ''}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
