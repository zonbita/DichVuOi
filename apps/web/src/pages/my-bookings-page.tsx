import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { CustomerBookingCard } from '../components/customer/customer-booking-card';
import { useAuth } from '../features/auth/auth-context';
import { useCustomerRealtime } from '../hooks/use-customer-realtime';
import { api, formatPrice } from '../services/api';
import type { Booking } from '../types/catalog';

type TabId = 'all' | 'action' | 'active' | 'done' | 'cancelled';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'action', label: 'Cần xử lý' },
  { id: 'active', label: 'Đang diễn ra' },
  { id: 'done', label: 'Hoàn thành' },
  { id: 'cancelled', label: 'Đã hủy' },
];

function isActive(b: Booking) {
  return (
    b.status === 'PENDING' ||
    b.status === 'CONFIRMED' ||
    b.status === 'IN_PROGRESS' ||
    b.status === 'AWAITING_CONFIRM' ||
    b.status === 'DISPUTED'
  );
}

function matchesTab(b: Booking, tab: TabId, userId: string) {
  switch (tab) {
    case 'all':
      return true;
    case 'action':
      if (b.status === 'CANCELLED') return false;
      if (b.paymentStatus === 'UNPAID') return true;
      if (b.status === 'COMPLETED') {
        return !(b.reviews ?? []).some((r) => r.fromUserId === userId);
      }
      if (b.status === 'PENDING' && b.paymentStatus === 'HELD' && !b.partnerId) {
        return true; // chờ nhận — khách theo dõi
      }
      if (b.status === 'AWAITING_CONFIRM' || b.status === 'DISPUTED') {
        return true;
      }
      return false;
    case 'active':
      return isActive(b);
    case 'done':
      return b.status === 'COMPLETED';
    case 'cancelled':
      return b.status === 'CANCELLED';
    default:
      return true;
  }
}

export function MyBookingsPage() {
  const { user, loading, refreshMe } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>('action');

  useCustomerRealtime(Boolean(user), user?.id);

  const bookingsQuery = useQuery({
    queryKey: ['bookings', 'mine'],
    queryFn: api.getMyBookings,
    enabled: Boolean(user),
  });

  const bookings = bookingsQuery.data ?? [];

  const stats = useMemo(() => {
    const total = bookings.length;
    const waitingPay = bookings.filter(
      (b) => b.paymentStatus === 'UNPAID' && b.status !== 'CANCELLED',
    ).length;
    const active = bookings.filter(isActive).length;
    const completed = bookings.filter((b) => b.status === 'COMPLETED');
    const spent = completed
      .filter((b) => b.paymentStatus === 'RELEASED' || b.paymentStatus === 'HELD')
      .reduce((sum, b) => sum + b.totalPrice, 0);
    const awaitingPartner = bookings.filter(
      (b) =>
        b.status === 'PENDING' &&
        b.paymentStatus === 'HELD' &&
        !b.partnerId,
    ).length;
    return { total, waitingPay, active, spent, awaitingPartner, completed: completed.length };
  }, [bookings]);

  const filtered = useMemo(() => {
    if (!user) return [];
    return bookings.filter((b) => matchesTab(b, tab, user.id));
  }, [bookings, tab, user]);

  const tabCounts = useMemo(() => {
    if (!user) {
      return { all: 0, action: 0, active: 0, done: 0, cancelled: 0 };
    }
    return {
      all: bookings.length,
      action: bookings.filter((b) => matchesTab(b, 'action', user.id)).length,
      active: bookings.filter((b) => matchesTab(b, 'active', user.id)).length,
      done: bookings.filter((b) => matchesTab(b, 'done', user.id)).length,
      cancelled: bookings.filter((b) => matchesTab(b, 'cancelled', user.id)).length,
    };
  }, [bookings, user]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['bookings', 'mine'] });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.updateBookingStatus(id, 'CANCELLED'),
    onSuccess: async () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
      await refreshMe();
    },
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => api.payBooking(id),
    onSuccess: async () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
      await refreshMe();
    },
  });

  if (loading) return <p>Đang tải...</p>;
  if (!user) return <Navigate to="/dang-nhap?redirect=/don-cua-toi" replace />;

  return (
    <div className="space-y-6 pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold sm:text-3xl">Đơn thuê của tôi</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-[15px] text-[var(--color-muted)]">
            Xin chào {user.fullName} — ví{' '}
            <Link to="/don-cua-toi/vi" className="font-bold text-[var(--color-brand-deep)]">
              {formatPrice(user.walletBalance ?? 0)}
            </Link>
            . <strong className="text-[var(--color-ink)]">Đặt cọc từ ví VNĐ</strong> trước khi
            đơn vào hàng chờ / chat.
          </p>
        </div>
        <Link to="/nhom" className="btn-primary px-4 py-2.5 text-sm">
          Thuê dịch vụ mới
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-[var(--color-line)] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Tổng đơn
          </p>
          <p className="mt-1 text-2xl font-extrabold">{stats.total}</p>
        </div>
        <div className="border border-[var(--color-line)] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Cần đặt cọc
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700">{stats.waitingPay}</p>
        </div>
        <div className="border border-[var(--color-line)] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Đang diễn ra
          </p>
          <p className="mt-1 text-2xl font-extrabold text-sky-700">{stats.active}</p>
          {stats.awaitingPartner > 0 ? (
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {stats.awaitingPartner} chờ người làm nhận
            </p>
          ) : null}
        </div>
        <div className="border border-[var(--color-line)] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Đã chi (hoàn thành)
          </p>
          <p className="mt-1 text-2xl font-extrabold text-[var(--color-sale)]">
            {formatPrice(stats.spent)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">{stats.completed} đơn xong</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 border-b border-[var(--color-line)] pb-3">
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

      {bookingsQuery.isLoading ? <p>Đang tải đơn...</p> : null}
      {bookingsQuery.isError ? (
        <p className="text-red-600">Không tải được danh sách đơn.</p>
      ) : null}

      <div className="space-y-3">
        {filtered.map((booking) => (
          <CustomerBookingCard
            key={booking.id}
            booking={booking}
            currentUserId={user.id}
            paying={payMutation.isPending && payMutation.variables === booking.id}
            cancelling={
              cancelMutation.isPending && cancelMutation.variables === booking.id
            }
            payError={
              payMutation.isError && payMutation.variables === booking.id
                ? (payMutation.error as Error).message
                : null
            }
            onPay={(id) => payMutation.mutate(id)}
            onCancel={(id) => cancelMutation.mutate(id)}
          />
        ))}
      </div>

      {!bookingsQuery.isLoading && filtered.length === 0 ? (
        <p className="border border-dashed border-[var(--color-line)] bg-white px-4 py-10 text-center text-[var(--color-muted)]">
          {bookings.length === 0 ? (
            <>
              Chưa có đơn nào.{' '}
              <Link to="/nhom" className="font-semibold text-[var(--color-brand-deep)]">
                Thuê dịch vụ ngay
              </Link>
            </>
          ) : (
            'Không có đơn trong mục này.'
          )}
        </p>
      ) : null}
    </div>
  );
}
