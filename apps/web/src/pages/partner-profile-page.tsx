import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { FavoritePartnerButton } from '../components/partner/favorite-partner-button';
import { ReputationProgressBar } from '../components/partner/reputation-progress-bar';
import { AvatarLevelOverlay, PartnerVerificationBadges } from '../components/ui/partner-badges';
import { StarIcon, Icon } from '../components/ui/icon';
import { publicPartnerQueryOptions } from '../lib/query-client';
import { api, formatPrice, formatWorkHours } from '../services/api';
import type { PublicPartnerProfile } from '../types/auth';
import { offeringColor } from '../utils/catalog-colors';

type PartnerOffering = PublicPartnerProfile['offerings'][number];

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} sao`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} className="h-3.5 w-3.5" tone={n <= rating ? 'gold' : 'muted'} />
      ))}
    </span>
  );
}

function RatingBreakdown({
  reviews,
  accent,
}: {
  reviews: PublicPartnerProfile['reviews'];
  accent?: string;
}) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const total = reviews.length || 1;

  return (
    <div className="space-y-1.5">
      {counts.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2 text-sm">
          <span className="inline-flex w-8 shrink-0 items-center gap-0.5 font-semibold text-[var(--color-muted)]">
            {star}
            <StarIcon className="h-3 w-3" tone="gold" />
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-line)]">
            <div
              className="h-full rounded-full"
              style={{ width: `${(count / total) * 100}%`, backgroundColor: accent ?? 'var(--color-brand)' }}
            />
          </div>
          <span className="w-6 text-right text-xs text-[var(--color-muted)]">{count}</span>
        </div>
      ))}
    </div>
  );
}

function sortOfferingsByReviews(list: PartnerOffering[]) {
  return [...list].sort(
    (a, b) =>
      b.ratingCount - a.ratingCount ||
      b.ratingAvg - a.ratingAvg ||
      a.service.name.localeCompare(b.service.name, 'vi'),
  );
}

function OfferingRatingInline({ offering }: { offering: PartnerOffering }) {
  const avg = offering.ratingCount > 0 ? offering.ratingAvg.toFixed(1) : '0';
  const count = offering.ratingCount;
  return (
    <span className="inline-flex items-center gap-0.5">
      <StarIcon className="h-3 w-3 shrink-0" tone="gold" />
      <span>
        {avg} ({count})
      </span>
    </span>
  );
}

function OfferingNavColumn({
  offerings,
  activeId,
  onChange,
}: {
  offerings: PartnerOffering[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav
      className="border-b border-[var(--color-line)] lg:border-r lg:border-b-0"
      aria-label="Nghề đang nhận"
    >
      <ul className="no-scrollbar flex gap-2 overflow-x-auto p-2 lg:flex-col lg:gap-1.5 lg:overflow-x-visible lg:overflow-y-auto lg:p-3 lg:max-h-[min(70vh,720px)]">
        {offerings.map((offering) => {
          const selected = offering.id === activeId;
          const groupSlug = offering.service.category?.group.slug;
          const chipColor = offeringColor(groupSlug);

          return (
            <li key={offering.id} className="shrink-0 lg:shrink">
              <button
                type="button"
                aria-current={selected ? 'true' : undefined}
                onClick={() => onChange(offering.id)}
                className={`w-full min-w-[11rem] rounded-xl px-2.5 py-2.5 text-left text-sm transition-[color,background-color,box-shadow,border-color] duration-[180ms] ease-in-out lg:min-w-0 ${
                  selected
                    ? 'font-semibold shadow-sm'
                    : 'border border-[var(--color-line)] bg-white hover:bg-[var(--color-canvas)]'
                }`}
                style={
                  selected
                    ? {
                        backgroundColor: chipColor.soft,
                        color: chipColor.ink,
                        boxShadow: `inset 3px 0 0 ${chipColor.main}`,
                      }
                    : { color: 'var(--color-ink)' }
                }
              >
                <span className="block font-semibold leading-snug">{offering.service.name}</span>
                <span className="mt-1 block text-[var(--color-muted)]">
                  <OfferingRatingInline offering={offering} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function OfferingMetaLine({
  icon,
  children,
}: {
  icon: 'clock' | 'check' | 'minus' | 'pin';
  children: ReactNode;
}) {
  return (
    <p className="flex items-start gap-2 text-sm text-[var(--color-muted)]">
      <Icon name={icon} className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function OfferingDetailPanel({
  offering,
  reviews,
  partnerUserId,
  skills,
}: {
  offering: PartnerOffering;
  reviews: PublicPartnerProfile['reviews'];
  partnerUserId: string;
  skills: string[];
}) {
  const groupSlug = offering.service.category?.group.slug;
  const color = groupSlug ? offeringColor(groupSlug) : null;
  const serviceReviews = reviews.filter((r) => r.serviceSlug === offering.service.slug);

  return (
    <div className="space-y-5">
      <article className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-white shadow-[var(--shadow-card)]">
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            {offering.service.category ? (
              <p className="mb-1 text-xs font-semibold" style={{ color: color?.main }}>
                {offering.service.category.group.name}
                {' · '}
                {offering.service.category.name}
              </p>
            ) : null}
            <h2 className="text-xl font-extrabold text-[var(--color-navy)]">{offering.service.name}</h2>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
              <StarRow rating={offering.ratingCount > 0 ? Math.round(offering.ratingAvg) : 0} />
              <span className="font-semibold text-[var(--color-ink)]">
                {offering.ratingCount > 0 ? offering.ratingAvg.toFixed(1) : '0'}
              </span>
              <span>({offering.ratingCount} sao)</span>
            </p>
            {skills.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-ink)]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-4 space-y-2">
              {offering.headline ? (
                <OfferingMetaLine icon="check">{offering.headline}</OfferingMetaLine>
              ) : null}
              <OfferingMetaLine icon="clock">
                {formatWorkHours(offering.hoursWorked)} làm · {offering.experienceYears} năm KN
                {offering.coverageNote ? ` · ${offering.coverageNote}` : ''}
              </OfferingMetaLine>
              {offering.includes ? (
                <OfferingMetaLine icon="check">Bao gồm: {offering.includes}</OfferingMetaLine>
              ) : null}
              {offering.excludes ? (
                <OfferingMetaLine icon="minus">Không gồm: {offering.excludes}</OfferingMetaLine>
              ) : null}
            </div>
          </div>
          <div className="border-t border-[var(--color-line)] px-4 py-4 sm:px-5 lg:flex lg:w-[11.5rem] lg:shrink-0 lg:flex-col lg:justify-center lg:border-t-0 lg:border-l lg:py-5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Giá chào
            </p>
            <p className="mt-1 text-2xl font-extrabold leading-tight text-[var(--color-sale)]">
              {formatPrice(offering.price)}
            </p>
            <p className="text-sm font-semibold text-[var(--color-muted)]">/{offering.service.unit}</p>
            <Link
              to={`/dich-vu/${offering.service.slug}?partner=${partnerUserId}`}
              className="btn-primary mt-4 inline-flex w-full items-center justify-center px-4 py-2.5 text-sm"
            >
              Thuê nghề này
            </Link>
          </div>
        </div>
      </article>

      {offering.ratingCount > 0 ? (
        <div className="flex flex-col gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] p-4 sm:flex-row sm:items-center">
          <div className="text-center sm:min-w-[7rem]">
            <p className="text-4xl font-extrabold" style={{ color: color?.ink ?? 'var(--color-brand-deep)' }}>
              {offering.ratingAvg.toFixed(1)}
            </p>
            <StarRow rating={Math.round(offering.ratingAvg)} />
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {offering.ratingCount} đánh giá
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <RatingBreakdown reviews={serviceReviews} accent={color?.main} />
          </div>
        </div>
      ) : null}

      <div>
        <h3 className="flex items-center gap-2 text-base font-extrabold text-[var(--color-navy)]">
          <Icon name="message" className="h-5 w-5 text-[var(--color-brand)]" />
          Đánh giá từ khách
          {serviceReviews.length ? ` (${serviceReviews.length})` : ''}
        </h3>
        {serviceReviews.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Chưa có đánh giá công khai cho nghề này trên sàn.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {serviceReviews.map((r) => (
              <article
                key={r.id}
                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">{r.fromName}</p>
                  <StarRow rating={r.rating} />
                </div>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                </p>
                {r.comment ? (
                  <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-ink)]">
                    {r.comment}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function Avatar({
  name,
  src,
  variant = 'compact',
}: {
  name: string;
  src?: string | null;
  variant?: 'compact' | 'sidebar';
}) {
  const [broken, setBroken] = useState(false);
  const isSidebar = variant === 'sidebar';

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setBroken(true)}
        className={
          isSidebar
            ? 'aspect-square w-full object-cover'
            : 'h-24 w-24 rounded-2xl object-cover ring-1 ring-[var(--color-brand)]/20'
        }
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className={
        isSidebar
          ? 'flex aspect-square w-full items-center justify-center bg-[var(--color-brand-soft)] text-4xl font-extrabold text-[var(--color-brand-deep)]'
          : 'flex h-24 w-24 items-center justify-center rounded-2xl bg-[var(--color-brand-soft)] text-2xl font-extrabold text-[var(--color-brand-deep)]'
      }
    >
      {initials || '?'}
    </div>
  );
}

function ProfileSidebar({
  data,
  offerings,
  onViewServices,
}: {
  data: PublicPartnerProfile;
  offerings: PartnerOffering[];
  onViewServices: () => void;
}) {
  const gallery = data.gallery ?? [];

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <section className="surface-card overflow-hidden">
        <AvatarLevelOverlay level={data.level} className="block w-full">
          <Avatar name={data.fullName} src={data.avatarUrl} variant="sidebar" />
        </AvatarLevelOverlay>

        {gallery.length > 0 ? (
          <div className="grid grid-cols-5 gap-1 border-t border-[var(--color-line)] p-2">
            {gallery.slice(0, 5).map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-md ring-1 ring-[var(--color-line)]"
              >
                <img
                  src={url}
                  alt="Portfolio"
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        ) : null}

        <div className="space-y-2 border-t border-[var(--color-line)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-extrabold leading-tight">{data.fullName}</h1>
                <PartnerVerificationBadges
                  isVerified={data.isVerified}
                  phoneVerified={data.phoneVerified}
                  bankVerified={data.bankVerified}
                />
              </div>
            </div>
            <FavoritePartnerButton partnerUserId={data.userId} showLabel={false} />
          </div>
          {data.headline ? (
            <p className="text-sm font-semibold text-[var(--color-brand-deep)]">{data.headline}</p>
          ) : null}
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-muted)]">
            <StarRow rating={Math.round(data.ratingAvg)} />
            <span>
              {data.ratingAvg.toFixed(1)} ({data.ratingCount}) · {data.completedJobs} việc
            </span>
          </p>
          <p className="flex items-start gap-2 text-sm">
            {data.acceptingJobs ? (
              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)]">
                <Icon name="check" className="h-2.5 w-2.5 text-white" />
              </span>
            ) : (
              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500">
                <Icon name="clock" className="h-2.5 w-2.5 text-white" />
              </span>
            )}
            <span>
              {data.acceptingJobs ? (
                <span className="font-semibold text-[var(--color-brand-deep)]">Đang nhận việc</span>
              ) : (
                <span className="font-semibold text-amber-700">Tạm nghỉ nhận việc</span>
              )}
              {' · '}
              <span className="text-[var(--color-muted)]">Phản hồi ~{data.responseMinutes} phút</span>
            </span>
          </p>
          <p className="flex items-start gap-2 text-sm text-[var(--color-muted)]">
            <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {[
                data.city,
                ...data.districts.filter(
                  (d) =>
                    d.trim().toLocaleLowerCase('vi') !==
                    (data.city ?? '').trim().toLocaleLowerCase('vi'),
                ),
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </p>
          <p className="flex items-start gap-2 text-sm text-[var(--color-muted)]">
            <Icon name="laptop" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Hình thức:{' '}
              {data.workModes.map((m) => (m === 'onsite' ? 'Tại chỗ' : 'Online')).join(' · ')}
            </span>
          </p>
          {data.skills.length ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {data.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-[var(--color-brand-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-brand-deep)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : null}
          {data.reputation ? (
            <div className="border-t border-[var(--color-line)] pt-3">
              <ReputationProgressBar reputation={data.reputation} />
            </div>
          ) : null}
        </div>

        {offerings.length > 0 ? (
          <div className="space-y-2 border-t border-[var(--color-line)] p-4">
            {(() => {
              const top = offerings[0];
              return top ? (
                <p className="text-center text-sm text-[var(--color-muted)]">
                  Từ{' '}
                  <span className="text-lg font-extrabold text-[var(--color-sale)]">
                    {formatPrice(top.price)}
                  </span>
                  <span>/{top.service.unit}</span>
                </p>
              ) : null;
            })()}
            <button type="button" onClick={onViewServices} className="btn-primary w-full py-2.5 text-sm">
              Đặt lịch ngay
            </button>
          </div>
        ) : null}
      </section>
    </aside>
  );
}

function PartnerProfileSkeleton() {
  return (
    <div
      className="grid w-full gap-5 lg:grid-cols-[minmax(260px,300px)_1fr] lg:items-start"
      aria-busy="true"
      aria-label="Đang tải hồ sơ"
    >
      <aside className="space-y-4">
        <section className="surface-card overflow-hidden">
          <div className="aspect-square w-full animate-pulse bg-[var(--color-line)]" />
          <div className="space-y-3 border-t border-[var(--color-line)] p-4">
            <div className="h-5 w-2/3 animate-pulse rounded bg-[var(--color-line)]" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--color-line)]" />
            <div className="h-4 w-full animate-pulse rounded bg-[var(--color-line)]" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--color-line)]" />
            <div className="mt-4 h-10 w-full animate-pulse rounded-full bg-[var(--color-line)]" />
          </div>
        </section>
      </aside>
      <div className="min-w-0">
        <section className="surface-card overflow-hidden">
          <div className="grid lg:grid-cols-[minmax(200px,240px)_1fr]">
            <div className="space-y-2 border-b border-[var(--color-line)] p-3 lg:border-r lg:border-b-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-lg bg-[var(--color-line)]"
                />
              ))}
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <div className="h-6 w-1/2 animate-pulse rounded bg-[var(--color-line)]" />
              <div className="h-4 w-full animate-pulse rounded bg-[var(--color-line)]" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--color-line)]" />
              <div className="mt-6 h-28 animate-pulse rounded-xl bg-[var(--color-line)]" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function PartnerProfilePage() {
  const { userId = '' } = useParams();
  const [activeOfferingId, setActiveOfferingId] = useState<string | null>(null);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['partner', 'public', userId],
    queryFn: () => api.getPublicPartner(userId),
    enabled: Boolean(userId),
    ...publicPartnerQueryOptions,
  });

  const offerings = useMemo(
    () => sortOfferingsByReviews(data?.offerings ?? []),
    [data?.offerings],
  );

  useEffect(() => {
    if (!offerings.length) {
      setActiveOfferingId(null);
      return;
    }
    setActiveOfferingId((current) =>
      current && offerings.some((o) => o.id === current) ? current : offerings[0].id,
    );
  }, [offerings]);

  const activeOffering = useMemo(
    () => offerings.find((o) => o.id === activeOfferingId) ?? offerings[0] ?? null,
    [offerings, activeOfferingId],
  );

  if (isLoading && !data) return <PartnerProfileSkeleton />;
  if (isError || !data) {
    return (
      <div>
        <p className="text-red-600">Không tìm thấy hồ sơ người làm.</p>
        <Link to="/" className="mt-3 inline-block text-[var(--color-brand-deep)]">
          Về trang chủ
        </Link>
      </div>
    );
  }

  const reviews = data.reviews ?? [];

  const scrollToServices = () => {
    if (offerings[0]) setActiveOfferingId(offerings[0].id);
    document.getElementById('partner-main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const selectOffering = (id: string) => {
    setActiveOfferingId(id);
  };

  return (
    <div
      className={`grid w-full gap-5 lg:grid-cols-[minmax(260px,300px)_1fr] lg:items-start ${
        isFetching ? 'opacity-95' : ''
      }`}
    >
      <ProfileSidebar
        data={data}
        offerings={offerings}
        onViewServices={scrollToServices}
      />

      <div id="partner-main" className="min-w-0">
        <section className="surface-card overflow-hidden">
          {offerings.length === 0 ? (
            <div className="p-5 sm:p-6">
              <p className="text-[var(--color-muted)]">
                Partner chưa gắn dịch vụ nào đang nhận việc.
              </p>
            </div>
          ) : activeOffering ? (
            <div className="grid lg:grid-cols-[minmax(200px,240px)_1fr] lg:items-start">
              <OfferingNavColumn
                offerings={offerings}
                activeId={activeOffering.id}
                onChange={selectOffering}
              />
              <div className="p-5 sm:p-6">
                <OfferingDetailPanel
                  offering={activeOffering}
                  reviews={reviews}
                  partnerUserId={data.userId}
                  skills={data.skills}
                />
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
