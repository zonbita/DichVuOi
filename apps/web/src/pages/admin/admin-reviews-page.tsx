import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { EmptyState, FilterBar, PageHeader, Pagination, SearchInput } from './admin-ui';
import {
  formatDateTime,
  useAdminViewportPageSize,
  useFilterParams,
  useSearchFilter,
} from './admin-utils';

export function AdminReviewsPage() {
  const { get, page, setParam, setPage } = useFilterParams();
  const [search, setSearch] = useSearchFilter(get, setParam);
  const pageSize = useAdminViewportPageSize({ rowPx: 88, chromePx: 280 });
  const q = get('q');

  const reviewsQuery = useQuery({
    queryKey: ['admin', 'reviews', { q, page, pageSize }],
    queryFn: () => api.adminReviews({ q, page, pageSize }),
    placeholderData: keepPreviousData,
  });

  const data = reviewsQuery.data;

  return (
    <div>
      <PageHeader
        title="Đánh giá"
        description="Theo dõi review hai chiều sau khi đơn hoàn thành."
      />
      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Nội dung, người đánh giá…"
        />
      </FilterBar>

      {reviewsQuery.isLoading ? <p className="mt-6">Đang tải…</p> : null}

      {data && data.items.length === 0 ? (
        <EmptyState>Chưa có đánh giá nào khớp bộ lọc.</EmptyState>
      ) : null}

      {data && data.items.length > 0 ? (
        <>
          <div className="mt-5 space-y-3">
            {data.items.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl border border-[var(--color-line)] bg-white p-4 text-sm shadow-sm"
              >
                <p className="font-bold">
                  {review.rating}★ ·{' '}
                  <Link
                    to={`/admin/bookings/${review.booking.id}`}
                    className="hover:text-[var(--color-brand-deep)]"
                  >
                    {review.booking.service.name}
                  </Link>
                </p>
                <p className="text-[var(--color-muted)]">
                  {review.fromUser.fullName} → {review.toUser.fullName} ·{' '}
                  {formatDateTime(review.createdAt)}
                </p>
                {review.comment ? (
                  <p className="mt-1">{review.comment}</p>
                ) : null}
              </article>
            ))}
          </div>

          <Pagination
            page={data.page}
            pageCount={data.pageCount}
            total={data.total}
            onChange={setPage}
          />
        </>
      ) : null}
    </div>
  );
}
