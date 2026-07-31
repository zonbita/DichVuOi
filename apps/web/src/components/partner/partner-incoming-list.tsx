import { formatPrice } from '../../services/api';
import type { Booking } from '../../types/catalog';
import { OpenJobCard, openJobRoomTone } from '../common/open-job-card';
import { Icon } from '../ui/icon';

type Props = {
  bookings: Booking[];
  loading?: boolean;
  onApply: (id: string) => void;
  applyingId?: string | null;
  appliedIds?: string[];
  emptyHint?: string;
};

/** Danh sách đơn mở — partner ứng tuyển (cọc 10%), chủ đơn chọn sau. */
export function PartnerIncomingList({
  bookings,
  loading,
  onApply,
  applyingId,
  appliedIds = [],
  emptyHint,
}: Props) {
  return (
    <section className="surface-card flex h-full min-h-[320px] flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold">Đơn thuê realtime</h2>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            Khách đặt cọc 100% → ứng tuyển (cọc 10% ví) → chờ chủ đơn chọn.
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
        {bookings.map((booking) => {
          const isApplying = applyingId === booking.id;
          const isApplied =
            appliedIds.includes(booking.id) ||
            (booking.applications?.some((application) =>
              ['APPLIED', 'SELECTED'].includes(application.status),
            ) ??
              false);
          const deposit =
            booking.applyDepositAmount ??
            Math.max(1, Math.round(booking.totalPrice * 0.1));
          const tone = isApplied
            ? {
                label: 'Đã vào phòng',
                badge: 'border border-amber-400 bg-amber-50 text-amber-800',
                dot: 'bg-amber-500',
              }
            : openJobRoomTone(booking);

          return (
            <OpenJobCard
              key={booking.id}
              booking={booking}
              footerLeft={
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold tracking-wide uppercase ${tone.badge}`}
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
                    {tone.label}
                  </span>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    Cọc{' '}
                    <span className="text-[var(--color-brand)]">
                      {formatPrice(deposit)}
                    </span>
                  </p>
                </div>
              }
              footerRight={
                <button
                  type="button"
                  disabled={isApplying || isApplied}
                  onClick={() => onApply(booking.id)}
                  className={`inline-flex min-w-[132px] items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold transition ${
                    isApplied
                      ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
                      : isApplying
                        ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
                        : 'bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-deep)]'
                  } disabled:opacity-100`}
                >
                  {isApplied
                    ? 'Đã ứng tuyển'
                    : isApplying
                      ? 'Đang ứng tuyển…'
                      : 'Ứng tuyển'}
                  <Icon
                    name={isApplied ? 'check' : 'chevronRight'}
                    className="h-4 w-4"
                  />
                </button>
              }
            />
          );
        })}

        {loading ? (
          <p className="text-sm text-[var(--color-muted)]">Đang tải…</p>
        ) : null}
        {!loading && bookings.length === 0 ? (
          <p className="rounded-xl bg-[var(--color-canvas)]/80 px-3 py-6 text-center text-sm text-[var(--color-muted)]">
            {emptyHint ??
              'Chưa có đơn mở. Khi khách đặt cọc, đơn sẽ hiện tại đây.'}
          </p>
        ) : null}
      </div>
    </section>
  );
}
