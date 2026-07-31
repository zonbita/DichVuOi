/** Badge chỉ dùng cho người làm (PartnerProfile). */

import type { ReactNode } from 'react';

/** Trạng thái xác minh: Đã xác minh / Chưa xác minh. */
export function VerificationBadge({
  verified,
  className = '',
}: {
  verified: boolean;
  className?: string;
}) {
  if (verified) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border border-[var(--color-brand)]/35 bg-[var(--color-brand-soft)] px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--color-brand-deep)] shadow-sm ${className}`}
        title="Hồ sơ đã được Dịch Vụ Ơi xác minh"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
          <path
            fill="currentColor"
            d="M8 1.2 2.5 3.4v3.8c0 3.5 2.3 5.9 5.5 7 3.2-1.1 5.5-3.5 5.5-7V3.4L8 1.2Zm-.2 9.1L4.9 7.4l1.1-1.1 1.8 1.8 3.3-3.3 1.1 1.1-4.4 4.4Z"
          />
        </svg>
        Đã xác minh
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-50 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800 shadow-sm ${className}`}
      title="Hồ sơ chưa được xác minh"
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
        <path
          fill="currentColor"
          d="M8 1.5a6.5 6.5 0 1 0 .001 13.001A6.5 6.5 0 0 0 8 1.5Zm0 1.6a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm-.7 2.2h1.4v3.8H7.3V5.3Zm0 4.8h1.4V11H7.3v-.9Z"
        />
      </svg>
      Chưa xác minh
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

/** Badge xác minh số điện thoại. */
export function PhoneVerificationBadge({
  verified,
  className = '',
}: {
  verified: boolean;
  className?: string;
}) {
  if (verified) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border border-[var(--color-brand)]/35 bg-[var(--color-brand-soft)] px-2.5 py-0.5 text-[11px] font-extrabold text-[var(--color-brand-deep)] shadow-sm ${className}`}
        title="Số điện thoại đã xác minh"
      >
        <PhoneBadgeIcon />
        Đã xác minh SĐT
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-50 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800 shadow-sm ${className}`}
      title="Số điện thoại chưa xác minh"
    >
      <PhoneBadgeIcon />
      Chưa xác minh SĐT
    </span>
  );
}

/** Badge xác minh tài khoản ngân hàng. */
export function BankVerificationBadge({
  verified,
  className = '',
}: {
  verified: boolean;
  className?: string;
}) {
  if (verified) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border border-sky-500/35 bg-sky-50 px-2.5 py-0.5 text-[11px] font-extrabold text-sky-800 shadow-sm ${className}`}
        title="Tài khoản ngân hàng đã xác minh"
      >
        <BankBadgeIcon />
        Đã xác minh NH
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-50 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800 shadow-sm ${className}`}
      title="Tài khoản ngân hàng chưa xác minh"
    >
      <BankBadgeIcon />
      Chưa xác minh NH
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
}: {
  isVerified?: boolean;
  phoneVerified?: boolean;
  bankVerified?: boolean;
  className?: string;
  showGeneral?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}>
      {showGeneral ? <VerificationBadge verified={Boolean(isVerified)} /> : null}
      <PhoneVerificationBadge verified={Boolean(phoneVerified)} />
      <BankVerificationBadge verified={Boolean(bankVerified)} />
    </div>
  );
}

/** @deprecated Dùng VerificationBadge — giữ alias tương thích. */
export function VerifiedBadge({ className = '' }: { className?: string }) {
  return <VerificationBadge verified className={className} />;
}

/** Cấp 1–100 — chỉ hiện trên hồ sơ / card người làm. */
export function LevelBadge({
  level,
  className = '',
}: {
  level: number;
  className?: string;
}) {
  const safe = Math.min(100, Math.max(1, Math.round(level) || 1));
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
  const safe = Math.min(100, Math.max(1, Math.round(level) || 1));
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

/** Badge cấp đè lên mép dưới avatar (giữa). */
export function AvatarLevelOverlay({
  level,
  children,
  className = '',
}: {
  level: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative inline-block pb-2.5 ${className}`}>
      {children}
      <LevelBadgeGold
        level={level}
        variant="overlay"
        className="absolute bottom-2.5 left-1/2 z-10 -translate-x-1/2 translate-y-1/2 whitespace-nowrap"
      />
    </div>
  );
}
