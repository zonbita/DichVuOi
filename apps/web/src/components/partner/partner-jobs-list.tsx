import { useEffect, useMemo, useState } from 'react';
import type { Booking } from '../../types/catalog';
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
      // Cần bắt đầu làm việc
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

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">Việc của tôi</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Đơn đã ứng tuyển và việc đã được chọn. Chat / địa chỉ khi khách đã
            cọc. Hoa hồng 15% khi giải ngân.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-[var(--color-line)] pb-3">
        {TABS.map((item) => {
          const count = tabCounts[item.id];
          const activeTab = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-3 py-2 text-sm font-bold transition ${
                activeTab
                  ? 'bg-[var(--color-ink)] text-white'
                  : 'bg-[var(--color-canvas)] text-[var(--color-ink)] hover:bg-[var(--color-brand-soft)]'
              }`}
            >
              {item.label}
              <span
                className={`ml-1.5 text-xs ${activeTab ? 'text-white/80' : 'text-[var(--color-muted)]'}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-[var(--color-muted)]">Đang tải…</p>
      ) : null}

      <div className="mt-4 space-y-3">
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

      {!loading && filtered.length === 0 ? (
        <p className="mt-4 border border-dashed border-[var(--color-line)] bg-white px-4 py-8 text-center text-[var(--color-muted)]">
          {poolSize === 0
            ? 'Chưa nhận việc nào. Ứng tuyển tại Đơn thuê realtime.'
            : bookings.length === 0
              ? 'Không có đơn thuộc nghề đang chọn.'
              : 'Không có đơn trong mục này.'}
        </p>
      ) : null}

      <div className="mt-4">
        <ListPagination
          page={safePage}
          pageCount={pageCount}
          total={filtered.length}
          unitLabel="việc"
          onChange={setPage}
          ariaLabel="Phân trang việc của tôi"
        />
      </div>
    </section>
  );
}
