import { Link } from 'react-router-dom';
import { formatPrice } from '../../services/api';
import type { BookingApplication } from '../../types/catalog';
import {
  AvatarLevelOverlay,
  PartnerVerificationBadges,
} from '../ui/partner-badges';

type Props = {
  applications: BookingApplication[];
  serviceId?: string;
  selecting?: boolean;
  onSelect: (applicationId: string) => void;
  matchingDeadlineAt?: string | null;
};

function formatWorkHours(onlineSeconds: number) {
  const hours = Math.round(onlineSeconds / 3600);
  return `${hours} giờ làm`;
}

function ApplicantCard({
  app,
  serviceId,
  selecting,
  onSelect,
}: {
  app: BookingApplication;
  serviceId?: string;
  selecting?: boolean;
  onSelect: (id: string) => void;
}) {
  const profile = app.partner?.partnerProfile;
  const partnerId = app.partner?.id ?? app.partnerId;
  const profileTo = partnerId ? `/user/${partnerId}` : null;
  const avatarUrl = profile?.avatarUrl;
  const level = profile?.level;
  const isVerified = profile?.isVerified;
  const phoneVerified = profile?.phoneVerified;
  const bankVerified = profile?.bankVerified;
  const ratingAvg = profile?.ratingAvg;
  const ratingCount = profile?.ratingCount ?? 0;
  const onlineSeconds = profile?.onlineSeconds ?? 0;
  const reputationPoints =
    app.partner?.reputationPeriods?.[0]?.currentPoints ?? null;

  const offeringPrice =
    serviceId && profile?.offerings
      ? profile.offerings.find((o) => o.serviceId === serviceId)?.price ?? null
      : null;

  const avatar = avatarUrl ? (
    <img
      src={avatarUrl}
      alt=""
      className="h-16 w-16 rounded-full border-2 border-amber-300 object-cover shadow"
    />
  ) : (
    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--color-line)] bg-[var(--color-canvas)] text-2xl font-bold text-[var(--color-muted)]">
      {app.partner?.fullName?.charAt(0) ?? '?'}
    </div>
  );

  const profileBlock = (
    <>
      <div className="shrink-0">
        {level != null ? (
          <AvatarLevelOverlay level={level}>{avatar}</AvatarLevelOverlay>
        ) : (
          avatar
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-base font-extrabold text-[var(--color-ink)]">
            {app.partner?.fullName ?? 'Người làm'}
          </p>
          <PartnerVerificationBadges
            isVerified={!!isVerified}
            phoneVerified={!!phoneVerified}
            bankVerified={!!bankVerified}
            className="!justify-start"
          />
        </div>

        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
          {profile?.headline || 'Freelancer trên Dich Vụ Ơi'}
        </p>

        {/* Stats row */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {reputationPoints != null ? (
            <span className="text-[var(--color-ink)]">
              <span className="font-semibold text-[var(--color-muted)]">
                UY TÍN
              </span>{' '}
              <span className="font-extrabold">{reputationPoints}</span>
              <span className="text-xs text-[var(--color-muted)]">
                /1000
              </span>
            </span>
          ) : null}

          {ratingAvg != null && ratingAvg > 0 ? (
            <span className="inline-flex items-center gap-1">
              <span className="text-amber-500">★</span>
              <span className="font-bold">{ratingAvg.toFixed(1)}</span>
              <span className="text-xs text-[var(--color-muted)]">
                ({ratingCount})
              </span>
            </span>
          ) : null}

          <span className="inline-flex items-center gap-1 text-[var(--color-muted)]">
            ◷ {formatWorkHours(onlineSeconds)}
          </span>
        </div>

        {/* Offering price */}
        {offeringPrice != null ? (
          <p className="mt-2 text-lg font-extrabold text-amber-600">
            {formatPrice(offeringPrice)}
            <span className="text-xs font-semibold text-[var(--color-muted)]">
              /gói
            </span>
          </p>
        ) : null}

        {app.note ? (
          <p className="mt-1.5 line-clamp-2 text-xs text-[var(--color-ink)]">
            {app.note}
          </p>
        ) : null}

        <p className="mt-1 text-[11px] text-[var(--color-muted)]">
          Cọc ứng tuyển: {formatPrice(app.depositAmount)}
        </p>
      </div>
    </>
  );

  return (
    <li className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-sm">
      <div className="flex gap-4 p-4">
        {profileTo ? (
          <Link
            to={profileTo}
            className="flex min-w-0 flex-1 gap-4 rounded-xl outline-none transition hover:bg-[var(--color-canvas)]/60 focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
            aria-label={`Xem hồ sơ ${app.partner?.fullName ?? 'người làm'}`}
          >
            {profileBlock}
          </Link>
        ) : (
          <div className="flex min-w-0 flex-1 gap-4">{profileBlock}</div>
        )}

        {/* CTA */}
        <div className="flex shrink-0 items-start">
          <button
            type="button"
            disabled={selecting}
            onClick={() => onSelect(app.id)}
            className="rounded-xl bg-[var(--color-ink)] px-4 py-2.5 text-sm font-bold text-white shadow transition hover:-translate-y-0.5 hover:bg-[var(--color-ink)]/90 disabled:opacity-60"
          >
            Chọn làm việc
          </button>
        </div>
      </div>
    </li>
  );
}

export function BookingApplicantsList({
  applications,
  serviceId,
  selecting,
  onSelect,
  matchingDeadlineAt,
}: Props) {
  const applied = applications.filter((a) => a.status === 'APPLIED');
  const others = applications.filter((a) => a.status !== 'APPLIED');

  return (
    <section className="glass-card space-y-3 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-[#172033]">
          Ứng viên ứng tuyển
        </h2>
        <p className="mt-0.5 text-xs text-[#7C8799]">
          Người làm đặt cọc 10% để vào list. Bạn chọn 1 người để giao việc.
          {matchingDeadlineAt
            ? ` Hạn ứng tuyển: ${new Date(matchingDeadlineAt).toLocaleString('vi-VN')}.`
            : null}
        </p>
      </div>

      {applied.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-[#172033]/12 bg-white/40 px-3 py-4 text-center text-sm text-[#7C8799]">
          Chưa có ai ứng tuyển. Đơn đang hiện trên hàng chờ người làm.
        </p>
      ) : (
        <ul className="space-y-3">
          {applied.map((app) => (
            <ApplicantCard
              key={app.id}
              app={app}
              serviceId={serviceId}
              selecting={selecting}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}

      {others.length > 0 ? (
        <p className="text-[11px] text-[var(--color-muted)]">
          Đã xử lý: {others.length} hồ sơ (từ chối / hoàn cọc / đã chọn).
        </p>
      ) : null}
    </section>
  );
}
