import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { LevelBadgeGold } from '../ui/partner-badges';
import { Icon, StarIcon } from '../ui/icon';
import { UserAvatar } from '../ui/user-avatar';
import { SectionHeaderBar } from './section-header-bar';

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diff / 60_000));
  if (mins < 60) return `${Math.max(1, mins)} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

/** Đơn vừa xong — luôn hiện block (kể cả đang tải / trống). */
export function HomeRecentCompletedSection() {
  const doneQuery = useQuery({
    queryKey: ['recent-completed-public'],
    queryFn: () => api.getRecentCompletedPublic(9),
    staleTime: 15_000,
    refetchInterval: 20_000,
  });

  const dones = doneQuery.data?.items ?? [];

  return (
    <section className="page-shell mt-10">
      <div className="section-container">
        <SectionHeaderBar icon="check" title="Vừa hoàn thành" />
        {doneQuery.isLoading ? (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="h-[58px] animate-pulse rounded-xl bg-[var(--color-line)]/50"
              />
            ))}
          </ul>
        ) : null}
        {!doneQuery.isLoading && dones.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-[var(--color-line)] bg-white px-4 py-6 text-center text-sm text-[var(--color-muted)]">
            Chưa có đơn hoàn thành gần đây. Khi việc xong, người làm sẽ hiện tại đây.
          </p>
        ) : null}
        {dones.length > 0 ? (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dones.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/user/${item.partnerUserId}`}
                  className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-white px-3.5 py-3 transition hover:border-[var(--color-brand)]/40 hover:bg-[var(--color-canvas)]"
                >
                  <UserAvatar
                    name={item.partnerName}
                    src={item.partnerAvatarUrl}
                    userId={item.partnerUserId}
                    size="sm"
                    className="!h-9 !w-9 shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-[var(--color-navy)]">
                      {item.partnerName}
                    </span>
                    <span className="block truncate text-xs text-[var(--color-muted)]">
                      {item.serviceName} · {relativeTime(item.completedAt)}
                    </span>
                  </span>
                  <Icon
                    name="check"
                    className="h-4 w-4 shrink-0 text-emerald-600"
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

/** Review nổi bật — chỉ hiện khi có dữ liệu. */
export function HomeFeaturedReviewsSection() {
  const reviewsQuery = useQuery({
    queryKey: ['featured-reviews'],
    queryFn: () => api.getFeaturedReviews(6),
    staleTime: 60_000,
  });

  const reviews = reviewsQuery.data?.items ?? [];
  if (reviewsQuery.isLoading || reviews.length === 0) return null;

  return (
    <section className="page-shell mt-10">
      <div className="section-container">
        <SectionHeaderBar icon="star" title="Khách vừa khen" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="flex flex-col rounded-2xl border border-[var(--color-line)] bg-white p-4 shadow-[0_4px_14px_rgba(24,49,63,0.06)]"
            >
              <div className="flex items-start gap-3">
                <Link
                  to={`/user/${r.partner.userId}`}
                  className="shrink-0"
                  aria-label={r.partner.fullName}
                >
                  <UserAvatar
                    name={r.partner.fullName}
                    src={r.partner.avatarUrl}
                    userId={r.partner.userId}
                    size="sm"
                    className="!h-10 !w-10"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/user/${r.partner.userId}`}
                      className="truncate text-sm font-extrabold text-[var(--color-navy)] hover:underline"
                    >
                      {r.partner.fullName}
                    </Link>
                    <LevelBadgeGold level={r.partner.level} variant="overlay" />
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                    {r.serviceName}
                    {r.partner.city ? ` · ${r.partner.city}` : ''}
                  </p>
                </div>
              </div>
              <div className="mt-3 inline-flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <StarIcon
                    key={n}
                    className="h-3.5 w-3.5"
                    tone={n <= r.rating ? 'gold' : 'muted'}
                  />
                ))}
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--color-ink)]">
                “{r.comment}”
              </p>
              <p className="mt-auto pt-3 text-xs text-[var(--color-muted)]">
                {r.fromNameMasked} · {relativeTime(r.createdAt)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** @deprecated dùng HomeRecentCompletedSection + HomeFeaturedReviewsSection */
export function HomeSocialProofSection() {
  return (
    <>
      <HomeRecentCompletedSection />
      <HomeFeaturedReviewsSection />
    </>
  );
}
