/** Badge chỉ dùng cho người làm (PartnerProfile). */

import type { CSSProperties, ReactNode } from 'react';

export type BadgeDisplayVariant = 'default' | 'icon';

function badgeShellClass(verified: boolean, variant: BadgeDisplayVariant, className: string) {
  const tone = verified
    ? 'border border-[var(--color-brand)]/35 bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]'
    : 'border border-amber-500/40 bg-amber-50 text-amber-800';
  const size =
    variant === 'icon'
      ? 'h-7 w-7 justify-center rounded-full p-0'
      : 'gap-1 rounded-full px-2.5 py-0.5';
  return `inline-flex items-center text-[11px] font-extrabold shadow-sm ${tone} ${size} ${className}`;
}

/** Trạng thái xác minh: Đã xác minh / Chưa xác minh. */
export function VerificationBadge({
  verified,
  className = '',
  variant = 'default',
}: {
  verified: boolean;
  className?: string;
  variant?: BadgeDisplayVariant;
}) {
  const title = verified
    ? 'Hồ sơ đã được Dịch Vụ Ơi xác minh'
    : 'Hồ sơ chưa được xác minh';
  const icon = verified ? (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
      <path
        fill="currentColor"
        d="M8 1.2 2.5 3.4v3.8c0 3.5 2.3 5.9 5.5 7 3.2-1.1 5.5-3.5 5.5-7V3.4L8 1.2Zm-.2 9.1L4.9 7.4l1.1-1.1 1.8 1.8 3.3-3.3 1.1 1.1-4.4 4.4Z"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
      <path
        fill="currentColor"
        d="M8 1.5a6.5 6.5 0 1 0 .001 13.001A6.5 6.5 0 0 0 8 1.5Zm0 1.6a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm-.7 2.2h1.4v3.8H7.3V5.3Zm0 4.8h1.4V11H7.3v-.9Z"
      />
    </svg>
  );

  return (
    <span
      className={badgeShellClass(verified, variant, className)}
      title={title}
      aria-label={title}
    >
      {icon}
      {variant === 'default' ? (
        <span>{verified ? 'Đã xác minh' : 'Chưa xác minh'}</span>
      ) : null}
    </span>
  );
}

function PhoneBadgeIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M5.2 1.8h5.6c.7 0 1.2.5 1.2 1.2v10c0 .7-.5 1.2-1.2 1.2H5.2c-.7 0-1.2-.5-1.2-1.2v-10c0-.7.5-1.2 1.2-1.2Zm.4 1.4v8.8h4.8V3.2H5.6Zm2.4 10.2a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4Z"
      />
    </svg>
  );
}

function BankBadgeIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M8 1.4 1.8 4.2v1.4h12.4V4.2L8 1.4Zm-4.6 5.2h1.6v4.2H3.4V6.6Zm3.5 0h2.2v4.2H6.9V6.6Zm3.5 0h1.6v4.2h-1.6V6.6ZM1.8 12.4h12.4V14H1.8v-1.6Z"
      />
    </svg>
  );
}

function bankBadgeShellClass(verified: boolean, variant: BadgeDisplayVariant, className: string) {
  const tone = verified
    ? 'border border-sky-500/35 bg-sky-50 text-sky-800'
    : 'border border-amber-500/40 bg-amber-50 text-amber-800';
  const size =
    variant === 'icon'
      ? 'h-7 w-7 justify-center rounded-full p-0'
      : 'gap-1 rounded-full px-2.5 py-0.5';
  return `inline-flex items-center text-[11px] font-extrabold shadow-sm ${tone} ${size} ${className}`;
}

/** Badge xác minh số điện thoại. */
export function PhoneVerificationBadge({
  verified,
  className = '',
  variant = 'default',
}: {
  verified: boolean;
  className?: string;
  variant?: BadgeDisplayVariant;
}) {
  const title = verified ? 'Số điện thoại đã xác minh' : 'Số điện thoại chưa xác minh';
  return (
    <span
      className={badgeShellClass(verified, variant, className)}
      title={title}
      aria-label={title}
    >
      <PhoneBadgeIcon />
      {variant === 'default' ? (
        <span>{verified ? 'Đã xác minh SĐT' : 'Chưa xác minh SĐT'}</span>
      ) : null}
    </span>
  );
}

/** Badge xác minh tài khoản ngân hàng. */
export function BankVerificationBadge({
  verified,
  className = '',
  variant = 'default',
}: {
  verified: boolean;
  className?: string;
  variant?: BadgeDisplayVariant;
}) {
  const title = verified
    ? 'Tài khoản ngân hàng đã xác minh'
    : 'Tài khoản ngân hàng chưa xác minh';
  return (
    <span
      className={bankBadgeShellClass(verified, variant, className)}
      title={title}
      aria-label={title}
    >
      <BankBadgeIcon />
      {variant === 'default' ? (
        <span>{verified ? 'Đã xác minh NH' : 'Chưa xác minh NH'}</span>
      ) : null}
    </span>
  );
}

/** Cụm badge xác minh trên card / hồ sơ người làm. */
export function PartnerVerificationBadges({
  isVerified,
  phoneVerified,
  bankVerified,
  className = '',
  showGeneral = true,
  variant = 'default',
}: {
  isVerified?: boolean;
  phoneVerified?: boolean;
  bankVerified?: boolean;
  className?: string;
  showGeneral?: boolean;
  variant?: BadgeDisplayVariant;
}) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}>
      {showGeneral ? (
        <VerificationBadge verified={Boolean(isVerified)} variant={variant} />
      ) : null}
      <PhoneVerificationBadge verified={Boolean(phoneVerified)} variant={variant} />
      <BankVerificationBadge verified={Boolean(bankVerified)} variant={variant} />
    </div>
  );
}

/** @deprecated Dùng VerificationBadge — giữ alias tương thích. */
export function VerifiedBadge({ className = '' }: { className?: string }) {
  return <VerificationBadge verified className={className} />;
}

export type PartnerRankId =
  | 'member'
  | 'active'
  | 'citizen'
  | 'guard'
  | 'knight'
  | 'elite'
  | 'premium'
  | 'vip'
  | 'hero'
  | 'legend';

export type PartnerRank = {
  id: PartnerRankId;
  label: string;
  /** Màu bar chính */
  color: string;
  /** Màu đậm (icon + đáy bar) */
  colorDark: string;
  /** Màu sáng (highlight icon) */
  colorLight: string;
  minRank: number;
  maxRank: number;
};

/** Map rank 1–1000 (đơn hoàn thành + thuê thành công) sang tier màu. */
export const PARTNER_RANKS: PartnerRank[] = [
  {
    id: 'member',
    label: 'MEMBER',
    color: '#7b8494',
    colorDark: '#5c6573',
    colorLight: '#a8b0bc',
    minRank: 1,
    maxRank: 100,
  },
  {
    id: 'active',
    label: 'ACTIVE',
    color: '#5b7c99',
    colorDark: '#3f5f78',
    colorLight: '#8aa0b8',
    minRank: 101,
    maxRank: 200,
  },
  {
    id: 'citizen',
    label: 'CITIZEN',
    color: '#c9a227',
    colorDark: '#9a7a12',
    colorLight: '#e4c65a',
    minRank: 201,
    maxRank: 300,
  },
  {
    id: 'guard',
    label: 'GUARD',
    color: '#3f9a5a',
    colorDark: '#2b6e3f',
    colorLight: '#6bc485',
    minRank: 301,
    maxRank: 400,
  },
  {
    id: 'knight',
    label: 'KNIGHT',
    color: '#d4891a',
    colorDark: '#a66810',
    colorLight: '#f0b04a',
    minRank: 401,
    maxRank: 500,
  },
  {
    id: 'elite',
    label: 'ELITE',
    color: '#e05a18',
    colorDark: '#a83f0e',
    colorLight: '#f08a4a',
    minRank: 501,
    maxRank: 600,
  },
  {
    id: 'premium',
    label: 'PREMIUM',
    color: '#2f6fd6',
    colorDark: '#1e4f9e',
    colorLight: '#6a9aeb',
    minRank: 601,
    maxRank: 700,
  },
  {
    id: 'vip',
    label: 'VIP',
    color: '#e6a817',
    colorDark: '#b07e0c',
    colorLight: '#f5c84a',
    minRank: 701,
    maxRank: 800,
  },
  {
    id: 'hero',
    label: 'HERO',
    color: '#d63b3b',
    colorDark: '#9e2424',
    colorLight: '#ef6f6f',
    minRank: 801,
    maxRank: 900,
  },
  {
    id: 'legend',
    label: 'LEGEND',
    color: '#8b3fd6',
    colorDark: '#6124a0',
    colorLight: '#b57aef',
    minRank: 901,
    maxRank: 1000,
  },
];

export const PARTNER_RANK_MIN = 1;
export const PARTNER_RANK_MAX = 1000;

export function clampPartnerRank(rank: number) {
  return Math.min(
    PARTNER_RANK_MAX,
    Math.max(PARTNER_RANK_MIN, Math.round(rank) || PARTNER_RANK_MIN),
  );
}

/** rank = clamp(1..1000, completedJobs + hireSuccessCount). */
export function computePartnerRankScore(
  completedJobs: number,
  hireSuccessCount: number,
) {
  const raw =
    Math.max(0, Math.round(completedJobs) || 0) +
    Math.max(0, Math.round(hireSuccessCount) || 0);
  return clampPartnerRank(raw || PARTNER_RANK_MIN);
}

export function resolvePartnerRank(rank: number): PartnerRank {
  const safe = clampPartnerRank(rank);
  return (
    PARTNER_RANKS.find((r) => safe >= r.minRank && safe <= r.maxRank) ??
    PARTNER_RANKS[0]
  );
}

/** Viền tròn avatar theo tier rank (UserAvatar). */
export function rankAvatarRingStyle(rank: number): CSSProperties {
  const tier = resolvePartnerRank(rank);
  return {
    boxShadow: `0 0 0 2px ${tier.colorLight}, 0 0 0 3.5px ${tier.color}, 0 2px 8px rgba(5,45,71,0.1)`,
  };
}

/** Viền avatar bo góc (PartnerAvatar). */
export function rankAvatarBorderStyle(rank: number): CSSProperties {
  const tier = resolvePartnerRank(rank);
  return {
    borderColor: tier.color,
    boxShadow: `0 0 0 1px ${tier.colorLight}, 0 4px 14px rgba(23,35,58,0.08)`,
  };
}

export function clampPartnerLevel(level: number) {
  return Math.min(100, Math.max(1, Math.round(level) || 1));
}

/** Icon khiên + kiếm chéo — tô theo màu rank. */
function RankShieldIcon({
  color,
  colorDark,
  colorLight,
  className = 'h-5 w-5',
}: {
  color: string;
  colorDark: string;
  colorLight: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {/* Crossed swords (behind) */}
      <path
        fill={colorDark}
        d="M4.2 3.1 5.4 2l6.1 6.1-.9 2.1-2.1.9L2.4 5l1.1-1.2 4.2 1.4L4.2 3.1Zm15.6 0L18.6 2l-6.1 6.1.9 2.1 2.1.9L21.6 5l-1.1-1.2-4.2 1.4 3.5-2.1Z"
      />
      <path
        fill={colorLight}
        d="M5.1 3.4 5.8 2.7l5.2 5.2-.5 1.2-1.2.5L3.9 4.2l1.2-.8Zm13.8 0 .7-.7-5.2 5.2.5 1.2 1.2.5 5.4-5.4-.7-.8Z"
      />
      {/* Shield */}
      <path
        fill={colorDark}
        d="M12 4.2 6.8 6.1v4.1c0 3.4 2.2 5.8 5.2 6.9 3-1.1 5.2-3.5 5.2-6.9V6.1L12 4.2Z"
      />
      <path
        fill={color}
        d="M12 5.1 7.8 6.7v3.4c0 2.8 1.8 4.8 4.2 5.7 2.4-.9 4.2-2.9 4.2-5.7V6.7L12 5.1Z"
      />
      <path
        fill={colorLight}
        d="M12 5.6 8.6 6.9v1.1L12 6.8l3.4 1.2V6.9L12 5.6Z"
      />
      <path
        fill={colorDark}
        d="M11.2 9.2h1.6v4.2h-1.6V9.2Zm0-2.2h1.6v1.4h-1.6V7Z"
      />
    </svg>
  );
}

type RankBadgeVariant = 'default' | 'overlay';

/**
 * Huy hiệu rank: điểm đơn hoàn thành + thuê thành công (1–1000).
 * Bar hiện chữ tier (MEMBER…LEGEND); số rank trong tooltip.
 */
export function PartnerRankBadge({
  rank,
  className = '',
  variant = 'default',
  completedJobs,
  hireSuccessCount,
}: {
  rank: number;
  className?: string;
  variant?: RankBadgeVariant;
  completedJobs?: number;
  hireSuccessCount?: number;
}) {
  const safe = clampPartnerRank(rank);
  const tier = resolvePartnerRank(safe);
  const overlay = variant === 'overlay';
  const detailParts = [
    completedJobs != null ? `${completedJobs} hoàn thành` : null,
    hireSuccessCount != null ? `${hireSuccessCount} thuê OK` : null,
  ].filter(Boolean);
  const title =
    detailParts.length > 0
      ? `Rank ${safe}/1000 · ${detailParts.join(' + ')} · ${tier.label}`
      : `Rank ${safe}/1000 · ${tier.label}`;

  return (
    <span
      className={`inline-flex items-center ${overlay ? 'h-4' : 'h-5'} ${className}`}
      title={title}
      aria-label={title}
    >
      <span
        className={`relative z-[1] shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)] ${
          overlay ? '-mr-1' : '-mr-1.5'
        }`}
      >
        <RankShieldIcon
          color={tier.color}
          colorDark={tier.colorDark}
          colorLight={tier.colorLight}
          className={overlay ? 'h-4 w-4' : 'h-5 w-5'}
        />
      </span>
      <span
        className={`inline-flex items-center justify-center font-extrabold uppercase tracking-wide text-white ${
          overlay
            ? 'min-w-[3.25rem] px-1.5 py-[1px] text-[8px] leading-none'
            : 'min-w-[4.25rem] px-2 py-0.5 text-[10px] leading-none'
        }`}
        style={{
          background: `linear-gradient(180deg, ${tier.colorLight} 0%, ${tier.color} 42%, ${tier.colorDark} 100%)`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.22)',
        }}
      >
        {tier.label}
      </span>
    </span>
  );
}

/** Cấp 1–100 — chỉ hiện trên hồ sơ / card người làm. */
export function LevelBadge({
  level,
  className = '',
}: {
  level: number;
  className?: string;
}) {
  const safe = clampPartnerLevel(level);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-white px-2 py-0.5 text-[12px] font-bold text-amber-800 shadow-sm ${className}`}
      title={`Cấp độ người làm: ${safe}/100`}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
        <path
          fill="currentColor"
          d="M8 1.5 9.8 5.3l4.2.4-3.2 2.8.9 4.1L8 10.7l-3.7 2 1-4.1L2 5.7l4.2-.4L8 1.5Z"
        />
      </svg>
      Cấp {safe}
    </span>
  );
}

/** Cấp dạng "huy hiệu vàng" nổi bật — dùng cho card hồ sơ đẹp. */
export function LevelBadgeGold({
  level,
  className = '',
  variant = 'default',
}: {
  level: number;
  className?: string;
  /** Thu nhỏ để đè lên góc dưới avatar. */
  variant?: 'default' | 'overlay';
}) {
  const safe = clampPartnerLevel(level);
  const overlay = variant === 'overlay';
  return (
    <span
      className={`inline-flex items-center rounded-full font-extrabold text-white shadow-[0_3px_10px_rgba(15,32,46,0.28)] ${
        overlay
          ? 'gap-0.5 px-2 py-0.5 text-[10px] leading-none'
          : 'gap-1.5 px-3.5 py-1 text-sm'
      } ${className}`}
      style={{
        background: 'linear-gradient(135deg,var(--color-navy),var(--color-navy-deep))',
        border: overlay ? '1.5px solid transparent' : '2px solid transparent',
        backgroundImage:
          'linear-gradient(135deg,var(--color-navy),var(--color-navy-deep)), linear-gradient(135deg,#e8c56a,var(--color-gold))',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }}
      title={`Cấp độ người làm: ${safe}/100`}
    >
      <svg
        viewBox="0 0 16 16"
        className={`shrink-0 ${overlay ? 'h-3 w-3 text-[var(--color-gold)]' : 'h-4 w-4 text-[var(--color-gold)]'}`}
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M8 1.5 9.8 5.3l4.2.4-3.2 2.8.9 4.1L8 10.7l-3.7 2 1-4.1L2 5.7l4.2-.4L8 1.5Z"
        />
      </svg>
      Cấp {safe}
    </span>
  );
}

/** Badge cấp (+ rank tùy chọn) đè lên mép dưới avatar (giữa), xếp dọc như mock. */
export function AvatarLevelOverlay({
  level,
  rank,
  completedJobs,
  hireSuccessCount,
  children,
  className = '',
}: {
  level: number;
  /** Rank 1–1000 — hiện chữ MEMBER…LEGEND dưới Cấp. */
  rank?: number;
  completedJobs?: number;
  hireSuccessCount?: number;
  children: ReactNode;
  className?: string;
}) {
  const showRank = rank != null;
  return (
    <div
      className={`relative inline-block ${showRank ? 'pb-8' : 'pb-2.5'} ${className}`}
    >
      {children}
      <div className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 translate-y-1/2 flex-col items-center gap-0.5">
        <LevelBadgeGold
          level={level}
          variant="overlay"
          className="whitespace-nowrap"
        />
        {showRank ? (
          <PartnerRankBadge
            rank={rank}
            variant="overlay"
            completedJobs={completedJobs}
            hireSuccessCount={hireSuccessCount}
            className="whitespace-nowrap"
          />
        ) : null}
      </div>
    </div>
  );
}
