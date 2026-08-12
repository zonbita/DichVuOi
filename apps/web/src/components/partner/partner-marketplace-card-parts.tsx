import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { Icon } from '../ui/icon';
import { rankAvatarBorderStyle } from '../ui/partner-badges';
import { resolveUserAvatarUrl } from '../../utils/portrait-avatar';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function PartnerAvatar({
  name,
  src,
  size = 'md',
  rank,
}: {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'profile';
  rank?: number | null;
}) {
  const [broken, setBroken] = useState(false);
  const box =
    size === 'profile'
      ? 'h-[7.5rem] w-[7.5rem] sm:h-[7.75rem] sm:w-[7.75rem]'
      : size === 'sm'
        ? 'h-10 w-10'
        : 'h-16 w-16';
  const text =
    size === 'profile' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg';
  const resolved = resolveUserAvatarUrl({ avatarUrl: src });
  const rankStyle: CSSProperties | undefined =
    rank != null ? rankAvatarBorderStyle(rank) : undefined;
  const borderClass = rankStyle
    ? 'border-2'
    : 'border border-[rgba(150,180,210,0.35)]';

  if (src && !broken) {
    return (
      <img
        src={resolved}
        alt={name}
        decoding="async"
        onError={() => setBroken(true)}
        className={`${box} rounded-[17px] ${borderClass} object-cover shadow-[0_4px_14px_rgba(23,35,58,0.08)]`}
        style={rankStyle}
      />
    );
  }

  return (
    <div
      className={`flex ${box} items-center justify-center rounded-[17px] ${borderClass} bg-gradient-to-br from-[#EFF6FF] to-white ${text} font-bold text-[#2563EB] shadow-[0_4px_14px_rgba(23,35,58,0.08)]`}
      style={rankStyle}
    >
      {initials(name)}
    </div>
  );
}

export function StatusBadge({
  tone,
  icon,
  children,
}: {
  tone: 'green' | 'orange' | 'cyan';
  icon: 'check' | 'star' | 'shield';
  children: ReactNode;
}) {
  const tones = {
    green: 'border-[#A7F3D0] bg-[#ECFDF5] text-[#059669]',
    orange: 'border-[#FED7AA] bg-[#FFF7ED] text-[#EA580C]',
    cyan: 'border-[#A5F3FC] bg-[#ECFEFF] text-[#0891B2]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      <Icon name={icon} className="h-3.5 w-3.5 shrink-0" />
      {children}
    </span>
  );
}

export function StatItem({
  icon,
  value,
  label,
}: {
  icon: 'users' | 'check' | 'clock';
  value: string;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 px-3 first:pl-0 last:pr-0 sm:px-4">
      <Icon name={icon} className="h-4 w-4 shrink-0 text-[#64748B]" />
      <p className="min-w-0 text-sm leading-tight text-[#17233A]">
        <span className="font-bold">{value}</span>{' '}
        <span className="font-medium text-[#64748B]">{label}</span>
      </p>
    </div>
  );
}

export function formatResponseLabel(minutes?: number) {
  if (minutes == null || minutes <= 0) return null;
  if (minutes < 60) return `< ${minutes} phút`;
  const hours = Math.ceil(minutes / 60);
  return `< ${hours}h`;
}
