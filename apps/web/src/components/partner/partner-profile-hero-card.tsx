import { FavoritePartnerButton } from './favorite-partner-button';
import {
  formatResponseLabel,
  PartnerAvatar,
  StatItem,
  StatusBadge,
} from './partner-marketplace-card-parts';
import { Icon } from '../ui/icon';
import { formatPrice, formatPriceNumber } from '../../services/api';
import type { PublicPartnerProfile } from '../../types/auth';
import { resolveOfferingPriceRange } from '../../utils/market-price';

type PartnerOffering = PublicPartnerProfile['offerings'][number];

function buildLocation(data: PublicPartnerProfile) {
  if (data.districts?.length && data.city) {
    return `${data.districts[0]}, ${data.city}`;
  }
  return data.city ?? data.districts?.[0] ?? null;
}

function buildScheduleLine(data: PublicPartnerProfile, offering?: PartnerOffering) {
  const chunks: string[] = [];

  if (data.workModes?.length) {
    chunks.push(
      data.workModes
        .map((mode) => (mode === 'online' ? 'Online' : 'Tại chỗ'))
        .join(' · '),
    );
  }
  if (data.districts?.length) {
    chunks.push(data.districts.slice(0, 4).join(', '));
  }
  if (offering?.coverageNote?.trim()) {
    chunks.push(offering.coverageNote.trim());
  }

  return chunks.length ? chunks.join(' • ') : null;
}

function resolvePrimaryOffering(offerings: PartnerOffering[]) {
  if (!offerings.length) return null;
  return [...offerings].sort(
    (a, b) =>
      b.ratingCount - a.ratingCount ||
      b.ratingAvg - a.ratingAvg ||
      a.service.name.localeCompare(b.service.name, 'vi'),
  )[0];
}

function resolveExperienceYears(offerings: PartnerOffering[]) {
  return offerings.reduce((max, item) => Math.max(max, item.experienceYears), 0);
}

export function PartnerProfileHeroCard({ data }: { data: PublicPartnerProfile }) {
  const primaryOffering = resolvePrimaryOffering(data.offerings);
  const experienceYears = resolveExperienceYears(data.offerings);
  const headline = data.headline?.trim() || primaryOffering?.headline?.trim() || null;
  const location = buildLocation(data);
  const scheduleLine = buildScheduleLine(data, primaryOffering ?? undefined);
  const skills = data.skills?.slice(0, 6) ?? [];
  const responseLabel = formatResponseLabel(data.responseMinutes);
  const satisfactionPct =
    data.onTimeRate != null
      ? `${data.onTimeRate}%`
      : data.ratingCount > 0
        ? `${Math.round((data.ratingAvg / 5) * 100)}%`
        : null;
  const reputation = data.reputation;
  const progressPct = reputation?.percent ?? 0;
  const progressCurrent = reputation?.currentPoints ?? data.completedJobs;
  const progressMax = reputation?.startingPoints ?? Math.max(data.completedJobs + 22, 150);
  const remainingSlots = reputation
    ? Math.max(0, progressMax - progressCurrent)
    : data.acceptingJobs === false
      ? 0
      : null;

  const priceRange = primaryOffering
    ? resolveOfferingPriceRange({
        price: primaryOffering.price,
        priceMin: primaryOffering.priceMin,
        priceMax: primaryOffering.priceMax,
      })
    : null;
  const unit = primaryOffering?.service.unit;

  const priceBlock = priceRange ? (
    <div className="text-left lg:text-right">
      <p className="whitespace-nowrap text-2xl font-bold tabular-nums text-[#17233A] sm:text-[26px]">
        {priceRange.max > priceRange.min ? (
          <>
            {formatPriceNumber(priceRange.min)}
            <span className="mx-0.5 font-semibold text-[#64748B]">–</span>
            {formatPriceNumber(priceRange.max)}
            <span className="ml-0.5 text-lg">VNĐ</span>
          </>
        ) : (
          formatPrice(priceRange.min)
        )}
      </p>
      {unit ? (
        <p className="mt-0.5 whitespace-nowrap text-sm font-medium text-[#64748B]">/ {unit}</p>
      ) : null}
    </div>
  ) : null;

  return (
    <section className="relative overflow-hidden rounded-[22px] border border-[rgba(150,180,210,0.25)] bg-white p-4 shadow-[0_8px_24px_rgba(23,35,58,0.06)] sm:p-5 md:p-6">
      <div
        className="absolute right-4 top-4 z-10 sm:right-5 sm:top-5"
        onClick={(event) => event.stopPropagation()}
      >
        <FavoritePartnerButton
          partnerUserId={data.userId}
          showLabel={false}
          className="!flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(150,180,210,0.35)] bg-white !p-0 text-[#64748B] shadow-none transition hover:border-[#2563EB]/25 hover:bg-[#EFF6FF] hover:text-[#F97316]"
        />
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
        <div className="flex shrink-0 flex-col items-center gap-2 sm:w-[140px]">
          <div className="relative shrink-0">
            <PartnerAvatar name={data.fullName} src={data.avatarUrl} size="profile" />
            <span className="absolute -bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#17233A] px-2.5 py-1 text-xs font-bold text-white shadow-md">
              <span className="text-amber-400">★</span>
              {data.ratingAvg.toFixed(1)}
            </span>
          </div>
          <p className="text-xs font-medium text-[#94A3B8] sm:text-center">
            ({data.ratingCount} đánh giá)
          </p>
        </div>

        <div className="min-w-0 flex-1 pr-10 sm:pr-12 lg:pr-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-xl font-bold leading-tight text-[#17233A] sm:text-2xl">
              {data.fullName}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {data.isVerified ? (
                <StatusBadge tone="green" icon="check">
                  Đã xác thực
                </StatusBadge>
              ) : null}
              {experienceYears > 0 ? (
                <StatusBadge tone="orange" icon="star">
                  {experienceYears} năm kinh nghiệm
                </StatusBadge>
              ) : null}
              {data.phoneVerified ? (
                <StatusBadge tone="cyan" icon="shield">
                  SĐT xác thực
                </StatusBadge>
              ) : null}
            </div>
          </div>

          {headline || location ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#64748B]">
              {headline ? (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Icon name="graduation" className="h-4 w-4 shrink-0 text-[#2563EB]" />
                  <span className="line-clamp-1">{headline}</span>
                </span>
              ) : null}
              {headline && location ? (
                <span className="hidden text-[#CBD5E1] sm:inline">|</span>
              ) : null}
              {location ? (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Icon name="pin" className="h-4 w-4 shrink-0 text-[#10B981]" />
                  <span className="line-clamp-1">{location}</span>
                </span>
              ) : null}
            </div>
          ) : null}

          {skills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5 text-[13px] font-semibold text-[#2563EB] transition hover:bg-[#DBEAFE]"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-wrap items-center divide-x divide-[#E2E8F0]">
              <StatItem
                icon="users"
                value={String(data.completedJobs)}
                label="đơn hoàn thành"
              />
              {satisfactionPct ? (
                <StatItem
                  icon="check"
                  value={satisfactionPct}
                  label={data.onTimeRate != null ? 'đúng hạn' : 'hài lòng'}
                />
              ) : (
                <StatItem icon="check" value="Mới" label="tham gia" />
              )}
              <StatItem
                icon="clock"
                value={responseLabel ?? '—'}
                label={responseLabel ? 'phản hồi' : 'chưa có dữ liệu'}
              />
            </div>
          </div>

          {priceBlock ? <div className="mt-4 lg:hidden">{priceBlock}</div> : null}

          {data.acceptingJobs === false ? (
            <p className="mt-2 text-xs font-semibold text-[#EA580C]">Tạm nghỉ nhận việc</p>
          ) : data.isOnline ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Đang online
            </p>
          ) : null}
        </div>

        {priceBlock ? (
          <div className="hidden shrink-0 flex-col items-end gap-3 lg:flex lg:pt-1">{priceBlock}</div>
        ) : null}
      </div>

      <div className="mt-5 border-t border-[#E5EAF2] pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-[#64748B]">
            {reputation ? (
              <>
                Uy tín{' '}
                <span className="font-bold text-[#17233A]">{progressCurrent}</span>
                <span className="text-[#94A3B8]"> / {progressMax}</span>
              </>
            ) : (
              <>
                Đã hoàn thành{' '}
                <span className="font-bold text-[#17233A]">{data.completedJobs}</span>
                <span className="text-[#94A3B8]"> đơn</span>
              </>
            )}
          </p>
          {remainingSlots != null ? (
            <p className="text-sm font-bold text-[#F97316]">
              {reputation
                ? remainingSlots > 0
                  ? `Còn ${remainingSlots} điểm uy tín`
                  : 'Đạt ngưỡng uy tín chu kỳ'
                : remainingSlots > 0
                  ? `Còn ${remainingSlots} suất trống`
                  : 'Hết suất nhận việc'}
            </p>
          ) : null}
        </div>

        <div
          className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#E5EAF2]"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={
            reputation
              ? `Uy tín ${progressCurrent} trên ${progressMax}`
              : `Tiến độ ${data.completedJobs} đơn`
          }
        >
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#FBBF24_0%,#F97316_100%)] transition-[width] duration-500 ease-out"
            style={{
              width: `${reputation ? progressPct : Math.min(100, Math.round((data.completedJobs / progressMax) * 100))}%`,
            }}
          />
        </div>

        {scheduleLine ? (
          <p className="mt-3 flex flex-wrap items-start gap-2 text-sm leading-relaxed text-[#64748B]">
            <Icon name="calendar" className="mt-0.5 h-4 w-4 shrink-0 text-[#64748B]" />
            <span>
              <span className="font-semibold text-[#475569]">Phạm vi:</span> {scheduleLine}
            </span>
          </p>
        ) : null}
      </div>
    </section>
  );
}
