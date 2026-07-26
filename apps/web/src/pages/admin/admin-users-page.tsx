import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  Badge,
  EmptyState,
  FilterBar,
  PageHeader,
  Pagination,
  Panel,
  SearchInput,
  SelectFilter,
} from './admin-ui';
import {
  ROLE_OPTIONS,
  formatDateTime,
  useFilterParams,
  useSearchFilter,
} from './admin-utils';

export function AdminUsersPage() {
  const { get, page, setParam, setPage } = useFilterParams();
  const [search, setSearch] = useSearchFilter(get, setParam);
  const queryClient = useQueryClient();

  const q = get('q');
  const role = get('role');

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', { q, role, page }],
    queryFn: () => api.adminUsers({ q, role: role || undefined, page }),
    placeholderData: keepPreviousData,
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, nextRole }: { id: string; nextRole: string }) =>
      api.adminUpdateUser(id, nextRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  const data = usersQuery.data;

  return (
    <div>
      <PageHeader
        title="Khách hàng"
        description="Tìm user theo tên / email / SĐT và đổi role khi cần."
      />
      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tên, email, số điện thoại…"
        />
        <SelectFilter
          label="Mọi role"
          value={role}
          onChange={(value) => setParam('role', value)}
          options={ROLE_OPTIONS}
        />
      </FilterBar>

      {usersQuery.isLoading ? <p className="mt-6">Đang tải…</p> : null}
      {roleMutation.isError ? (
        <p className="mt-3 text-sm text-red-600">
          {(roleMutation.error as Error).message}
        </p>
      ) : null}

      {data && data.items.length === 0 ? (
        <EmptyState>Không có user khớp bộ lọc.</EmptyState>
      ) : null}

      {data && data.items.length > 0 ? (
        <>
          <Panel className="mt-0 overflow-x-auto p-0 sm:p-0">
            <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-[var(--color-muted)]">
                <th className="px-4 py-3 pr-3 font-semibold">Tên</th>
                <th className="py-3 pr-3 font-semibold">Email</th>
                <th className="py-3 pr-3 font-semibold">Hồ sơ</th>
                <th className="py-3 pr-3 font-semibold">Đơn</th>
                <th className="py-3 pr-3 font-semibold">Tham gia</th>
                <th className="px-4 py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[var(--color-line)]/70 last:border-0"
                >
                  <td className="px-4 py-3 pr-3 font-medium">
                    {user.fullName}
                    {user.phone ? (
                      <span className="block text-xs text-[var(--color-muted)]">
                        {user.phone}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3">{user.email}</td>
                  <td className="py-3 pr-3">
                    {user.partnerProfile ? (
                      <Badge
                        tone={user.partnerProfile.isVerified ? 'green' : 'amber'}
                      >
                        {user.partnerProfile.isVerified
                          ? 'Đã xác minh'
                          : 'Chưa xác minh'}
                      </Badge>
                    ) : (
                      <span className="text-[var(--color-muted)]">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    thuê {user._count.customerBookings} · làm{' '}
                    {user._count.partnerBookings}
                  </td>
                  <td className="py-3 pr-3 text-[var(--color-muted)]">
                    {formatDateTime(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="field-input py-1 text-sm"
                      value={user.role}
                      disabled={roleMutation.isPending}
                      onChange={(event) =>
                        roleMutation.mutate({
                          id: user.id,
                          nextRole: event.target.value,
                        })
                      }
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </Panel>

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
