import type { Booking } from '../../types/catalog';

const STEPS: Array<{
  key: string;
  label: string;
  match: (b: Booking) => boolean;
}> = [
  {
    key: 'pending',
    label: 'Đã cọc / đang ghép',
    match: (b) =>
      ['PENDING', 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'AWAITING_CONFIRM', 'COMPLETED', 'DISPUTED'].includes(
        b.status,
      ) && b.paymentStatus !== 'UNPAID',
  },
  {
    key: 'confirmed',
    label: 'Đã có người làm',
    match: (b) =>
      ['CONFIRMED', 'IN_PROGRESS', 'AWAITING_CONFIRM', 'COMPLETED', 'DISPUTED'].includes(
        b.status,
      ),
  },
  {
    key: 'progress',
    label: 'Đang làm',
    match: (b) =>
      ['IN_PROGRESS', 'AWAITING_CONFIRM', 'COMPLETED', 'DISPUTED'].includes(b.status),
  },
  {
    key: 'await',
    label: 'Chờ nghiệm thu',
    match: (b) =>
      ['AWAITING_CONFIRM', 'COMPLETED', 'DISPUTED'].includes(b.status),
  },
  {
    key: 'done',
    label: 'Hoàn thành',
    match: (b) => b.status === 'COMPLETED',
  },
];

/** Stepper tiến độ đơn — khách / người làm. */
export function BookingStatusTimeline({ booking }: { booking: Booking }) {
  if (booking.status === 'CANCELLED') {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
        Đơn đã hủy
        {booking.paymentStatus === 'REFUNDED' ? ' · đã hoàn cọc' : ''}
      </div>
    );
  }

  const activeIdx = (() => {
    let idx = -1;
    STEPS.forEach((step, i) => {
      if (step.match(booking)) idx = i;
    });
    return idx;
  })();

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-4 shadow-[0_4px_14px_rgba(24,49,63,0.05)]">
      <p className="mb-3 text-sm font-extrabold text-[var(--color-navy)]">
        Tiến độ đơn
      </p>
      <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:justify-between sm:gap-1">
        {STEPS.map((step, i) => {
          const done = i <= activeIdx;
          const current = i === activeIdx;
          return (
            <li
              key={step.key}
              className="relative flex flex-1 items-start gap-3 pb-4 last:pb-0 sm:flex-col sm:items-center sm:pb-0 sm:text-center"
            >
              {i < STEPS.length - 1 ? (
                <span
                  className={`absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-0.5 sm:left-[calc(50%+14px)] sm:top-[11px] sm:h-0.5 sm:w-[calc(100%-28px)] ${
                    i < activeIdx ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-line)]'
                  }`}
                  aria-hidden
                />
              ) : null}
              <span
                className={`relative z-[1] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                  current
                    ? 'bg-[var(--color-brand)] text-white ring-4 ring-[var(--color-brand)]/20'
                    : done
                      ? 'bg-[var(--color-brand)] text-white'
                      : 'bg-[var(--color-canvas)] text-[var(--color-muted)] ring-1 ring-[var(--color-line)]'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              <span
                className={`pt-0.5 text-xs font-semibold sm:mt-2 sm:max-w-[7.5rem] ${
                  current
                    ? 'text-[var(--color-brand-deep)]'
                    : done
                      ? 'text-[var(--color-navy)]'
                      : 'text-[var(--color-muted)]'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      {booking.status === 'DISPUTED' ? (
        <p className="mt-3 text-xs font-semibold text-amber-800">
          Đơn đang khiếu nại — escrow vẫn giữ trên sàn.
        </p>
      ) : null}
    </div>
  );
}
