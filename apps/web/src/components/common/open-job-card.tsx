import type { ReactNode } from 'react';
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
  footerLeft?: ReactNode;
  footerRight: ReactNode;
};

/** Card đơn mở — ảnh | tiêu đề + chip ngang rộng | giá + CTA. */
export function OpenJobCard({
  booking,
  footerLeft,
  footerRight,
}: OpenJobCardProps) {
  const durationLabel = booking.service.durationMin
    ? `~${Math.round((booking.service.durationMin / 60) * 10) / 10}h`
    : null;
  const applicationsLabel =
    booking.applicationCount != null
      ? `${booking.applicationCount} ứng viên`
      : '0 ứng viên';
  const budgetLabel =
    booking.budgetMin != null && booking.budgetMax != null
      ? `${formatPriceNumber(booking.budgetMin)} – ${formatPriceNumber(booking.budgetMax)} VNĐ`
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

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-gradient-to-br from-white via-white to-emerald-50/40 shadow-[0_10px_24px_rgba(24,49,63,0.08)]">
      <div className="flex flex-col gap-3.5 p-4 sm:flex-row sm:items-stretch sm:gap-4 sm:p-5">
        <div className="relative h-[88px] w-[88px] shrink-0 self-start sm:h-[104px] sm:w-[104px]">
          <img
            src={serviceImage(booking.service)}
            alt={booking.service.name}
            className="h-full w-full rounded-[12px] object-cover shadow-sm ring-1 ring-black/5"
            loading="lazy"
            decoding="async"
          />
          <span className="absolute -bottom-1.5 -right-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-md ring-2 ring-white">
            <Icon name="briefcase" className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-extrabold tracking-tight text-[var(--color-navy)] sm:text-xl">
              {booking.service.name}
            </h3>
            <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-sm text-[var(--color-muted)]">
              <Icon name="user" className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="truncate">
                {booking.customerName}
                {booking.customerPhoneMasked
                  ? ` · ${booking.customerPhone}`
                  : null}
              </span>
            </p>

            <div className="mt-3 flex w-full flex-wrap items-center gap-2">
              {booking.matchingDeadlineAt && matchingDeadlineLabel ? (
                <JobMetaPill
                  icon="clock"
                  iconClassName="text-[#E11D48]"
                  className="!border-transparent !bg-[#FFF1F2] !px-3 !py-1.5"
                  title={new Date(
                    booking.matchingDeadlineAt,
                  ).toLocaleString('vi-VN')}
                >
                  <span className="font-semibold text-[#BE123C]">
                    {matchingDeadlineLabel}
                  </span>
                </JobMetaPill>
              ) : null}

              <ScheduleTimePill
                date={booking.scheduledAt}
                className="!border-transparent !bg-[#EFF6FF] !px-3 !py-1.5"
              />

              {durationLabel ? (
                <JobMetaPill
                  icon="clock"
                  iconClassName="text-[#7C3AED]"
                  className="!border-transparent !bg-[#F5F3FF] !px-3 !py-1.5"
                >
                  <span className="font-semibold text-[#6D28D9]">
                    {durationLabel}
                  </span>
                </JobMetaPill>
              ) : null}

              <JobMetaPill
                icon="users"
                iconClassName="text-[#059669]"
                className="!border-transparent !bg-[#ECFDF5] !px-3 !py-1.5"
              >
                <span className="font-semibold text-[#047857]">
                  {applicationsLabel}
                </span>
              </JobMetaPill>

              <JobMetaPill
                icon="shield"
                iconClassName="text-[#0F766E]"
                className="!border-transparent !bg-[#F0FDFA] !px-3 !py-1.5"
              >
                <span className="font-semibold text-[#0F766E]">
                  {depositAmount <= 0
                    ? `Cọc 0% · miễn`
                    : `Cọc ${depositPercent}% · ${formatPrice(depositAmount)}`}
                </span>
              </JobMetaPill>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch justify-between gap-2.5 sm:w-[min(100%,220px)] sm:items-end">
            <p className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#FFF7ED] px-3.5 py-2.5 text-[13px] font-extrabold text-[#C2410C] sm:justify-start">
              <Icon name="wallet" className="h-4 w-4 shrink-0 text-[#EA580C]" />
              <span className="min-w-0 leading-snug">{budgetLabel}</span>
            </p>

            <div
              className={`flex w-full flex-wrap items-center gap-2 ${
                footerLeft != null ? 'justify-between' : 'justify-end'
              } sm:flex-col sm:items-end`}
            >
              {footerLeft}
              {footerRight}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
