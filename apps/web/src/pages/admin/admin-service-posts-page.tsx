import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { LevelBadgeGold } from '../../components/ui/partner-badges';
import { api } from '../../services/api';
import {
  EmptyState,
  FilterBar,
  PageHeader,
  Pagination,
  SearchInput,
} from './admin-ui';
import {
  formatDateTime,
  useAdminViewportPageSize,
  useFilterParams,
  useSearchFilter,
} from './admin-utils';

function Avatar({ name, src }: { name: string; src?: string | null }) {
  if (src) {
    const url = src.startsWith('http')
      ? src
      : `${import.meta.env.VITE_API_URL ?? ''}${src}`;
    return (
      <img
        src={url}
        alt={name}
        className="h-12 w-12 rounded-xl object-cover ring-1 ring-[var(--color-line)]"
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
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-brand-soft)] text-sm font-extrabold text-[var(--color-brand-deep)]">
      {initials || '?'}
    </div>
  );
}

/** Hàng chờ: chỉ người làm đang có bài cần duyệt. */
export function AdminServicePostsPage() {
  const { get, page, setParam, setPage } = useFilterParams();
  const [search, setSearch] = useSearchFilter(get, setParam);
  const pageSize = useAdminViewportPageSize({ rowPx: 76, chromePx: 280 });
  const q = get('q');

  const queueQuery = useQuery({
    queryKey: ['admin', 'service-posts-queue', { q, page, pageSize }],
    queryFn: () => api.adminServicePostQueue({ q, page, pageSize }),
    placeholderData: keepPreviousData,
  });

  const data = queueQuery.data;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Bài đăng dịch vụ"
        description="Chỉ hiện người làm đang chờ duyệt. Bấm vào người đó để xem bài kiểu gig và duyệt."
      />
      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tên, email, tiêu đề bài…"
        />
      </FilterBar>

      {queueQuery.isLoading ? <p className="mt-6">Đang tải…</p> : null}

      {data && data.items.length === 0 ? (
        <EmptyState>Không có ai đang chờ duyệt bài.</EmptyState>
      ) : null}

      {data && data.items.length > 0 ? (
        <>
          <div className="mt-5 flex min-h-0 flex-1 flex-col gap-2">
            {data.items.map((item) => {
              const to = item.firstPostId
                ? `/admin/service-posts/${item.firstPostId}`
                : `/user/${item.userId}`;
              return (
                <Link
                  key={item.partnerProfileId}
                  to={to}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-3.5 shadow-sm transition hover:border-[var(--color-brand)] hover:shadow-md"
                >
                  <Avatar name={item.fullName} src={item.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold text-[var(--color-navy)]">
                        {item.fullName}
                      </p>
                      <LevelBadgeGold level={item.level} />
                    </div>
                    <p className="truncate text-sm text-[var(--color-muted)]">
                      {item.email}
                      {item.posts[0]
                        ? ` · ${item.posts[0].serviceName}: ${item.posts[0].title}`
                        : ''}
                    </p>
                    {item.oldestPendingAt ? (
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                        Chờ từ {formatDateTime(item.oldestPendingAt)}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">
                    {item.pendingCount} bài chờ
                  </span>
                </Link>
              );
            })}
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
