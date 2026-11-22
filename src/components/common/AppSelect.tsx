import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface AppSelectOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface AppSelectProps<T extends string = string> {
  id?: string;
  value?: T;
  onChange: (value: T) => void;
  options: AppSelectOption<T>[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  variant?: 'default' | 'emerald' | 'amber' | 'muted' | 'sky';
  triggerClassName?: string;
  menuClassName?: string;
  'aria-label'?: string;
}

export function AppSelect<T extends string = string>({
  id,
  value,
  onChange,
  options,
  placeholder = 'Выберите...',
  className = '',
  disabled = false,
  size = 'md',
  variant = 'default',
  triggerClassName = '',
  menuClassName = '',
  'aria-label': ariaLabel,
}: AppSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.stopPropagation();
        e.preventDefault();
        setIsOpen(false);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      const enabledOptions = options.filter((o) => !o.disabled);
      const currentIndex = enabledOptions.findIndex((o) => o.value === value);
      const nextIndex =
        currentIndex === -1 || currentIndex === enabledOptions.length - 1
          ? 0
          : currentIndex + 1;
      onChange(enabledOptions[nextIndex].value);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      const enabledOptions = options.filter((o) => !o.disabled);
      const currentIndex = enabledOptions.findIndex((o) => o.value === value);
      const prevIndex =
        currentIndex <= 0
          ? enabledOptions.length - 1
          : currentIndex - 1;
      onChange(enabledOptions[prevIndex].value);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'sky':
        return isOpen
          ? 'border-sky-500 ring-2 ring-sky-500/20 bg-white dark:bg-[#121922] text-slate-900 dark:text-white shadow-xs'
          : 'border-slate-200 dark:border-white/10 hover:border-sky-500/50 hover:bg-slate-50 dark:hover:bg-[#16202c] bg-white dark:bg-[#121922] text-slate-900 dark:text-white';
      case 'emerald':
        return isOpen
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white dark:bg-[#121922] text-slate-900 dark:text-white shadow-xs'
          : 'border-slate-200 dark:border-white/10 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-[#16202c] bg-white dark:bg-[#121922] text-slate-900 dark:text-white';
      case 'amber':
        return isOpen
          ? 'border-amber-500 ring-2 ring-amber-500/20 bg-white dark:bg-[#121922] text-slate-900 dark:text-white shadow-xs'
          : 'border-slate-200 dark:border-white/10 hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-[#16202c] bg-white dark:bg-[#121922] text-slate-900 dark:text-white';
      case 'muted':
        return isOpen
          ? 'border-slate-300 dark:border-white/20 ring-2 ring-slate-400/20 bg-slate-50 dark:bg-[#121922] text-slate-700 dark:text-slate-300'
          : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-[#121922]/80 text-slate-600 dark:text-slate-400';
      case 'default':
      default:
        return isOpen
          ? 'border-sky-500 ring-2 ring-sky-500/20 bg-white dark:bg-[#121922] text-slate-900 dark:text-white shadow-xs'
          : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-[#121922] text-slate-900 dark:text-white';
    }
  };

  const getChevronColor = () => {
    if (variant === 'sky') return 'text-sky-500';
    if (variant === 'emerald') return 'text-emerald-500';
    if (variant === 'amber') return 'text-amber-500';
    if (variant === 'muted') return 'text-slate-400';
    return isOpen ? 'text-sky-500' : 'text-slate-400';
  };

  const isSmall = size === 'sm';

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full select-none ${className}`}
      data-testid="app-select"
    >
      {/* Interactive Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 border rounded-xl text-left cursor-pointer outline-none transition-all ${
          isSmall ? 'min-h-[34px] px-2.5 py-1.5 text-xs' : 'min-h-[42px] px-3 py-2 text-xs sm:text-sm'
        } ${getVariantStyles()} ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${triggerClassName}`}
        data-testid="app-select-trigger"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="shrink-0 flex items-center justify-center">
              {selectedOption.icon}
            </span>
          )}
          <span className="font-semibold truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.description && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
              — {selectedOption.description}
            </span>
          )}
          {selectedOption?.badge && (
            <span className="shrink-0 ml-auto mr-1">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`shrink-0 w-4 h-4 transition-transform duration-200 ${getChevronColor()} ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-[#17212b] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[220px] max-h-64 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95 duration-100 ${menuClassName}`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                data-testid={`app-select-option-${opt.value}`}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                  opt.disabled
                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                    : isSelected
                    ? 'bg-sky-500/15 text-sky-900 dark:text-sky-200 font-semibold border border-sky-500/25 cursor-pointer'
                    : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {opt.icon && (
                    <span className="shrink-0 flex items-center justify-center">
                      {opt.icon}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{opt.label}</div>
                    {opt.description && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {opt.description}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {opt.badge && <span>{opt.badge}</span>}
                  {isSelected && (
                    <Check className="w-4 h-4 text-sky-500 shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Synchronized native select for testability & standard combobox queries */}
      <select
        id={id}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="sr-only"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
