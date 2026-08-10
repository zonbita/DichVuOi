import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../ui/icon';
import type { IconName } from '../ui/icon';

type Props = {
  title: string;
  /** Squircle icon bên trái tiêu đề. */
  icon?: IconName;
  subtitle?: ReactNode;
  badge?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** Thanh tiêu đề section trang chủ — soft-3D navy (navbar language). */
export function SectionHeaderBar({
  title,
  icon,
  subtitle,
  badge,
  action,
  className = '',
}: Props) {
  return (
    <div
      className={`section-header-bar mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:gap-x-3.5 sm:px-3.5 sm:py-2.5 ${className}`}
    >
      <div aria-hidden className="section-header-bar__highlight" />
      <div className="relative flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 sm:gap-x-2.5">
        {icon ? (
          <span className="soft-3d-squircle soft-3d-squircle--sm">
            <Icon name={icon} className="h-3.5 w-3.5 drop-shadow-sm !text-white" />
          </span>
        ) : null}
        <h2 className="section-header-bar__title text-sm font-bold tracking-tight drop-shadow-sm sm:text-base">
          {title}
        </h2>
        {subtitle ? (
          <span className="section-header-bar__sub text-xs font-medium">{subtitle}</span>
        ) : null}
        {badge}
      </div>
      {action ? (
        <div className="relative ml-auto flex min-w-0 max-w-full flex-1 items-center justify-end gap-2 overflow-visible sm:max-w-md md:max-w-lg">
          {action}
        </div>
      ) : null}
    </div>
  );
}

/** Link «Xem tất cả» trên nền navy soft-3D. */
export function SectionHeaderViewAll({
  to,
  label = 'Xem tất cả',
}: {
  to: string;
  label?: string;
}) {
  return (
    <Link
      to={to}
      className="section-header-bar__action group inline-flex items-center gap-1 text-xs font-semibold transition sm:text-sm"
    >
      {label}
      <Icon
        name="chevronRight"
        className="h-3.5 w-3.5 !text-current transition group-hover:translate-x-0.5"
      />
    </Link>
  );
}
