import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  api,
  formatBookingStatus,
  formatPaymentStatus,
  formatPrice,
} from '../../services/api';
import {
  Badge,
  EmptyState,
  FilterBar,
  PageHeader,
  Pagination,
  SearchInput,
  SelectFilter,
} from './admin-ui';
import {
  BOOKING_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  bookingStatusTone,
  formatDateTime,
  paymentStatusTone,
  useAdminViewportPageSize,
  useFilterParams,
  useSearchFilter,
} from './admin-utils';

export function AdminBookingsPage() {
  const { get, page, setParam, setPage } = useFilterParams();
  const [search, setSearch] = useSearchFilter(get, setParam);
  const pageSize = useAdminViewportPageSize({ rowPx: 56, chromePx: 340 });

  const q = get('q');
  const status = get('status');
  const paymentStatus = get('paymentStatus');
  const from = get('from');
  const to = get('to');

  const bookingsQuery = useQuery({
    queryKey: [
      'admin',
      'bookings',
      { q, status, paymentStatus, from, to, page, pageSize },
    ],
    queryFn: () =>
      api.adminBookings({
        q,
        page,
        pageSize,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        from: from ? new Date(from).toISOString() : undefined,
        // Chốt cuối ngày để lọc «đến ngày» bao gồm cả hôm đó.
        to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const data = bookingsQuery.data;

  return (
    <div>
      <PageHeader
        title="Đơn hàng"
        description="Lọc theo trạng thái, cọc giữ chỗ và khoảng ngày — mở chi tiết để xử lý."
      />
      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Khách, partner, dịch vụ…"
        />
        <SelectFilter
          label="Mọi trạng thái đơn"
          value={status}
          onChange={(value) => setParam('status', value)}
          options={BOOKING_STATUS_OPTIONS}
        />
        <SelectFilter
          label="Mọi trạng thái tiền"
          value={paymentStatus}
          onChange={(value) => setParam('paymentStatus', value)}
          options={PAYMENT_STATUS_OPTIONS}
        />
        <label className="flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
          Từ
          <input
            type="date"
            value={from}
            onChange={(event) => setParam('from', event.target.value)}
            className="field-input h-10 w-auto py-1.5 text-sm"
          />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
          Đến
          <input
            type="date"
            value={to}
            onChange={(event) => setParam('to', event.target.value)}
            className="field-input h-10 w-auto py-1.5 text-sm"
          />
        </label>
      </FilterBar>

      {bookingsQuery.isLoading ? <p className="mt-6">Đang tải…</p> : null}

      {data && data.items.length === 0 ? (
        <EmptyState>Không có đơn khớp bộ lọc.</EmptyState>
      ) : null}

      {data && data.items.length > 0 ? (
        <>
          <div className="mt-5 space-y-3">
            {data.items.map((booking) => (
              <Link
                key={booking.id}
                to={`/admin/bookings/${booking.id}`}
                className="block admin-card p-4 transition hover:border-[var(--color-brand)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-bold">
                      {booking.service.name}
                      <Badge tone={bookingStatusTone(booking.status)}>
                        {formatBookingStatus(booking.status)}
                      </Badge>
                      <Badge tone={paymentStatusTone(booking.paymentStatus)}>
                        {formatPaymentStatus(booking.paymentStatus)}
                      </Badge>
                    </p>
                    <p className="mt-1 text-sm">
                      Khách: {booking.user.fullName} · Partner:{' '}
                      {booking.partner?.fullName ?? '—'}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {booking._count.messages} tin · {booking._count.reviews}{' '}
                      review · tạo {formatDateTime(booking.createdAt)}
                    </p>
                  </div>
                  <p className="text-right font-extrabold">
                    {formatPrice(booking.totalPrice)}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            page={data.page}
            pageCount={data.pageCount}
            total={data.total}
            onChange={setPage}
          />
        </>
      ) : null}
    </div>
  );
}
