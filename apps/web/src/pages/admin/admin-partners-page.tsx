import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Badge,
  EmptyState,
  FilterBar,
  PageHeader,
  Pagination,
  SearchInput,
  SelectFilter,
} from './admin-ui';
import { formatDateTime, useFilterParams, useSearchFilter } from './admin-utils';

const VERIFIED_OPTIONS = [
  { value: 'false', label: 'Chưa xác minh' },
  { value: 'true', label: 'Đã xác minh' },
];

const ACCEPTING_OPTIONS = [
  { value: 'true', label: 'Đang nhận việc' },
  { value: 'false', label: 'Tạm nghỉ' },
];

export function AdminPartnersPage() {
  const { get, page, setParam, setPage } = useFilterParams();
  const [search, setSearch] = useSearchFilter(get, setParam);
  const queryClient = useQueryClient();

  const q = get('q');
  const verified = get('verified');
  const accepting = get('acceptingJobs');

  const partnersQuery = useQuery({
    queryKey: ['admin', 'partners', { q, verified, accepting, page }],
    queryFn: () =>
      api.adminPartners({
        q,
        page,
        verified: verified === '' ? undefined : verified === 'true',
        acceptingJobs: accepting === '' ? undefined : accepting === 'true',
      }),
    placeholderData: keepPreviousData,
  });

  const partnerMutation = useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: { isVerified?: boolean; acceptingJobs?: boolean };
    }) => api.adminUpdatePartner(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  const data = partnersQuery.data;

  return (
    <div>
      <PageHeader
        title="Đối tác"
        description="Hàng đợi duyệt hồ sơ người làm — chưa verify xếp lên đầu."
      />
      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tên, email, tiêu đề, thành phố…"
        />
        <SelectFilter
          label="Mọi trạng thái duyệt"
          value={verified}
          onChange={(value) => setParam('verified', value)}
          options={VERIFIED_OPTIONS}
        />
        <SelectFilter
          label="Mọi trạng thái việc"
          value={accepting}
          onChange={(value) => setParam('acceptingJobs', value)}
          options={ACCEPTING_OPTIONS}
        />
      </FilterBar>

      {partnersQuery.isLoading ? <p className="mt-6">Đang tải…</p> : null}
      {partnerMutation.isError ? (
        <p className="mt-3 text-sm text-red-600">
          {(partnerMutation.error as Error).message}
        </p>
      ) : null}

      {data && data.items.length === 0 ? (
        <EmptyState>Không có hồ sơ khớp bộ lọc.</EmptyState>
      ) : null}

      {data && data.items.length > 0 ? (
        <>
          <div className="mt-5 space-y-3">
            {data.items.map((partner) => (
              <article
                key={partner.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm ${
                  partner.isVerified
                    ? 'border-[var(--color-line)]'
                    : 'border-amber-300'
                }`}
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    <Link
                      to={`/user/${partner.userId}`}
                      className="hover:text-[var(--color-brand-deep)]"
                    >
                      {partner.user.fullName}
                    </Link>
                    <Badge tone={partner.isVerified ? 'green' : 'amber'}>
                      {partner.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                    </Badge>
                    <Badge tone={partner.acceptingJobs ? 'blue' : 'neutral'}>
                      {partner.acceptingJobs ? 'Đang nhận việc' : 'Tạm nghỉ'}
                    </Badge>
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {partner.user.email} · {partner.city ?? '—'} · Lv{' '}
                    {partner.level} · {partner.ratingAvg}★ ({partner.ratingCount})
                    · {partner._count.offerings} dịch vụ
                  </p>
                  {partner.headline ? (
                    <p className="mt-1 text-sm">{partner.headline}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Mở hồ sơ {formatDateTime(partner.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {partner.isVerified ? (
                    <button
                      type="button"
                      disabled={partnerMutation.isPending}
                      className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                      onClick={() =>
                        partnerMutation.mutate({
                          userId: partner.userId,
                          payload: { isVerified: false },
                        })
                      }
                    >
                      Bỏ verify
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={partnerMutation.isPending}
                      className="admin-btn admin-btn-primary h-9"
                      onClick={() =>
                        partnerMutation.mutate({
                          userId: partner.userId,
                          payload: { isVerified: true },
                        })
                      }
                    >
                      Duyệt hồ sơ
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={partnerMutation.isPending}
                    className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                    onClick={() =>
                      partnerMutation.mutate({
                        userId: partner.userId,
                        payload: { acceptingJobs: !partner.acceptingJobs },
                      })
                    }
                  >
                    {partner.acceptingJobs ? 'Cho tạm nghỉ' : 'Cho nhận việc'}
                  </button>
                </div>
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
