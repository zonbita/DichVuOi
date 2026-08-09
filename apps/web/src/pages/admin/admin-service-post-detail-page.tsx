import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SquareImageSlider } from '../../components/partner/square-image-slider';
import {
  AvatarLevelOverlay,
  PartnerVerificationBadges,
} from '../../components/ui/partner-badges';
import { Icon, StarIcon } from '../../components/ui/icon';
import { RichPostBody } from '../../components/ui/simple-rich-editor';
import { api, formatPrice } from '../../services/api';
import { mediaSrc } from '../../utils/media-src';
import { PageHeader } from './admin-ui';

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
        src={mediaSrc(src)}
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

/** Trang duyệt bài — layout giống /user/:userId/dich-vu/:postId + Duyệt/Từ chối. */
export function AdminServicePostDetailPage() {
  const { postId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const detailQuery = useQuery({
    queryKey: ['admin', 'service-post', postId],
    queryFn: () => api.adminServicePostDetail(postId),
    enabled: Boolean(postId),
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: {
      status: 'APPROVED' | 'REJECTED';
      rejectReason?: string;
    }) => api.adminReviewServicePost(postId, payload),
    onSuccess: async (result) => {
      setRejectOpen(false);
      setRejectReason('');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'service-posts-queue'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'service-post'] });

      const siblings = detailQuery.data?.siblingPending.filter((p) => p.id !== postId) ?? [];
      if (result.status === 'APPROVED' || result.status === 'REJECTED') {
        if (siblings[0]) {
          navigate(`/admin/service-posts/${siblings[0].id}`, { replace: true });
        } else {
          navigate('/admin/service-posts', { replace: true });
        }
      }
    },
  });

  if (detailQuery.isLoading) {
    return <p className="p-4 text-sm text-[var(--color-muted)]">Đang tải bài…</p>;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="p-4">
        <p className="text-red-600">Không tìm thấy bài đăng.</p>
        <Link to="/admin/service-posts" className="mt-2 inline-block font-semibold text-[var(--color-brand-deep)]">
          Về hàng chờ
        </Link>
      </div>
    );
  }

  const { post, seller, offering, siblingPending } = detailQuery.data;
  const imgs =
    post.images?.length > 0 ? post.images : post.coverUrl ? [post.coverUrl] : [];
  const unit = offering?.unit ?? post.service.unit;
  const price = offering?.price;
  const isPending = post.status === 'PENDING';

  return (
    <div>
      <PageHeader
        title="Duyệt bài đăng"
        description={`${seller.fullName} · ${post.service.name}`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link
          to="/admin/service-posts"
          className="font-semibold text-[var(--color-brand-deep)] hover:underline"
        >
          ← Hàng chờ
        </Link>
        <span className="text-[var(--color-muted)]">·</span>
        <Link
          to={`/user/${seller.userId}`}
          className="text-[var(--color-muted)] hover:text-[var(--color-brand-deep)]"
        >
          Hồ sơ công khai
        </Link>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
            post.status === 'PENDING'
              ? 'bg-amber-100 text-amber-800'
              : post.status === 'APPROVED'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-red-100 text-red-700'
          }`}
        >
          {post.status === 'PENDING'
            ? 'Chờ duyệt'
            : post.status === 'APPROVED'
              ? 'Đã duyệt'
              : 'Từ chối'}
        </span>
      </div>

      {siblingPending.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {siblingPending.map((p) => (
            <Link
              key={p.id}
              to={`/admin/service-posts/${p.id}`}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                p.id === post.id
                  ? 'bg-[var(--color-brand)] text-white'
                  : 'bg-[var(--color-canvas)] text-[var(--color-ink)] hover:bg-white'
              }`}
            >
              {p.serviceName}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-start">
        <div className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-sm">
            {imgs.length > 0 ? (
              <SquareImageSlider
                images={imgs}
                resolveSrc={mediaSrc}
                variant="gallery"
                className=""
              />
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center bg-[var(--color-brand-soft)] text-4xl font-extrabold text-[var(--color-brand)]">
                {post.service.name.slice(0, 1)}
              </div>
            )}
            <div className="space-y-2 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                {post.service.category?.group.name
                  ? `${post.service.category.group.name} · ${post.service.category.name}`
                  : post.service.name}
              </p>
              <h1 className="text-2xl font-extrabold leading-tight text-[var(--color-navy)]">
                {post.title}
              </h1>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-line)] bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-extrabold text-[var(--color-navy)]">Về dịch vụ này</h2>
            <div className="mt-3">
              <RichPostBody html={post.body} />
            </div>
            {(offering?.includes || offering?.excludes || offering?.coverageNote) && (
              <div className="mt-4 space-y-2 border-t border-[var(--color-line)] pt-4 text-sm">
                {offering.includes ? (
                  <p className="text-[var(--color-muted)]">
                    <span className="font-semibold text-[var(--color-ink)]">Bao gồm:</span>{' '}
                    {offering.includes}
                  </p>
                ) : null}
                {offering.excludes ? (
                  <p className="text-[var(--color-muted)]">
                    <span className="font-semibold text-[var(--color-ink)]">Không gồm:</span>{' '}
                    {offering.excludes}
                  </p>
                ) : null}
                {offering.coverageNote ? (
                  <p className="text-[var(--color-muted)]">{offering.coverageNote}</p>
                ) : null}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-[var(--color-line)] bg-white p-4 shadow-sm sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Giá chào
            </p>
            {price != null ? (
              <p className="mt-1 whitespace-nowrap text-2xl font-extrabold text-[var(--color-sale)]">
                {formatPrice(price)}
                <span className="text-sm font-semibold text-[var(--color-muted)]">/{unit}</span>
              </p>
            ) : (
              <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">Chưa có giá</p>
            )}

            {isPending ? (
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  className="btn-primary w-full py-2.5 text-sm"
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate({ status: 'APPROVED' })}
                >
                  Duyệt bài
                </button>
                <button
                  type="button"
                  className="btn-secondary w-full py-2.5 text-sm"
                  disabled={reviewMutation.isPending}
                  onClick={() => {
                    setRejectOpen(true);
                    setRejectReason('');
                  }}
                >
                  Từ chối
                </button>
              </div>
            ) : null}

            {rejectOpen ? (
              <div className="mt-3 space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
                <label className="block text-sm">
                  <span className="font-semibold">Lý do từ chối</span>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-red-200 px-3 py-2"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-red-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                    disabled={reviewMutation.isPending || !rejectReason.trim()}
                    onClick={() =>
                      reviewMutation.mutate({
                        status: 'REJECTED',
                        rejectReason: rejectReason.trim(),
                      })
                    }
                  >
                    Xác nhận từ chối
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-sm font-semibold"
                    onClick={() => setRejectOpen(false)}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : null}

            {post.rejectReason ? (
              <p className="mt-3 text-sm text-red-700">Lý do: {post.rejectReason}</p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-[var(--color-line)] bg-white p-4 shadow-sm transition hover:bg-[var(--color-canvas)]/40">
            <Link
              to={`/user/${seller.userId}`}
              className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
              aria-label={`Xem hồ sơ ${seller.fullName}`}
            >
              <div className="flex gap-3">
                <AvatarLevelOverlay level={seller.level} className="block w-16 shrink-0">
                  <div className="aspect-square w-full overflow-hidden rounded-2xl">
                    <SellerAvatar name={seller.fullName} src={seller.avatarUrl} />
                  </div>
                </AvatarLevelOverlay>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-[var(--color-navy)] hover:text-[var(--color-brand-deep)]">
                    {seller.fullName}
                  </p>
                  <p className="truncate text-xs text-[var(--color-muted)]">{seller.email}</p>
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
                  <Icon name="clock" className="h-3.5 w-3.5" />~{seller.responseMinutes} phút
                </span>
              </p>
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
