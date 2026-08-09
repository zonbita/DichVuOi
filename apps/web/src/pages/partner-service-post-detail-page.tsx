import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SquareImageSlider } from '../components/partner/square-image-slider';
import { AvatarLevelOverlay, PartnerVerificationBadges } from '../components/ui/partner-badges';
import { Icon, StarIcon } from '../components/ui/icon';
import { RichPostBody } from '../components/ui/simple-rich-editor';
import { api, formatPrice, formatPriceNumber } from '../services/api';
import { mediaSrc } from '../utils/media-src';

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} sao`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} className="h-3.5 w-3.5" tone={n <= rating ? 'gold' : 'muted'} />
      ))}
    </span>
  );
}

function SellerAvatar({ name, src }: { name: string; src?: string | null }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setBroken(true)}
        className="h-full w-full object-cover"
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
    <div className="flex h-full w-full items-center justify-center bg-[var(--color-brand-soft)] text-xl font-extrabold text-[var(--color-brand-deep)]">
      {initials || '?'}
    </div>
  );
}

/** Trang chi tiết bài đăng dịch vụ — layout gần Fiverr gig. */
export function PartnerServicePostDetailPage() {
  const { userId = '', postId = '' } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['partner', 'public-post', userId, postId],
    queryFn: () => api.getPublicPartnerPost(userId, postId),
    enabled: Boolean(userId && postId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Đang tải bài đăng">
        <div className="h-8 w-2/3 animate-pulse rounded bg-white/50" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="h-72 animate-pulse rounded-[20px] bg-white/45" />
          <div className="h-64 animate-pulse rounded-[20px] bg-white/45" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="glass-card p-5 sm:p-6">
        <p className="text-red-600">Không tìm thấy bài đăng dịch vụ.</p>
        <Link
          to={userId ? `/user/${userId}` : '/'}
          className="mt-3 inline-block font-semibold text-[var(--color-brand-deep)]"
        >
          {userId ? 'Về hồ sơ người làm' : 'Về trang chủ'}
        </Link>
      </div>
    );
  }

  const { post, seller, offering, reviews } = data;
  const imgs =
    post.images?.length > 0 ? post.images : post.coverUrl ? [post.coverUrl] : [];
  const unit = offering?.unit ?? post.service.unit;
  const priceMin = offering?.priceMin ?? offering?.price ?? null;
  const priceMax = offering?.priceMax ?? priceMin;
  const hireTo = `/dich-vu/${post.service.slug}?partner=${seller.userId}`;
  const serviceRatingAvg = offering?.ratingAvg ?? 0;
  const serviceRatingCount = offering?.ratingCount ?? reviews.length;

  const priceLabel =
    priceMin != null
      ? priceMax != null && priceMax > priceMin
        ? `${formatPriceNumber(priceMin)} – ${formatPriceNumber(priceMax)} VNĐ`
        : formatPrice(priceMin)
      : 'Liên hệ';

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-muted)]">
        <Link to={`/user/${seller.userId}`} className="hover:text-[var(--color-brand-deep)]">
          {seller.fullName}
        </Link>
        <span>/</span>
        <span className="text-[var(--color-ink)]">{post.service.name}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-start">
        <div className="min-w-0 space-y-5">
          <section className="glass-card overflow-hidden">
            {imgs.length > 0 ? (
              <SquareImageSlider
                images={imgs}
                resolveSrc={mediaSrc}
                variant="gallery"
                className="rounded-none"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-[var(--color-brand-soft)] text-4xl font-extrabold text-[var(--color-brand)] sm:aspect-[16/10]">
                {post.service.name.slice(0, 1)}
              </div>
            )}
            <div className="space-y-3 p-3.5 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                {post.service.category?.group.name
                  ? `${post.service.category.group.name} · ${post.service.category.name}`
                  : post.service.name}
              </p>
              <h1 className="text-xl font-extrabold leading-tight text-[var(--color-navy)] sm:text-2xl lg:text-3xl">
                {post.title}
              </h1>
              <p className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
                <StarRow
                  rating={serviceRatingCount > 0 ? Math.round(serviceRatingAvg) : 0}
                />
                <span className="font-semibold text-[var(--color-ink)]">
                  {serviceRatingCount > 0 ? serviceRatingAvg.toFixed(1) : '0'}
                </span>
                <span>({serviceRatingCount} đánh giá nghề này)</span>
              </p>

              <div className="border-t border-white/50 pt-4">
                <h2 className="text-lg font-extrabold text-[var(--color-navy)]">
                  Về dịch vụ này
                </h2>
                <div className="mt-3">
                  <RichPostBody html={post.body} />
                </div>
                {(offering?.includes || offering?.excludes || offering?.coverageNote) && (
                  <div className="mt-5 space-y-2 border-t border-white/50 pt-4 text-sm">
                    {offering.includes ? (
                      <p className="flex gap-2 text-[var(--color-muted)]">
                        <Icon
                          name="check"
                          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]"
                        />
                        <span>
                          <span className="font-semibold text-[var(--color-ink)]">Bao gồm:</span>{' '}
                          {offering.includes}
                        </span>
                      </p>
                    ) : null}
                    {offering.excludes ? (
                      <p className="flex gap-2 text-[var(--color-muted)]">
                        <Icon name="minus" className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          <span className="font-semibold text-[var(--color-ink)]">Không gồm:</span>{' '}
                          {offering.excludes}
                        </span>
                      </p>
                    ) : null}
                    {offering.coverageNote ? (
                      <p className="flex gap-2 text-[var(--color-muted)]">
                        <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{offering.coverageNote}</span>
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="glass-card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-[var(--color-navy)]">
              <Icon name="chart" className="h-5 w-5 text-[var(--color-brand)]" />
              Đánh giá
            </h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                Chưa có đánh giá cho nghề này.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {reviews.map((r) => (
                  <article
                    key={r.id}
                    className="rounded-2xl border border-white/70 bg-white/45 p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold">{r.fromName}</p>
                      <StarRow rating={r.rating} />
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                    {r.comment ? (
                      <p className="mt-2 line-clamp-5 text-sm leading-relaxed text-[var(--color-ink)]">
                        {r.comment}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="glass-card min-w-0 overflow-hidden p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Giá chào
            </p>
            {priceMin != null ? (
              <p className="mt-1 min-w-0 break-words text-base font-extrabold leading-snug tabular-nums text-[var(--color-sale)] sm:text-lg lg:text-xl">
                {priceMax != null && priceMax > priceMin ? (
                  <>
                    {formatPriceNumber(priceMin)}
                    <span className="mx-0.5 font-semibold text-[var(--color-muted)]">–</span>
                    {formatPriceNumber(priceMax)}
                    <span className="ml-1 text-sm font-bold sm:text-base">VNĐ</span>
                  </>
                ) : (
                  formatPrice(priceMin)
                )}
                <span className="text-sm font-semibold text-[var(--color-muted)]">/{unit}</span>
              </p>
            ) : (
              <p className="mt-1 text-base font-bold text-[var(--color-muted)]">Liên hệ đặt lịch</p>
            )}
            {offering?.headline ? (
              <p className="mt-2 text-sm text-[var(--color-muted)]">{offering.headline}</p>
            ) : null}
            <Link
              to={hireTo}
              className="btn-primary mt-4 hidden w-full items-center justify-center py-3 text-sm lg:inline-flex"
            >
              Thuê dịch vụ này
            </Link>
            <Link
              to={`/user/${seller.userId}`}
              className="mt-2 inline-flex w-full items-center justify-center rounded-[14px] border border-white/70 bg-white/50 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-white/80"
            >
              Xem hồ sơ người làm
            </Link>
          </section>

          <section className="glass-card p-4 transition hover:bg-white/90">
            <Link
              to={`/user/${seller.userId}`}
              className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
              aria-label={`Xem hồ sơ ${seller.fullName}`}
            >
              <div className="flex gap-3">
                <AvatarLevelOverlay level={seller.level} className="block w-16 shrink-0">
                  <div className="aspect-square w-full overflow-hidden rounded-2xl">
                    <SellerAvatar
                      name={seller.fullName}
                      src={seller.avatarUrl ? mediaSrc(seller.avatarUrl) : null}
                    />
                  </div>
                </AvatarLevelOverlay>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-[var(--color-navy)] hover:text-[var(--color-brand-deep)]">
                    {seller.fullName}
                  </p>
                  <PartnerVerificationBadges
                    isVerified={seller.isVerified}
                    phoneVerified={seller.phoneVerified}
                    bankVerified={seller.bankVerified}
                    className="!mt-1 !justify-start"
                  />
                  <p className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-[var(--color-muted)]">
                    <StarRow rating={Math.round(seller.ratingAvg)} />
                    <span>
                      {seller.ratingAvg.toFixed(1)} ({seller.ratingCount})
                    </span>
                  </p>
                </div>
              </div>
              {seller.headline ? (
                <p className="mt-3 text-sm font-semibold text-[var(--color-brand-deep)]">
                  {seller.headline}
                </p>
              ) : null}
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-muted)]">
                {seller.city ? (
                  <span className="inline-flex items-center gap-1">
                    <Icon name="pin" className="h-3.5 w-3.5" />
                    {seller.city}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <Icon name="clock" className="h-3.5 w-3.5" />
                  Phản hồi ~{seller.responseMinutes} phút
                </span>
                {seller.acceptingJobs ? (
                  <span className="font-semibold text-[var(--color-brand-deep)]">Đang nhận việc</span>
                ) : (
                  <span className="font-semibold text-amber-700">Tạm nghỉ</span>
                )}
              </p>
            </Link>
          </section>
        </aside>
      </div>

      {/* Sticky CTA — mobile / tablet */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-white/95 px-3 py-2.5 shadow-[0_-8px_24px_rgba(5,45,71,0.12)] backdrop-blur-md sm:py-3 lg:hidden">
        <div className="mx-auto flex max-w-[1396px] items-center gap-2.5 sm:gap-3">
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Giá chào
            </p>
            <p className="truncate text-sm font-extrabold tabular-nums leading-snug text-[var(--color-sale)] sm:text-base">
              {priceLabel}
              {priceMin != null ? (
                <span className="text-xs font-semibold text-[var(--color-muted)] sm:text-sm">
                  /{unit}
                </span>
              ) : null}
            </p>
          </div>
          <Link
            to={hireTo}
            className="btn-primary shrink-0 px-3 py-2 text-xs whitespace-nowrap sm:px-4 sm:py-2.5 sm:text-sm"
          >
            Thuê dịch vụ
          </Link>
        </div>
      </div>
    </div>
  );
}
