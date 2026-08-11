import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  formatBookingStatus,
  formatPaymentStatus,
  formatPrice,
} from '../../services/api';
import type { Booking } from '../../types/catalog';
import { serviceImage } from '../../utils/catalog-images';
import { BookingChatPanel } from '../booking/booking-chat-panel';
import { BookingReviewForm } from '../booking/booking-review-form';
import { ChatUnreadBadge } from '../ui/chat-unread-badge';
import { Icon } from '../ui/icon';
import { useBookingUnreadCount } from '../../hooks/use-booking-unread-count';

type Props = {
  booking: Booking;
  currentUserId: string;
  /** @deprecated Giữ tương thích — card luôn tự bọc surface. */
  embedded?: boolean;
  paying?: boolean;
  cancelling?: boolean;
  confirming?: boolean;
  settlementPending?: boolean;
  payError?: string | null;
  cancelError?: string | null;
  confirmError?: string | null;
  settlementError?: string | null;
  onPay: (id: string) => void;
  onCancel: (id: string) => void;
  onConfirm?: (id: string, acceptIncomplete: boolean) => void;
  onProposeSettlement?: (id: string, percent: number) => void;
  onApproveSettlement?: (id: string) => void;
};

function shortRef(id: string) {
  return id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || id.slice(-6);
}

function partnerLabel(booking: Booking) {
  if (booking.partner) return booking.partner.fullName;
  if (booking.status === 'CANCELLED') return 'Đã hủy trước khi có người nhận';
  if (booking.status === 'SCHEDULED') {
    return booking.publishAt
      ? `Hẹn đăng ${new Date(booking.publishAt).toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : 'Đã hẹn giờ đăng';
  }
  if (booking.paymentStatus === 'HELD') return 'Đang chờ người làm nhận việc…';
  return 'Chưa có người làm nhận';
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-violet-50 text-violet-700';
    case 'PENDING':
      return 'bg-[#FFF7E8] text-[#C98518]';
    case 'CONFIRMED':
      return 'bg-[#EFF6FF] text-[#2563EB]';
    case 'IN_PROGRESS':
      return 'bg-[#EFF6FF] text-[#1D4ED8]';
    case 'AWAITING_CONFIRM':
      return 'bg-[#FFF7E8] text-[#C98518]';
    case 'DISPUTED':
      return 'bg-[#FFF5F5] text-[#DC5B5B]';
    case 'COMPLETED':
      return 'bg-[#ECFDF5] text-[#047857]';
    case 'CANCELLED':
      return 'bg-[#F1F5F9] text-[#64748B]';
    default:
      return 'bg-[#F1F5F9] text-[#64748B]';
  }
}

const surface = 'glass-card overflow-hidden';

export function CustomerBookingCard({
  booking,
  currentUserId,
  paying,
  cancelling,
  confirming,
  settlementPending,
  payError,
  cancelError,
  confirmError,
  settlementError,
  onPay,
  onCancel,
  onConfirm,
  onProposeSettlement,
  onApproveSettlement,
}: Props) {
  const [chatOpen, setChatOpen] = useState(false);
  const [settlementPercentDraft, setSettlementPercentDraft] = useState(
    booking.settlementPercent ?? 100,
  );
  useEffect(() => {
    setSettlementPercentDraft(booking.settlementPercent ?? 100);
  }, [booking.settlementPercent]);
  const canPay =
    booking.paymentStatus === 'UNPAID' && booking.status !== 'CANCELLED';
  const canCancel =
    booking.status === 'SCHEDULED' ||
    booking.status === 'PENDING' ||
    booking.status === 'CONFIRMED';
  const showChat =
    Boolean(booking.partnerId) &&
    (booking.paymentStatus === 'HELD' || booking.paymentStatus === 'RELEASED') &&
    (booking.status === 'CONFIRMED' ||
      booking.status === 'IN_PROGRESS' ||
      booking.status === 'AWAITING_CONFIRM' ||
      booking.status === 'DISPUTED');

  function onCardClick(event: React.MouseEvent) {
    if (!showChat) return;
    const target = event.target as HTMLElement;
    if (target.closest('a, button, input, textarea, label, select')) return;
    setChatOpen(true);
  }
  const unreadCount = useBookingUnreadCount(
    booking.id,
    currentUserId,
    showChat,
  );
  const incompleteCount = (booking.requirements ?? []).filter(
    (r) => !r.customerConfirmed,
  ).length;
  const showContactHint =
    Boolean(booking.contactPolicy?.hint) &&
    booking.status !== 'CANCELLED' &&
    booking.paymentStatus !== 'REFUNDED';
  const footerHint = showContactHint
    ? booking.contactPolicy?.hint
    : booking.status === 'CANCELLED' && booking.paymentStatus === 'REFUNDED'
      ? 'Đơn đã hủy — cọc đã hoàn về ví.'
      : null;
  const cover = serviceImage(booking.service, 'card');

  return (
    <article
      className={`${surface} ${showChat ? 'cursor-pointer' : ''} ${
        unreadCount > 0
          ? 'ring-2 ring-[#DC5B5B] ring-offset-2 ring-offset-transparent'
          : ''
      }`}
      onClick={onCardClick}
      title={showChat ? 'Nhấp để mở chat đơn' : undefined}
    >
      <div className="flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-stretch lg:gap-0 lg:p-8">
        {/* Job information */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:gap-5">
          <Link
            to={`/dich-vu/${booking.service.slug}`}
            className="relative block h-[140px] w-full shrink-0 overflow-visible sm:h-[160px] sm:w-[160px] lg:h-[180px] lg:w-[180px]"
          >
            <span className="block h-full w-full overflow-hidden rounded-2xl bg-[#EEF2F7] ring-1 ring-[#DCE4EF]">
              <img
                src={cover}
                alt={booking.service.name}
                className="catalog-photo h-full w-full object-cover"
                loading="lazy"
              />
            </span>
            <ChatUnreadBadge count={unreadCount} />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/don-cua-toi/don/${booking.id}`}
                className="text-2xl font-bold tracking-tight text-[#0F2747] hover:text-[var(--color-brand-deep)] sm:text-[26px]"
              >
                {booking.service.name}
              </Link>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClass(booking.status)}`}
              >
                {formatBookingStatus(booking.status)}
              </span>
              <Link
                to={`/dich-vu/${booking.service.slug}`}
                className="inline-flex rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-semibold text-[#2563EB] hover:bg-[#DBEAFE]"
              >
                Dịch vụ
              </Link>
            </div>

            <p className="mt-1.5 text-[15px] text-[#64748B]">
              {booking.service.category.group.name}
              {booking.paymentStatus
                ? ` · ${formatPaymentStatus(booking.paymentStatus)}`
                : null}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm text-[#64748B]">
              <span className="inline-flex items-center gap-2">
                <Icon name="receipt" className="h-4 w-4 shrink-0 text-[#64748B]" />
                {shortRef(booking.id)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Icon name="clock" className="h-4 w-4 shrink-0 text-[#64748B]" />
                {new Date(booking.scheduledAt).toLocaleString('vi-VN')}
              </span>
              <span className="inline-flex min-w-0 items-center gap-2">
                <Icon name="user" className="h-4 w-4 shrink-0 text-[#64748B]" />
                {booking.partner ? (
                  <Link
                    to={`/user/${booking.partner.id}`}
                    className="truncate font-semibold text-[#0F2747] hover:text-[#2563EB]"
                  >
                    {booking.partner.fullName}
                  </Link>
                ) : (
                  <span className="truncate">{partnerLabel(booking)}</span>
                )}
              </span>
              {booking.address ? (
                <span className="inline-flex min-w-0 max-w-full items-center gap-2">
                  <Icon name="pin" className="h-4 w-4 shrink-0 text-[#64748B]" />
                  <span className="truncate">{booking.address}</span>
                </span>
              ) : null}
            </div>

            {booking.status === 'CONFIRMED' && booking.responseDeadlineAt ? (
              <p className="mt-4 rounded-xl border border-[#F3D6A4] bg-[#FFF7E8] px-3.5 py-2.5 text-xs font-medium text-[#C98518]">
                Người làm phải bắt đầu trước{' '}
                {new Date(booking.responseDeadlineAt).toLocaleString('vi-VN')} —
                quá hạn tịch thu cọc 10% và mở lại đơn.
              </p>
            ) : null}

            {footerHint ? (
              <p className="mt-4 flex items-start gap-2 rounded-xl border border-[#F3D6A4] bg-[#FFF7E8] px-3.5 py-2.5 text-sm font-medium text-[#C98518]">
                <Icon name="message" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{footerHint}</span>
              </p>
            ) : null}
          </div>
        </div>

        {/* Payment summary */}
        <div className="flex w-full shrink-0 flex-col justify-center gap-4 border-t border-white/50 pt-5 lg:w-[240px] lg:border-t-0 lg:border-l lg:border-white/50 lg:pl-7 lg:pt-0">
          <div className="flex flex-col items-center gap-2.5 lg:items-start">
            <p className="text-2xl font-bold tracking-tight text-[#0F2747]">
              {formatPrice(booking.totalPrice)}
            </p>

            {booking.paymentStatus === 'REFUNDED' ? (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-semibold text-[#047857]">
                <Icon name="check" className="h-3.5 w-3.5" />
                Đã hoàn cọc
              </p>
            ) : null}
            {booking.paymentStatus === 'RELEASED' ? (
              <p className="text-xs text-[#64748B]">
                Đã giải ngân {formatPrice(booking.partnerPayout ?? 0)}
              </p>
            ) : null}
            {booking.paymentStatus === 'HELD' && booking.status !== 'CANCELLED' ? (
              <p className="inline-flex rounded-full bg-[#FFF7E8] px-2.5 py-1 text-[11px] font-semibold text-[#C98518]">
                Hệ thống đang giữ cọc
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            {canPay ? (
              <button
                type="button"
                onClick={() => onPay(booking.id)}
                disabled={paying}
                className="btn-primary h-11 w-full px-4 text-sm disabled:opacity-50"
              >
                {paying ? 'Đang đặt cọc…' : 'Đặt cọc'}
              </button>
            ) : null}
            <Link
              to={`/don-cua-toi/don/${booking.id}`}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[var(--color-brand)]/35 bg-white/50 px-4 text-sm font-semibold text-[var(--color-brand-deep)] transition hover:bg-[var(--color-brand-soft)]/80"
            >
              Chi tiết
            </Link>
            {booking.paymentStatus === 'UNPAID' && booking.status !== 'CANCELLED' ? (
              <Link
                to="/don-cua-toi/vi"
                className="text-center text-xs font-semibold text-[var(--color-brand-deep)] hover:underline"
              >
                Nạp ví nếu thiếu số dư
              </Link>
            ) : null}

            {booking.status === 'AWAITING_CONFIRM' && onConfirm ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => onConfirm(booking.id, incompleteCount > 0)}
                  disabled={confirming}
                  className="btn-primary h-11 w-full px-4 text-sm disabled:opacity-50"
                >
                  Đồng ý 100%
                </button>
                {onProposeSettlement ? (
                  <div className="space-y-1.5 rounded-xl border border-white/60 bg-white/40 p-2.5 backdrop-blur-sm">
                    <p className="text-[11px] font-semibold text-[#64748B]">
                      Nghiệm thu theo % (cần 2 bên đồng ý)
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={settlementPercentDraft}
                        onChange={(event) =>
                          setSettlementPercentDraft(
                            Math.max(
                              1,
                              Math.min(100, Number(event.target.value) || 1),
                            ),
                          )
                        }
                        className="field-input w-20 text-sm"
                      />
                      <span className="text-xs text-[#64748B]">%</span>
                      <button
                        type="button"
                        disabled={settlementPending}
                        onClick={() =>
                          onProposeSettlement(booking.id, settlementPercentDraft)
                        }
                        className="rounded-lg border border-[var(--color-brand)]/30 bg-white/70 px-3 py-2 text-xs font-semibold text-[var(--color-brand-deep)] hover:bg-[var(--color-brand-soft)] disabled:opacity-50"
                      >
                        Gửi đề xuất
                      </button>
                    </div>
                    {booking.settlementPercent ? (
                      <p className="text-[11px] text-[#64748B]">
                        Đề xuất hiện tại: <strong>{booking.settlementPercent}%</strong> ·
                        Khách{' '}
                        {booking.customerSettlementApprovedAt ? 'đã đồng ý' : 'chưa đồng ý'} ·
                        Người làm{' '}
                        {booking.partnerSettlementApprovedAt ? 'đã đồng ý' : 'chưa đồng ý'}
                      </p>
                    ) : null}
                    {booking.settlementPercent && onApproveSettlement ? (
                      <button
                        type="button"
                        disabled={settlementPending}
                        onClick={() => onApproveSettlement(booking.id)}
                        className="w-full rounded-lg bg-[var(--color-navy)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--color-navy-deep)] disabled:opacity-50"
                      >
                        Đồng ý mức {booking.settlementPercent}%
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {incompleteCount > 0 ? (
                  <p className="text-center text-[11px] text-[#64748B]">
                    Còn {incompleteCount} mục chưa tích — nên kiểm checklist trước.
                  </p>
                ) : null}
              </div>
            ) : null}

            {booking.disputeResultNote ? (
              <p className="text-center text-xs text-[#64748B] lg:text-left">
                KQ tranh chấp: {booking.disputeResultNote}
              </p>
            ) : null}

            {canCancel ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (
                    !window.confirm(
                      'Hủy đơn này? Nếu đã đặt cọc, tiền sẽ hoàn về ví.',
                    )
                  ) {
                    return;
                  }
                  onCancel(booking.id);
                }}
                disabled={cancelling}
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[#DC5B5B]/70 bg-white/60 px-4 text-sm font-semibold text-[#DC5B5B] transition hover:bg-[#FFF5F5] disabled:opacity-50"
              >
                <span aria-hidden className="text-base leading-none">
                  ×
                </span>
                {cancelling ? 'Đang hủy…' : 'Hủy đơn'}
              </button>
            ) : null}

            {payError ? (
              <p className="text-center text-xs text-[#DC5B5B]">
                {payError}
                {payError.includes('Số dư') ? (
                  <>
                    {' '}
                    <Link to="/don-cua-toi/vi" className="font-semibold underline">
                      Nạp ví
                    </Link>
                  </>
                ) : null}
              </p>
            ) : null}
            {cancelError ? (
              <p className="text-center text-xs text-[#DC5B5B]">{cancelError}</p>
            ) : null}
            {confirmError ? (
              <p className="text-center text-xs text-[#DC5B5B]">{confirmError}</p>
            ) : null}
            {settlementError ? (
              <p className="text-center text-xs text-[#DC5B5B]">{settlementError}</p>
            ) : null}

            {booking.status === 'COMPLETED' && booking.partnerId ? (
              <Link
                to={`/dich-vu/${booking.service.slug}?partner=${booking.partnerId}`}
                className="btn-primary inline-flex h-11 w-full items-center justify-center px-4 text-sm"
              >
                Thuê lại
              </Link>
            ) : null}

            {(booking.status !== 'PENDING' &&
              booking.status !== 'CANCELLED') ||
            booking.paymentStatus === 'REFUNDED' ? (
              <Link
                to="/don-cua-toi/khieu-nai"
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--color-brand)]/30 bg-white/50 px-3 text-sm font-semibold text-[var(--color-brand-deep)] transition hover:bg-[var(--color-brand-soft)]/80"
              >
                <Icon name="shield" className="h-3.5 w-3.5" />
                Khiếu nại đơn
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {booking.partnerId &&
      booking.paymentStatus === 'UNPAID' &&
      booking.status !== 'CANCELLED' ? (
        <div className="border-t border-[#DCE4EF] px-6 py-3 sm:px-8">
          <p className="text-xs text-[#64748B]">
            Chat mở sau khi đặt cọc giữ chỗ.
          </p>
        </div>
      ) : null}
      {showChat ? (
        <div className="border-t border-[#DCE4EF] px-6 py-3 sm:px-8">
          <p className="text-xs font-semibold text-[var(--color-brand-deep)]">
            {unreadCount > 0
              ? `${unreadCount > 9 ? '9+' : unreadCount} tin mới — nhấp để mở chat`
              : 'Nhấp vào thẻ để mở chat đơn'}
          </p>
        </div>
      ) : null}
      <div className="px-6 empty:hidden sm:px-8">
        <BookingReviewForm booking={booking} currentUserId={currentUserId} />
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
