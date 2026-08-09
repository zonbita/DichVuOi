import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { CustomerBookingCard } from '../components/customer/customer-booking-card';
import { dashboardSurfaceClass } from '../components/dashboard/dashboard-chrome';
import { Icon } from '../components/ui/icon';
import type { IconName } from '../components/ui/icon';
import { useAuth } from '../features/auth/auth-context';
import { useCustomerRealtime } from '../hooks/use-customer-realtime';
import {
  requestScheduleNotificationPermission,
  useScheduleReminders,
} from '../hooks/use-schedule-reminders';
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
  return (
    b.status === 'SCHEDULED' ||
    b.status === 'PENDING' ||
    isInProgress(b) ||
    b.status === 'DISPUTED'
  );
}

function matchesTab(b: Booking, tab: TabId) {
  switch (tab) {
    case 'all':
      return true;
    case 'waiting':
      return b.status === 'PENDING' || b.status === 'SCHEDULED';
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
  const [notifState, setNotifState] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );

  useCustomerRealtime(Boolean(user), user?.id);

  const bookingsQuery = useQuery({
    queryKey: ['bookings', 'mine'],
    queryFn: api.getMyBookings,
    enabled: Boolean(user),
  });

  const bookings = bookingsQuery.data ?? [];
  useScheduleReminders(Boolean(user) && notifState === 'granted', bookings);

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
    <div className="space-y-5 pb-6">
      {notifState === 'default' ? (
        <div
          className={`${dashboardSurfaceClass} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}
        >
          <p className="text-sm text-[var(--color-ink)]">
            Bật nhắc lịch để nhận thông báo đơn sắp diễn ra (trong 24 giờ).
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--color-brand-deep)]"
            onClick={() => {
              void requestScheduleNotificationPermission().then(setNotifState);
            }}
          >
            <Icon name="clock" className="h-4 w-4" />
            Bật nhắc lịch
          </button>
        </div>
      ) : null}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            {
              key: 'total',
              label: 'Tổng đơn',
              value: String(stats.total),
              icon: 'receipt' as IconName,
              iconClass: 'bg-sky-100 text-sky-600',
              valueClass: 'text-[var(--color-ink)]',
              labelClass: 'text-[var(--color-muted)]',
              hint: null as string | null,
            },
            {
              key: 'pay',
              label: 'Cần đặt cọc',
              value: String(stats.waitingPay),
              icon: 'card' as IconName,
              iconClass: 'bg-amber-100 text-amber-600',
              valueClass: 'text-amber-700',
              labelClass: 'text-amber-700/80',
              hint: null,
            },
            {
              key: 'active',
              label: 'Đang thực hiện',
              value: String(stats.active),
              icon: 'clock' as IconName,
              iconClass: 'bg-sky-100 text-sky-600',
              valueClass: 'text-sky-700',
              labelClass: 'text-sky-700/80',
              hint:
                stats.awaitingPartner > 0
                  ? `${stats.awaitingPartner} đơn chờ người làm`
                  : null,
            },
            {
              key: 'spent',
              label: 'Đã chi (hoàn thành)',
              value: formatPrice(stats.spent),
              icon: 'bank' as IconName,
              iconClass: 'bg-[var(--color-brand-soft)] text-[var(--color-brand)]',
              valueClass: 'text-[var(--color-brand-deep)]',
              labelClass: 'text-[var(--color-brand-deep)]/80',
              hint: `${stats.completed} đơn xong`,
            },
          ] as const
        ).map((stat) => (
          <div
            key={stat.key}
            className={`${dashboardSurfaceClass} flex min-w-0 items-start gap-3 p-4`}
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}
            >
              <Icon name={stat.icon} className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p
                className={`text-[11px] font-semibold uppercase tracking-wide ${stat.labelClass}`}
              >
                {stat.label}
              </p>
              <p
                className={`mt-0.5 truncate text-2xl font-extrabold leading-tight ${stat.valueClass}`}
              >
                {stat.value}
              </p>
              {stat.hint ? (
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">{stat.hint}</p>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      <div
        className={`${dashboardSurfaceClass} flex flex-col gap-2 p-1.5 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex min-w-max items-stretch sm:min-w-0 sm:flex-wrap">
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
                      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
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

        <div className="flex shrink-0 items-center gap-2 border-t border-[var(--color-line)] pt-1.5 sm:border-l sm:border-t-0 sm:pl-2 sm:pt-0">
          <Link
            to="/don-cua-toi/thue"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-2.5 text-sm font-bold !text-white transition hover:bg-[var(--color-navy-deep)] sm:w-auto"
          >
            Thuê dịch vụ mới
          </Link>
        </div>
      </div>

      {bookingsQuery.isLoading ? (
        <p className="text-[var(--color-muted)]">Đang tải đơn...</p>
      ) : null}
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
        <p className={`${dashboardSurfaceClass} border-dashed px-4 py-10 text-center text-[var(--color-muted)]`}>
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
