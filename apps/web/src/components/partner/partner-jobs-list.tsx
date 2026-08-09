import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Booking } from '../../types/catalog';
import {
  DashboardPageHeader,
  dashboardSurfaceClass,
} from '../dashboard/dashboard-chrome';
import { Icon } from '../ui/icon';
import { ListPagination } from '../ui/list-pagination';
import { PartnerBookingCard } from './partner-booking-card';

const PAGE_SIZE = 3;

type TabId =
  | 'all'
  | 'applied'
  | 'action'
  | 'active'
  | 'awaiting'
  | 'dispute'
  | 'done'
  | 'cancelled';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'applied', label: 'Chờ chọn' },
  { id: 'action', label: 'Công việc cần làm' },
  { id: 'active', label: 'Đang diễn ra' },
  { id: 'awaiting', label: 'Chờ xác nhận' },
  { id: 'dispute', label: 'Khiếu nại' },
  { id: 'done', label: 'Hoàn thành' },
  { id: 'cancelled', label: 'Đã hủy' },
];

function hasMyApplication(b: Booking, userId: string) {
  return (
    b.applications?.some(
      (a) =>
        a.partnerId === userId &&
        (a.status === 'APPLIED' || a.status === 'SELECTED'),
    ) ?? false
  );
}

/** Đã ứng tuyển, chưa được khách chọn. */
function isAppliedWaiting(b: Booking, userId: string) {
  return b.status === 'PENDING' && !b.partnerId && hasMyApplication(b, userId);
}

/**
 * Tab theo đúng BookingStatus — không chồng chéo (trừ «Tất cả»).
 * COMPLETED chỉ thuộc «Hoàn thành» (kể cả chưa đánh giá).
 */
function matchesTab(b: Booking, tab: TabId, userId: string) {
  switch (tab) {
    case 'all':
      return true;
    case 'applied':
      return isAppliedWaiting(b, userId);
    case 'action':
      return (
        b.status === 'CONFIRMED' ||
        (b.status === 'PENDING' && Boolean(b.partnerId))
      );
    case 'active':
      return b.status === 'IN_PROGRESS';
    case 'awaiting':
      return b.status === 'AWAITING_CONFIRM';
    case 'dispute':
      return b.status === 'DISPUTED';
    case 'done':
      return b.status === 'COMPLETED';
    case 'cancelled':
      return b.status === 'CANCELLED';
    default:
      return false;
  }
}

function bookingRecency(b: Booking) {
  return new Date(b.updatedAt ?? b.createdAt ?? b.scheduledAt).getTime();
}

function sortJobsNewestFirst(bookings: Booking[]) {
  return bookings
    .slice()
    .sort((a, b) => bookingRecency(b) - bookingRecency(a));
}

function emptyCopy(tab: TabId, poolSize: number, filteredPool: number) {
  if (poolSize === 0) {
    return {
      title: 'Chưa nhận việc nào',
      body: 'Ứng tuyển tại Đơn thuê để bắt đầu nhận việc.',
      showCta: true,
    };
  }
  if (filteredPool === 0) {
    return {
      title: 'Không có đơn thuộc nghề đang chọn',
      body: 'Đổi bộ lọc nghề hoặc tìm việc mới tại Đơn thuê.',
      showCta: true,
    };
  }
  const byTab: Record<TabId, { title: string; body: string }> = {
    all: {
      title: 'Chưa có việc',
      body: 'Ứng tuyển tại Đơn thuê để bắt đầu nhận việc.',
    },
    applied: {
      title: 'Chưa có đơn chờ chọn',
      body: 'Ứng tuyển việc mới — khách sẽ chọn người làm từ danh sách.',
    },
    action: {
      title: 'Chưa có công việc cần làm',
      body: 'Ứng tuyển tại Đơn thuê để bắt đầu nhận việc.',
    },
    active: {
      title: 'Chưa có việc đang diễn ra',
      body: 'Khi bắt đầu làm, đơn sẽ hiện ở mục này.',
    },
    awaiting: {
      title: 'Chưa có đơn chờ xác nhận',
      body: 'Sau khi bạn báo hoàn thành, đơn chờ khách xác nhận.',
    },
    dispute: {
      title: 'Không có khiếu nại',
      body: 'Đơn đang tranh chấp sẽ hiện tại đây.',
    },
    done: {
      title: 'Chưa có việc hoàn thành',
      body: 'Các đơn đã xong sẽ được liệt kê trong mục này.',
    },
    cancelled: {
      title: 'Không có đơn đã hủy',
      body: 'Đơn bị hủy sẽ hiện tại đây.',
    },
  };
  return { ...byTab[tab], showCta: tab === 'action' || tab === 'all' || tab === 'applied' };
}

/** Empty state: cặp mở + badge check, tone xanh nhạt. */
function EmptyBriefcaseArt() {
  return (
    <svg
      viewBox="0 0 160 120"
      className="mx-auto h-[120px] w-[160px]"
      fill="none"
      aria-hidden
    >
      <ellipse cx="80" cy="102" rx="48" ry="8" fill="#E8F4FB" />
      <path
        d="M28 58c8-18 28-28 52-28s44 10 52 28"
        stroke="#B8D4EA"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M36 64c6-12 20-18 44-18s38 6 44 18"
        stroke="#C9DFF0"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path d="M48 58h64l6 28H42z" fill="#D7EAF7" stroke="#7EB6D4" strokeWidth="1.8" />
      <path
        d="M58 58V48.5A6.5 6.5 0 0 1 64.5 42h31A6.5 6.5 0 0 1 102 48.5V58"
        stroke="#7EB6D4"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M42 86h76l-4 12H46z"
        fill="#EAF5FB"
        stroke="#7EB6D4"
        strokeWidth="1.8"
      />
      <path d="M68 70h24" stroke="#9BC6DE" strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="42" r="2" fill="#B8D4EA" />
      <circle cx="128" cy="48" r="1.5" fill="#B8D4EA" />
      <path
        d="M118 36l1.2 2.6 2.8.4-2 2.1.5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2.1 2.8-.4z"
        fill="#B8D4EA"
      />
      <path
        d="M40 34l.9 1.9 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.5 2.1-.3z"
        fill="#C9DFF0"
      />
      <circle cx="112" cy="88" r="14" fill="#fff" stroke="#7EB6D4" strokeWidth="1.6" />
      <circle cx="112" cy="88" r="10.5" fill="#E8F7F5" />
      <path
        d="M106.5 88.2 110.2 91.8 118 83.5"
        stroke="var(--color-brand)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = {
  bookings: Booking[];
  /** Tổng đơn trước khi lọc nghề (để empty copy đúng). */
  sourceTotal?: number;
  loading?: boolean;
  currentUserId: string;
  statusPending?: boolean;
  statusVariables?: { id: string; status: string } | null;
  statusError?: Error | null;
  settlementPending?: boolean;
  settlementBookingId?: string | null;
  settlementError?: Error | null;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onApproveSettlement?: (id: string) => void;
};

export function PartnerJobsList({
  bookings,
  sourceTotal,
  loading,
  currentUserId,
  statusPending,
  statusVariables,
  statusError,
  settlementPending,
  settlementBookingId,
  settlementError,
  onStart,
  onComplete,
  onApproveSettlement,
}: Props) {
  const [tab, setTab] = useState<TabId>('action');
  const [page, setPage] = useState(1);
  const poolSize = sourceTotal ?? bookings.length;

  const tabCounts = useMemo(() => {
    return {
      all: bookings.length,
      applied: bookings.filter((b) => matchesTab(b, 'applied', currentUserId))
        .length,
      action: bookings.filter((b) => matchesTab(b, 'action', currentUserId))
        .length,
      active: bookings.filter((b) => matchesTab(b, 'active', currentUserId))
        .length,
      awaiting: bookings.filter((b) =>
        matchesTab(b, 'awaiting', currentUserId),
      ).length,
      dispute: bookings.filter((b) => matchesTab(b, 'dispute', currentUserId))
        .length,
      done: bookings.filter((b) => matchesTab(b, 'done', currentUserId)).length,
      cancelled: bookings.filter((b) =>
        matchesTab(b, 'cancelled', currentUserId),
      ).length,
    };
  }, [bookings, currentUserId]);

  const filtered = useMemo(
    () =>
      sortJobsNewestFirst(
        bookings.filter((b) => matchesTab(b, tab, currentUserId)),
      ),
    [bookings, tab, currentUserId],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const empty = emptyCopy(tab, poolSize, bookings.length);

  return (
    <section className="space-y-4">
      <DashboardPageHeader
        icon="briefcase"
        title="Việc của tôi"
        description="Đơn đã ứng tuyển và việc đã được chọn. Chat / địa chỉ khi khách đã cọc. Hoa hồng 15% khi giải ngân."
      />

      <div className={`overflow-x-auto ${dashboardSurfaceClass}`}>
        <div className="flex min-w-max items-stretch px-1.5 py-1.5 sm:min-w-0 sm:flex-wrap">
          {TABS.map((item, index) => {
            const count = tabCounts[item.id];
            const activeTab = tab === item.id;
            return (
              <div key={item.id} className="flex items-stretch">
                {index > 0 ? (
                  <span
                    aria-hidden
                    className="my-2 w-px shrink-0 bg-[var(--color-line)]"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`mx-0.5 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    activeTab
                      ? 'bg-[var(--color-navy)] text-white shadow-[0_6px_16px_rgba(7,59,92,0.28)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-canvas)]'
                  }`}
                >
                  <span className="whitespace-nowrap">{item.label}</span>
                  <span
                    className={`inline-flex min-w-[1.35rem] items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                      activeTab
                        ? 'bg-[var(--color-brand)] text-white'
                        : 'bg-[var(--color-canvas)] text-[var(--color-muted)]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-muted)]">Đang tải…</p>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] bg-white px-6 py-12 text-center shadow-[0_4px_16px_rgba(24,49,63,0.04)] sm:py-14">
          <EmptyBriefcaseArt />
          <h3 className="mt-5 text-lg font-extrabold text-[var(--color-navy)]">
            {empty.title}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted)]">
            {empty.body}
          </p>
          {empty.showCta ? (
            <div className="mt-6 flex flex-col items-center gap-3">
              <Link
                to="/doi-tac/don-thue"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-navy)] px-5 py-2.5 text-sm font-bold !text-white transition hover:bg-[var(--color-navy-deep)]"
              >
                Tìm việc phù hợp
                <Icon name="chevronRight" className="h-4 w-4 !text-white" />
              </Link>
              <button
                type="button"
                onClick={() => setTab('applied')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand)] transition hover:text-[var(--color-brand-deep)]"
              >
                Xem đơn đã ứng tuyển
                <Icon name="chevronRight" className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        {paged.map((booking) => (
          <PartnerBookingCard
            key={booking.id}
            booking={booking}
            currentUserId={currentUserId}
            statusPending={
              statusPending && statusVariables?.id === booking.id
            }
            statusError={
              statusError && statusVariables?.id === booking.id
                ? statusError.message
                : null
            }
            settlementPending={
              settlementPending && settlementBookingId === booking.id
            }
            settlementError={
              settlementError && settlementBookingId === booking.id
                ? settlementError.message
                : null
            }
            onStart={onStart}
            onComplete={onComplete}
            onApproveSettlement={onApproveSettlement}
          />
        ))}
      </div>

      {filtered.length > 0 ? (
        <ListPagination
          page={safePage}
          pageCount={pageCount}
          total={filtered.length}
          unitLabel="việc"
          onChange={setPage}
          ariaLabel="Phân trang việc của tôi"
        />
      ) : null}
    </section>
  );
}
