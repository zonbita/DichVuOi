import { memo, useEffect, useState, type CSSProperties } from 'react';
import { resolveUserAvatarUrl } from '../../utils/portrait-avatar';
import { rankAvatarRingStyle } from './partner-badges';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const sizeClass = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
} as const;

type UserAvatarProps = {
  name: string;
  src?: string | null;
  userId?: string | null;
  email?: string | null;
  /** Rank 1–1000 — viền avatar theo tier MEMBER…LEGEND. */
  rank?: number | null;
  size?: keyof typeof sizeClass;
  className?: string;
  loading?: 'lazy' | 'eager';
};

function UserAvatarInner({
  name,
  src,
  userId,
  email,
  rank,
  size = 'md',
  className = '',
  loading = 'lazy',
}: UserAvatarProps) {
  const resolved = resolveUserAvatarUrl({ id: userId, email, avatarUrl: src });
  const [broken, setBroken] = useState(false);
  const box = sizeClass[size];
  const rankStyle: CSSProperties | undefined =
    rank != null ? rankAvatarRingStyle(rank) : undefined;
  const ringClass = rankStyle ? '' : 'ring-2 ring-white shadow-sm';

  useEffect(() => {
    setBroken(false);
  }, [resolved]);

  if (!broken) {
    return (
      <img
        src={resolved}
        alt={name}
        loading={loading}
        decoding="async"
        onError={() => setBroken(true)}
        className={`${box} shrink-0 rounded-full object-cover ${ringClass} ${className}`}
        style={rankStyle}
      />
    );
  }

  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-deep)] font-extrabold text-white ${ringClass} ${className}`}
      style={rankStyle}
      aria-hidden
    >
      {initials(name) || '?'}
    </div>
  );
}

export const UserAvatar = memo(UserAvatarInner);
