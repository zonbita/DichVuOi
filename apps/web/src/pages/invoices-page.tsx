import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  DashboardEmpty,
  DashboardPageHeader,
} from '../components/dashboard/dashboard-chrome';
import { ListPagination } from '../components/ui/list-pagination';
import { useAuth } from '../features/auth/auth-context';
import { api, formatPrice } from '../services/api';
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '../types/finance';

const PAGE_SIZE = 6;

export function InvoicesPage({
  basePath,
}: {
  basePath: '/don-cua-toi' | '/doi-tac';
}) {
  const { user, loading } = useAuth();
  const [page, setPage] = useState(1);
  const invoicesQuery = useQuery({
    queryKey: ['invoices'],
    queryFn: api.listInvoices,
    enabled: Boolean(user),
  });

  const items = invoicesQuery.data ?? [];
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, safePage]);

  if (loading) return <p>Đang tải…</p>;
  if (!user) {
    return <Navigate to={`/dang-nhap?redirect=${basePath}/hoa-don`} replace />;
  }

  return (
    <div className="flex flex-col gap-4">
      {basePath !== '/don-cua-toi' ? (
        <DashboardPageHeader
          icon="receipt"
          title="Hóa đơn VNĐ"
          description="Mỗi lần đặt cọc tạo một hóa đơn. Giải ngân / hoàn cập nhật trạng thái."
          actions={
            <Link
              to={`${basePath}/vi`}
              className="text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
            >
              ← Ví VNĐ
            </Link>
          }
        />
      ) : null}

      <div className="space-y-3">
        {invoicesQuery.isLoading ? (
          <p className="text-sm text-[var(--color-muted)]">Đang tải…</p>
        ) : null}
        {items.length === 0 && !invoicesQuery.isLoading ? (
          <DashboardEmpty
            title="Chưa có hóa đơn"
            body="Đặt cọc đơn thuê để phát hành hóa đơn trên sàn."
            ctaTo="/don-cua-toi/thue"
            ctaLabel="Thuê dịch vụ"
          />
        ) : null}

        {pagedItems.map((invoice) => (
          <Link
            key={invoice.id}
            to={`${basePath}/hoa-don/${invoice.id}`}
            className="glass-card block !rounded-2xl p-4 transition hover:border-[var(--color-brand)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-extrabold">{invoice.serviceName}</p>
                <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                  {invoice.invoiceNumber} ·{' '}
                  {new Date(invoice.issuedAt).toLocaleString('vi-VN')}
                </p>
                <p className="mt-1 text-xs font-semibold text-[var(--color-brand-deep)]">
                  {INVOICE_STATUS_LABELS[invoice.status as InvoiceStatus] ??
                    invoice.status}
                </p>
              </div>
              <p className="text-lg font-extrabold text-[var(--color-invoice)]">
                {formatPrice(invoice.subtotal)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <ListPagination
        page={safePage}
        pageCount={pageCount}
        total={items.length}
        unitLabel="hóa đơn"
        onChange={setPage}
        ariaLabel="Phân trang hóa đơn"
      />
    </div>
  );
}

export function InvoiceDetailPage({
  basePath,
}: {
  basePath: '/don-cua-toi' | '/doi-tac';
}) {
  const { id = '' } = useParams();
  const { user, loading } = useAuth();
  const invoiceQuery = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.getInvoice(id),
    enabled: Boolean(user) && Boolean(id),
  });

  if (loading || invoiceQuery.isLoading) return <p>Đang tải hóa đơn…</p>;
  if (!user) {
    return (
      <Navigate to={`/dang-nhap?redirect=${basePath}/hoa-don/${id}`} replace />
    );
  }
  if (invoiceQuery.isError || !invoiceQuery.data) {
    return (
      <div className="space-y-3">
        <Link
          to={`${basePath}/hoa-don`}
          className="text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
        >
          ← Hóa đơn
        </Link>
        <p className="text-red-600">Không tìm thấy hóa đơn.</p>
      </div>
    );
  }

  const invoice = invoiceQuery.data;
  const bookingHref =
    basePath === '/doi-tac'
      ? `/doi-tac/viec/${invoice.bookingId}`
      : `/don-cua-toi/don/${invoice.bookingId}`;

  return (
    <div className="space-y-4 pb-8">
      <DashboardPageHeader
        icon="receipt"
        title="Chi tiết hóa đơn"
        description={invoice.invoiceNumber}
        actions={
          <Link
            to={`${basePath}/hoa-don`}
            className="text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
          >
            ← Hóa đơn
          </Link>
        }
      />

      <article className="glass-card !rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold">{invoice.serviceName}</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {INVOICE_STATUS_LABELS[invoice.status as InvoiceStatus] ??
                invoice.status}
            </p>
          </div>
          <p className="text-2xl font-extrabold text-[var(--color-invoice)]">
            {formatPrice(invoice.subtotal)}
          </p>
        </div>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-[var(--color-muted)]">Khách thuê</dt>
            <dd className="mt-0.5 font-bold">
              {invoice.customer?.fullName ?? invoice.customerName}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-muted)]">Người làm</dt>
            <dd className="mt-0.5 font-bold">
              {invoice.partner?.fullName ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-muted)]">Ngày phát hành</dt>
            <dd className="mt-0.5">
              {new Date(invoice.issuedAt).toLocaleString('vi-VN')}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-muted)]">Tiền tệ</dt>
            <dd className="mt-0.5 font-bold">{invoice.currency}</dd>
          </div>
          {invoice.commissionAmount > 0 ? (
            <div>
              <dt className="font-semibold text-[var(--color-muted)]">Hoa hồng sàn</dt>
              <dd className="mt-0.5 font-bold text-[var(--color-invoice)]">
                {formatPrice(invoice.commissionAmount)}
              </dd>
            </div>
          ) : null}
          {invoice.partnerPayout > 0 ? (
            <div>
              <dt className="font-semibold text-[var(--color-muted)]">
                Chi trả người làm
              </dt>
              <dd className="mt-0.5 font-bold text-[var(--color-invoice)]">
                {formatPrice(invoice.partnerPayout)}
              </dd>
            </div>
          ) : null}
          {invoice.settledAt ? (
            <div>
              <dt className="font-semibold text-[var(--color-muted)]">Quyết toán</dt>
              <dd className="mt-0.5">
                {new Date(invoice.settledAt).toLocaleString('vi-VN')}
              </dd>
            </div>
          ) : null}
          {invoice.refundedAt ? (
            <div>
              <dt className="font-semibold text-[var(--color-muted)]">Hoàn tiền</dt>
              <dd className="mt-0.5">
                {new Date(invoice.refundedAt).toLocaleString('vi-VN')}
              </dd>
            </div>
          ) : null}
        </dl>

        <Link
          to={bookingHref}
          className="mt-5 inline-block text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
        >
          Xem đơn liên quan
        </Link>
      </article>
    </div>
  );
}
