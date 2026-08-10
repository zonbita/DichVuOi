import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { prefetchPublicPartnerPost, seedDetailFromListItem } from '../../lib/prefetch-public-partner-post';
import { formatPrice, formatPriceNumber } from '../../services/api';
import type { PublicServicePostListItem } from '../../types/public-service-post';
import { offeringColor } from '../../utils/catalog-colors';
import { resolveOfferingPriceRange } from '../../utils/market-price';
import { ReputationProgressBar } from '../partner/reputation-progress-bar';
import { AvatarLevelOverlay } from '../ui/partner-badges';
import { StarIcon } from '../ui/icon';
import { UserAvatar } from '../ui/user-avatar';
import { mediaSrc } from '../../utils/media-src';

type Props = {
  post: PublicServicePostListItem;
  layout?: 'rail' | 'fluid';
};

/** Card bài đăng — cả card là 1 link; footer hiện giá (không còn «Báo giá»). */
export function ServicePostCard({ post, layout = 'rail' }: Props) {
  const queryClient = useQueryClient();
  const [imgBroken, setImgBroken] = useState(false);
  const cover = post.images?.[0] ?? post.coverUrl;
  const showCover = Boolean(cover) && !imgBroken;
  const groupSlug = post.service.category?.group.slug;
  const color = groupSlug ? offeringColor(groupSlug) : null;
  const title = post.title?.trim() || post.service.name;
  const detailTo = `/user/${post.seller.userId}/dich-vu/${post.id}`;
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

  const warmDetail = () => {
    const images =
      post.images?.length > 0
        ? post.images
        : post.coverUrl
          ? [post.coverUrl]
          : [];
    prefetchPublicPartnerPost(queryClient, post.seller.userId, post.id, {
      seed: seedDetailFromListItem(post),
      images,
    });
  };

  return (
    <Link
      to={detailTo}
      aria-label={`Xem ${title} — ${post.seller.fullName}`}
      onMouseEnter={warmDetail}
      onFocus={warmDetail}
      onTouchStart={warmDetail}
      className={`group flex flex-col overflow-hidden rounded-sm bg-white shadow-[0_12px_32px_rgba(5,45,71,0.11)] ring-1 ring-black/[0.04] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(5,45,71,0.15)] ${widthClass}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-canvas)]">
        {showCover ? (
          <img
            src={mediaSrc(cover!)}
            alt=""
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
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3.5">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <AvatarLevelOverlay
              level={post.seller.level}
              rank={post.seller.rank ?? 1}
              completedJobs={post.seller.completedJobs}
              hireSuccessCount={post.seller.hireSuccessCount}
            >
              <span className="relative inline-block">
                <UserAvatar
                  name={post.seller.fullName}
                  src={post.seller.avatarUrl}
                  userId={post.seller.userId}
                  size="sm"
                  className="!h-10 !w-10 !ring-2 !ring-[var(--color-line)] shadow-[0_3px_10px_rgba(5,45,71,0.12)]"
                />
                {post.seller.isOnline ? (
                  <span
                    className="absolute right-0 top-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"
                    title="Đang online"
                  />
                ) : null}
              </span>
            </AvatarLevelOverlay>
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="truncate text-[13px] font-bold tracking-tight text-[var(--color-navy)] group-hover:text-[var(--color-brand-deep)]">
              {post.seller.fullName}
            </p>
            <p className="mt-1 line-clamp-2 text-[15px] font-extrabold leading-snug tracking-tight text-[var(--color-navy)] transition group-hover:text-[var(--color-brand-deep)]">
              {title}
            </p>
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
            <span className="inline-flex max-w-full items-baseline gap-1 rounded-full border border-[var(--color-line)] bg-white px-3.5 py-2 text-[13px] shadow-sm transition group-hover:border-[var(--color-brand)]/40 group-hover:bg-[var(--color-brand-soft)]">
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
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--color-muted)] shadow-sm">
              Thỏa thuận
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
