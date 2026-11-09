import { SquareImageSlider } from '../../components/partner/square-image-slider';
import { Icon } from '../../components/ui/icon';
import { RichPostBody } from '../../components/ui/rich-post-body';
import { formatPrice, formatPriceNumber } from '../../services/api';
import type { PartnerServicePost } from '../../types/partner-service-post';
import { resolveOfferingPriceRange } from '../../utils/market-price';
import { mediaSrc } from '../../utils/media-src';
import { STATUS_CLASS, STATUS_LABEL } from './constants';

export function ServicePostCard({
  post,
  onEdit,
  onDelete,
}: {
  post: PartnerServicePost;
  onEdit: (post: PartnerServicePost) => void;
  onDelete: (id: string) => void;
}) {
    const imgs =
      post.images?.length > 0
        ? post.images
        : post.coverUrl
          ? [post.coverUrl]
          : [];
    return (
      <article
        key={post.id}
        className="glass-card overflow-hidden !rounded-2xl"
      >
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-line)] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--color-brand-deep)]">
              {post.service.name}
            </p>
            <span
              className={`inline-flex border px-2.5 py-1 text-xs font-extrabold ${STATUS_CLASS[post.status]}`}
            >
              {STATUS_LABEL[post.status]}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm font-bold text-[var(--color-ink)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand-deep)]"
              onClick={() => onEdit(post)}
            >
              <Icon name="pencil" className="h-3.5 w-3.5" />
              Sửa
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 border border-transparent px-3 py-1.5 text-sm font-bold text-red-700 transition hover:border-red-200 hover:bg-red-50"
              onClick={() => {
                if (window.confirm('Xóa bài đăng này?')) {
                  onDelete(post.id);
                }
              }}
            >
              <Icon name="trash" className="h-3.5 w-3.5" />
              Xóa
            </button>
          </div>
        </header>

        <div className="px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-extrabold leading-snug text-[var(--color-navy)]">
              {post.title}
            </h3>
            {(() => {
              const range = resolveOfferingPriceRange({
                price: post.price,
                priceMin: post.priceMin,
                priceMax: post.priceMax,
              });
              if (!range) return null;
              return (
                <p className="whitespace-nowrap text-base font-extrabold text-[var(--color-sale)]">
                  {range.max > range.min ? (
                    <>
                      {formatPriceNumber(range.min)}
                      <span className="mx-1 font-semibold text-[var(--color-muted)]">
                        –
                      </span>
                      {formatPriceNumber(range.max)}
                      <span className="ml-1">VNĐ</span>
                    </>
                  ) : (
                    formatPrice(range.min)
                  )}
                  <span className="text-xs font-semibold text-[var(--color-muted)]">
                    /{post.service.unit}
                  </span>
                </p>
              );
            })()}
          </div>

          {imgs.length > 0 ? (
            <SquareImageSlider images={imgs} resolveSrc={mediaSrc} size={112} />
          ) : null}

          <div className="mt-3 max-w-none text-sm text-[var(--color-ink)]">
            <RichPostBody html={post.body} />
          </div>

          {post.status === 'REJECTED' && post.rejectReason ? (
            <p className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              Lý do từ chối: {post.rejectReason}
            </p>
          ) : null}
        </div>
      </article>
    );
}
