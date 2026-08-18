import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { LevelBadgeGold } from '../../components/ui/partner-badges';
import { api } from '../../services/api';
import type { AdminServicePost } from '../../types/admin';
import { mediaSrc } from '../../utils/media-src';
import {
  Badge,
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

const VIEW_TABS = [
  { value: '', label: 'Hàng chờ' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'all', label: 'Tất cả' },
] as const;

function statusTone(status: AdminServicePost['status']) {
  if (status === 'APPROVED') return 'green';
  if (status === 'REJECTED') return 'red';
  return 'amber';
}

function statusLabel(status: AdminServicePost['status']) {
  if (status === 'APPROVED') return 'Đã duyệt';
  if (status === 'REJECTED') return 'Từ chối';
  return 'Chờ duyệt';
}

function Avatar({ name, src }: { name: string; src?: string | null }) {
  if (src) {
    return (
      <img
        src={mediaSrc(src)}
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

function CoverThumb({
  title,
  src,
}: {
  title: string;
  src?: string | null;
}) {
  if (src) {
    return (
      <img
        src={mediaSrc(src)}
        alt=""
        className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-[var(--color-line)]"
      />
    );
  }
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-soft)] text-lg font-extrabold text-[var(--color-brand-deep)]">
      {title.slice(0, 1)}
    </div>
  );
}

/** Hàng chờ PENDING (nhóm theo người làm) + list đã duyệt / từ chối / tất cả. */
export function AdminServicePostsPage() {
  const location = useLocation();
  const { get, page, setParam, setPage } = useFilterParams();
  const [search, setSearch] = useSearchFilter(get, setParam);
  const pageSize = useAdminViewportPageSize({ rowPx: 84, chromePx: 320 });
  const q = get('q');
  const status = get('status');
  const isQueue = status === '' || status === 'PENDING';

  const queueQuery = useQuery({
    queryKey: ['admin', 'service-posts-queue', { q, page, pageSize }],
    queryFn: () => api.adminServicePostQueue({ q, page, pageSize }),
    placeholderData: keepPreviousData,
    enabled: isQueue,
  });

  const listQuery = useQuery({
    queryKey: ['admin', 'service-posts', { q, status, page, pageSize }],
    queryFn: () =>
      api.adminServicePosts({
        q,
        page,
        pageSize,
        status: status === 'all' ? undefined : status,
      }),
    placeholderData: keepPreviousData,
    enabled: !isQueue,
  });

  const queue = queueQuery.data;
  const list = listQuery.data;
  const loading = isQueue ? queueQuery.isLoading : listQuery.isLoading;
  const error = isQueue ? queueQuery.error : listQuery.error;

  const description = isQueue
    ? 'Người làm đang có bài chờ duyệt — bấm vào bài để xem gallery và duyệt.'
    : status === 'APPROVED'
      ? 'Bài đang hiện trên sàn. Mở gallery để ẩn khỏi hồ sơ công khai.'
      : status === 'REJECTED'
        ? 'Bài đã từ chối / gỡ sàn. Có thể duyệt lại từ gallery.'
        : 'Mọi bài đăng — lọc hoặc mở gallery để duyệt, ẩn, duyệt lại.';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Bài đăng dịch vụ" description={description} />
      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tên, email, tiêu đề bài…"
        />
        <div className="flex flex-wrap gap-1.5">
          {VIEW_TABS.map((tab) => {
            const active = isQueue ? tab.value === '' : status === tab.value;
            return (
              <button
                key={tab.value || 'queue'}
                type="button"
                onClick={() => setParam('status', tab.value)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                  active
                    ? 'bg-[var(--color-brand-deep)] text-white'
                    : 'border border-[var(--color-line)] bg-white text-[var(--color-muted)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </FilterBar>

      {loading ? <p className="mt-6">Đang tải…</p> : null}
      {error ? (
        <p className="mt-3 text-sm text-red-600">{(error as Error).message}</p>
      ) : null}

      {isQueue && queue && queue.items.length === 0 && !loading ? (
        <EmptyState>Không có ai đang chờ duyệt bài.</EmptyState>
      ) : null}

      {isQueue && queue && queue.items.length > 0 ? (
        <>
          <div className="mt-5 flex min-h-0 flex-1 flex-col gap-2">
            {queue.items.map((item) => {
              const to = item.firstPostId
                ? `/admin/service-posts/${item.firstPostId}`
                : `/user/${item.userId}`;
              return (
                <article
                  key={item.partnerProfileId}
                  className="flex items-start gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-3.5 shadow-sm"
                >
                  <Link
                    to={to}
                    state={{ listSearch: location.search }}
                    className="shrink-0"
                  >
                    <Avatar name={item.fullName} src={item.avatarUrl} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={to}
                        state={{ listSearch: location.search }}
                        className="font-extrabold text-[var(--color-navy)] hover:text-[var(--color-brand-deep)]"
                      >
                        {item.fullName}
                      </Link>
                      <LevelBadgeGold level={item.level} />
                    </div>
                    <p className="truncate text-sm text-[var(--color-muted)]">
                      {item.email}
                    </p>
                    {item.posts.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.posts.map((post) => (
                          <Link
                            key={post.id}
                            to={`/admin/service-posts/${post.id}`}
                            state={{ listSearch: location.search }}
                            className="max-w-full truncate rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
                          >
                            {post.serviceName}: {post.title}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                    {item.oldestPendingAt ? (
                      <p className="mt-1.5 text-xs text-[var(--color-muted)]">
                        Chờ từ {formatDateTime(item.oldestPendingAt)}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">
                    {item.pendingCount} bài chờ
                  </span>
                </article>
              );
            })}
          </div>

          <Pagination
            page={queue.page}
            pageCount={queue.pageCount}
            total={queue.total}
            onChange={setPage}
          />
        </>
      ) : null}

      {!isQueue && list && list.items.length === 0 && !loading ? (
        <EmptyState>
          {status === 'APPROVED'
            ? 'Không có bài đã duyệt.'
            : status === 'REJECTED'
              ? 'Không có bài bị từ chối.'
              : 'Không có bài đăng khớp bộ lọc.'}
        </EmptyState>
      ) : null}

      {!isQueue && list && list.items.length > 0 ? (
        <>
          <div className="mt-5 flex min-h-0 flex-1 flex-col gap-2">
            {list.items.map((item) => (
              <Link
                key={item.id}
                to={`/admin/service-posts/${item.id}`}
                state={{ listSearch: location.search }}
                className="flex items-start gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-3.5 shadow-sm transition hover:border-[var(--color-brand)] hover:shadow-md"
              >
                <CoverThumb title={item.title} src={item.coverUrl} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-extrabold text-[var(--color-navy)]">
                    <span className="min-w-0 truncate">{item.title}</span>
                    <Badge tone={statusTone(item.status)}>
                      {statusLabel(item.status)}
                    </Badge>
                  </p>
                  <p className="mt-1 truncate text-sm text-[var(--color-muted)]">
                    {item.partner.fullName} · {item.service.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                    {item.partner.email} · {formatDateTime(item.createdAt)}
                  </p>
                  {item.status === 'REJECTED' && item.rejectReason ? (
                    <p className="mt-1 line-clamp-2 text-xs text-red-700">
                      {item.rejectReason}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            page={list.page}
            pageCount={list.pageCount}
            total={list.total}
            onChange={setPage}
          />
        </>
      ) : null}
    </div>
  );
}
