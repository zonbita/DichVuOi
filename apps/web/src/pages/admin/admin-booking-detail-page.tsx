import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookingChecklist } from '../../components/booking/booking-checklist';
import { Icon } from '../../components/ui/icon';
import type { IconName } from '../../components/ui/icon';
import {
  api,
  formatBookingStatus,
  formatPaymentStatus,
  formatPrice,
} from '../../services/api';
import {
  BOOKING_STATUS_OPTIONS,
  formatDateTime,
} from './admin-utils';

function shortBookingId(id: string) {
  return `#BK${id.slice(-8).toUpperCase()}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

function statusBadgeClass(status: string) {
  if (status === 'COMPLETED' || status === 'CONFIRMED') return 'admin-badge-green';
  if (status === 'CANCELLED') return 'admin-badge-red';
  if (status === 'IN_PROGRESS') return 'admin-badge-blue';
  if (status === 'PENDING') return 'admin-badge-amber';
  return 'admin-badge-neutral';
}

function paymentBadgeClass(status: string) {
  if (status === 'RELEASED') return 'admin-badge-green';
  if (status === 'HELD') return 'admin-badge-amber';
  if (status === 'REFUNDED') return 'admin-badge-red';
  return 'admin-badge-neutral';
}

export function AdminBookingDetailPage() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const [revealContact, setRevealContact] = useState(false);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState('');

  const bookingQuery = useQuery({
    queryKey: ['admin', 'booking', id],
    queryFn: () => api.adminBooking(id),
    enabled: Boolean(id),
  });

  const mutation = useMutation({
    mutationFn: (payload: { status?: string; paymentStatus?: string }) =>
      api.adminUpdateBooking(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  if (bookingQuery.isLoading) {
    return <p className="text-sm text-[var(--color-muted)]">Đang tải đơn…</p>;
  }
  if (bookingQuery.isError) {
    return (
      <div className="admin-card p-6">
        <p className="font-semibold">{(bookingQuery.error as Error).message}</p>
        <Link
          to="/admin/bookings"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand-deep)]"
        >
          <Icon name="chevronLeft" className="h-4 w-4" /> Về danh sách đơn
        </Link>
      </div>
    );
  }

  const booking = bookingQuery.data;
  if (!booking) return null;

  const commissionPct = booking.commissionBps / 100;
  const commissionAmount =
    booking.commissionAmount ||
    Math.round((booking.totalPrice * booking.commissionBps) / 10000);
  const partnerPayout =
    booking.partnerPayout || booking.totalPrice - commissionAmount;

  const timeline: Array<{
    label: string;
    at: string | null;
    icon: IconName;
    tone: 'green' | 'amber' | 'gray';
  }> = [
    { label: 'Tạo đơn', at: booking.createdAt, icon: 'check', tone: 'green' },
    { label: 'Lịch hẹn', at: booking.scheduledAt, icon: 'calendar', tone: 'green' },
    { label: 'Giữ cọc trên sàn', at: booking.paidAt, icon: 'lock', tone: 'amber' },
    {
      label: 'Giải ngân cho partner',
      at: booking.releasedAt,
      icon: 'send',
      tone: 'gray',
    },
    { label: 'Hoàn tiền', at: booking.refundedAt, icon: 'card', tone: 'gray' },
  ];

  async function copyId() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  const mask = (value: string | null | undefined) => {
    if (!value) return '—';
    if (revealContact) return value;
    if (value.includes('@')) {
      const [local, domain] = value.split('@');
      return `${local.slice(0, 2)}•••@${domain}`;
    }
    if (value.length <= 4) return '••••';
    return `${value.slice(0, 3)}••••${value.slice(-2)}`;
  };

  const toneClass = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-600',
    amber: 'border-amber-200 bg-amber-50 text-amber-600',
    gray: 'border-[var(--admin-border)] bg-[var(--admin-bg)] text-[var(--color-muted)]',
  } as const;

  return (
    <div className="space-y-4">
      <Link
        to="/admin/bookings"
        className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-brand-deep)]"
      >
        <Icon name="chevronLeft" className="h-4 w-4" />
        Về danh sách đơn
      </Link>

      {/* Header card */}
      <header className="admin-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]">
              <Icon name="sparkles" className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[1.35rem] leading-tight font-extrabold tracking-tight sm:text-[1.6rem]">
                {booking.service.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`admin-badge ${statusBadgeClass(booking.status)}`}>
                  {formatBookingStatus(booking.status)}
                </span>
                <span
                  className={`admin-badge ${paymentBadgeClass(booking.paymentStatus)}`}
                >
                  {formatPaymentStatus(booking.paymentStatus)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void copyId()}
                className="mt-2.5 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <span>
                  Mã đơn:{' '}
                  <span className="font-semibold text-[var(--color-ink)]">
                    {shortBookingId(booking.id)}
                  </span>
                </span>
                <Icon name="copy" className="h-3.5 w-3.5" />
                {copied ? (
                  <span className="text-xs font-semibold text-[var(--color-brand-deep)]">
                    Đã copy
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          <p className="text-[1.75rem] font-extrabold tracking-tight text-[var(--color-brand-deep)] lg:pt-1 lg:text-[2rem]">
            {formatPrice(booking.totalPrice)}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--admin-border)] pt-4">
          {booking.paymentStatus === 'UNPAID' ? (
            <button
              type="button"
              disabled={mutation.isPending}
              className="admin-btn admin-btn-primary"
              onClick={() => mutation.mutate({ paymentStatus: 'HELD' })}
            >
              <Icon name="lock" className="h-4 w-4" />
              Ép giữ cọc
            </button>
          ) : null}

          <button
            type="button"
            disabled={mutation.isPending || booking.paymentStatus !== 'HELD'}
            className="admin-btn admin-btn-primary"
            onClick={() => mutation.mutate({ paymentStatus: 'RELEASED' })}
          >
            <Icon name="send" className="h-4 w-4" />
            Giải ngân cho partner
          </button>

          <button
            type="button"
            disabled={
              mutation.isPending ||
              (booking.paymentStatus !== 'HELD' &&
                booking.status === 'CANCELLED')
            }
            className="admin-btn admin-btn-outline"
            onClick={() =>
              mutation.mutate({
                paymentStatus: 'REFUNDED',
                status: 'CANCELLED',
              })
            }
          >
            Hoàn tiền + hủy đơn
          </button>

          <label className="relative inline-flex">
            <span className="sr-only">Cập nhật trạng thái</span>
            <select
              className="admin-btn admin-btn-outline appearance-none pr-9"
              value={booking.status}
              disabled={mutation.isPending}
              onChange={(event) =>
                mutation.mutate({ status: event.target.value })
              }
            >
              {BOOKING_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Icon
              name="chevronDown"
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--color-brand-deep)]"
            />
          </label>
        </div>

        {mutation.isError ? (
          <p className="mt-3 text-sm text-red-600">
            {(mutation.error as Error).message}
          </p>
        ) : null}
      </header>

      <section className="admin-card p-5">
        <BookingChecklist booking={booking as never} mode="admin" embedded />
      </section>

      {/* 2 cột: Các bên | Cọc giữ chỗ + Timeline */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <section className="admin-card p-5">
          <h2 className="text-[15px] font-extrabold">Các bên</h2>

          <div className="mt-4 space-y-3">
            <PartyRow
              label="Khách thuê"
              name={booking.user.fullName}
              email={mask(booking.user.email)}
              phone={mask(booking.user.phone)}
            />
            <PartyRow
              label="Người làm"
              name={booking.partner?.fullName ?? 'Chưa có ai nhận'}
              email={booking.partner ? mask(booking.partner.email) : '—'}
              phone={booking.partner ? mask(booking.partner.phone) : '—'}
              href={booking.partner ? `/user/${booking.partner.id}` : undefined}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--admin-bg)] px-3.5 py-3">
            <div>
              <p className="text-xs font-bold text-[var(--color-muted)]">
                Liên hệ trên đơn
              </p>
              <p className="mt-0.5 text-sm font-medium">
                {revealContact
                  ? `${booking.customerName} · ${booking.customerPhone}`
                  : 'Đã ẩn — chỉ hiện khi cần xử lý tranh chấp'}
              </p>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn-ghost h-9 text-xs"
              onClick={() => setRevealContact((value) => !value)}
            >
              {revealContact ? 'Ẩn liên hệ' : 'Hiển thị liên hệ'}
            </button>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold text-[var(--color-muted)]">Địa chỉ</p>
            <p className="mt-1 text-sm font-medium leading-relaxed">
              {booking.address}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.address)}`}
              target="_blank"
              rel="noreferrer"
              className="admin-btn admin-btn-ghost mt-2.5 h-9 text-xs"
            >
              <Icon name="pin" className="h-3.5 w-3.5" />
              Xem trên bản đồ
            </a>
          </div>

          {booking.note ? (
            <div className="mt-4 border-t border-[var(--admin-border)] pt-4">
              <p className="text-xs font-bold text-[var(--color-muted)]">Ghi chú</p>
              <p className="mt-1 text-sm">{booking.note}</p>
            </div>
          ) : null}
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="admin-card p-5">
            <h2 className="text-[15px] font-extrabold">Cọc giữ chỗ</h2>
            <dl className="mt-4 space-y-3.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--color-muted)]">Tổng tiền đơn</dt>
                <dd className="font-bold">{formatPrice(booking.totalPrice)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--color-muted)]">
                  Phí nền tảng ({commissionPct}%)
                </dt>
                <dd className="font-semibold text-red-500">
                  −{formatPrice(commissionAmount)}
                </dd>
              </div>
              <div className="rounded-xl bg-[var(--color-brand-soft)] px-3.5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-sm font-semibold text-[var(--color-brand-deep)]">
                    Số tiền Partner nhận
                  </dt>
                  <dd className="text-lg font-extrabold text-[var(--color-brand-deep)]">
                    {formatPrice(partnerPayout)}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          <section className="admin-card p-5">
            <h2 className="text-[15px] font-extrabold">Timeline</h2>
            <ol className="mt-4">
              {timeline.map((step, index) => {
                const done = Boolean(step.at);
                const tone = done ? step.tone : 'gray';
                const last = index === timeline.length - 1;
                return (
                  <li key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
                    {!last ? (
                      <span className="absolute top-8 left-[15px] h-[calc(100%-16px)] w-px bg-[var(--admin-border)]" />
                    ) : null}
                    <span
                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${toneClass[tone]}`}
                    >
                      <Icon name={step.icon} className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-2 pt-1">
                      <p
                        className={`text-sm font-semibold ${
                          done
                            ? 'text-[var(--color-ink)]'
                            : 'text-[var(--color-muted)]'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="shrink-0 text-right text-[11px] leading-snug text-[var(--color-muted)]">
                        {step.at ? formatDateTime(step.at) : '—'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </div>

      {/* Chat */}
      <section className="admin-card overflow-hidden">
        <div className="border-b border-[var(--admin-border)] px-5 py-4">
          <h2 className="text-[15px] font-extrabold">
            Chat trên đơn
            <span className="ml-1.5 font-semibold text-[var(--color-muted)]">
              ({booking.messages.length})
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            Admin xem được tin đã lọc PII để điều tra bỏ sàn / tranh chấp.
          </p>
        </div>

        <div className="max-h-[380px] space-y-3 overflow-y-auto px-5 py-4">
          {booking.messages.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--admin-border)] p-6 text-center text-sm text-[var(--color-muted)]">
              Chưa có tin nhắn trên đơn này.
            </p>
          ) : (
            booking.messages.map((message) => {
              const isPartner =
                Boolean(booking.partner) &&
                message.sender.id === booking.partner?.id;
              return (
                <div key={message.id} className="flex gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      isPartner
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]'
                    }`}
                  >
                    {initials(message.sender.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`rounded-xl px-3.5 py-2.5 ${
                        message.redacted
                          ? 'border border-amber-200 bg-amber-50'
                          : isPartner
                            ? 'bg-orange-50'
                            : 'bg-[var(--color-brand-soft)]/70'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-bold ${
                            isPartner
                              ? 'text-orange-700'
                              : 'text-[var(--color-brand-deep)]'
                          }`}
                        >
                          {message.sender.fullName}
                        </span>
                        <span className="text-[11px] text-[var(--color-muted)]">
                          {formatDateTime(message.createdAt)}
                        </span>
                        {message.redacted ? (
                          <span className="admin-badge admin-badge-amber">
                            Đã ẩn liên hệ
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-[var(--color-ink)]">
                        {message.body}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-[var(--admin-border)] bg-[var(--admin-bg)]/50 px-4 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-white px-3 py-2">
            <button
              type="button"
              className="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--admin-bg)]"
              title="Đính kèm (sắp có)"
              disabled
            >
              <Icon name="paperclip" className="h-4 w-4" />
            </button>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Nhập nội dung… (admin gửi tin — sắp có)"
              disabled
              className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)] disabled:cursor-not-allowed"
            />
            <button
              type="button"
              disabled
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand)] text-white opacity-50"
              title="Gửi (sắp có)"
            >
              <Icon name="send" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {booking.reviews.length > 0 ? (
        <section className="admin-card p-5">
          <h2 className="text-[15px] font-extrabold">
            Đánh giá ({booking.reviews.length})
          </h2>
          <ul className="mt-3 space-y-2">
            {booking.reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-xl border border-[var(--admin-border)] px-3.5 py-3 text-sm"
              >
                <p className="font-semibold">
                  {review.rating}★ · {review.fromUser.fullName} →{' '}
                  {review.toUser.fullName}
                </p>
                {review.comment ? <p className="mt-1">{review.comment}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function PartyRow({
  label,
  name,
  email,
  phone,
  href,
}: {
  label: string;
  name: string;
  email: string;
  phone: string;
  href?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[var(--admin-border)] px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-bold tracking-wide text-[var(--color-muted)] uppercase">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-bold">{name}</p>
        <p className="mt-0.5 text-xs text-[var(--color-muted)]">{email}</p>
        <p className="text-xs text-[var(--color-muted)]">{phone}</p>
      </div>
      {href ? (
        <Link to={href} className="admin-btn admin-btn-ghost h-9 text-xs">
          Xem hồ sơ
        </Link>
      ) : null}
    </div>
  );
}
