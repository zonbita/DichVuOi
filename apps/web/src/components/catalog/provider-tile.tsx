import { useState } from 'react';
import type { MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { FavoritePartnerButton } from '../partner/favorite-partner-button';
import {
  formatResponseLabel,
  PartnerAvatar,
  StatItem,
  StatusBadge,
} from '../partner/partner-marketplace-card-parts';
import { LevelBadge, PartnerVerificationBadges, computePartnerRankScore } from '../ui/partner-badges';
import { Icon } from '../ui/icon';
import { formatPrice, formatWorkHours } from '../../services/api';
import type { ServiceProvider } from '../../types/catalog';

const TOOLTIP_W = 320;
const TOOLTIP_OFFSET = 14;

function clampTooltipPosition(x: number, y: number) {
  const maxX = window.innerWidth - TOOLTIP_W - 12;
  const approxH = 280;
  const maxY = window.innerHeight - approxH - 12;
  return {
    left: Math.max(12, Math.min(x + TOOLTIP_OFFSET, maxX)),
    top: Math.max(12, Math.min(y + TOOLTIP_OFFSET, maxY)),
  };
}

function buildScheduleLine(provider: ServiceProvider) {
  const { partner } = provider;
  const chunks: string[] = [];

  if (partner.workModes?.length) {
    chunks.push(
      partner.workModes
        .map((mode) => (mode === 'online' ? 'Online' : 'Tại chỗ'))
        .join(' · '),
    );
  }
  if (partner.districts?.length) {
    chunks.push(partner.districts.slice(0, 4).join(', '));
  }
  if (provider.coverageNote?.trim()) {
    chunks.push(provider.coverageNote.trim());
  }

  return chunks.length ? chunks.join(' • ') : null;
}

function buildLocation(partner: ServiceProvider['partner']) {
  if (partner.districts?.length && partner.city) {
    return `${partner.districts[0]}, ${partner.city}`;
  }
  return partner.city ?? partner.districts?.[0] ?? null;
}

export function ProviderTile({
  provider,
  unit,
  selected,
  canHire,
  onSelect,
}: {
  provider: ServiceProvider;
  unit: string;
  selected: boolean;
  canHire: boolean;
  onSelect: () => void;
}) {
  const { partner } = provider;
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  const headline = provider.headline?.trim() || partner.headline?.trim() || null;
  const location = buildLocation(partner);
  const scheduleLine = buildScheduleLine(provider);
  const skills = partner.skills?.slice(0, 6) ?? [];
  const responseLabel = formatResponseLabel(partner.responseMinutes);
  const satisfactionPct =
    partner.ratingCount > 0
      ? `${Math.round((partner.ratingAvg / 5) * 100)}%`
      : null;
  const reputation = partner.reputation;
  const progressPct = reputation?.percent ?? 0;
  const progressCurrent = reputation?.currentPoints ?? partner.completedJobs;
  const progressMax = reputation?.startingPoints ?? Math.max(partner.completedJobs + 22, 150);
  const remainingSlots = reputation
    ? Math.max(0, progressMax - progressCurrent)
    : partner.acceptingJobs === false
      ? 0
      : null;

  function onMove(event: MouseEvent<HTMLElement>) {
    setPos(clampTooltipPosition(event.clientX, event.clientY));
  }

  const hireButton = canHire ? (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onSelect();
      }}
      className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold text-white transition sm:w-auto ${
        selected
          ? 'bg-[#2563EB] shadow-[0_4px_14px_rgba(37,99,235,0.28)]'
          : 'bg-[#17233A] hover:bg-[#0f172a]'
      }`}
    >
      {selected ? 'Đã chọn' : 'Thuê ngay'}
    </button>
  ) : (
    <Link
      to={`/user/${partner.userId}`}
      className="inline-flex w-full items-center justify-center rounded-xl bg-[#17233A] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0f172a] sm:w-auto"
    >
      Xem hồ sơ
    </Link>
  );

  const priceBlock = (
    <div className="text-left lg:text-right">
      <p className="whitespace-nowrap text-2xl font-bold tabular-nums text-[#17233A] sm:text-[26px]">
        {formatPrice(provider.price)}
      </p>
      <p className="mt-0.5 whitespace-nowrap text-sm font-medium text-[#64748B]">
        / {unit}
      </p>
    </div>
  );

  return (
    <article
      onMouseEnter={(event) => {
        setHover(true);
        setPos(clampTooltipPosition(event.clientX, event.clientY));
      }}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(false)}
      className={`relative overflow-hidden rounded-[22px] border bg-white p-4 transition duration-200 sm:p-5 md:p-6 ${
        selected
          ? 'border-[#2563EB]/40 shadow-[0_12px_32px_rgba(37,99,235,0.14)] ring-2 ring-[#2563EB]/20'
          : 'border-[rgba(150,180,210,0.25)] shadow-[0_8px_24px_rgba(23,35,58,0.06)] hover:border-[rgba(150,180,210,0.45)] hover:shadow-[0_12px_28px_rgba(23,35,58,0.10)]'
      }`}
    >
      <div
        className="absolute right-4 top-4 z-10 sm:right-5 sm:top-5"
        onClick={(event) => event.stopPropagation()}
      >
        <FavoritePartnerButton
          partnerUserId={partner.userId}
          showLabel={false}
          className="!flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(150,180,210,0.35)] bg-white !p-0 text-[#64748B] shadow-none transition hover:border-[#2563EB]/25 hover:bg-[#EFF6FF] hover:text-[#F97316]"
        />
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
        <div className="flex shrink-0 flex-col items-center gap-2 sm:w-[140px]">
          <Link
            to={`/user/${partner.userId}`}
            className="relative shrink-0"
            aria-label={`Xem hồ sơ ${partner.fullName}`}
          >
            <PartnerAvatar
              name={partner.fullName}
              src={partner.avatarUrl}
              size="profile"
              rank={computePartnerRankScore(partner.completedJobs, 0)}
            />
            <span className="absolute -bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#17233A] px-2.5 py-1 text-xs font-bold text-white shadow-md">
              <span className="text-amber-400">★</span>
              {partner.ratingAvg.toFixed(1)}
            </span>
          </Link>
          <p className="text-xs font-medium text-[#94A3B8] sm:text-center">
            ({partner.ratingCount} đánh giá)
          </p>
        </div>

        <div className="min-w-0 flex-1 pr-10 sm:pr-12 lg:pr-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link
              to={`/user/${partner.userId}`}
              className="text-xl font-bold leading-tight text-[#17233A] transition hover:text-[#2563EB] sm:text-2xl"
            >
              {partner.fullName}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              {partner.isVerified ? (
                <StatusBadge tone="green" icon="check">
                  Đã xác thực
                </StatusBadge>
              ) : null}
              {provider.experienceYears > 0 ? (
                <StatusBadge tone="orange" icon="star">
                  {provider.experienceYears} năm kinh nghiệm
                </StatusBadge>
              ) : null}
              {partner.phoneVerified ? (
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
                value={String(partner.completedJobs)}
                label="đơn hoàn thành"
              />
              {satisfactionPct ? (
                <StatItem icon="check" value={satisfactionPct} label="hài lòng" />
              ) : (
                <StatItem icon="check" value="Mới" label="tham gia" />
              )}
              <StatItem
                icon="clock"
                value={
                  responseLabel ??
                  formatWorkHours(provider.hoursWorked ?? 0).replace(' giờ', 'h')
                }
                label={responseLabel ? 'phản hồi' : 'làm nghề này'}
              />
            </div>
          </div>

          <div className="mt-4 lg:hidden">{priceBlock}</div>
          <div className="mt-3 flex lg:hidden">{hireButton}</div>

          {partner.acceptingJobs === false ? (
            <p className="mt-2 text-xs font-semibold text-[#EA580C]">
              Tạm nghỉ nhận việc
            </p>
          ) : null}
        </div>

        <div className="hidden shrink-0 flex-col items-end gap-3 lg:flex lg:pt-1">
          {priceBlock}
          {hireButton}
        </div>
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
                <span className="font-bold text-[#17233A]">{partner.completedJobs}</span>
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
              : `Tiến độ ${partner.completedJobs} đơn`
          }
        >
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#FBBF24_0%,#F97316_100%)] transition-[width] duration-500 ease-out"
            style={{
              width: `${reputation ? progressPct : Math.min(100, Math.round((partner.completedJobs / progressMax) * 100))}%`,
            }}
          />
        </div>

        {scheduleLine ? (
          <p className="mt-3 flex flex-wrap items-start gap-2 text-sm leading-relaxed text-[#64748B]">
            <Icon name="calendar" className="mt-0.5 h-4 w-4 shrink-0 text-[#64748B]" />
            <span>
              <span className="font-semibold text-[#475569]">Phạm vi:</span>{' '}
              {scheduleLine}
            </span>
          </p>
        ) : null}
      </div>

      {hover
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[9990] w-[min(320px,calc(100vw-1.5rem))]"
              style={{ left: pos.left, top: pos.top }}
            >
              <div className="rounded-2xl border border-[rgba(150,180,210,0.25)] bg-white p-4 text-left shadow-xl">
                <div className="flex items-start gap-3">
                  <PartnerAvatar
                    name={partner.fullName}
                    src={partner.avatarUrl}
                    size="sm"
                    rank={computePartnerRankScore(partner.completedJobs, 0)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start gap-2">
                      <p className="text-base font-bold text-[#17233A]">
                        {partner.fullName}
                      </p>
                      <LevelBadge level={partner.level} />
                      <PartnerVerificationBadges
                        isVerified={partner.isVerified}
                        phoneVerified={partner.phoneVerified}
                        bankVerified={partner.bankVerified}
                        className="!justify-start"
                      />
                    </div>
                    {headline ? (
                      <p className="mt-1 text-sm font-medium text-[#2563EB]">
                        {headline}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-sm text-[#64748B]">
                  <p>
                    ★ {partner.ratingAvg.toFixed(1)} ({partner.ratingCount} đánh giá)
                  </p>
                  <p>{partner.completedJobs} việc hoàn thành</p>
                  <p>{formatWorkHours(provider.hoursWorked)} làm nghề này</p>
                  <p>{provider.experienceYears} năm kinh nghiệm</p>
                  {location ? <p>Khu vực: {location}</p> : null}
                  {partner.workModes?.length ? (
                    <p>
                      Hình thức:{' '}
                      {partner.workModes
                        .map((m) => (m === 'onsite' ? 'Tại chỗ' : 'Online'))
                        .join(' · ')}
                    </p>
                  ) : null}
                  {partner.responseMinutes ? (
                    <p>Phản hồi ~{partner.responseMinutes} phút</p>
                  ) : null}
                  <p>
                    {partner.acceptingJobs === false ? (
                      <span className="font-semibold text-[#EA580C]">
                        Tạm nghỉ nhận việc
                      </span>
                    ) : (
                      <span className="font-semibold text-[#2563EB]">
                        Đang nhận việc
                      </span>
                    )}
                  </p>
                  <p className="font-extrabold text-[#17233A]">
                    {formatPrice(provider.price)} / {unit}
                  </p>
                </div>
                {skills.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {skills.slice(0, 5).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md bg-[#EFF6FF] px-1.5 py-0.5 text-[11px] font-semibold text-[#2563EB]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}
                {provider.includes ? (
                  <p className="mt-2 line-clamp-2 text-xs text-[#64748B]">
                    {provider.includes}
                  </p>
                ) : null}
                {partner.bio ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#64748B]">
                    {partner.bio}
                  </p>
                ) : null}
                <p className="mt-3 text-sm font-bold text-[#2563EB]">
                  Nhấp thẻ để xem hồ sơ ›
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </article>
  );
}
