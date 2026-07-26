import { useMemo, useState } from 'react';
import type { Booking } from '../../types/catalog';
import { PartnerBookingCard } from './partner-booking-card';

type TabId = 'all' | 'action' | 'active' | 'done' | 'cancelled';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'action', label: 'Cần xử lý' },
  { id: 'active', label: 'Đang diễn ra' },
  { id: 'done', label: 'Hoàn thành' },
  { id: 'cancelled', label: 'Đã hủy' },
];

function matchesTab(b: Booking, tab: TabId, userId: string) {
  switch (tab) {
    case 'all':
      return true;
    case 'action':
      if (b.status === 'CONFIRMED') return true;
      if (b.status === 'IN_PROGRESS') return true;
      if (b.status === 'COMPLETED') {
        return !(b.reviews ?? []).some((r) => r.fromUserId === userId);
      }
      return false;
    case 'active':
      return (
        b.status === 'CONFIRMED' ||
        b.status === 'IN_PROGRESS' ||
        (b.status === 'PENDING' && Boolean(b.partnerId))
      );
    case 'done':
      return b.status === 'COMPLETED';
    case 'cancelled':
      return b.status === 'CANCELLED';
    default:
      return true;
  }
}

type Props = {
  bookings: Booking[];
  loading?: boolean;
  currentUserId: string;
  statusPending?: boolean;
  statusVariables?: { id: string; status: string } | null;
  statusError?: Error | null;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
};

export function PartnerJobsList({
  bookings,
  loading,
  currentUserId,
  statusPending,
  statusVariables,
  statusError,
  onStart,
  onComplete,
}: Props) {
  const [tab, setTab] = useState<TabId>('action');

  const tabCounts = useMemo(() => {
    return {
      all: bookings.length,
      action: bookings.filter((b) => matchesTab(b, 'action', currentUserId)).length,
      active: bookings.filter((b) => matchesTab(b, 'active', currentUserId)).length,
      done: bookings.filter((b) => matchesTab(b, 'done', currentUserId)).length,
      cancelled: bookings.filter((b) => matchesTab(b, 'cancelled', currentUserId)).length,
    };
  }, [bookings, currentUserId]);

  const filtered = useMemo(
    () => bookings.filter((b) => matchesTab(b, tab, currentUserId)),
    [bookings, tab, currentUserId],
  );

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">Việc của tôi</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Chat / địa chỉ khi khách đã cọc. Bắt đầu làm khi escrow HELD. Hoa hồng 15% khi giải ngân.
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

      {loading ? <p className="mt-4 text-sm text-[var(--color-muted)]">Đang tải…</p> : null}

      <div className="mt-4 space-y-3">
        {filtered.map((booking) => (
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
            onStart={onStart}
            onComplete={onComplete}
          />
        ))}
      </div>

      {!loading && filtered.length === 0 ? (
        <p className="mt-4 border border-dashed border-[var(--color-line)] bg-white px-4 py-8 text-center text-[var(--color-muted)]">
          {bookings.length === 0
            ? 'Chưa nhận việc nào. Nhận đơn từ hàng chờ realtime bên trên.'
            : 'Không có đơn trong mục này.'}
        </p>
      ) : null}
    </section>
  );
}
