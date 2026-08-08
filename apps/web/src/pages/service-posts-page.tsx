import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ServicePostCard } from '../components/common/service-post-card';
import { Icon } from '../components/ui/icon';
import { api } from '../services/api';

/**
 * Danh sách toàn bộ bài đăng dịch vụ đã duyệt.
 */
export function ServicePostsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 24;

  const postsQuery = useQuery({
    queryKey: ['service-posts', 'approved', 'list', page, pageSize],
    queryFn: () => api.getApprovedServicePosts(page, pageSize),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const board = postsQuery.data;
  const posts = board?.items ?? [];
  const total = board?.total ?? 0;
  const pageCount = board?.pageCount ?? 1;

  return (
    <div className="page-shell py-6 sm:py-8">
      <div className="section-container min-w-0">
        <nav className="text-sm text-[var(--color-muted)]">
          <Link to="/" className="hover:text-[var(--color-brand-deep)]">
            Trang chủ
          </Link>{' '}
          / <span className="text-[var(--color-ink)]">Bài đăng dịch vụ</span>
        </nav>

        <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-navy)] sm:text-3xl">
              Bài đăng dịch vụ
            </h1>
            <p className="mt-1.5 text-sm text-[var(--color-muted)] sm:text-base">
              Các gig đã được xét duyệt trên sàn — thuê trực tiếp từ người làm.
            </p>
          </div>
          {total > 0 ? (
            <p className="text-sm font-semibold text-[var(--color-muted)]">
              {total} bài đăng
            </p>
          ) : null}
        </header>

        {postsQuery.isLoading ? (
          <p className="mt-8 text-[var(--color-muted)]">Đang tải bài đăng…</p>
        ) : null}

        {!postsQuery.isLoading && posts.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-[var(--color-line)] bg-white px-4 py-10 text-center text-[var(--color-muted)]">
            Chưa có bài đăng đã duyệt. Khi admin duyệt gig của người làm, danh sách sẽ hiện tại đây.
          </p>
        ) : null}

        {posts.length > 0 ? (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {posts.map((post) => (
                <ServicePostCard key={post.id} post={post} layout="fluid" />
              ))}
            </div>

            {total > pageSize ? (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--color-muted)]">
                  Trang {page}/{pageCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || postsQuery.isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-white px-3.5 py-2 text-sm font-semibold disabled:opacity-40"
                  >
                    <Icon name="chevronLeft" className="h-4 w-4" />
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={page >= pageCount || postsQuery.isFetching}
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-white px-3.5 py-2 text-sm font-semibold disabled:opacity-40"
                  >
                    Sau
                    <Icon name="chevronRight" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
