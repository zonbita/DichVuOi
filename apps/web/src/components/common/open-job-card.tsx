import type { ReactNode, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, formatPriceNumber } from '../../services/api';
import type { Booking } from '../../types/catalog';
import { serviceImage } from '../../utils/catalog-images';
import { JobMetaPill, ScheduleTimePill } from './schedule-time-pill';
import { Icon } from '../ui/icon';

function formatRemainingTime(deadlineIso: string) {
  const diffMs = new Date(deadlineIso).getTime() - Date.now();
  if (diffMs <= 0) return 'Đã hết hạn';
  const totalHours = Math.ceil(diffMs / (60 * 60 * 1000));
  if (totalHours < 24) return `Còn ${totalHours} giờ`;
  const totalDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return `Còn ${totalDays} ngày`;
}

/** Tiêu đề đơn mở: jobTitle khách đặt, fallback tên dịch vụ. */
export function openJobTitle(booking: Booking) {
  const title = booking.jobTitle?.trim();
  return title || booking.service.name;
}

/** Trạng thái “room” giống lobby game — badge viền màu. */
export function openJobRoomTone(booking: Booking) {
  const apps = booking.applicationCount ?? 0;
  const deadlineMs = booking.matchingDeadlineAt
    ? new Date(booking.matchingDeadlineAt).getTime() - Date.now()
    : null;
  const urgent =
    deadlineMs != null && deadlineMs > 0 && deadlineMs < 24 * 60 * 60 * 1000;

  if (urgent) {
    return {
      label: 'Sắp hết hạn',
      badge: 'border border-amber-400 bg-amber-50 text-amber-800',
      dot: 'bg-amber-500',
    };
  }
  if (apps > 0) {
    return {
      label: `Đang ghép · ${apps}`,
      badge: 'border border-sky-400 bg-sky-50 text-sky-800',
      dot: 'bg-sky-500',
    };
  }
  return {
    label: 'Mở · chờ ứng viên',
    badge: 'border border-emerald-400 bg-emerald-50 text-emerald-800',
    dot: 'bg-emerald-500',
  };
}

type OpenJobCardProps = {
  booking: Booking;
  /** Điều hướng tới trang chi tiết khi bấm phần nội dung card. */
  detailTo?: string;
  footerLeft?: ReactNode;
  /** Nút tương tác (Ứng tuyển…) — nằm ngoài Link. Bỏ trống để hiện CTA visual trong Link. */
  footerRight?: ReactNode;
  /**
   * horizontal — hàng ngang (dashboard).
   * portrait — lưới trang chủ / danh sách nhận việc.
   */
  layout?: 'horizontal' | 'portrait';
  /** Ảnh đầu tiên (LCP) — eager + fetchPriority high. */
  priority?: boolean;
};

function compactAmount(value: number): { n: string; unit: 'tr' | 'vnd' } {
  if (value >= 1_000_000) {
    return {
      n: new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 2,
      }).format(value / 1_000_000),
      unit: 'tr',
    };
  }
  return { n: formatPriceNumber(value), unit: 'vnd' };
}

/** Ngân sách ngắn, luôn 1 hàng — vd. `1,08–1,38 tr`. */
function formatCompactBudget(min: number, max: number) {
  const a = compactAmount(min);
  const b = compactAmount(max);
  if (min === max) {
    return b.unit === 'tr' ? `${b.n} tr` : `${b.n} VNĐ`;
  }
  if (a.unit === 'tr' && b.unit === 'tr') {
    return `${a.n}–${b.n} tr`;
  }
  const left = a.unit === 'tr' ? `${a.n} tr` : a.n;
  const right = b.unit === 'tr' ? `${b.n} tr` : `${b.n} VNĐ`;
  return `${left}–${right}`;
}

const metaPill =
  '!gap-1.5 !rounded-xl !border-transparent !px-3 !py-1.5 text-[13px] leading-none';

const metaPillPortrait =
  '!gap-1 !rounded-lg !border-transparent !px-2 !py-1 text-[11px] leading-none';

function getOpenJobLabels(booking: Booking) {
  const durationLabel = booking.service.durationMin
    ? `~${Math.round((booking.service.durationMin / 60) * 10) / 10}h`
    : null;
  const applicationsLabel =
    booking.applicationCount != null
      ? `${booking.applicationCount} ứng viên`
      : '0 ứng viên';
  const budgetFull =
    booking.budgetMin != null && booking.budgetMax != null
      ? `${formatPriceNumber(booking.budgetMin)} - ${formatPriceNumber(booking.budgetMax)} VNĐ`
      : formatPrice(booking.totalPrice);
  const budgetCompact =
    booking.budgetMin != null && booking.budgetMax != null
      ? formatCompactBudget(booking.budgetMin, booking.budgetMax)
      : compactAmount(booking.totalPrice).unit === 'tr'
        ? `${compactAmount(booking.totalPrice).n} tr`
        : formatPrice(booking.totalPrice);
  const matchingDeadlineLabel = booking.matchingDeadlineAt
    ? formatRemainingTime(booking.matchingDeadlineAt)
    : null;
  const depositAmount =
    booking.applyDepositAmount != null
      ? booking.applyDepositAmount
      : Math.max(
          booking.applyDepositBps === 0 ? 0 : 1,
          Math.round(
            (booking.totalPrice *
              (booking.applyDepositBps ??
                (booking.applyDepositPercent != null
                  ? booking.applyDepositPercent * 100
                  : 1000))) /
              10000,
          ),
        );
  const depositPercent =
    booking.applyDepositPercent ??
    Math.round((booking.applyDepositBps ?? 1000) / 100);

  return {
    durationLabel,
    applicationsLabel,
    budgetFull,
    budgetCompact,
    matchingDeadlineLabel,
    depositAmount,
    depositPercent,
  };
}

function MetaPills({
  booking,
  compact,
  hideDeposit,
}: {
  booking: Booking;
  compact?: boolean;
  hideDeposit?: boolean;
}) {
  const {
    durationLabel,
    applicationsLabel,
    matchingDeadlineLabel,
    depositAmount,
    depositPercent,
  } = getOpenJobLabels(booking);
  const pill = compact ? metaPillPortrait : metaPill;

  return (
    <div className="flex w-full flex-wrap items-center gap-1.5">
      {booking.matchingDeadlineAt && matchingDeadlineLabel ? (
        <JobMetaPill
          icon="clock"
          iconClassName={
            compact ? '!h-3 !w-3 text-[#E11D48]' : '!h-3.5 !w-3.5 text-[#E11D48]'
          }
          className={`${pill} !bg-[#FFF1F2]`}
          title={new Date(booking.matchingDeadlineAt).toLocaleString('vi-VN')}
        >
          <span className="font-semibold text-[#BE123C]">
            {matchingDeadlineLabel}
          </span>
        </JobMetaPill>
      ) : null}

      <ScheduleTimePill
        date={booking.scheduledAt}
        compact={compact}
        className={`${pill} [&_svg]:!h-3 [&_svg]:!w-3`}
      />

      {durationLabel ? (
        <JobMetaPill
          icon="clock"
          iconClassName={
            compact
              ? '!h-3 !w-3 text-[var(--color-muted)]'
              : '!h-3.5 !w-3.5 text-[var(--color-muted)]'
          }
          className={pill}
        >
          <span className="font-semibold text-[var(--color-navy)]">{durationLabel}</span>
        </JobMetaPill>
      ) : null}

      <JobMetaPill
        icon="users"
        iconClassName={
          compact
            ? '!h-3 !w-3 text-[var(--color-muted)]'
            : '!h-3.5 !w-3.5 text-[var(--color-muted)]'
        }
        className={pill}
      >
        <span className="font-semibold text-[var(--color-navy)]">{applicationsLabel}</span>
      </JobMetaPill>

      {hideDeposit ? null : (
        <JobMetaPill
          icon="shield"
          iconClassName={
            compact
              ? '!h-3 !w-3 text-[var(--color-muted)]'
              : '!h-3.5 !w-3.5 text-[var(--color-muted)]'
          }
          className={pill}
        >
          <span className="whitespace-nowrap font-semibold text-[var(--color-navy)]">
            {depositAmount <= 0
              ? `Cọc 0% · miễn`
              : `Cọc ${depositPercent}% · ${formatPrice(depositAmount)}`}
          </span>
        </JobMetaPill>
      )}
    </div>
  );
}

function BudgetChip({
  label,
  className = '',
}: {
  label: string;
  className?: string;
}) {
  return (
    <p
      className={`inline-flex w-full max-w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--color-brand-soft)] px-3 py-2 text-[12px] font-extrabold text-[var(--color-sale)] ${className}`}
      title={label}
    >
      <Icon name="wallet" className="h-3.5 w-3.5 shrink-0 text-[#EA580C]" />
      <span className="whitespace-nowrap tabular-nums leading-none">{label}</span>
    </p>
  );
}

/** Card đơn mở — horizontal (dashboard) hoặc portrait (trang chủ). */
export function OpenJobCard({
  booking,
  detailTo,
  footerLeft,
  footerRight,
  layout = 'horizontal',
  priority = false,
}: OpenJobCardProps) {
  const { budgetFull, budgetCompact, depositAmount, depositPercent } =
    getOpenJobLabels(booking);
  const title = openJobTitle(booking);
  const room = openJobRoomTone(booking);
  const depositLabel =
    depositAmount <= 0
      ? 'Cọc miễn'
      : `Cọc ${depositPercent}%`;

  if (layout === 'portrait') {
    const body = (
      <>
        <div className="relative h-[132px] w-full shrink-0 overflow-hidden rounded-[14px]">
          <img
            src={serviceImage(booking.service, 'card')}
            alt={title}
            className="h-full w-full object-cover"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding="async"
          />
          <span
            className={`absolute top-2 left-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${room.badge}`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${room.dot}`} />
            <span className="truncate">{room.label}</span>
          </span>
        </div>

        <div className="mt-2.5 min-w-0">
          <h3
            className="line-clamp-2 break-all text-[16px] font-extrabold leading-snug tracking-tight text-[var(--color-navy)]"
            title={title}
          >
            {title}
          </h3>
          {booking.jobTitle?.trim() ? (
            <p className="mt-0.5 truncate text-[11px] text-[var(--color-muted)]">
              {booking.service.name}
            </p>
          ) : null}
          <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-[12px] text-[var(--color-muted)]">
            <Icon name="user" className="h-3 w-3 shrink-0 opacity-70" />
            <span className="truncate">{booking.customerName}</span>
          </p>
          <div className="mt-2">
            <MetaPills booking={booking} compact hideDeposit />
          </div>
        </div>

        <div className="mt-auto flex shrink-0 flex-col gap-1.5 pt-2">
          <BudgetChip label={budgetCompact} />
          <p className="truncate text-center text-[10px] font-semibold text-[var(--color-muted)]">
            {depositLabel}
          </p>
          {footerRight ? null : (
            <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[var(--color-brand)] px-4 py-2.5 text-sm font-bold text-white">
              Xem việc
              <Icon name="chevronRight" className="h-4 w-4" />
            </span>
          )}
        </div>
      </>
    );

    return (
      <article className="flex w-full min-w-0 flex-col overflow-hidden rounded-[16px] border border-[var(--color-line)] bg-white p-3 shadow-[0_4px_14px_rgba(24,49,63,0.07)] transition hover:border-[var(--color-brand)]/35 hover:shadow-[0_6px_18px_rgba(24,49,63,0.1)]">
        {detailTo ? (
          <Link
            to={detailTo}
            className="flex min-h-0 flex-1 flex-col rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
          >
            {body}
          </Link>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">{body}</div>
        )}

        {footerRight ? (
          <div
            className="mt-2 flex w-full shrink-0 flex-col gap-2"
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            {footerLeft}
            <div className="min-w-0 [&_a]:w-full [&_button]:w-full">
              {footerRight}
            </div>
          </div>
        ) : null}
      </article>
    );
  }

  const main = (
    <>
      <div className="relative h-[100px] w-[100px] shrink-0 self-start sm:h-[142px] sm:w-[142px] sm:self-center">
        <img
          src={serviceImage(booking.service, 'card')}
          alt={title}
          className="h-full w-full rounded-[14px] object-cover"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
        />
        <span className="absolute -bottom-1.5 -right-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-md ring-2 ring-white">
          <Icon name="briefcase" className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-start">
        <h3
          className="shrink-0 truncate break-all text-lg font-extrabold leading-tight tracking-tight text-[var(--color-navy)] sm:text-[20px]"
          title={title}
        >
          {title}
        </h3>
        {booking.jobTitle?.trim() ? (
          <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
            {booking.service.name}
          </p>
        ) : null}
        <p className="mt-1 flex min-w-0 shrink-0 items-center gap-1.5 truncate text-sm text-[var(--color-muted)]">
          <Icon name="user" className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="truncate">{booking.customerName}</span>
        </p>

        <div className="mt-2.5">
          <MetaPills booking={booking} />
        </div>
      </div>
    </>
  );

  const shellClass =
    'w-full max-w-[668px] rounded-[16px] border border-[var(--color-line)] bg-white shadow-[0_4px_14px_rgba(24,49,63,0.07)] transition hover:border-[var(--color-brand)]/35 hover:shadow-[0_6px_18px_rgba(24,49,63,0.1)]';

  return (
    <article className={shellClass}>
      <div className="flex flex-col gap-3.5 p-4 sm:min-h-[178px] sm:flex-row sm:items-stretch sm:gap-4 sm:px-5 sm:py-[18px]">
        {detailTo ? (
          <Link
            to={detailTo}
            className="flex min-w-0 flex-1 flex-col gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] sm:flex-row sm:items-stretch sm:gap-4"
          >
            {main}
          </Link>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
            {main}
          </div>
        )}

        <div className="flex shrink-0 flex-col items-stretch justify-between gap-2.5 sm:w-[210px] sm:items-end sm:py-0.5">
          <BudgetChip
            label={budgetFull}
            className="!px-3.5 !py-2.5 !text-[13px] sm:justify-start"
          />

          <div
            className={`flex w-full flex-wrap items-center gap-2 ${
              footerLeft != null ? 'justify-between' : 'justify-end'
            } sm:flex-col sm:items-end`}
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            {footerLeft}
            {footerRight}
          </div>
        </div>
      </div>
    </article>
  );
}
