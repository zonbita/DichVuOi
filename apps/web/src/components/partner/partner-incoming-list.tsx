import { formatPrice } from '../../services/api';
import type { Booking } from '../../types/catalog';

type Props = {
  bookings: Booking[];
  loading?: boolean;
  onAccept: (id: string) => void;
  accepting?: boolean;
};

/** Danh sách khách thuê / đơn mở — cập nhật realtime qua Socket.IO. */
export function PartnerIncomingList({
  bookings,
  loading,
  onAccept,
  accepting,
}: Props) {
  return (
    <section className="surface-card flex h-full min-h-[320px] flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold">Đơn thuê realtime</h2>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            Khách thuê đặt cọc → hiện ngay. Nhận việc gắn vào lịch tháng.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </span>
      </div>

      <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-0.5">
        {bookings.map((booking) => (
          <article
            key={booking.id}
            className="rounded-xl border border-[var(--color-line)] bg-white p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold">{booking.service.name}</p>
                <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                  {booking.customerName}
                  {booking.customerPhoneMasked ? ` · ${booking.customerPhone}` : null}
                </p>
                <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                  {new Date(booking.scheduledAt).toLocaleString('vi-VN')}
                  {booking.service.durationMin
                    ? ` · ~${Math.round((booking.service.durationMin / 60) * 10) / 10}h`
                    : null}
                </p>
              </div>
              <p className="shrink-0 text-sm font-extrabold text-[var(--color-sale)]">
                {formatPrice(booking.totalPrice)}
              </p>
            </div>
            <button
              type="button"
              disabled={accepting}
              onClick={() => onAccept(booking.id)}
              className="mt-2 w-full rounded-lg bg-[var(--color-ink)] py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              Nhận việc
            </button>
          </article>
        ))}

        {loading ? (
          <p className="text-sm text-[var(--color-muted)]">Đang tải…</p>
        ) : null}
        {!loading && bookings.length === 0 ? (
          <p className="rounded-xl bg-[var(--color-canvas)]/80 px-3 py-6 text-center text-sm text-[var(--color-muted)]">
            Chưa có đơn mở. Khi khách đặt cọc, tên khách thuê sẽ hiện tại đây ngay.
          </p>
        ) : null}
      </div>
    </section>
  );
}
