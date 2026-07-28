import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { api, formatPrice } from '../services/api';
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '../types/finance';

export function InvoicesPage({
  basePath,
}: {
  basePath: '/don-cua-toi' | '/doi-tac';
}) {
  const { user, loading } = useAuth();
  const invoicesQuery = useQuery({
    queryKey: ['invoices'],
    queryFn: api.listInvoices,
    enabled: Boolean(user),
  });

  if (loading) return <p>Đang tải…</p>;
  if (!user) {
    return <Navigate to={`/dang-nhap?redirect=${basePath}/hoa-don`} replace />;
  }

  const items = invoicesQuery.data ?? [];

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Hóa đơn VNĐ</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Mỗi lần đặt cọc tạo một hóa đơn. Giải ngân / hoàn cập nhật trạng thái.
          </p>
        </div>
        <Link
          to={`${basePath}/vi`}
          className="text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
        >
          ← Ví VNĐ
        </Link>
      </div>

      {invoicesQuery.isLoading ? <p>Đang tải…</p> : null}
      {items.length === 0 && !invoicesQuery.isLoading ? (
        <p className="border border-dashed border-[var(--color-line)] bg-white px-4 py-10 text-center text-[var(--color-muted)]">
          Chưa có hóa đơn. Đặt cọc đơn thuê để phát hành.
        </p>
      ) : null}

      <div className="space-y-3">
        {items.map((invoice) => (
          <Link
            key={invoice.id}
            to={`${basePath}/hoa-don/${invoice.id}`}
            className="block border border-[var(--color-line)] bg-white p-4 shadow-sm transition hover:border-[var(--color-brand)]"
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
      <div>
        <Link
          to={`${basePath}/hoa-don`}
          className="text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
        >
          ← Hóa đơn
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold">Chi tiết hóa đơn</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {invoice.invoiceNumber}
        </p>
      </div>

      <article className="border border-[var(--color-line)] bg-white p-5 shadow-sm">
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
          Xem đơn liên quan →
        </Link>
      </article>
    </div>
  );
}
