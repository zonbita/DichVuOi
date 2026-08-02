import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, formatPrice } from '../../services/api';
import { PageHeader, StatCard } from './admin-ui';

export function AdminOverviewPage() {
  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: api.adminStats,
  });

  const stats = statsQuery.data;
  if (statsQuery.isLoading) {
    return <p className="text-sm text-[var(--color-muted)]">Đang tải thống kê…</p>;
  }
  if (!stats) return <p>Không tải được thống kê.</p>;

  const completionRate = stats.bookings
    ? Math.round((stats.completed / stats.bookings) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title="Tổng quan"
        description="Theo dõi người dùng, đơn hàng, escrow và chất lượng vận hành."
      />

      {stats.partnersPendingVerify > 0 || stats.escrowHeldCount > 0 ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {stats.partnersPendingVerify > 0 ? (
            <Link
              to="/admin/partners?verified=false"
              className="rounded-full bg-amber-100 px-3.5 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-200"
            >
              {stats.partnersPendingVerify} hồ sơ chờ duyệt →
            </Link>
          ) : null}
          {stats.escrowHeldCount > 0 ? (
            <Link
              to="/admin/bookings?paymentStatus=HELD"
              className="rounded-full bg-sky-100 px-3.5 py-1.5 text-sm font-semibold text-sky-900 hover:bg-sky-200"
            >
              {stats.escrowHeldCount} đơn đang giữ escrow →
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--color-muted)]">
            Người dùng
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Users" value={String(stats.users)} />
            <StatCard label="Partners" value={String(stats.partners)} />
            <StatCard
              label="Chờ duyệt hồ sơ"
              value={String(stats.partnersPendingVerify)}
              tone={stats.partnersPendingVerify > 0 ? 'warn' : 'default'}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--color-muted)]">
            Đơn hàng
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Tổng đơn" value={String(stats.bookings)} />
            <StatCard label="Việc mở" value={String(stats.openJobs)} />
            <StatCard
              label="Hoàn thành"
              value={String(stats.completed)}
              hint={`${completionRate}% tổng đơn`}
            />
            <StatCard label="Đã hủy" value={String(stats.cancelled)} />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--color-muted)]">
            Dòng tiền
          </h2>
          <div className="mb-3">
            <Link
              to="/admin/finance"
              className="text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
            >
              Mở menu Tiền →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="GMV hoàn thành"
              value={formatPrice(stats.gmvCompleted)}
            />
            <StatCard
              label="Escrow đang giữ"
              value={formatPrice(stats.escrowHeldAmount)}
              hint={`${stats.escrowHeldCount} đơn`}
            />
            <StatCard
              label="Hoa hồng đã thu"
              value={formatPrice(stats.commissionEarned)}
              hint={`${stats.escrowReleasedCount} đơn đã giải ngân`}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--color-muted)]">
            Chất lượng & an toàn
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Đánh giá" value={String(stats.reviews)} />
            <StatCard
              label="Tin bị lọc PII"
              value={String(stats.redactedMessages)}
              tone={stats.redactedMessages > 0 ? 'warn' : 'default'}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
