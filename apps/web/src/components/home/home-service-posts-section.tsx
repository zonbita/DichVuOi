import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ServicePostCard } from '../common/service-post-card';
import { ScrollRail } from '../common/scroll-rail';
import { Icon } from '../ui/icon';

const HOME_POSTS_LIMIT = 16;

/**
 * Bài đăng dịch vụ đã được admin duyệt — rail ngang trên trang chủ.
 */
export function HomeServicePostsSection() {
  const postsQuery = useQuery({
    queryKey: ['service-posts', 'approved', 'home'],
    queryFn: () => api.getApprovedServicePosts(1, HOME_POSTS_LIMIT),
    staleTime: 60_000,
  });

  const posts = postsQuery.data?.items ?? [];
  const total = postsQuery.data?.total ?? 0;

  if (!postsQuery.isLoading && posts.length === 0) {
    return null;
  }

  return (
    <section className="page-shell mt-10">
      <div className="section-container min-w-0">
        <div className="section-header-bar mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3.5 sm:px-5 sm:py-4">
          <h2 className="text-xl font-bold tracking-tight text-[var(--color-navy)] sm:text-2xl">
            Bài đăng dịch vụ
          </h2>
          <span className="text-sm font-medium text-[var(--color-muted)]">
            Đã xét duyệt · kéo ngang để xem thêm
          </span>
          {total > 0 ? (
            <div className="ml-auto flex shrink-0 items-center gap-3">
              <Link
                to="/bai-dang"
                className="text-[15px] font-semibold !text-[var(--color-brand)] transition hover:!text-[var(--color-navy)]"
              >
                <span className="inline-flex items-center gap-1">
                  Xem tất cả
                  <Icon name="chevronRight" className="h-4 w-4" />
                </span>
              </Link>
            </div>
          ) : null}
        </div>

        {postsQuery.isLoading ? (
          <p className="text-base text-[var(--color-muted)]">Đang tải bài đăng…</p>
        ) : null}

        {posts.length > 0 ? (
          <ScrollRail showArrows={false}>
            {posts.map((post) => (
              <ServicePostCard key={post.id} post={post} />
            ))}
          </ScrollRail>
        ) : null}
      </div>
    </section>
  );
}
