import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { SectionHeaderBar } from '../components/home/section-header-bar';
import { PartnerProfileHeroCard } from '../components/partner/partner-profile-hero-card';
import { SquareImageSlider } from '../components/partner/square-image-slider';
import { StarIcon } from '../components/ui/icon';
import {
  prefetchPublicPartnerPost,
  seedDetailFromPublicProfile,
} from '../lib/prefetch-public-partner-post';
import { publicPartnerQueryOptions } from '../lib/query-client';
import { api, formatPrice, formatPriceNumber } from '../services/api';
import { resolveOfferingPriceRange } from '../utils/market-price';
import type { PublicPartnerProfile } from '../types/auth';
import { offeringColor } from '../utils/catalog-colors';
import { mediaSrc } from '../utils/media-src';

type PartnerOffering = PublicPartnerProfile['offerings'][number];
type ServicePost = PublicPartnerProfile['servicePosts'][number];
type Review = PublicPartnerProfile['reviews'][number];

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
  reviews: Review[];
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
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/60">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(count / total) * 100}%`,
                backgroundColor: accent ?? 'var(--color-brand)',
              }}
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

function GigCard({
  post,
  offering,
  partnerUserId,
  partnerName,
}: {
  post: ServicePost;
  offering?: PartnerOffering;
  partnerUserId: string;
  partnerName: string;
}) {
  const queryClient = useQueryClient();
  const imgs = (() => {
    if (post.images?.length) return post.images;
    const raw = (post as { imagesJson?: string }).imagesJson;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          const urls = parsed.filter((u): u is string => typeof u === 'string');
          if (urls.length) return urls;
        }
      } catch {
        /* ignore */
      }
    }
    return post.coverUrl ? [post.coverUrl] : [];
  })();
  const groupSlug = post.service.category?.group.slug;
  const color = groupSlug ? offeringColor(groupSlug) : null;
  const title = post.title?.trim() || offering?.headline?.trim() || post.service.name;
  const detailTo = `/user/${partnerUserId}/dich-vu/${post.id}`;
  const hireTo = `/dich-vu/${post.service.slug}?partner=${partnerUserId}`;
  const ratingAvg = offering?.ratingAvg ?? 0;
  const ratingCount = offering?.ratingCount ?? 0;
  const priceRange = resolveOfferingPriceRange({
    price: post.price ?? offering?.price,
    priceMin: post.priceMin ?? offering?.priceMin,
    priceMax: post.priceMax ?? offering?.priceMax,
  });
  const unit = offering?.service.unit ?? post.service.unit;

  const warmDetail = () => {
    const profile = queryClient.getQueryData<PublicPartnerProfile>([
      'partner',
      'public',
      partnerUserId,
    ]);
    prefetchPublicPartnerPost(queryClient, partnerUserId, post.id, {
      seed: profile ? seedDetailFromPublicProfile(profile, post.id) : null,
      images: imgs,
    });
  };

  return (
    <article
      className="glass-card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(23,32,51,0.08)]"
      onMouseEnter={warmDetail}
      onFocusCapture={warmDetail}
      onTouchStart={warmDetail}
    >
      <div className="relative">
        {imgs.length > 0 ? (
          <SquareImageSlider images={imgs} resolveSrc={mediaSrc} variant="cover" className="" />
        ) : (
          <div
            className="flex aspect-[16/10] w-full items-center justify-center"
            style={{ backgroundColor: color?.soft ?? 'var(--color-brand-soft)' }}
          >
            <span
              className="text-3xl font-extrabold"
              style={{ color: color?.main ?? 'var(--color-brand)' }}
            >
              {post.service.name.slice(0, 1)}
            </span>
          </div>
        )}
        <Link
          to={detailTo}
          className="absolute inset-0 z-[1]"
          aria-label={`Xem ${title}`}
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {post.service.name}
        </p>
        <Link
          to={detailTo}
          className="line-clamp-2 text-base font-extrabold leading-snug text-[var(--color-navy)] hover:text-[var(--color-brand-deep)]"
        >
          {title}
        </Link>
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <span className="font-semibold text-[var(--color-ink)]">{partnerName}</span>
          <StarRow rating={ratingCount > 0 ? Math.round(ratingAvg) : 0} />
          <span>
            {ratingCount > 0 ? ratingAvg.toFixed(1) : '0'} ({ratingCount})
          </span>
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-white/50 pt-2.5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Giá chào
            </p>
            {priceRange ? (
              <p className="whitespace-nowrap text-lg font-extrabold leading-tight text-[var(--color-sale)]">
                {priceRange.max > priceRange.min ? (
                  <>
                    {formatPriceNumber(priceRange.min)}
                    <span className="mx-0.5 font-semibold text-[var(--color-muted)]">–</span>
                    {formatPriceNumber(priceRange.max)}
                    <span className="ml-0.5">VNĐ</span>
                  </>
                ) : (
                  formatPrice(priceRange.min)
                )}
                <span className="text-xs font-semibold text-[var(--color-muted)]">/{unit}</span>
              </p>
            ) : (
              <p className="text-sm font-semibold text-[var(--color-muted)]">Liên hệ đặt lịch</p>
            )}
          </div>
          <Link to={hireTo} className="btn-primary shrink-0 px-3 py-2 text-xs">
            Thuê
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Chỉ các nghề đã có bài đăng (servicePosts đã duyệt). */
function GigsGrid({
  offerings,
  posts,
  partnerUserId,
  partnerName,
}: {
  offerings: PartnerOffering[];
  posts: ServicePost[];
  partnerUserId: string;
  partnerName: string;
}) {
  if (posts.length === 0) {
    return (
      <section id="partner-gigs" className="glass-card p-5 sm:p-6">
        <p className="text-[var(--glass-muted,#7c8799)]">
          Chưa có bài viết dịch vụ đã duyệt.
        </p>
      </section>
    );
  }

  const offeringByService = new Map(offerings.map((o) => [o.service.id, o]));

  return (
    <section id="partner-gigs" className="space-y-3">
      <SectionHeaderBar
        icon="briefcase"
        title={`Dịch vụ của ${partnerName}`}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <GigCard
            key={post.id}
            post={post}
            offering={offeringByService.get(post.serviceId)}
            partnerUserId={partnerUserId}
            partnerName={partnerName}
          />
        ))}
      </div>
    </section>
  );
}

function ReviewsSection({
  reviews,
  offerings,
  filterServiceId,
  onFilterChange,
}: {
  reviews: Review[];
  offerings: PartnerOffering[];
  filterServiceId: string | null;
  onFilterChange: (serviceId: string | null) => void;
}) {
  const filtered = filterServiceId
    ? reviews.filter(
        (r) =>
          r.serviceId === filterServiceId ||
          offerings.some(
            (o) => o.service.id === filterServiceId && o.service.slug === r.serviceSlug,
          ),
      )
    : reviews;

  const avg =
    filtered.length > 0
      ? filtered.reduce((sum, r) => sum + r.rating, 0) / filtered.length
      : 0;

  const accentOffering = filterServiceId
    ? offerings.find((o) => o.service.id === filterServiceId)
    : null;
  const accent = accentOffering?.service.category?.group.slug
    ? offeringColor(accentOffering.service.category.group.slug).main
    : undefined;

  return (
    <section id="partner-reviews" className="space-y-3">
      <SectionHeaderBar
        icon="star"
        title="Đánh giá"
        action={
          offerings.length > 1 ? (
            <div className="flex flex-wrap justify-end gap-1.5">
              <button
                type="button"
                onClick={() => onFilterChange(null)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  filterServiceId === null
                    ? 'bg-white/20 text-white ring-1 ring-white/35'
                    : 'bg-white/10 text-white/80 ring-1 ring-white/20 hover:bg-white/15'
                }`}
              >
                Tất cả
              </button>
              {offerings.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onFilterChange(o.service.id)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    filterServiceId === o.service.id
                      ? 'bg-white/20 text-white ring-1 ring-white/35'
                      : 'bg-white/10 text-white/80 ring-1 ring-white/20 hover:bg-white/15'
                  }`}
                >
                  {o.service.name}
                </button>
              ))}
            </div>
          ) : null
        }
      />

      {filtered.length === 0 ? (
        <div className="glass-card p-4 sm:p-5">
          <p className="text-sm text-[var(--color-muted)]">Chưa có đánh giá công khai.</p>
        </div>
      ) : (
        <div className="glass-card grid gap-5 p-4 sm:p-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/40 p-4 lg:items-stretch">
            <div className="text-center">
              <p
                className="text-4xl font-extrabold"
                style={{ color: accent ?? 'var(--color-brand-deep)' }}
              >
                {avg.toFixed(1)}
              </p>
              <StarRow rating={Math.round(avg)} />
              <p className="mt-1 text-xs text-[var(--color-muted)]">{filtered.length} đánh giá</p>
            </div>
            <div className="mt-2 w-full">
              <RatingBreakdown reviews={filtered} accent={accent} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((r) => (
              <article
                key={r.id}
                className="rounded-2xl border border-white/70 bg-white/45 p-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">{r.fromName}</p>
                  <StarRow rating={r.rating} />
                </div>
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                  {r.serviceName} · {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                </p>
                {r.comment ? (
                  <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-[var(--color-ink)]">
                    {r.comment}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function PartnerProfileSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-5" aria-busy="true" aria-label="Đang tải hồ sơ">
      <section className="overflow-hidden rounded-[22px] border border-[rgba(150,180,210,0.25)] bg-white p-5 shadow-[0_8px_24px_rgba(23,35,58,0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="mx-auto h-[7.5rem] w-[7.5rem] animate-pulse rounded-[17px] bg-[#E5EAF2] sm:mx-0" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-7 w-2/5 animate-pulse rounded bg-[#E5EAF2]" />
            <div className="h-4 w-3/5 animate-pulse rounded bg-[#E5EAF2]" />
            <div className="flex gap-2">
              <div className="h-8 w-16 animate-pulse rounded-lg bg-[#E5EAF2]" />
              <div className="h-8 w-20 animate-pulse rounded-lg bg-[#E5EAF2]" />
            </div>
            <div className="h-4 w-4/5 animate-pulse rounded bg-[#E5EAF2]" />
          </div>
        </div>
        <div className="mt-5 h-2.5 animate-pulse rounded-full bg-[#E5EAF2]" />
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-64 animate-pulse rounded-[20px] bg-white/45" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-[20px] bg-white/45" />
    </div>
  );
}

export function PartnerProfilePage() {
  const { userId = '' } = useParams();
  const [reviewFilterServiceId, setReviewFilterServiceId] = useState<string | null>(null);

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

  if (isLoading && !data) return <PartnerProfileSkeleton />;
  if (isError || !data) {
    return (
      <div className="glass-card p-5 sm:p-6">
        <p className="text-red-600">Không tìm thấy hồ sơ người làm.</p>
        <Link to="/" className="mt-3 inline-block text-[var(--color-brand-deep)]">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className={`space-y-5 sm:space-y-6 ${isFetching ? 'opacity-95' : ''}`}>
      <PartnerProfileHeroCard data={data} />
      {(data.gallery?.length ?? 0) > 0 ? (
        <section className="space-y-3">
          <SectionHeaderBar
            icon="camera"
            title="Portfolio"
            subtitle="Ảnh minh họa công việc đã làm"
          />
          <div className="glass-card overflow-hidden p-4 sm:p-5">
            <SquareImageSlider
              images={data.gallery}
              resolveSrc={mediaSrc}
              variant="gallery"
            />
          </div>
        </section>
      ) : null}
      <GigsGrid
        offerings={offerings}
        posts={data.servicePosts ?? []}
        partnerUserId={data.userId}
        partnerName={data.fullName}
      />
      <ReviewsSection
        reviews={data.reviews ?? []}
        offerings={offerings}
        filterServiceId={reviewFilterServiceId}
        onFilterChange={setReviewFilterServiceId}
      />
    </div>
  );
}
