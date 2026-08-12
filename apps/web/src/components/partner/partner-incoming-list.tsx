import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Booking } from '../../types/catalog';
import {
  OPEN_JOB_PORTRAIT_GRID,
  OpenJobCard,
  openJobRoomTone,
} from '../common/open-job-card';
import {
  DashboardPageHeader,
  dashboardSurfaceClass,
} from '../dashboard/dashboard-chrome';
import { ListPagination } from '../ui/list-pagination';
import { Icon } from '../ui/icon';
import {
  PartnerProfessionTabs,
  type ProfessionTab,
} from './partner-profession-tabs';

const PAGE_SIZE = 10;

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

/** Danh sách đơn mở — portrait card giống trang chủ (5/hàng). */
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
    <section
      className={`${dashboardSurfaceClass} flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5`}
    >
      <div className="shrink-0">
        <DashboardPageHeader
          icon="sparkles"
          title="Đơn thuê"
          description="Việc mở trên sàn — lọc theo nghề bạn đang nhận, rồi ứng tuyển."
          actions={
            <Link
              to="/doi-tac/ho-so"
              className="text-sm font-semibold text-[var(--color-brand)] underline-offset-2 hover:underline"
            >
              Thêm nghề
            </Link>
          }
        />
      </div>

      {showProfessionFilter ? (
        <div className="mt-3 shrink-0">
          <PartnerProfessionTabs
            tabs={professionTabs!}
            value={professionId}
            onChange={onProfessionChange!}
            orientation="horizontal"
          />
        </div>
      ) : null}

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5">
        {paged.length > 0 ? (
          <div className={OPEN_JOB_PORTRAIT_GRID}>
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
                  layout="portrait"
                  detailTo={`/viec-moi/${booking.id}`}
                  footerRight={
                    <div className="flex w-full flex-col gap-1.5">
                      <span
                        className={`inline-flex w-full items-center justify-center gap-1.5 truncate rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase ${tone.badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`}
                        />
                        <span className="truncate">{tone.label}</span>
                      </span>
                      <button
                        type="button"
                        disabled={isApplying || isApplied}
                        onClick={() => onApply(booking.id)}
                        className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-bold transition ${
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
                    </div>
                  }
                />
              );
            })}
          </div>
        ) : null}

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
          ariaLabel="Phân trang đơn thuê"
        />
      </div>
    </section>
  );
}
