import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { EmptyState, FilterBar, PageHeader, Pagination, SearchInput } from './admin-ui';
import {
  formatDateTime,
  useAdminViewportPageSize,
  useFilterParams,
  useSearchFilter,
} from './admin-utils';

export function AdminFlaggedPage() {
  const { get, page, setParam, setPage } = useFilterParams();
  const [search, setSearch] = useSearchFilter(get, setParam);
  const pageSize = useAdminViewportPageSize({ rowPx: 88, chromePx: 280 });
  const q = get('q');
  const queryClient = useQueryClient();

  const flaggedQuery = useQuery({
    queryKey: ['admin', 'flagged', { q, page, pageSize }],
    queryFn: () => api.adminFlaggedMessages({ q, page, pageSize }),
    placeholderData: keepPreviousData,
  });

  const banMutation = useMutation({
    mutationFn: ({
      userId,
      chatBanned,
    }: {
      userId: string;
      chatBanned: boolean;
    }) => api.adminUpdateUser(userId, { chatBanned }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'flagged'] });
    },
  });

  const data = flaggedQuery.data;

  return (
    <div>
      <PageHeader
        title="Tin bị lọc PII"
        description="Tin nhắn lộ SĐT / Zalo / email — khóa chat đơn hoặc mở đơn để điều tra."
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
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold">
                    {message.sender.fullName} ·{' '}
                    <Link
                      to={`/admin/bookings/${message.booking.id}`}
                      className="hover:text-[var(--color-brand-deep)]"
                    >
                      {message.booking.service.name}
                    </Link>
                    {message.sender.chatBanned ? (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                        Đã khóa chat
                      </span>
                    ) : null}
                  </p>
                  <button
                    type="button"
                    disabled={banMutation.isPending}
                    onClick={() =>
                      banMutation.mutate({
                        userId: message.sender.id,
                        chatBanned: !message.sender.chatBanned,
                      })
                    }
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                      message.sender.chatBanned
                        ? 'border border-[var(--color-line)] bg-white text-[var(--color-ink)]'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {message.sender.chatBanned ? 'Mở chat' : 'Khóa chat'}
                  </button>
                </div>
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
