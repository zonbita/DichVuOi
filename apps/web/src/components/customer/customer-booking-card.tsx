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
  if (booking.paymentStatus === 'HELD') return 'Đang chờ người làm nhận việc…';
  return 'Chưa có người làm nhận';
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-[#F4E8D8] text-[#8A5A2B]';
    case 'CONFIRMED':
      return 'bg-[#E8F0FE] text-[#4977E8]';
    case 'IN_PROGRESS':
      return 'bg-[#EEE8FF] text-[#5B4B8A]';
    case 'AWAITING_CONFIRM':
      return 'bg-[#FFF0E6] text-[#B8642A]';
    case 'DISPUTED':
      return 'bg-[#FDECEC] text-[#C45B5B]';
    case 'COMPLETED':
      return 'bg-[#E7F6EE] text-[#2F7A52]';
    case 'CANCELLED':
      return 'bg-[#EEF1F5] text-[#7C8799]';
    default:
      return 'bg-[#EEF1F5] text-[#7C8799]';
  }
}

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
    booking.status === 'PENDING' || booking.status === 'CONFIRMED';
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
  const cover = serviceImage(booking.service);

  return (
    <article
      className={`glass-card overflow-hidden ${showChat ? 'cursor-pointer' : ''} ${
        unreadCount > 0
          ? 'ring-2 ring-[#E41E3F] ring-offset-2 ring-offset-[#F7F8FA]'
          : ''
      }`}
      onClick={onCardClick}
      title={showChat ? 'Nhấp để mở chat đơn' : undefined}
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-stretch lg:gap-0 lg:p-0">
        {/* Thumbnail */}
        <div className="flex shrink-0 items-start lg:p-5">
          <Link
            to={`/dich-vu/${booking.service.slug}`}
            className="relative block h-[88px] w-[88px] overflow-visible sm:h-[96px] sm:w-[96px]"
          >
            <span className="block h-full w-full overflow-hidden rounded-[18px] bg-[#EEF1F5] ring-1 ring-[#172033]/06">
              <img
                src={cover}
                alt={booking.service.name}
                className="catalog-photo h-full w-full object-cover"
                loading="lazy"
              />
            </span>
            <ChatUnreadBadge count={unreadCount} />
          </Link>
        </div>

        {/* Main info */}
        <div className="min-w-0 flex-1 lg:py-5 lg:pr-5">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/don-cua-toi/don/${booking.id}`}
              className="text-xl font-bold tracking-tight text-[#172033] hover:text-[#4977E8]"
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
              className="inline-flex rounded-full bg-[#E8F0FE] px-2.5 py-1 text-[11px] font-semibold text-[#4977E8] hover:bg-[#dce8fd]"
            >
              Dịch vụ
            </Link>
          </div>

          <p className="mt-1.5 text-sm text-[#7C8799]">
            {booking.service.category.group.name}
            {booking.paymentStatus
              ? ` · ${formatPaymentStatus(booking.paymentStatus)}`
              : null}
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#7C8799]">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="receipt" className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {shortRef(booking.id)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {new Date(booking.scheduledAt).toLocaleString('vi-VN')}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Icon name="user" className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {booking.partner ? (
                <Link
                  to={`/user/${booking.partner.id}`}
                  className="truncate font-semibold text-[#172033] hover:text-[#4977E8]"
                >
                  {booking.partner.fullName}
                </Link>
              ) : (
                <span className="truncate">{partnerLabel(booking)}</span>
              )}
            </span>
            {booking.address ? (
              <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                <Icon name="pin" className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="truncate">{booking.address}</span>
              </span>
            ) : null}
          </div>

          {booking.status === 'CONFIRMED' && booking.responseDeadlineAt ? (
            <p className="mt-3 rounded-[12px] bg-[#FFF0E6] px-3 py-2 text-xs font-medium text-[#8A5A2B]">
              Người làm phải bắt đầu trước{' '}
              {new Date(booking.responseDeadlineAt).toLocaleString('vi-VN')} —
              quá hạn tịch thu cọc 10% và mở lại đơn.
            </p>
          ) : null}

          {footerHint ? (
            <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-[#8A5A2B]">
              <Icon name="message" className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" />
              <span>{footerHint}</span>
            </p>
          ) : null}
        </div>

        {/* Price + actions */}
        <div className="flex w-full shrink-0 flex-col justify-center gap-3 border-t border-[#172033]/08 pt-4 lg:w-[220px] lg:border-t-0 lg:px-5 lg:py-5 lg:pt-5">
          <div className="text-center lg:text-left">
            <p className="text-2xl font-bold tracking-tight text-[#C8963E]">
              {formatPrice(booking.totalPrice)}
            </p>

            {booking.paymentStatus === 'REFUNDED' ? (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#E7F6EE] px-2.5 py-1 text-[11px] font-semibold text-[#2F7A52]">
                <Icon name="check" className="h-3.5 w-3.5" />
                Đã hoàn cọc
              </p>
            ) : null}
            {booking.paymentStatus === 'RELEASED' ? (
              <p className="mt-2 text-xs text-[#7C8799]">
                Đã giải ngân {formatPrice(booking.partnerPayout ?? 0)}
              </p>
            ) : null}
            {booking.paymentStatus === 'HELD' && booking.status !== 'CANCELLED' ? (
              <p className="mt-2 inline-flex rounded-full bg-[#F4E8D8] px-2.5 py-1 text-[11px] font-semibold text-[#8A5A2B]">
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
                className="w-full rounded-xl bg-[#4977E8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3d66c9] disabled:opacity-50"
              >
                Đặt cọc từ ví VNĐ
              </button>
            ) : null}
            {booking.paymentStatus === 'UNPAID' && booking.status !== 'CANCELLED' ? (
              <Link
                to="/don-cua-toi/vi"
                className="text-center text-xs font-semibold text-[#4977E8] hover:underline"
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
                  className="w-full rounded-xl bg-[#4977E8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3d66c9] disabled:opacity-50"
                >
                  Đồng ý 100%
                </button>
                {onProposeSettlement ? (
                  <div className="space-y-1.5 rounded-xl border border-[#172033]/10 bg-[#F7F9FA] p-2.5">
                    <p className="text-[11px] font-semibold text-[#7C8799]">
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
                      <span className="text-xs text-[#7C8799]">%</span>
                      <button
                        type="button"
                        disabled={settlementPending}
                        onClick={() =>
                          onProposeSettlement(booking.id, settlementPercentDraft)
                        }
                        className="rounded-lg border border-[#B7C9F5] bg-white px-3 py-2 text-xs font-semibold text-[#4977E8] hover:bg-[#F3F7FF] disabled:opacity-50"
                      >
                        Gửi đề xuất
                      </button>
                    </div>
                    {booking.settlementPercent ? (
                      <p className="text-[11px] text-[#7C8799]">
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
                        className="w-full rounded-lg bg-[#172033] px-3 py-2 text-xs font-semibold text-white hover:bg-[#101b2d] disabled:opacity-50"
                      >
                        Đồng ý mức {booking.settlementPercent}%
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {incompleteCount > 0 ? (
                  <p className="text-center text-[11px] text-[#7C8799]">
                    Còn {incompleteCount} mục chưa tích — nên kiểm checklist trước.
                  </p>
                ) : null}
              </div>
            ) : null}

            {booking.disputeResultNote ? (
              <p className="text-center text-xs text-[#7C8799] lg:text-left">
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
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#E8A0A0] bg-white px-4 py-2.5 text-sm font-semibold text-[#C45B5B] transition hover:bg-[#FDF4F4] disabled:opacity-50"
              >
                <span aria-hidden className="text-base leading-none">
                  ×
                </span>
                {cancelling ? 'Đang hủy…' : 'Hủy đơn'}
              </button>
            ) : null}

            {payError ? (
              <p className="text-center text-xs text-[#C45B5B]">
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
              <p className="text-center text-xs text-[#C45B5B]">{cancelError}</p>
            ) : null}
            {confirmError ? (
              <p className="text-center text-xs text-[#C45B5B]">{confirmError}</p>
            ) : null}
            {settlementError ? (
              <p className="text-center text-xs text-[#C45B5B]">{settlementError}</p>
            ) : null}

            {booking.status === 'COMPLETED' && booking.partnerId ? (
              <Link
                to={`/dich-vu/${booking.service.slug}?partner=${booking.partnerId}`}
                className="w-full rounded-xl bg-[#4977E8] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#3d66c9]"
              >
                Thuê lại
              </Link>
            ) : null}

            {(booking.status !== 'PENDING' &&
              booking.status !== 'CANCELLED') ||
            booking.paymentStatus === 'REFUNDED' ? (
              <Link
                to="/don-cua-toi/khieu-nai"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#B7C9F5] bg-white px-3 py-2.5 text-sm font-semibold text-[#4977E8] transition hover:bg-[#F3F7FF]"
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
        <div className="border-t border-[#172033]/08 px-5 py-3">
          <p className="text-xs text-[#7C8799]">
            Chat mở sau khi đặt cọc giữ chỗ.
          </p>
        </div>
      ) : null}
      {showChat ? (
        <div className="border-t border-[#172033]/08 px-5 py-2.5">
          <p className="text-xs font-semibold text-[#4977E8]">
            {unreadCount > 0
              ? `${unreadCount > 9 ? '9+' : unreadCount} tin mới — nhấp để mở chat →`
              : 'Nhấp vào thẻ để mở chat đơn →'}
          </p>
        </div>
      ) : null}
      <div className="px-5 empty:hidden">
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
