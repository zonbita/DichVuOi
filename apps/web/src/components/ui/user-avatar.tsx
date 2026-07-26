import { useState } from 'react';
import { resolveUserAvatarUrl } from '../../utils/portrait-avatar';

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
  size?: keyof typeof sizeClass;
  className?: string;
};

export function UserAvatar({
  name,
  src,
  userId,
  email,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const [broken, setBroken] = useState(false);
  const resolved = resolveUserAvatarUrl({ id: userId, email, avatarUrl: src });
  const box = sizeClass[size];

  if (!broken) {
    return (
      <img
        src={resolved}
        alt={name}
        onError={() => setBroken(true)}
        className={`${box} shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-deep)] font-extrabold text-white shadow-sm ring-2 ring-white ${className}`}
      aria-hidden
    >
      {initials(name) || '?'}
    </div>
  );
}
