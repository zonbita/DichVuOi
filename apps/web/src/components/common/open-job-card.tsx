import type { ReactNode } from 'react';
import { formatPrice, formatPriceNumber } from '../../services/api';
import type { Booking } from '../../types/catalog';
import { serviceImage } from '../../utils/catalog-images';
import { JobMetaPill, ScheduleTimePill } from './schedule-time-pill';
import { Icon } from '../ui/icon';

function formatRemainingTime(deadlineIso: string) {
  const diffMs = new Date(deadlineIso).getTime() - Date.now();
  if (diffMs <= 0) return 'đã hết hạn';
  const totalHours = Math.ceil(diffMs / (60 * 60 * 1000));
  if (totalHours < 24) return `còn ${totalHours} giờ`;
  const totalDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return `còn ${totalDays} ngày`;
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

/** Card đơn mở — hạn+giá · ảnh | tiêu đề+meta ngang · footer. */
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

  const metaItems = [
    <ScheduleTimePill key="schedule" date={booking.scheduledAt} />,
    durationLabel ? (
      <JobMetaPill
        key="duration"
        icon="clock"
        iconClassName="text-[#0EA5E9]"
        className="border-[#BAE6FD]"
      >
        <span className="font-semibold text-[#0369A1]">{durationLabel}</span>
      </JobMetaPill>
    ) : null,
    <JobMetaPill
      key="apps"
      icon="users"
      iconClassName="text-[#16A34A]"
      className="border-[#BBF7D0]"
    >
      <span className="font-semibold text-[#15803D]">{applicationsLabel}</span>
    </JobMetaPill>,
  ].filter(Boolean);

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-[0_10px_24px_rgba(24,49,63,0.08)]">
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {booking.matchingDeadlineAt && matchingDeadlineLabel ? (
            <JobMetaPill
              icon="clock"
              iconClassName="text-[#D0382E]"
              className="!border-[#F5C6C2] !bg-[#FFF5F4]"
              title={new Date(booking.matchingDeadlineAt).toLocaleString('vi-VN')}
            >
              <span className="font-semibold text-[#D0382E]">
                Hạn ứng tuyển: {matchingDeadlineLabel}
              </span>
            </JobMetaPill>
          ) : (
            <span />
          )}
          <p className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#F3D6A4] bg-[#FFF7E9] px-3 py-1 text-[13px] font-extrabold text-[#B96A07]">
            <Icon name="wallet" className="h-3.5 w-3.5 shrink-0" />
            {budgetLabel}
          </p>
        </div>

        <div className="mt-3.5 flex items-start gap-3.5 sm:gap-4">
          <img
            src={serviceImage(booking.service)}
            alt={booking.service.name}
            className="h-[88px] w-[88px] shrink-0 rounded-[10px] object-cover sm:h-[96px] sm:w-[96px]"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-extrabold text-[var(--color-navy)] sm:text-xl">
              {booking.service.name}
            </h3>
            <p className="mt-0.5 truncate text-sm text-[var(--color-muted)]">
              {booking.customerName}
              {booking.customerPhoneMasked
                ? ` · ${booking.customerPhone}`
                : null}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-2">
              {metaItems.map((item, index) => (
                <span key={index} className="inline-flex items-center gap-1.5">
                  {index > 0 ? (
                    <span
                      aria-hidden
                      className="text-[11px] font-bold text-[#CBD5E1]"
                    >
                      ·
                    </span>
                  ) : null}
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`flex flex-wrap items-center gap-3 px-4 pb-3.5 sm:px-5 sm:pb-4 ${
          footerLeft != null ? 'justify-between' : 'justify-end'
        }`}
      >
        {footerLeft}
        {footerRight}
      </div>
    </article>
  );
}
