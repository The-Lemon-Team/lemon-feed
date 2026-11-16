import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  LucideIcon,
} from 'lucide-react';

interface FeedBusSidebarProps {
  selectedStatus: ModerationStatus | 'ALL';
  onStatusChange: (status: ModerationStatus | 'ALL') => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  pendingCount?: number;
}

interface StatusItem {
  id: ModerationStatus | 'ALL';
  label: string;
  icon: LucideIcon;
  iconClass?: string;
  showPendingBadge?: boolean;
}

interface CategoryItem {
  id: string;
  label: string;
  icon: LucideIcon;
  color?: string;
}

interface IndicatorRect {
  top: number;
  height: number;
}

const STATUS_ITEMS: StatusItem[] = [
  { id: 'PENDING', label: 'На модерации', icon: Inbox, showPendingBadge: true },
  { id: 'APPROVED', label: 'Одобренные', icon: CheckCircle, iconClass: 'text-emerald-500' },
  { id: 'REJECTED', label: 'Отклонённые', icon: XCircle, iconClass: 'text-rose-500' },
  { id: 'ALL', label: 'Все статусы', icon: Layers },
];

const CATEGORIES: CategoryItem[] = [
  { id: 'ALL', label: 'Все категории', icon: Layers },
  { id: 'ai', label: 'AI & Нейросети', icon: Sparkles, color: 'text-purple-500' },
  { id: 'habr', label: 'Хабр & IT Dev', icon: Cpu, color: 'text-sky-500' },
  { id: 'politics', label: 'Политика & Мир', icon: Globe, color: 'text-amber-500' },
  { id: 'frontier', label: 'Фронтир & Наука', icon: Radio, color: 'text-emerald-500' },
  { id: 'cybersec', label: 'Кибербезопасность', icon: Shield, color: 'text-rose-500' },
  { id: 'crypto', label: 'Криптовалюты', icon: Coins, color: 'text-yellow-500' },
];

/**
 * Tracks the active menu button's vertical offset and height relative to its
 * positioned list container so a single pill indicator can glide smoothly
 * between items without triggering layout shifts.
 */
function useSlidingIndicator(activeKey: string) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [rect, setRect] = useState<IndicatorRect | null>(null);
  const [animate, setAnimate] = useState(false);

  const setItemRef = useCallback(
    (id: string) => (el: HTMLButtonElement | null) => {
      if (el) {
        itemRefs.current.set(id, el);
      } else {
        itemRefs.current.delete(id);
      }
    },
    []
  );

  const measure = useCallback(() => {
    const el = itemRefs.current.get(activeKey);
    if (!el || el.offsetHeight <= 0) {
      setRect(null);
      setAnimate(false);
      return;
    }

    const nextTop = el.offsetTop;
    const nextHeight = el.offsetHeight;

    setRect((prev) => {
      if (prev && prev.top === nextTop && prev.height === nextHeight) {
        return prev;
      }
      return { top: nextTop, height: nextHeight };
    });
  }, [activeKey]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  // Enable CSS transitions one frame after initial positioning so the pill
  // snaps to the initial item instead of sliding down from y=0 on mount.
  useEffect(() => {
    if (!rect || animate) return;
    const rafId = requestAnimationFrame(() => {
      setAnimate(true);
    });
    return () => cancelAnimationFrame(rafId);
  }, [rect, animate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(container);
    return () => observer.disconnect();
  }, [measure]);

  return { containerRef, setItemRef, rect, animate };
}

interface SlidingIndicatorProps {
  rect: IndicatorRect | null;
  animate: boolean;
  className: string;
  children?: React.ReactNode;
}

const SlidingIndicator: React.FC<SlidingIndicatorProps> = ({
  rect,
  animate,
  className,
  children,
}) => {
  if (!rect) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        transform: `translate3d(0, ${rect.top}px, 0)`,
        height: `${rect.height}px`,
      }}
      className={`pointer-events-none absolute inset-x-0 top-0 z-0 rounded-lg will-change-transform ${
        animate
          ? 'transition-[transform,height] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const FeedBusSidebar: React.FC<FeedBusSidebarProps> = ({
  selectedStatus,
  onStatusChange,
  selectedCategory,
  onCategoryChange,
  pendingCount = 0,
}) => {
  const statusIndicator = useSlidingIndicator(selectedStatus);
  const categoryIndicator = useSlidingIndicator(selectedCategory);

  return (
    <aside className="w-full md:w-60 shrink-0 space-y-4 select-none">
      {/* 1. Status Filter Section */}
      <div className="bg-white/95 dark:bg-[#18222d]/95 rounded-2xl p-3 border border-slate-200/80 dark:border-white/[0.08] shadow-soft space-y-1.5">
        <div className="px-2 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Статус очереди
        </div>

        <div ref={statusIndicator.containerRef} className="relative space-y-1">
          <SlidingIndicator
            rect={statusIndicator.rect}
            animate={statusIndicator.animate}
            className="bg-[#2481cc] shadow-sm shadow-[#2481cc]/25"
          />

          {STATUS_ITEMS.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedStatus === item.id;
            const fallbackActive = !statusIndicator.rect && isSelected ? 'bg-[#2481cc] shadow-sm' : '';

            return (
              <button
                key={item.id}
                ref={statusIndicator.setItemRef(item.id)}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onStatusChange(item.id)}
                className={`relative z-10 w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium border border-transparent transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2481cc]/50 cursor-pointer ${
                  isSelected
                    ? `text-white ${fallbackActive}`
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={`w-4 h-4 transition-colors duration-150 ${
                      isSelected ? 'text-white' : item.iconClass || ''
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.showPendingBadge && pendingCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold transition-colors duration-150 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Category / Channel Filter Section */}
      <div className="bg-white/95 dark:bg-[#18222d]/95 rounded-2xl p-3 border border-slate-200/80 dark:border-white/[0.08] shadow-soft space-y-1.5">
        <div className="px-2 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Тематические каналы
        </div>

        <div ref={categoryIndicator.containerRef} className="relative space-y-1">
          <SlidingIndicator
            rect={categoryIndicator.rect}
            animate={categoryIndicator.animate}
            className="bg-[#2481cc]/10 dark:bg-[#2481cc]/15 border border-[#2481cc]/30 dark:border-[#64b5f6]/25 shadow-soft"
          >
            <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#2481cc] dark:bg-[#64b5f6]" />
          </SlidingIndicator>

          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const fallbackActive =
              !categoryIndicator.rect && isSelected
                ? 'bg-[#2481cc]/10 dark:bg-[#2481cc]/15 border-[#2481cc]/30 dark:border-[#64b5f6]/25'
                : 'border-transparent';

            return (
              <button
                key={cat.id}
                ref={categoryIndicator.setItemRef(cat.id)}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onCategoryChange(cat.id)}
                className={`relative z-10 w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2481cc]/50 cursor-pointer ${
                  isSelected
                    ? `text-[#2481cc] dark:text-[#64b5f6] ${fallbackActive}`
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.05]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${cat.color || ''}`} />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
