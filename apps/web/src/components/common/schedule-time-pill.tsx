import type { ReactNode } from 'react';
import type { IconName } from '../ui/icon';
import { Icon } from '../ui/icon';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

const pillBase =
  'inline-flex max-w-full items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[13px]';

/** Pill meta chung trên card job — nền pastel, icon + chữ ngang. */
export function JobMetaPill({
  icon,
  children,
  className = '',
  iconClassName = 'text-[#64748B]',
  title,
}: {
  icon: IconName;
  children: ReactNode;
  className?: string;
  iconClassName?: string;
  title?: string;
}) {
  return (
    <span
      className={`${pillBase} border-transparent bg-[#F8FAFC] ${className}`}
      title={title}
    >
      <Icon name={icon} className={`h-3.5 w-3.5 shrink-0 ${iconClassName}`} />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

/** Pill giờ · ngày (job card) — cùng tone muted với meta khác; chỉ hạn ứng tuyển giữ màu cảnh báo. */
export function ScheduleTimePill({
  date,
  className = '',
}: {
  date: string | Date;
  className?: string;
}) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  const day = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

  return (
    <JobMetaPill
      icon="calendar"
      iconClassName="text-[var(--color-muted)]"
      className={className}
      title={d.toLocaleString('vi-VN')}
    >
      <span className="font-bold tabular-nums text-[var(--color-navy)]">{time}</span>
      <span className="mx-1.5 text-[var(--color-muted)]">·</span>
      <span className="font-medium tabular-nums text-[var(--color-muted)]">{day}</span>
    </JobMetaPill>
  );
}
