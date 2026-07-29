import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { CustomerBookingCard } from '../components/customer/customer-booking-card';
import { useAuth } from '../features/auth/auth-context';
import { useCustomerRealtime } from '../hooks/use-customer-realtime';
import { api, formatPrice } from '../services/api';
import type { Booking } from '../types/catalog';

type TabId =
  | 'all'
  | 'waiting'
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'complaint'
  | 'done';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'waiting', label: 'Đơn chờ' },
  { id: 'active', label: 'Đang thực hiện' },
  { id: 'expired', label: 'Hết hạn' },
  { id: 'cancelled', label: 'Đơn bị huỷ' },
  { id: 'complaint', label: 'Khiếu nại' },
  { id: 'done', label: 'Hoàn thành' },
];

function isInProgress(b: Booking) {
  return (
    b.status === 'CONFIRMED' ||
    b.status === 'IN_PROGRESS' ||
    b.status === 'AWAITING_CONFIRM'
  );
}

function isActive(b: Booking) {
  return b.status === 'PENDING' || isInProgress(b) || b.status === 'DISPUTED';
}

function matchesTab(b: Booking, tab: TabId) {
  switch (tab) {
    case 'all':
      return true;
    case 'waiting':
      return b.status === 'PENDING';
    case 'active':
      return isInProgress(b);
    case 'expired':
      return b.status === 'CANCELLED' && !!b.matchingDeadlineAt;
    case 'cancelled':
      return b.status === 'CANCELLED' && !b.matchingDeadlineAt;
    case 'complaint':
      return b.status === 'DISPUTED';
    case 'done':
      return b.status === 'COMPLETED';
    default:
      return false;
  }
}

export function MyBookingsPage() {
  const { user, loading, refreshMe } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>('all');

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

  const filtered = useMemo(
    () => bookings.filter((b) => matchesTab(b, tab)),
    [bookings, tab],
  );

  const tabCounts = useMemo(
    () => ({
      all: bookings.length,
      waiting: bookings.filter((b) => matchesTab(b, 'waiting')).length,
      active: bookings.filter((b) => matchesTab(b, 'active')).length,
      expired: bookings.filter((b) => matchesTab(b, 'expired')).length,
      cancelled: bookings.filter((b) => matchesTab(b, 'cancelled')).length,
      complaint: bookings.filter((b) => matchesTab(b, 'complaint')).length,
      done: bookings.filter((b) => matchesTab(b, 'done')).length,
    }),
    [bookings],
  );

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

  const proposeSettlementMutation = useMutation({
    mutationFn: ({ id, percent }: { id: string; percent: number }) =>
      api.proposeBookingSettlement(id, percent),
    onSuccess: async () => {
      invalidate();
    },
  });

  const approveSettlementMutation = useMutation({
    mutationFn: (id: string) => api.approveBookingSettlement(id),
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
        </div>
        <Link to="/don-cua-toi/thue" className="btn-primary px-4 py-2.5 text-sm">
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
            Đang thực hiện
          </p>
          <p className="mt-1 text-2xl font-extrabold text-sky-700">{stats.active}</p>
          {stats.awaitingPartner > 0 ? (
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {stats.awaitingPartner} đơn chờ người làm
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

      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
        {TABS.map((item) => {
          const count = tabCounts[item.id];
          const activeTab = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-3 py-1.5 text-sm font-bold transition ${
                activeTab
                  ? 'rounded-full bg-[var(--color-ink)] text-white'
                  : 'text-[var(--color-ink)] hover:text-[var(--color-brand-deep)]'
              }`}
            >
              {item.label}
              <span
                className={`ml-1.5 text-xs font-semibold ${
                  activeTab ? 'text-white/80' : 'text-[var(--color-muted)]'
                }`}
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
            cancelError={
              cancelMutation.isError && cancelMutation.variables === booking.id
                ? (cancelMutation.error as Error).message
                : null
            }
            onPay={(id) => payMutation.mutate(id)}
            onCancel={(id) => cancelMutation.mutate(id)}
            settlementPending={
              proposeSettlementMutation.isPending ||
              approveSettlementMutation.isPending
            }
            settlementError={
              proposeSettlementMutation.isError &&
              proposeSettlementMutation.variables?.id === booking.id
                ? (proposeSettlementMutation.error as Error).message
                : approveSettlementMutation.isError &&
                    approveSettlementMutation.variables === booking.id
                  ? (approveSettlementMutation.error as Error).message
                  : null
            }
            onProposeSettlement={(id, percent) =>
              proposeSettlementMutation.mutate({ id, percent })
            }
            onApproveSettlement={(id) => approveSettlementMutation.mutate(id)}
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
