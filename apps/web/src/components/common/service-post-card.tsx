import { Link } from 'react-router-dom';
import { formatPrice } from '../../services/api';
import type { PublicServicePostListItem } from '../../types/public-service-post';
import { offeringColor } from '../../utils/catalog-colors';
import { StarIcon } from '../ui/icon';

function mediaSrc(url: string) {
  const apiBase = import.meta.env.VITE_API_URL ?? '';
  return url.startsWith('http') || url.startsWith('blob:') ? url : `${apiBase}${url}`;
}

type Props = {
  post: PublicServicePostListItem;
  /** Mặc định fixed width (rail); `fluid` = full cột lưới. */
  layout?: 'rail' | 'fluid';
};

/** Card bài đăng dịch vụ đã duyệt — trang chủ / khám phá. */
export function ServicePostCard({ post, layout = 'rail' }: Props) {
  const cover = post.images?.[0] ?? post.coverUrl;
  const groupSlug = post.service.category?.group.slug;
  const color = groupSlug ? offeringColor(groupSlug) : null;
  const title = post.title?.trim() || post.service.name;
  const detailTo = `/user/${post.seller.userId}/dich-vu/${post.id}`;
  const hireTo = `/dich-vu/${post.service.slug}?partner=${post.seller.userId}`;
  const ratingAvg = post.seller.ratingAvg ?? 0;
  const ratingCount = post.seller.ratingCount ?? 0;
  const widthClass =
    layout === 'fluid'
      ? 'w-full'
      : 'w-[240px] shrink-0 sm:w-[260px]';

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-line)]/70 bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] ${widthClass}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-canvas)]">
        {cover ? (
          <img
            src={mediaSrc(cover)}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
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
        <Link to={detailTo} className="absolute inset-0 z-[1]" aria-label={`Xem ${title}`} />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {post.service.name}
        </p>
        <Link
          to={detailTo}
          className="line-clamp-2 text-[15px] font-extrabold leading-snug text-[var(--color-navy)] hover:text-[var(--color-brand-deep)]"
        >
          {title}
        </Link>
        <p className="flex flex-wrap items-center gap-1 text-xs text-[var(--color-muted)]">
          <Link
            to={`/user/${post.seller.userId}`}
            className="font-semibold text-[var(--color-ink)] hover:text-[var(--color-brand-deep)]"
          >
            {post.seller.fullName}
          </Link>
          <span className="inline-flex items-center gap-0.5">
            <StarIcon
              className="h-3.5 w-3.5"
              tone={ratingCount > 0 ? 'gold' : 'muted'}
            />
            {ratingCount > 0 ? ratingAvg.toFixed(1) : '—'}
            {ratingCount > 0 ? ` (${ratingCount})` : ''}
          </span>
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-[var(--color-line)]/60 pt-2.5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Từ
            </p>
            {post.price != null ? (
              <p className="whitespace-nowrap text-base font-extrabold leading-tight text-[var(--color-sale)]">
                {formatPrice(post.price)}
                <span className="text-xs font-semibold text-[var(--color-muted)]">
                  /{post.service.unit}
                </span>
              </p>
            ) : (
              <p className="text-sm font-semibold text-[var(--color-muted)]">Liên hệ</p>
            )}
          </div>
          <Link
            to={hireTo}
            className="shrink-0 rounded-md bg-[var(--color-brand)] px-3 py-1.5 text-xs font-bold !text-white transition hover:bg-[var(--color-brand-deep)]"
          >
            Thuê
          </Link>
        </div>
      </div>
    </article>
  );
}
