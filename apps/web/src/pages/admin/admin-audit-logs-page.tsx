import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { EmptyState, FilterBar, PageHeader, Pagination, SearchInput } from './admin-ui';
import {
  formatDateTime,
  useAdminViewportPageSize,
  useFilterParams,
  useSearchFilter,
} from './admin-utils';

export function AdminAuditLogsPage() {
  const { get, page, setParam, setPage } = useFilterParams();
  const [search, setSearch] = useSearchFilter(get, setParam);
  const pageSize = useAdminViewportPageSize({ rowPx: 72, chromePx: 280 });
  const q = get('q');

  const logsQuery = useQuery({
    queryKey: ['admin', 'audit-logs', { q, page, pageSize }],
    queryFn: () => api.adminAuditLogs({ q, page, pageSize }),
    placeholderData: keepPreviousData,
  });

  const data = logsQuery.data;

  return (
    <div>
      <PageHeader
        title="Nhật ký admin"
        description="Thao tác khóa chat, đổi role và các hành động đã ghi nhận."
      />
      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Action, email admin, target…"
        />
      </FilterBar>

      {logsQuery.isLoading ? <p className="mt-6">Đang tải…</p> : null}

      {data && data.items.length === 0 ? (
        <EmptyState>Chưa có nhật ký.</EmptyState>
      ) : null}

      {data && data.items.length > 0 ? (
        <>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--color-line)] bg-[var(--color-canvas)] text-xs uppercase tracking-wide text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--color-line)]/70 last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--color-muted)]">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{row.actor.fullName}</p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {row.actor.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold">
                      {row.action}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {row.targetType ?? '—'}
                      {row.targetId ? (
                        <span className="ml-1 text-[var(--color-muted)]">
                          {row.targetId.slice(0, 10)}…
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
