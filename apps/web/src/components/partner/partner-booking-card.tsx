import { Link } from 'react-router-dom';
import {
  formatBookingStatus,
  formatPaymentStatus,
  formatPrice,
} from '../../services/api';
import type { Booking } from '../../types/catalog';
import { BookingChat } from '../booking/booking-chat';
import { BookingReviewForm } from '../booking/booking-review-form';

type Props = {
  booking: Booking;
  currentUserId: string;
  statusPending?: boolean;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  statusError?: string | null;
};

function statusBadgeClass(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-800 ring-amber-200';
    case 'CONFIRMED':
      return 'bg-sky-50 text-sky-800 ring-sky-200';
    case 'IN_PROGRESS':
      return 'bg-violet-50 text-violet-800 ring-violet-200';
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-600 ring-slate-200';
    default:
      return 'bg-[var(--color-canvas)] text-[var(--color-muted)] ring-[var(--color-line)]';
  }
}

export function PartnerBookingCard({
  booking,
  currentUserId,
  statusPending,
  onStart,
  onComplete,
  statusError,
}: Props) {
  const showChat =
    (booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS') &&
    (booking.paymentStatus === 'HELD' || booking.paymentStatus === 'RELEASED');

  const payoutHint =
    booking.paymentStatus === 'RELEASED'
      ? formatPrice(booking.partnerPayout ?? 0)
      : booking.paymentStatus === 'HELD'
        ? `~${formatPrice(Math.round((booking.totalPrice * 85) / 100))}`
        : null;

  return (
    <article className="border border-[var(--color-line)] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/doi-tac/viec/${booking.id}`}
              className="text-lg font-extrabold hover:text-[var(--color-brand-deep)]"
            >
              {booking.service.name}
            </Link>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${statusBadgeClass(booking.status)}`}
            >
              {formatBookingStatus(booking.status)}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {formatPaymentStatus(booking.paymentStatus ?? 'UNPAID')}
            {booking.customerName ? ` · ${booking.customerName}` : null}
          </p>
          <p className="mt-2 text-[15px]">{booking.address}</p>
          <p className="text-sm text-[var(--color-muted)]">
            {new Date(booking.scheduledAt).toLocaleString('vi-VN')}
          </p>

          {booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS' ? (
            <div className="mt-3">
              {showChat ? (
                <BookingChat bookingId={booking.id} />
              ) : (
                <p className="text-xs text-amber-800">
                  Chờ khách đặt cọc — chưa mở chat / địa chỉ đầy đủ.
                </p>
              )}
            </div>
          ) : null}

          {booking.status === 'COMPLETED' ? (
            <div className="mt-3">
              <BookingReviewForm booking={booking} currentUserId={currentUserId} />
            </div>
          ) : null}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-extrabold text-[var(--color-sale)]">
            {formatPrice(booking.totalPrice)}
          </p>
          {payoutHint ? (
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {booking.paymentStatus === 'RELEASED' ? 'Đã nhận' : 'Ước nhận'}{' '}
              <strong className="text-[var(--color-ink)]">{payoutHint}</strong>
            </p>
          ) : null}

          {booking.status === 'CONFIRMED' ? (
            <button
              type="button"
              disabled={statusPending}
              onClick={() => onStart(booking.id)}
              className="mt-3 bg-[var(--color-brand)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              Bắt đầu làm
            </button>
          ) : null}
          {booking.status === 'IN_PROGRESS' ? (
            <button
              type="button"
              disabled={statusPending}
              onClick={() => onComplete(booking.id)}
              className="mt-3 bg-[var(--color-ink)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              Hoàn thành
            </button>
          ) : null}
          {statusError ? (
            <p className="mt-1 max-w-[12rem] text-xs text-red-600">{statusError}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
