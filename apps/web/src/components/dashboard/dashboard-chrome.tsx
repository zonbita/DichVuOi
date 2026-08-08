import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../ui/icon';
import type { IconName } from '../ui/icon';

const surfaceClass =
  'rounded-2xl border border-[var(--color-line)] bg-white shadow-[0_4px_16px_rgba(24,49,63,0.05)]';

/** Ô icon teal — khớp header «Việc của tôi». */
export function DashboardIconBox({
  name,
  className = '',
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[var(--color-brand)] text-white shadow-[0_8px_18px_rgba(0,156,149,0.28)] ${className}`}
    >
      <Icon name={name} className="h-5 w-5 !text-white" />
    </span>
  );
}

/** Header trang dashboard: icon + tiêu đề navy + mô tả muted. */
export function DashboardPageHeader({
  icon,
  title,
  description,
  actions,
  badge,
}: {
  icon: IconName;
  title: string;
  description?: string;
  actions?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3.5">
        <DashboardIconBox name={icon} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-navy)]">
              {title}
            </h1>
            {badge}
          </div>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

/** Panel trắng bo góc — tab bar / card khối. */
export function DashboardSurface({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${surfaceClass} ${className}`}>{children}</div>;
}

/** Empty state kiểu Việc của tôi. */
export function DashboardEmpty({
  title,
  body,
  ctaTo,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaTo?: string;
  ctaLabel?: string;
}) {
  return (
    <div
      className={`${surfaceClass} px-6 py-12 text-center sm:py-14`}
    >
      <h3 className="text-lg font-extrabold text-[var(--color-navy)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted)]">{body}</p>
      {ctaTo && ctaLabel ? (
        <Link
          to={ctaTo}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-navy)] px-5 py-2.5 text-sm font-bold !text-white transition hover:bg-[var(--color-navy-deep)]"
        >
          {ctaLabel}
          <Icon name="chevronRight" className="h-4 w-4 !text-white" />
        </Link>
      ) : null}
    </div>
  );
}

export const dashboardSurfaceClass = surfaceClass;
