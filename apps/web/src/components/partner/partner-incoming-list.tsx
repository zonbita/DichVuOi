import { formatPrice, formatPriceNumber } from '../../services/api';
import type { Booking } from '../../types/catalog';
import { serviceImage } from '../../utils/catalog-images';
import { Icon } from '../ui/icon';

type Props = {
  bookings: Booking[];
  loading?: boolean;
  onApply: (id: string) => void;
  applyingId?: string | null;
  appliedIds?: string[];
  emptyHint?: string;
};

function formatRemainingTime(deadlineIso: string) {
  const diffMs = new Date(deadlineIso).getTime() - Date.now();
  if (diffMs <= 0) return 'đã hết hạn';

  const totalHours = Math.ceil(diffMs / (60 * 60 * 1000));
  if (totalHours < 24) return `còn ${totalHours} giờ`;

  const totalDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return `còn ${totalDays} ngày`;
}

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
          const scheduleLabel = new Date(booking.scheduledAt).toLocaleString(
            'vi-VN',
          );
          const durationLabel = booking.service.durationMin
            ? `~${Math.round((booking.service.durationMin / 60) * 10) / 10}h`
            : null;
          const applicationsLabel =
            booking.applicationCount != null
              ? `${booking.applicationCount} ứng viên`
              : null;
          const budgetLabel =
            booking.budgetMin != null && booking.budgetMax != null
              ? `${formatPriceNumber(booking.budgetMin)} – ${formatPriceNumber(booking.budgetMax)} VNĐ`
              : formatPrice(booking.totalPrice);
          const matchingDeadlineLabel = booking.matchingDeadlineAt
            ? formatRemainingTime(booking.matchingDeadlineAt)
            : null;

          return (
            <article
              key={booking.id}
              className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-[0_10px_24px_rgba(24,49,63,0.08)]"
            >
              <div className="border-l-4 border-[var(--color-brand)] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <img
                      src={serviceImage(booking.service)}
                      alt={booking.service.name}
                      className="h-[88px] w-[88px] shrink-0 rounded-2xl object-cover shadow-sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xl font-extrabold text-[var(--color-ink)]">
                        {booking.service.name}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-[var(--color-ink)]/80">
                        {booking.customerName}
                        {booking.customerPhoneMasked
                          ? ` · ${booking.customerPhone}`
                          : null}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[var(--color-muted)]">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon name="clock" className="h-3.5 w-3.5 shrink-0" />
                          {scheduleLabel}
                        </span>
                        {durationLabel ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Icon name="clock" className="h-3.5 w-3.5 shrink-0" />
                            {durationLabel}
                          </span>
                        ) : null}
                        {applicationsLabel ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Icon name="users" className="h-3.5 w-3.5 shrink-0" />
                            {applicationsLabel}
                          </span>
                        ) : null}
                      </div>
                      {booking.matchingDeadlineAt && matchingDeadlineLabel ? (
                        <p
                          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#D0382E]"
                          title={new Date(booking.matchingDeadlineAt).toLocaleString(
                            'vi-VN',
                          )}
                        >
                          <Icon name="clock" className="h-3.5 w-3.5 shrink-0" />
                          Hạn ghép: {matchingDeadlineLabel}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <p className="shrink-0 rounded-xl border border-[#F3D6A4] bg-[#FFF7E9] px-3 py-1.5 text-sm font-extrabold text-[#B96A07] shadow-sm">
                    {budgetLabel}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-line)] bg-[var(--color-canvas)]/45 px-4 py-3">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <Icon name="shield" className="h-4 w-4" />
                  </span>
                  Cọc <span className="text-lg text-[var(--color-brand)]">{formatPrice(deposit)}</span>
                </p>
                <button
                  type="button"
                  disabled={isApplying || isApplied}
                  onClick={() => onApply(booking.id)}
                  className={`inline-flex min-w-[152px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-[0_10px_24px_rgba(24,49,63,0.16)] transition ${
                    isApplied
                      ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
                      : isApplying
                        ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
                        : 'bg-[var(--color-brand)] text-white hover:-translate-y-0.5 hover:bg-[var(--color-brand-deep)]'
                  } disabled:opacity-100`}
                >
                  {isApplied ? 'Đã ứng tuyển' : isApplying ? 'Đang ứng tuyển…' : 'Ứng tuyển'}
                  <Icon
                    name={isApplied ? 'check' : 'chevronRight'}
                    className="h-4 w-4"
                  />
                </button>
              </div>
            </article>
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
