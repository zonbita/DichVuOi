import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Booking } from '../../types/catalog';
import { OpenJobCard, openJobRoomTone } from '../common/open-job-card';
import { ListPagination } from '../ui/list-pagination';
import { Icon } from '../ui/icon';
import {
  PartnerProfessionTabs,
  type ProfessionTab,
} from './partner-profession-tabs';

const PAGE_SIZE = 3;

type Props = {
  bookings: Booking[];
  loading?: boolean;
  onApply: (id: string) => void;
  applyingId?: string | null;
  appliedIds?: string[];
  emptyHint?: string;
  professionTabs?: ProfessionTab[];
  professionId?: string;
  onProfessionChange?: (id: string) => void;
};

/** Danh sách đơn mở — partner ứng tuyển (cọc theo % chủ thuê set). */
export function PartnerIncomingList({
  bookings,
  loading,
  onApply,
  applyingId,
  appliedIds = [],
  emptyHint,
  professionTabs,
  professionId = 'all',
  onProfessionChange,
}: Props) {
  const [page, setPage] = useState(1);
  const showProfessionFilter =
    Boolean(professionTabs?.length) && Boolean(onProfessionChange);

  const pageCount = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  useEffect(() => {
    setPage(1);
  }, [professionId]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return bookings.slice(start, start + PAGE_SIZE);
  }, [bookings, safePage]);

  return (
    <section className="surface-card flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold">Đơn thuê realtime</h2>
          <Link
            to="/doi-tac/ho-so"
            className="mt-0.5 inline-block text-xs font-semibold text-[var(--color-brand)] underline-offset-2 hover:underline"
          >
            Thêm nghề (Bấm vào để sang hồ sơ)
          </Link>
        </div>
        {showProfessionFilter ? (
          <div className="w-full max-w-[360px] shrink-0 sm:ml-auto">
            <PartnerProfessionTabs
              tabs={professionTabs!}
              value={professionId}
              onChange={onProfessionChange!}
              orientation="vertical"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-0.5">
        {paged.map((booking) => {
          const isApplying = applyingId === booking.id;
          const isApplied =
            appliedIds.includes(booking.id) ||
            (booking.applications?.some((application) =>
              ['APPLIED', 'SELECTED'].includes(application.status),
            ) ??
              false);
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
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold tracking-wide uppercase ${tone.badge}`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
                  {tone.label}
                </span>
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

      <div className="mt-3 shrink-0">
        <ListPagination
          page={safePage}
          pageCount={pageCount}
          total={bookings.length}
          unitLabel="đơn"
          onChange={setPage}
          ariaLabel="Phân trang đơn thuê realtime"
        />
      </div>
    </section>
  );
}
