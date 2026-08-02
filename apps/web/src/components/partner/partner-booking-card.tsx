import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  formatBookingStatus,
  formatPaymentStatus,
  formatPrice,
} from '../../services/api';
import type { Booking } from '../../types/catalog';
import { useBookingUnreadCount } from '../../hooks/use-booking-unread-count';
import { BookingChatPanel } from '../booking/booking-chat-panel';
import { BookingChecklist } from '../booking/booking-checklist';
import { BookingReviewForm } from '../booking/booking-review-form';
import { ChatUnreadBadge } from '../ui/chat-unread-badge';

type Props = {
  booking: Booking;
  currentUserId: string;
  statusPending?: boolean;
  settlementPending?: boolean;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onApproveSettlement?: (id: string) => void;
  settlementError?: string | null;
  statusError?: string | null;
  /** Hiện checklist tương tác trên thẻ (list Việc của tôi). */
  showChecklist?: boolean;
};

function statusBadgeClass(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-800 ring-amber-200';
    case 'CONFIRMED':
      return 'bg-sky-50 text-sky-800 ring-sky-200';
    case 'IN_PROGRESS':
      return 'bg-violet-50 text-violet-800 ring-violet-200';
    case 'AWAITING_CONFIRM':
      return 'bg-orange-50 text-orange-800 ring-orange-200';
    case 'DISPUTED':
      return 'bg-rose-50 text-rose-800 ring-rose-200';
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-600 ring-slate-200';
    default:
      return 'bg-[var(--color-canvas)] text-[var(--color-muted)] ring-[var(--color-line)]';
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function PartnerBookingCard({
  booking,
  currentUserId,
  statusPending,
  settlementPending,
  onStart,
  onComplete,
  onApproveSettlement,
  settlementError,
  statusError,
  showChecklist = true,
}: Props) {
  const [chatOpen, setChatOpen] = useState(false);
  const showChat =
    (booking.status === 'CONFIRMED' ||
      booking.status === 'IN_PROGRESS' ||
      booking.status === 'AWAITING_CONFIRM' ||
      booking.status === 'DISPUTED') &&
    (booking.paymentStatus === 'HELD' || booking.paymentStatus === 'RELEASED');

  const unreadCount = useBookingUnreadCount(
    booking.id,
    currentUserId,
    showChat,
  );

  const payoutHint =
    booking.paymentStatus === 'RELEASED'
      ? formatPrice(booking.partnerPayout ?? 0)
      : booking.paymentStatus === 'HELD'
        ? `~${formatPrice(Math.round((booking.totalPrice * 85) / 100))}`
        : null;

  const myApplication = (booking.applications ?? []).find(
    (a) =>
      a.partnerId === currentUserId &&
      (a.status === 'APPLIED' || a.status === 'SELECTED'),
  );
  const awaitingSelection =
    booking.status === 'PENDING' && !booking.partnerId && Boolean(myApplication);

  function onCardClick(event: React.MouseEvent) {
    if (!showChat) return;
    const target = event.target as HTMLElement;
    if (target.closest('a, button, input, textarea, label, select')) return;
    setChatOpen(true);
  }

  return (
    <article
      className={`border bg-white p-4 shadow-sm sm:p-5 ${
        showChat ? 'cursor-pointer' : ''
      } ${
        unreadCount > 0
          ? 'border-transparent ring-2 ring-[#E41E3F] ring-offset-2'
          : 'border-[var(--color-line)]'
      }`}
      onClick={onCardClick}
      title={showChat ? 'Nhấp để mở chat đơn' : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="relative h-14 w-14 shrink-0">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-brand-soft)] text-sm font-extrabold text-[var(--color-brand-deep)] ring-1 ring-[var(--color-line)]">
              {initials(booking.customerName || 'KH')}
            </div>
            <ChatUnreadBadge count={unreadCount} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/doi-tac/viec/${booking.id}`}
                className="text-lg font-extrabold hover:text-[var(--color-brand-deep)]"
              >
                {booking.service.name}
              </Link>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${
                  awaitingSelection
                    ? 'bg-amber-50 text-amber-800 ring-amber-200'
                    : statusBadgeClass(booking.status)
                }`}
              >
                {awaitingSelection
                  ? 'Đã ứng tuyển'
                  : formatBookingStatus(booking.status)}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {awaitingSelection
                ? 'Chờ chủ đơn chọn người làm'
                : formatPaymentStatus(booking.paymentStatus ?? 'UNPAID')}
              {booking.customerName ? ` · ${booking.customerName}` : null}
            </p>
            <p className="mt-2 text-[15px]">{booking.address}</p>
            <p className="text-sm text-[var(--color-muted)]">
              {new Date(booking.scheduledAt).toLocaleString('vi-VN')}
            </p>
            {booking.status === 'CONFIRMED' && booking.responseDeadlineAt ? (
              <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
                SLA phản hồi: vào «Bắt đầu làm» trước{' '}
                {new Date(booking.responseDeadlineAt).toLocaleString('vi-VN')} —
                quá hạn mất cọc ứng tuyển, đơn mở lại hàng chờ.
              </p>
            ) : null}

            {showChat ? (
              <p className="mt-3 text-xs font-semibold text-[var(--color-brand-deep)]">
                {unreadCount > 0
                  ? `${unreadCount > 9 ? '9+' : unreadCount} tin mới — nhấp để mở chat →`
                  : 'Nhấp vào thẻ để mở chat đơn →'}
              </p>
            ) : booking.status === 'CONFIRMED' ||
              booking.status === 'IN_PROGRESS' ||
              booking.status === 'AWAITING_CONFIRM' ||
              booking.status === 'DISPUTED' ? (
              <p className="mt-3 text-xs text-amber-800">
                Chờ khách đặt cọc — chưa mở chat / địa chỉ đầy đủ.
              </p>
            ) : null}

            {booking.disputeResultNote ? (
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                KQ tranh chấp: {booking.disputeResultNote}
              </p>
            ) : null}

            {(showChecklist && (booking.requirements?.length ?? 0) > 0) ||
            (showChecklist &&
              ['CONFIRMED', 'IN_PROGRESS', 'AWAITING_CONFIRM', 'DISPUTED'].includes(
                booking.status,
              )) ? (
              <div
                className="mt-3"
                onClick={(event) => event.stopPropagation()}
              >
                <BookingChecklist
                  booking={booking}
                  mode="partner"
                  embedded
                  compact
                />
              </div>
            ) : null}

            {booking.status === 'COMPLETED' ? (
              <div className="mt-3">
                <BookingReviewForm
                  booking={booking}
                  currentUserId={currentUserId}
                />
              </div>
            ) : null}
          </div>
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
              Báo đã xong việc
            </button>
          ) : null}
          {booking.status === 'AWAITING_CONFIRM' ? (
            <div className="mt-3 max-w-[14rem] space-y-1.5 text-left">
              <p className="text-xs text-orange-800">
                Đang chờ khách xác nhận / report. Escrow vẫn giữ.
              </p>
              {booking.settlementPercent ? (
                <p className="text-xs text-[var(--color-muted)]">
                  Mức nghiệm thu: <strong>{booking.settlementPercent}%</strong>
                  <br />
                  Khách{' '}
                  {booking.customerSettlementApprovedAt ? 'đã đồng ý' : 'chưa đồng ý'} ·
                  Bạn{' '}
                  {booking.partnerSettlementApprovedAt ? 'đã đồng ý' : 'chưa đồng ý'}
                </p>
              ) : (
                <p className="text-xs text-[var(--color-muted)]">
                  Chờ khách gửi mức nghiệm thu.
                </p>
              )}
              {booking.settlementPercent && onApproveSettlement ? (
                <button
                  type="button"
                  disabled={settlementPending}
                  onClick={() => onApproveSettlement(booking.id)}
                  className="w-full rounded-lg bg-[#172033] px-3 py-2 text-xs font-semibold text-white hover:bg-[#101b2d] disabled:opacity-50"
                >
                  Đồng ý mức {booking.settlementPercent}%
                </button>
              ) : null}
            </div>
          ) : null}
          {booking.status === 'DISPUTED' ? (
            <p className="mt-3 max-w-[12rem] text-xs text-rose-800">
              Đang tranh chấp — ban kiểm duyệt xử lý.
            </p>
          ) : null}
          {statusError ? (
            <p className="mt-1 max-w-[12rem] text-xs text-red-600">{statusError}</p>
          ) : null}
          {settlementError ? (
            <p className="mt-1 max-w-[12rem] text-xs text-red-600">{settlementError}</p>
          ) : null}
        </div>
      </div>

      <BookingChatPanel
        bookingId={booking.id}
        currentUserId={currentUserId}
        title={booking.service.name}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </article>
  );
}
