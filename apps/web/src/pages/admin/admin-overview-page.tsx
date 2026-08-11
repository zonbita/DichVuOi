import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  AlertOctagon,
  Banknote,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  DollarSign,
  FileText,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context';
import { api, formatPrice } from '../../services/api';

type Accent = 'blue' | 'green' | 'purple' | 'yellow' | 'red';

/** Soft UI tones — khớp mock Tổng quan (pastel tile + glow). */
const accentTone: Record<
  Accent,
  { icon: string; soft: string; glow: string; chart: string }
> = {
  blue: {
    icon: '#3B82F6',
    soft: '#DBEAFE',
    glow: 'rgba(59, 130, 246, 0.35)',
    chart: '#3B82F6',
  },
  green: {
    icon: '#10B981',
    soft: '#D1FAE5',
    glow: 'rgba(16, 185, 129, 0.35)',
    chart: '#10B981',
  },
  purple: {
    icon: '#8B5CF6',
    soft: '#EDE9FE',
    glow: 'rgba(139, 92, 246, 0.35)',
    chart: '#8B5CF6',
  },
  yellow: {
    icon: '#F59E0B',
    soft: '#FEF3C7',
    glow: 'rgba(245, 158, 11, 0.38)',
    chart: '#F59E0B',
  },
  red: {
    icon: '#EF4444',
    soft: '#FEE2E2',
    glow: 'rgba(239, 68, 68, 0.35)',
    chart: '#EF4444',
  },
};

function Sparkline({
  seed,
  color,
  variant = 'line',
}: {
  seed: number;
  color: string;
  variant?: 'line' | 'bars';
}) {
  const points = Array.from({ length: 8 }, (_, i) => {
    const n = Math.abs(Math.sin(seed * 12.9898 + i * 78.233)) % 1;
    return 6 + n * 22;
  });

  if (variant === 'bars') {
    return (
      <svg
        aria-hidden
        viewBox="0 0 72 36"
        className="h-9 w-[4.5rem] shrink-0"
      >
        {points.map((h, i) => (
          <rect
            key={i}
            x={i * 9 + 1}
            y={36 - h}
            width="5"
            height={h}
            rx="2"
            fill={color}
            opacity={0.45 + (i / points.length) * 0.55}
          />
        ))}
      </svg>
    );
  }

  const d = points
    .map((y, i) => `${i === 0 ? 'M' : 'L'} ${i * 10} ${36 - y}`)
    .join(' ');

  return (
    <svg aria-hidden viewBox="0 0 70 36" className="h-9 w-[4.5rem] shrink-0">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GmvTrendChart({
  points,
}: {
  points: Array<{ date: string; gmv: number }>;
}) {
  const max = Math.max(1, ...points.map((p) => p.gmv));
  const w = Math.max(320, points.length * 18);
  const h = 120;
  const path = points
    .map((p, i) => {
      const x = (i / Math.max(1, points.length - 1)) * (w - 8) + 4;
      const y = h - 8 - (p.gmv / max) * (h - 24);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="admin-metric-card mt-4 overflow-x-auto">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--admin-muted)]">
          GMV 30 ngày gần nhất
        </p>
        <p className="text-xs font-semibold text-[var(--admin-muted)]">
          Tổng kỳ: {formatPrice(points.reduce((s, p) => s + p.gmv, 0))}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-32 w-full min-w-[320px]"
        role="img"
        aria-label="Biểu đồ GMV theo ngày"
      >
        <path
          d={path}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => {
          const x = (i / Math.max(1, points.length - 1)) * (w - 8) + 4;
          const y = h - 8 - (p.gmv / max) * (h - 24);
          return (
            <circle
              key={p.date}
              cx={x}
              cy={y}
              r="3"
              fill="#3B82F6"
              opacity={p.gmv > 0 ? 1 : 0.25}
            >
              <title>
                {p.date}: {formatPrice(p.gmv)}
              </title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon: IconCmp,
  accent,
  chart,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent: Accent;
  chart?: 'line' | 'bars' | 'none';
}) {
  const tone = accentTone[accent];
  const seed = value.length + label.length;

  return (
    <article className="admin-metric-card">
      <div className="flex items-start gap-3">
        <div
          className="admin-metric-icon"
          style={{
            background: tone.soft,
            color: tone.icon,
            boxShadow: `0 8px 16px -4px ${tone.glow}`,
          }}
        >
          <IconCmp size={22} strokeWidth={2} absoluteStrokeWidth aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--admin-muted)]">
            {label}
          </p>
          <div className="mt-1 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[1.65rem] font-extrabold leading-none tracking-tight text-[var(--admin-ink)]">
                {value}
              </p>
              {hint ? (
                <p className="mt-1.5 text-xs font-semibold text-[var(--admin-muted)]">
                  {hint}
                </p>
              ) : null}
            </div>
            {chart && chart !== 'none' ? (
              <Sparkline seed={seed} color={tone.chart} variant={chart} />
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function SectionTitle({
  icon: IconCmp,
  children,
}: {
  icon: LucideIcon;
  children: string;
}) {
  return (
    <h2 className="admin-section-label">
      <IconCmp size={15} strokeWidth={2.25} absoluteStrokeWidth aria-hidden />
      {children}
    </h2>
  );
}

function QuickRow({
  icon: IconCmp,
  label,
  value,
  soft,
  color,
  glow,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  soft: string;
  color: string;
  glow: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className="admin-quick-icon"
        style={{
          background: soft,
          color,
          boxShadow: `0 6px 12px -3px ${glow}`,
        }}
      >
        <IconCmp size={16} strokeWidth={2.25} absoluteStrokeWidth aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold leading-snug text-[var(--admin-muted)]">
          {label}
        </p>
      </div>
      <p className="shrink-0 text-sm font-extrabold text-[var(--admin-ink)]">
        {value}
      </p>
    </div>
  );
}

function monthRangeLabel() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `01/${pad(m + 1)}/${y} - ${pad(last)}/${pad(m + 1)}/${y}`;
}

export function AdminOverviewPage() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: api.adminStats,
    enabled: isAdmin,
  });

  const gmvQuery = useQuery({
    queryKey: ['admin', 'gmv-series', 30],
    queryFn: () => api.adminGmvSeries(30),
    enabled: isAdmin,
  });

  if (loading) {
    return <p className="text-sm text-[var(--admin-muted)]">Đang tải…</p>;
  }
  if (!isAdmin) {
    return <Navigate to="/admin/support" replace />;
  }

  const stats = statsQuery.data;
  if (statsQuery.isLoading) {
    return <p className="text-sm text-[var(--admin-muted)]">Đang tải thống kê…</p>;
  }
  if (!stats) return <p>Không tải được thống kê.</p>;

  const completionRate = stats.bookings
    ? Math.round((stats.completed / stats.bookings) * 100)
    : 0;
  const cancelRate = stats.bookings
    ? Math.round((stats.cancelled / stats.bookings) * 100)
    : 0;
  const gmvPoints = gmvQuery.data?.points ?? [];

  return (
    <div className="pb-4">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] font-extrabold tracking-tight text-[var(--admin-ink)] sm:text-[2rem]">
            Tổng quan
          </h1>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            Theo dõi người dùng, đơn hàng, cọc giữ chỗ và chất lượng vận hành.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 text-sm font-semibold text-[var(--admin-ink)] shadow-[var(--admin-shadow-sm)]">
          <Calendar
            size={18}
            strokeWidth={2}
            absoluteStrokeWidth
            className="text-[var(--admin-accent)]"
            aria-hidden
          />
          {monthRangeLabel()}
          <ChevronDown
            size={16}
            strokeWidth={2}
            absoluteStrokeWidth
            className="text-[var(--admin-muted)]"
            aria-hidden
          />
        </div>
      </div>

      {stats.partnersPendingVerify > 0 ||
      stats.servicePostsPending > 0 ||
      stats.escrowHeldCount > 0 ||
      stats.complaintsPending > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {stats.partnersPendingVerify > 0 ? (
            <Link
              to="/admin/partners?verified=false"
              className="admin-chip admin-chip-amber gap-1.5"
            >
              <UserCheck size={15} strokeWidth={2.25} absoluteStrokeWidth aria-hidden />
              {stats.partnersPendingVerify} hồ sơ chờ duyệt
            </Link>
          ) : null}
          {stats.servicePostsPending > 0 ? (
            <Link
              to="/admin/service-posts"
              className="admin-chip admin-chip-violet gap-1.5"
            >
              <Briefcase size={15} strokeWidth={2.25} absoluteStrokeWidth aria-hidden />
              {stats.servicePostsPending} bài đăng DV chờ duyệt
            </Link>
          ) : null}
          {stats.escrowHeldCount > 0 ? (
            <Link
              to="/admin/bookings?paymentStatus=HELD"
              className="admin-chip admin-chip-sky gap-1.5"
            >
              <FileText size={15} strokeWidth={2.25} absoluteStrokeWidth aria-hidden />
              {stats.escrowHeldCount} đơn đang giữ cọc
            </Link>
          ) : null}
          {stats.complaintsPending > 0 ? (
            <Link
              to="/admin/complaints?status=PENDING"
              className="admin-chip admin-chip-rose gap-1.5"
            >
              <AlertOctagon size={15} strokeWidth={2.25} absoluteStrokeWidth aria-hidden />
              {stats.complaintsPending} khiếu nại chờ xử lý
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-7">
        <section>
          <SectionTitle icon={Users}>Người dùng</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Users"
              value={String(stats.users)}
              icon={Users}
              accent="blue"
              hint="Tài khoản trên sàn"
            />
            <MetricCard
              label="Partners"
              value={String(stats.partners)}
              icon={Building2}
              accent="purple"
              hint="Hồ sơ người làm"
            />
            <MetricCard
              label="Chờ duyệt hồ sơ"
              value={String(stats.partnersPendingVerify)}
              icon={ClipboardCheck}
              accent="green"
              hint={
                stats.partnersPendingVerify > 0
                  ? 'Cần xử lý sớm'
                  : 'Không còn tồn'
              }
            />
          </div>
        </section>

        <section>
          <SectionTitle icon={ShoppingCart}>Đơn hàng</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Tổng đơn"
              value={String(stats.bookings)}
              icon={ShoppingCart}
              accent="blue"
              chart="line"
            />
            <MetricCard
              label="Việc mở"
              value={String(stats.openJobs)}
              icon={FileText}
              accent="green"
              chart="line"
            />
            <MetricCard
              label="Hoàn thành"
              value={String(stats.completed)}
              icon={CheckCircle2}
              accent="yellow"
              hint={`${completionRate}% tổng đơn`}
              chart="line"
            />
            <MetricCard
              label="Đã hủy"
              value={String(stats.cancelled)}
              icon={Trash2}
              accent="red"
              chart="line"
            />
          </div>
        </section>

        <section>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <SectionTitle icon={DollarSign}>Dòng tiền</SectionTitle>
            <Link
              to="/admin/finance"
              className="mb-3 text-sm font-bold text-[var(--admin-accent)] hover:underline"
            >
              Mở menu Tiền
            </Link>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_minmax(240px,0.9fr)]">
            <MetricCard
              label="GMV hoàn thành"
              value={formatPrice(stats.gmvCompleted)}
              icon={Wallet}
              accent="blue"
              chart="bars"
            />
            <MetricCard
              label="Cọc đang giữ"
              value={formatPrice(stats.escrowHeldAmount)}
              icon={Tag}
              accent="purple"
              hint={`${stats.escrowHeldCount} đơn`}
              chart="bars"
            />
            <MetricCard
              label="Hoa hồng đã thu"
              value={formatPrice(stats.commissionEarned)}
              icon={Banknote}
              accent="green"
              hint={`${stats.escrowReleasedCount} đơn đã giải ngân`}
              chart="bars"
            />
            <aside className="admin-metric-card xl:row-span-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--admin-muted)]">
                Tổng kết nhanh
              </p>
              <div className="mt-1 divide-y divide-[var(--admin-border)]">
                <QuickRow
                  icon={TrendingUp}
                  label="Doanh thu hoàn thành"
                  value={formatPrice(stats.gmvCompleted)}
                  soft="#D1FAE5"
                  color="#10B981"
                  glow="rgba(16, 185, 129, 0.35)"
                />
                <QuickRow
                  icon={UserPlus}
                  label="Người dùng"
                  value={String(stats.users)}
                  soft="#DBEAFE"
                  color="#3B82F6"
                  glow="rgba(59, 130, 246, 0.35)"
                />
                <QuickRow
                  icon={ShoppingBag}
                  label="Đơn hoàn thành"
                  value={String(stats.completed)}
                  soft="#FEF3C7"
                  color="#F59E0B"
                  glow="rgba(245, 158, 11, 0.38)"
                />
                <QuickRow
                  icon={Shield}
                  label="Tỷ lệ hủy đơn"
                  value={`${cancelRate}%`}
                  soft="#EDE9FE"
                  color="#8B5CF6"
                  glow="rgba(139, 92, 246, 0.35)"
                />
              </div>
            </aside>
          </div>
          {gmvPoints.length > 0 ? <GmvTrendChart points={gmvPoints} /> : null}
        </section>

        <section>
          <SectionTitle icon={Shield}>Chất lượng & an toàn</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Đánh giá"
              value={String(stats.reviews)}
              icon={Star}
              accent="blue"
              chart="line"
              hint="Review hai chiều"
            />
            <MetricCard
              label="Tin bị lọc PII"
              value={String(stats.redactedMessages)}
              icon={AlertOctagon}
              accent="purple"
              chart="line"
              hint={
                stats.redactedMessages > 0
                  ? 'Cần rà soát'
                  : 'Không có tin lộ'
              }
            />
            <MetricCard
              label="Bài đăng DV chờ"
              value={String(stats.servicePostsPending)}
              icon={ClipboardCheck}
              accent="yellow"
              hint={
                stats.servicePostsPending > 0
                  ? 'Vào hàng chờ duyệt'
                  : 'Hàng chờ trống'
              }
            />
          </div>
        </section>
      </div>
    </div>
  );
}
