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
      className={`section-header-bar mb-4 flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 sm:gap-x-5 sm:px-5 sm:py-4 ${className}`}
    >
      <div aria-hidden className="section-header-bar__highlight" />
      <div className="relative flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-3.5">
        {icon ? (
          <span className="soft-3d-squircle soft-3d-squircle--md">
            <Icon name={icon} className="h-[18px] w-[18px] drop-shadow-sm !text-white" />
          </span>
        ) : null}
        <h2 className="section-header-bar__title text-xl font-bold tracking-tight drop-shadow-sm sm:text-2xl">
          {title}
        </h2>
        {subtitle ? (
          <span className="section-header-bar__sub text-sm font-medium">{subtitle}</span>
        ) : null}
        {badge}
      </div>
      {action ? (
        <div className="relative ml-auto flex shrink-0 items-center gap-3">{action}</div>
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
      className="section-header-bar__action group inline-flex items-center gap-1 text-[15px] font-semibold transition"
    >
      {label}
      <Icon
        name="chevronRight"
        className="h-4 w-4 !text-current transition group-hover:translate-x-0.5"
      />
    </Link>
  );
}
