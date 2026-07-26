/** Badge chỉ dùng cho người làm (PartnerProfile). */

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
}: {
  level: number;
  className?: string;
}) {
  const safe = Math.min(100, Math.max(1, Math.round(level) || 1));
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-sm font-extrabold text-white shadow-[0_3px_10px_rgba(15,32,46,0.28)] ${className}`}
      style={{
        background: 'linear-gradient(135deg,#1a2c40,#12202e)',
        border: '2px solid transparent',
        backgroundImage:
          'linear-gradient(135deg,#1a2c40,#12202e), linear-gradient(135deg,#ffd76a,#e0a300)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }}
      title={`Cấp độ người làm: ${safe}/100`}
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4 text-amber-400" aria-hidden>
        <path
          fill="currentColor"
          d="M8 1.5 9.8 5.3l4.2.4-3.2 2.8.9 4.1L8 10.7l-3.7 2 1-4.1L2 5.7l4.2-.4L8 1.5Z"
        />
      </svg>
      Cấp {safe}
    </span>
  );
}
