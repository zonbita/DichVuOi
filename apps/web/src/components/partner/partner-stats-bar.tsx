import { useMemo } from 'react';
import { formatPrice } from '../../services/api';
import type { Booking } from '../../types/catalog';

type Props = {
  mine: Booking[];
  openCount: number;
};

export function PartnerStatsBar({ mine, openCount }: Props) {
  const stats = useMemo(() => {
    const active = mine.filter(
      (b) =>
        b.status === 'CONFIRMED' ||
        b.status === 'IN_PROGRESS' ||
        (b.status === 'PENDING' && Boolean(b.partnerId)),
    ).length;
    const needStart = mine.filter((b) => b.status === 'CONFIRMED').length;
    const inProgress = mine.filter((b) => b.status === 'IN_PROGRESS').length;
    const completed = mine.filter((b) => b.status === 'COMPLETED');
    const earned = completed
      .filter((b) => b.paymentStatus === 'RELEASED')
      .reduce((sum, b) => sum + (b.partnerPayout ?? 0), 0);
    const held = mine
      .filter((b) => b.paymentStatus === 'HELD' && b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + Math.round((b.totalPrice * 85) / 100), 0);

    return {
      active,
      needStart,
      inProgress,
      completed: completed.length,
      earned,
      held,
      openCount,
    };
  }, [mine, openCount]);

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="border border-[var(--color-line)] bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Đơn mở (hàng chờ)
        </p>
        <p className="mt-1 text-2xl font-extrabold text-emerald-700">{stats.openCount}</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">Realtime — nhận ngay</p>
      </div>
      <div className="border border-[var(--color-line)] bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Việc đang làm
        </p>
        <p className="mt-1 text-2xl font-extrabold text-sky-700">{stats.active}</p>
        {(stats.needStart > 0 || stats.inProgress > 0) && (
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {stats.needStart > 0 ? `${stats.needStart} chờ bắt đầu` : null}
            {stats.needStart > 0 && stats.inProgress > 0 ? ' · ' : null}
            {stats.inProgress > 0 ? `${stats.inProgress} đang làm` : null}
          </p>
        )}
      </div>
      <div className="border border-[var(--color-line)] bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Escrow đang giữ
        </p>
        <p className="mt-1 text-2xl font-extrabold text-amber-700">
          {formatPrice(stats.held)}
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">Ước nhận sau hoa hồng 15%</p>
      </div>
      <div className="border border-[var(--color-line)] bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Đã nhận (giải ngân)
        </p>
        <p className="mt-1 text-2xl font-extrabold text-[var(--color-sale)]">
          {formatPrice(stats.earned)}
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">{stats.completed} đơn xong</p>
      </div>
    </section>
  );
}
