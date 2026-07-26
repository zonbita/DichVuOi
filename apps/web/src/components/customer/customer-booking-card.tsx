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
  paying?: boolean;
  cancelling?: boolean;
  payError?: string | null;
  onPay: (id: string) => void;
  onCancel: (id: string) => void;
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

export function CustomerBookingCard({
  booking,
  currentUserId,
  paying,
  cancelling,
  payError,
  onPay,
  onCancel,
}: Props) {
  const canPay =
    booking.paymentStatus === 'UNPAID' && booking.status !== 'CANCELLED';
  const canCancel =
    booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  const showChat =
    Boolean(booking.partnerId) &&
    booking.paymentStatus === 'HELD' &&
    (booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS');

  return (
    <article className="border border-[var(--color-line)] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/don-cua-toi/don/${booking.id}`}
              className="text-lg font-extrabold hover:text-[var(--color-brand-deep)]"
            >
              {booking.service.name}
            </Link>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${statusBadgeClass(booking.status)}`}
            >
              {formatBookingStatus(booking.status)}
            </span>
            <Link
              to={`/dich-vu/${booking.service.slug}`}
              className="text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-brand-deep)]"
            >
              Dịch vụ
            </Link>
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {booking.service.category.group.name}
            {booking.paymentStatus
              ? ` · ${formatPaymentStatus(booking.paymentStatus)}`
              : null}
          </p>
          <p className="mt-2 text-[15px]">{booking.address}</p>
          <p className="text-sm text-[var(--color-muted)]">
            {new Date(booking.scheduledAt).toLocaleString('vi-VN')}
          </p>
          {booking.partner ? (
            <p className="mt-2 text-sm">
              Người làm: <strong>{booking.partner.fullName}</strong>
              <span className="text-[var(--color-muted)]">
                {' '}
                (không hiện SĐT — chat trong đơn)
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {booking.paymentStatus === 'HELD'
                ? 'Đang chờ người làm nhận việc…'
                : 'Chưa có người làm nhận'}
            </p>
          )}
          {booking.contactPolicy?.hint ? (
            <p className="mt-1 text-xs text-amber-800">{booking.contactPolicy.hint}</p>
          ) : null}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-extrabold text-[var(--color-sale)]">
            {formatPrice(booking.totalPrice)}
          </p>
          {canPay ? (
            <button
              type="button"
              onClick={() => onPay(booking.id)}
              disabled={paying}
              className="btn-primary mt-3 px-4 py-2 text-sm disabled:opacity-50"
            >
              Đặt cọc giữ chỗ
            </button>
          ) : null}
          {booking.paymentStatus === 'RELEASED' ? (
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Đã giải ngân partner {formatPrice(booking.partnerPayout ?? 0)}
            </p>
          ) : null}
          {booking.paymentStatus === 'REFUNDED' ? (
            <p className="mt-2 text-xs text-emerald-700">Đã hoàn cọc</p>
          ) : null}
          {canCancel ? (
            <button
              type="button"
              onClick={() => onCancel(booking.id)}
              disabled={cancelling}
              className="mt-3 block w-full text-sm font-semibold text-red-600 disabled:opacity-50"
            >
              Hủy đơn
            </button>
          ) : null}
          {payError ? (
            <p className="mt-1 text-xs text-red-600">{payError}</p>
          ) : null}
          <Link
            to="/don-cua-toi/khieu-nai"
            className="mt-2 inline-block text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-brand-deep)]"
          >
            Khiếu nại đơn
          </Link>
        </div>
      </div>

      {showChat ? <BookingChat bookingId={booking.id} /> : null}
      {booking.partnerId &&
      booking.paymentStatus === 'UNPAID' &&
      booking.status !== 'CANCELLED' ? (
        <p className="mt-3 text-xs text-amber-800">
          Chat mở sau khi đặt cọc giữ chỗ.
        </p>
      ) : null}
      <BookingReviewForm booking={booking} currentUserId={currentUserId} />
    </article>
  );
}
