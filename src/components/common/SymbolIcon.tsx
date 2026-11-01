import React from 'react';

export interface SymbolIconProps {
  icon?: string | null;
  className?: string;
  fallback?: string;
  size?: number | string;
  title?: string;
  style?: React.CSSProperties;
}

/**
 * Universal icon renderer that supports both Unicode emojis (e.g. '⏱️', '🍋', '🚀')
 * and Google Material Symbols font icons (e.g. 'trending_up', 'palette', 'architecture', 'calendar_today').
 *
 * Ligature names are normalized to snake_case and rendered with the `.material-symbols-outlined`
 * font class, which uses `overflow: hidden; width: 1em; height: 1em` to prevent FOUT text overflow.
 */
export const SymbolIcon: React.FC<SymbolIconProps> = ({
  icon,
  className = '',
  fallback = '✨',
  size,
  title,
  style,
}) => {
  const raw = (icon || fallback || '').trim();
  if (!raw) return null;

  const combinedStyle: React.CSSProperties = {
    ...(size ? { fontSize: typeof size === 'number' ? `${size}px` : size } : {}),
    ...style,
  };

  // Icon ligature names contain only ASCII letters, numbers, underscores, and dashes (e.g. trending_up, check-circle).
  // Emojis contain Unicode characters outside standard ASCII, so they won't match this pattern.
  const isLigature = /^[a-z0-9_-]+$/i.test(raw);

  if (isLigature) {
    const iconName = raw.toLowerCase().replace(/-/g, '_');
    return (
      <span
        className={`material-symbols-outlined inline-flex items-center justify-center shrink-0 select-none leading-none ${className}`}
        style={Object.keys(combinedStyle).length > 0 ? combinedStyle : undefined}
        title={title || raw}
        aria-hidden="true"
      >
        {iconName}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none leading-none ${className}`}
      style={Object.keys(combinedStyle).length > 0 ? combinedStyle : undefined}
      title={title}
    >
      {raw}
    </span>
  );
};
