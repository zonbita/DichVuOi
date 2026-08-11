import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { ServicePostCard } from '../common/service-post-card';
import { ScrollRail } from '../common/scroll-rail';
import { SectionHeaderBar, SectionHeaderViewAll } from './section-header-bar';

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
    <section className="page-shell mt-5 pt-1">
      <div className="section-container min-w-0">
        <div className="min-w-0 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-line)] p-4 shadow-[var(--shadow-card)] sm:p-5">
          <SectionHeaderBar
            icon="sparkles"
            title="Bài đăng dịch vụ"
            subtitle="Đã xét duyệt · kéo ngang để xem thêm"
            action={total > 0 ? <SectionHeaderViewAll to="/bai-dang" /> : null}
          />

          {postsQuery.isLoading ? (
            <p className="text-base text-[var(--color-muted)]">Đang tải bài đăng…</p>
          ) : null}

          {posts.length > 0 ? (
            <ScrollRail showArrows>
              {posts.map((post, index) => (
                <ServicePostCard
                  key={post.id}
                  post={post}
                  priority={index === 0}
                />
              ))}
            </ScrollRail>
          ) : null}
        </div>
      </div>
    </section>
  );
}
