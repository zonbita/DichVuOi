import { Link } from 'react-router-dom';
import type { PartnerLevelBreakdown } from '../../types/auth';
import { DashboardSurface } from '../dashboard/dashboard-chrome';
import { LevelBadgeGold, PartnerRankBadge, VerificationBadge } from '../ui/partner-badges';

type Row = {
  id: string;
  label: string;
  points: number;
  max: number;
  detail: string;
  tip: string;
};

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden bg-[var(--color-line)]">
      <div
        className="h-full bg-[var(--color-brand)] transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function formatLastOnline(iso: string | null) {
  if (!iso) return 'Chưa ghi nhận';
  return new Date(iso).toLocaleString('vi-VN');
}

type Props = {
  data: PartnerLevelBreakdown;
};

/** Bảng cấp 1–100 + breakdown điểm + số liệu gốc. */
export function PartnerLevelPanel({ data }: Props) {
  const f = data.formula;
  const onlineCap = f.online?.totalCap ?? f.hours.totalCap;
  const onlineHoursCap = f.online?.hoursCap ?? f.hours.perServiceHoursCap;
  const onlinePerHour = f.online?.perHour ?? f.hours.perHour;

  const rows: Row[] = [
    {
      id: 'online',
      label: 'Giờ online',
      points: data.hoursPoints,
      max: onlineCap,
      detail: `${data.inputs.onlineHours.toFixed(1)} / ${onlineHoursCap} giờ`,
      tip: 'Giữ app / trang Người làm mở để tích giờ qua Socket.',
    },
    {
      id: 'jobs',
      label: 'Đơn hoàn thành',
      points: data.jobsPoints,
      max: f.jobs.cap * f.jobs.perJob,
      detail: `${data.inputs.completedJobs} / ${f.jobs.cap} đơn`,
      tip: 'Nhận việc và hoàn thành đơn trên sàn.',
    },
    {
      id: 'rating',
      label: 'Điểm ★ trung bình',
      points: data.ratingPoints,
      max: f.rating.maxPoints,
      detail:
        data.inputs.ratingCount >= f.rating.minReviews
          ? `★ ${data.inputs.ratingAvg.toFixed(1)} / 5`
          : `Cần ≥ ${f.rating.minReviews} đánh giá (đang có ${data.inputs.ratingCount})`,
      tip: `Chỉ tính khi có từ ${f.rating.minReviews} đánh giá trở lên.`,
    },
    {
      id: 'reviews',
      label: 'Số đánh giá',
      points: data.reviewCountPoints,
      max: f.reviewCount.cap * f.reviewCount.perReview,
      detail: `${data.inputs.ratingCount} / ${f.reviewCount.cap} đánh giá`,
      tip: 'Khách đánh giá sau khi đơn hoàn tất.',
    },
    {
      id: 'verified',
      label: 'Đã xác thực',
      points: data.verifiedBonus,
      max: f.verifiedBonus,
      detail: data.inputs.isVerified ? 'Đã xác minh' : 'Chưa xác minh',
      tip: 'Admin xác minh hồ sơ (+10 điểm).',
    },
    {
      id: 'diversity',
      label: 'Đa dạng nghề',
      points: data.diversityBonus,
      max: f.diversity.cap * f.diversity.perOffering,
      detail: `${data.inputs.activeOfferings} / ${f.diversity.cap} nghề gắn`,
      tip: 'Gắn thêm nghề trên Hồ sơ (tối đa điểm ở 8 nghề).',
    },
  ];

  const levelPct = Math.min(100, Math.max(0, data.level));

  return (
    <div className="space-y-5">
      <DashboardSurface className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-[var(--color-muted)]">
              Thang merit 1–100 — khác uy tín (khiếu nại / tuân thủ).
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <LevelBadgeGold level={data.level} />
              <PartnerRankBadge
                rank={data.rank}
                completedJobs={data.inputs.completedJobs}
                hireSuccessCount={data.inputs.hireSuccessCount}
              />
              <VerificationBadge verified={data.inputs.isVerified} />
            </div>
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              Rank {data.rank}/1000 · {data.inputs.completedJobs} hoàn thành +{' '}
              {data.inputs.hireSuccessCount} thuê thành công
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Tổng điểm{' '}
              <strong className="text-[var(--color-ink)]">{data.totalPoints}</strong>
              {' · '}
              cấp lưu {data.storedLevel}
              {data.storedLevel !== data.level ? (
                <span className="text-amber-700"> (tính lại: {data.level})</span>
              ) : null}
            </p>
          </div>
          <div className="w-full max-w-[220px]">
            <div className="flex items-end justify-between text-sm">
              <span className="font-semibold text-[var(--color-muted)]">Tiến độ cấp</span>
              <span className="text-2xl font-extrabold text-[var(--color-ink)]">
                {data.level}
                <span className="text-sm font-semibold text-[var(--color-muted)]">/100</span>
              </span>
            </div>
            <ProgressBar value={levelPct} max={100} />
          </div>
        </div>

        <p className="mt-4 text-sm text-[var(--color-muted)]">
          Online gần nhất: {formatLastOnline(data.inputs.lastOnlineAt)}
          {data.inputs.isOnline ? (
            <span className="ml-2 inline-flex items-center gap-1.5 font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Đang online
            </span>
          ) : null}
        </p>
        {data.onTimeRate != null ? (
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Đúng hạn:{' '}
            <strong className="text-[var(--color-navy)]">{data.onTimeRate}%</strong>
            <span className="text-[var(--color-muted)]">
              {' '}
              ({data.onTimeSampleSize ?? 0} đơn gần đây)
            </span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Đúng hạn: chưa có đơn hoàn thành để tính.
          </p>
        )}
      </DashboardSurface>

      <DashboardSurface className="p-5">
        <h2 className="text-lg font-extrabold text-[var(--color-navy)]">Nguồn điểm</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Cấp = làm tròn tổng các nguồn dưới (kẹp 1–100).
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <article
              key={row.id}
              className="border border-[var(--color-line)] bg-[var(--color-canvas)]/60 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-[var(--color-ink)]">{row.label}</p>
                <p className="shrink-0 text-sm font-extrabold text-[var(--color-brand-deep)]">
                  {row.points}
                  <span className="font-medium text-[var(--color-muted)]">/{row.max}</span>
                </p>
              </div>
              <ProgressBar value={row.points} max={row.max} />
              <p className="mt-2 text-xs font-semibold text-[var(--color-ink)]/80">
                {row.detail}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">{row.tip}</p>
            </article>
          ))}
        </div>
      </DashboardSurface>

      <DashboardSurface className="p-5">
        <h2 className="text-lg font-extrabold text-[var(--color-navy)]">Số liệu hiện tại</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <li>
            <span className="text-[var(--color-muted)]">Giờ online: </span>
            <strong>{data.inputs.onlineHours.toFixed(1)}h</strong>
            <span className="text-[var(--color-muted)]">
              {' '}
              ({data.inputs.onlineSeconds.toLocaleString('vi-VN')} giây)
            </span>
          </li>
          <li>
            <span className="text-[var(--color-muted)]">Đơn hoàn thành: </span>
            <strong>{data.inputs.completedJobs}</strong>
          </li>
          <li>
            <span className="text-[var(--color-muted)]">Đánh giá: </span>
            <strong>
              ★ {data.inputs.ratingAvg.toFixed(1)} ({data.inputs.ratingCount})
            </strong>
          </li>
          <li>
            <span className="text-[var(--color-muted)]">Nghề đang gắn: </span>
            <strong>{data.inputs.activeOfferings}</strong>
          </li>
        </ul>

        <p className="mt-4 text-sm text-[var(--color-muted)]">
          Giờ online: min(giờ, {onlineHoursCap}) × {onlinePerHour} (tối đa {onlineCap} điểm).
          {data.inputs.onlineHours <= 0
            ? ' Chưa có giờ — mở trang Người làm để bắt đầu tích.'
            : null}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/doi-tac/ho-so"
            className="inline-flex rounded-xl border border-[var(--color-line)] bg-white px-4 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-canvas)]"
          >
            Chỉnh Hồ sơ / nghề
          </Link>
          <Link
            to="/doi-tac/viec"
            className="inline-flex rounded-xl bg-[var(--color-navy)] px-4 py-2 text-sm font-bold !text-white hover:bg-[var(--color-navy-deep)]"
          >
            Nhận việc
          </Link>
        </div>
      </DashboardSurface>
    </div>
  );
}
