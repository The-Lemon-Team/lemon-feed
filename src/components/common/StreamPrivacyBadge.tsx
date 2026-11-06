import React from 'react';
import { Lock, Globe } from 'lucide-react';
import { StreamPrivacy } from '@lenta/shared';

export interface StreamPrivacyBadgeProps {
  privacy?: StreamPrivacy | 'all' | string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  showLabel?: boolean;
}

export const StreamPrivacyBadge: React.FC<StreamPrivacyBadgeProps> = ({
  privacy = 'public',
  size = 'xs',
  className = '',
  showLabel = true,
}) => {
  const isPrivate = privacy === 'private';

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.2 gap-1',
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  }[size];

  if (isPrivate) {
    return (
      <span
        data-testid="stream-privacy-badge-private"
        className={`inline-flex items-center rounded-full font-mono font-semibold shrink-0 select-none bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 ${sizeClasses} ${className}`}
        title="Приватный стрим: защищенный закрытый контур"
      >
        <Lock className={`${iconSizes} shrink-0 text-purple-500 dark:text-purple-400`} />
        {showLabel && <span>Private</span>}
      </span>
    );
  }

  return (
    <span
      data-testid="stream-privacy-badge-public"
      className={`inline-flex items-center rounded-full font-mono font-semibold shrink-0 select-none bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 ${sizeClasses} ${className}`}
      title="Публичный стрим: открытый контур"
    >
      <Globe className={`${iconSizes} shrink-0 text-sky-500 dark:text-sky-400`} />
      {showLabel && <span>Public</span>}
    </span>
  );
};
