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

const metaPill =
  '!gap-1.5 !rounded-xl !border-transparent !px-3 !py-1.5 text-[13px] leading-none';

/** Card đơn mở — ~668×178: ảnh | tiêu đề + meta | giá + CTA. */
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
      ? `${formatPriceNumber(booking.budgetMin)} - ${formatPriceNumber(booking.budgetMax)} VNĐ`
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
    <article className="w-full max-w-[668px] overflow-hidden rounded-[16px] border border-[var(--color-line)] bg-white shadow-[0_4px_14px_rgba(24,49,63,0.07)]">
      <div className="flex flex-col gap-3.5 p-4 sm:h-[178px] sm:flex-row sm:items-stretch sm:gap-4 sm:px-5 sm:py-[18px]">
        <div className="relative h-[100px] w-[100px] shrink-0 self-start sm:h-[142px] sm:w-[142px] sm:self-center">
          <img
            src={serviceImage(booking.service)}
            alt={booking.service.name}
            className="h-full w-full rounded-[14px] object-cover"
            loading="lazy"
            decoding="async"
          />
          <span className="absolute -bottom-1.5 -right-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-md ring-2 ring-white">
            <Icon name="briefcase" className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <h3 className="truncate text-lg font-extrabold leading-tight tracking-tight text-[var(--color-navy)] sm:text-[20px]">
              {booking.service.name}
            </h3>
            <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-sm text-[var(--color-muted)]">
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
                  iconClassName="!h-3.5 !w-3.5 text-[#E11D48]"
                  className={`${metaPill} !bg-[#FFF1F2]`}
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
                className={`${metaPill} !bg-[#EFF6FF] [&_svg]:!h-3.5 [&_svg]:!w-3.5`}
              />

              {durationLabel ? (
                <JobMetaPill
                  icon="clock"
                  iconClassName="!h-3.5 !w-3.5 text-[#7C3AED]"
                  className={`${metaPill} !bg-[#F5F3FF]`}
                >
                  <span className="font-semibold text-[#6D28D9]">
                    {durationLabel}
                  </span>
                </JobMetaPill>
              ) : null}

              <JobMetaPill
                icon="users"
                iconClassName="!h-3.5 !w-3.5 text-[#059669]"
                className={`${metaPill} !bg-[#ECFDF5]`}
              >
                <span className="font-semibold text-[#047857]">
                  {applicationsLabel}
                </span>
              </JobMetaPill>

              <JobMetaPill
                icon="shield"
                iconClassName="!h-3.5 !w-3.5 text-[#0F766E]"
                className={`${metaPill} !bg-[#F0FDFA]`}
              >
                <span className="whitespace-nowrap font-semibold text-[#0F766E]">
                  {depositAmount <= 0
                    ? `Cọc 0% · miễn`
                    : `Cọc ${depositPercent}% · ${formatPrice(depositAmount)}`}
                </span>
              </JobMetaPill>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch justify-between gap-2.5 sm:w-[210px] sm:items-end sm:py-0.5">
            <p
              className="inline-flex w-full max-w-full items-center justify-center gap-1.5 truncate rounded-xl bg-[#FFF7ED] px-3.5 py-2.5 text-[13px] font-extrabold text-[#C2410C] sm:justify-start"
              title={budgetLabel}
            >
              <Icon
                name="wallet"
                className="h-4 w-4 shrink-0 text-[#EA580C]"
              />
              <span className="min-w-0 truncate tabular-nums leading-snug">
                {budgetLabel}
              </span>
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
