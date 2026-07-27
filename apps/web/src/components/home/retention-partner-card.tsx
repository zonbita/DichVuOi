import { Link } from 'react-router-dom';
import { formatPrice } from '../../services/api';
import { LevelBadge, VerificationBadge } from '../ui/partner-badges';

type Props = {
  partnerUserId: string;
  fullName: string;
  avatarUrl?: string | null;
  subtitle?: string | null;
  ratingAvg?: number;
  level?: number;
  isVerified?: boolean;
  serviceSlug?: string;
  serviceName?: string;
  price?: number;
  unit?: string;
  badge?: string;
  ctaLabel?: string;
};

function Avatar({ name, src }: { name: string; src?: string | null }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-lg font-extrabold text-[var(--color-brand-deep)] ring-2 ring-white shadow-sm">
      {initials || '?'}
    </div>
  );
}

export function RetentionPartnerCard({
  partnerUserId,
  fullName,
  avatarUrl,
  subtitle,
  ratingAvg,
  level = 1,
  isVerified = false,
  serviceSlug,
  serviceName,
  price,
  unit,
  badge,
  ctaLabel = 'Thuê lại',
}: Props) {
  const hireTo = serviceSlug
    ? `/dich-vu/${serviceSlug}?partner=${partnerUserId}`
    : `/nguoi/${partnerUserId}`;

  return (
    <article className="flex w-[min(100%,280px)] shrink-0 flex-col border border-[var(--color-line)] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Link to={`/nguoi/${partnerUserId}`} className="shrink-0">
          <Avatar name={fullName} src={avatarUrl} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              to={`/nguoi/${partnerUserId}`}
              className="truncate text-base font-extrabold hover:text-[var(--color-brand-deep)]"
            >
              {fullName}
            </Link>
            <LevelBadge level={level} />
            <VerificationBadge verified={isVerified} />
          </div>
          {subtitle ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-muted)]">{subtitle}</p>
          ) : null}
          {typeof ratingAvg === 'number' && ratingAvg > 0 ? (
            <p className="mt-1 text-xs font-semibold text-[var(--color-ink)]">
              ★ {ratingAvg.toFixed(1)}
            </p>
          ) : null}
        </div>
      </div>

      {serviceName ? (
        <p className="mt-3 text-sm font-semibold text-[var(--color-ink)]">{serviceName}</p>
      ) : null}
      {typeof price === 'number' ? (
        <p className="text-sm text-[var(--color-sale)]">
          {formatPrice(price)}
          {unit ? <span className="text-[var(--color-muted)]">/{unit}</span> : null}
        </p>
      ) : null}

      {badge ? (
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {badge}
        </p>
      ) : null}

      <Link to={hireTo} className="btn-primary mt-3 w-full py-2 text-center text-sm">
        {ctaLabel}
      </Link>
    </article>
  );
}
