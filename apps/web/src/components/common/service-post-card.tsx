import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, formatPriceNumber } from '../../services/api';
import type { PublicServicePostListItem } from '../../types/public-service-post';
import { offeringColor } from '../../utils/catalog-colors';
import { resolveOfferingPriceRange } from '../../utils/market-price';
import { ReputationProgressBar } from '../partner/reputation-progress-bar';
import { LevelBadgeGold } from '../ui/partner-badges';
import { StarIcon } from '../ui/icon';
import { UserAvatar } from '../ui/user-avatar';

function mediaSrc(url: string) {
  const apiBase = import.meta.env.VITE_API_URL ?? '';
  return url.startsWith('http') || url.startsWith('blob:') ? url : `${apiBase}${url}`;
}

type Props = {
  post: PublicServicePostListItem;
  layout?: 'rail' | 'fluid';
};

/** Card bài đăng — khớp mockup: cover sạch, avatar + cấp dưới ảnh. */
export function ServicePostCard({ post, layout = 'rail' }: Props) {
  const [imgBroken, setImgBroken] = useState(false);
  const cover = post.images?.[0] ?? post.coverUrl;
  const showCover = Boolean(cover) && !imgBroken;
  const groupSlug = post.service.category?.group.slug;
  const color = groupSlug ? offeringColor(groupSlug) : null;
  const title = post.title?.trim() || post.service.name;
  const detailTo = `/user/${post.seller.userId}/dich-vu/${post.id}`;
  const hireTo = `/dich-vu/${post.service.slug}?partner=${post.seller.userId}`;
  const ratingAvg = post.seller.ratingAvg ?? 0;
  const ratingCount = post.seller.ratingCount ?? 0;
  const unit = post.service.unit?.trim() || 'gói';
  const priceRange = resolveOfferingPriceRange({
    price: post.price,
    priceMin: post.priceMin,
    priceMax: post.priceMax,
  });
  const widthClass =
    layout === 'fluid' ? 'w-full' : 'w-[220px] shrink-0 sm:w-[252px] md:w-[272px]';
  const accent = color?.main ?? 'var(--color-brand)';
  const soft = color?.soft ?? 'var(--color-brand-soft)';

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_12px_32px_rgba(5,45,71,0.11)] ring-1 ring-black/[0.04] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(5,45,71,0.15)] ${widthClass}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-canvas)]">
        {showCover ? (
          <img
            src={mediaSrc(cover!)}
            alt={title}
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
            onError={() => setImgBroken(true)}
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2 px-4"
            style={{
              background: `radial-gradient(ellipse 90% 80% at 30% 20%, ${soft} 0%, color-mix(in srgb, ${accent} 16%, white) 100%)`,
            }}
          >
            <span
              className="flex h-14 w-14 items-center justify-center rounded-[18px] text-2xl font-extrabold text-white shadow-[0_6px_16px_rgba(5,45,71,0.18)]"
              style={{
                background: `radial-gradient(circle at 30% 25%, color-mix(in srgb, ${accent} 75%, white), ${accent})`,
              }}
            >
              {post.service.name.slice(0, 1)}
            </span>
            <span className="line-clamp-1 text-center text-[11px] font-semibold text-[var(--color-navy)]/70">
              {post.service.name}
            </span>
          </div>
        )}
        <Link to={detailTo} className="absolute inset-0 z-[1]" aria-label={`Xem ${title}`} />
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3.5">
        <div className="flex items-start gap-3">
          <Link
            to={`/user/${post.seller.userId}`}
            className="flex w-[52px] shrink-0 flex-col items-center gap-1"
            aria-label={post.seller.fullName}
          >
            <UserAvatar
              name={post.seller.fullName}
              src={post.seller.avatarUrl}
              userId={post.seller.userId}
              size="sm"
              className="!h-10 !w-10 !ring-2 !ring-[var(--color-line)] shadow-[0_3px_10px_rgba(5,45,71,0.12)]"
            />
            <LevelBadgeGold
              level={post.seller.level}
              variant="overlay"
              className="whitespace-nowrap"
            />
          </Link>

          <div className="min-w-0 flex-1 pt-0.5">
            <Link
              to={`/user/${post.seller.userId}`}
              className="block truncate text-[13px] font-bold tracking-tight text-[var(--color-navy)] hover:text-[var(--color-brand-deep)]"
            >
              {post.seller.fullName}
            </Link>
            <Link
              to={detailTo}
              className="mt-1 line-clamp-2 text-[15px] font-extrabold leading-snug tracking-tight text-[var(--color-navy)] transition hover:text-[var(--color-brand-deep)]"
            >
              {title}
            </Link>
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px]">
              <StarIcon
                className="h-3.5 w-3.5"
                tone={ratingCount > 0 ? 'gold' : 'muted'}
              />
              {ratingCount > 0 ? (
                <>
                  <span className="font-bold text-[var(--color-navy)]">
                    {ratingAvg.toFixed(1)}
                  </span>
                  <span className="font-medium text-[var(--color-muted)]">
                    ({ratingCount.toLocaleString('vi-VN')})
                  </span>
                </>
              ) : (
                <span className="font-medium text-[var(--color-muted)]">
                  Chưa có đánh giá
                </span>
              )}
            </p>
          </div>
        </div>

        {post.seller.reputation ? (
          <ReputationProgressBar
            reputation={post.seller.reputation}
            variant="compact"
            className="mt-3"
          />
        ) : null}

        <div className="mt-auto flex items-center justify-end border-t border-[var(--color-line)]/70 pt-3">
          {priceRange ? (
            <Link
              to={hireTo}
              className="inline-flex max-w-full items-baseline gap-1 rounded-full border border-[var(--color-line)] bg-white px-3.5 py-2 text-[13px] shadow-sm transition hover:border-[var(--color-brand)]/40 hover:bg-[var(--color-brand-soft)]"
            >
              <span className="whitespace-nowrap font-extrabold tabular-nums text-[var(--color-sale)]">
                {priceRange.max > priceRange.min ? (
                  <>
                    {formatPriceNumber(priceRange.min)}
                    <span className="mx-0.5 font-semibold text-[var(--color-muted)]">
                      –
                    </span>
                    {formatPriceNumber(priceRange.max)}
                    <span className="ml-0.5">VNĐ</span>
                  </>
                ) : (
                  formatPrice(priceRange.min)
                )}
                <span className="text-[11px] font-semibold text-[var(--color-muted)]">
                  /{unit}
                </span>
              </span>
            </Link>
          ) : (
            <Link
              to={hireTo}
              className="inline-flex items-center rounded-full border border-[var(--color-brand)]/45 bg-[var(--color-brand-soft)] px-4 py-2 text-[13px] font-bold text-[var(--color-brand-deep)] shadow-[0_2px_8px_rgba(0,156,149,0.12)] transition hover:border-[var(--color-brand)]/65 hover:bg-[var(--color-brand)]/15"
            >
              Báo giá
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
