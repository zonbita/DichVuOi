import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { EmptyState, FilterBar, PageHeader, Pagination, SearchInput } from './admin-ui';
import { formatDateTime, useFilterParams, useSearchFilter } from './admin-utils';

export function AdminFlaggedPage() {
  const { get, page, setParam, setPage } = useFilterParams();
  const [search, setSearch] = useSearchFilter(get, setParam);
  const q = get('q');

  const flaggedQuery = useQuery({
    queryKey: ['admin', 'flagged', { q, page }],
    queryFn: () => api.adminFlaggedMessages({ q, page }),
    placeholderData: keepPreviousData,
  });

  const data = flaggedQuery.data;

  return (
    <div>
      <PageHeader
        title="Khiếu nại / tin bị lọc"
        description="Tin nhắn lộ SĐT / Zalo / email — mở đơn để điều tra."
      />
      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Nội dung tin, người gửi…"
        />
      </FilterBar>

      {flaggedQuery.isLoading ? <p className="mt-6">Đang tải…</p> : null}

      {data && data.items.length === 0 ? (
        <EmptyState>Không có tin bị lọc.</EmptyState>
      ) : null}

      {data && data.items.length > 0 ? (
        <>
          <div className="mt-5 space-y-3">
            {data.items.map((message) => (
              <article
                key={message.id}
                className="rounded-2xl border border-amber-300 bg-amber-50/60 p-4 text-sm shadow-sm"
              >
                <p className="font-semibold">
                  {message.sender.fullName} ·{' '}
                  <Link
                    to={`/admin/bookings/${message.booking.id}`}
                    className="hover:text-[var(--color-brand-deep)]"
                  >
                    {message.booking.service.name}
                  </Link>
                </p>
                <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                <p className="mt-1 text-xs text-amber-800">
                  Đã ẩn liên hệ ngoài sàn · {formatDateTime(message.createdAt)}
                </p>
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
