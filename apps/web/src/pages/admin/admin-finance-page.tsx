import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { useState } from 'react';
import { api, formatPrice } from '../../services/api';
import {
  WALLET_TX_LABELS,
  type WalletTransactionType,
} from '../../types/finance';
import {
  Badge,
  EmptyState,
  FilterBar,
  PageHeader,
  Pagination,
  Panel,
  SearchInput,
  SelectFilter,
  StatCard,
} from './admin-ui';
import {
  formatDateTime,
  useFilterParams,
  useSearchFilter,
} from './admin-utils';

const TX_TYPE_OPTIONS = [
  { value: 'TOP_UP', label: 'Nạp' },
  { value: 'WITHDRAW', label: 'Rút' },
  { value: 'ESCROW_HOLD', label: 'Giữ cọc' },
  { value: 'ESCROW_REFUND', label: 'Hoàn cọc' },
  { value: 'PARTNER_PAYOUT', label: 'Trả đối tác' },
  { value: 'ADMIN_ADJUSTMENT', label: 'Admin điều chỉnh' },
  { value: 'APPLY_DEPOSIT', label: 'Cọc ứng tuyển' },
  { value: 'APPLY_REFUND', label: 'Hoàn cọc' },
  { value: 'APPLY_FORFEIT', label: 'Tịch thu cọc' },
];

export function AdminFinancePage() {
  const { get, page, setParam, setPage } = useFilterParams();
  const [search, setSearch] = useSearchFilter(get, setParam);
  const queryClient = useQueryClient();

  const q = get('q');
  const type = get('type');
  const positiveOnly = get('positiveOnly') === '1';
  const tab = get('tab') === 'tx' ? 'tx' : 'wallets';

  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const overviewQuery = useQuery({
    queryKey: ['admin', 'finance', 'overview'],
    queryFn: api.adminFinanceOverview,
  });

  const walletsQuery = useQuery({
    queryKey: ['admin', 'finance', 'wallets', { q, page, positiveOnly }],
    queryFn: () =>
      api.adminFinanceWallets({
        q: q || undefined,
        page,
        positiveOnly: positiveOnly || undefined,
      }),
    placeholderData: keepPreviousData,
    enabled: tab === 'wallets',
  });

  const txQuery = useQuery({
    queryKey: ['admin', 'finance', 'tx', { q, type, page }],
    queryFn: () =>
      api.adminFinanceTransactions({
        q: q || undefined,
        type: type || undefined,
        page,
      }),
    placeholderData: keepPreviousData,
    enabled: tab === 'tx',
  });

  const adjustMutation = useMutation({
    mutationFn: (payload: { userId: string; amount: number; reason: string }) =>
      api.adminAdjustWallet(payload.userId, {
        amount: payload.amount,
        reason: payload.reason,
      }),
    onSuccess: () => {
      setAdjustAmount('');
      setAdjustReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'finance'] });
    },
  });

  const overview = overviewQuery.data;
  const wallets = walletsQuery.data;
  const txs = txQuery.data;

  function submitAdjust(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(adjustAmount.trim());
    if (!adjustUserId.trim() || !Number.isFinite(amount) || amount === 0) return;
    if (adjustReason.trim().length < 3) return;
    adjustMutation.mutate({
      userId: adjustUserId.trim(),
      amount: Math.trunc(amount),
      reason: adjustReason.trim(),
    });
  }

  return (
    <div>
      <PageHeader
        title="Tiền"
        description="Tổng ví, cọc đang giữ, lịch sử giao dịch và điều chỉnh số dư (admin)."
      />

      {overviewQuery.isLoading ? (
        <p className="text-sm text-[var(--color-muted)]">Đang tải…</p>
      ) : null}

      {overview ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Tổng số dư ví"
            value={formatPrice(overview.totalWalletBalance)}
            hint={`${overview.walletsWithBalance} tài khoản có số dư`}
          />
          <StatCard
            label="Cọc đang giữ"
            value={formatPrice(overview.escrowHeldAmount)}
            hint={`${overview.escrowHeldCount} đơn`}
          />
          <StatCard
            label="Hoa hồng đã thu"
            value={formatPrice(overview.commissionEarned)}
          />
          <StatCard
            label="Đã rút (mock)"
            value={formatPrice(overview.withdrawnTotal)}
          />
        </div>
      ) : null}

      <Panel className="mb-6 p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-muted)]">
          Điều chỉnh ví
        </h2>
        <form
          onSubmit={submitAdjust}
          className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">User ID</span>
            <input
              value={adjustUserId}
              onChange={(e) => setAdjustUserId(e.target.value)}
              placeholder="cuid…"
              className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Số tiền (+/−)</span>
            <input
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="vd. 50000 hoặc -10000"
              className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2 lg:col-span-1">
            <span className="mb-1 block font-semibold">Lý do</span>
            <input
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="Hoàn tiền / bù lỗi…"
              className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={adjustMutation.isPending}
              className="w-full rounded-lg bg-[var(--color-navy)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {adjustMutation.isPending ? 'Đang lưu…' : 'Áp dụng'}
            </button>
          </div>
        </form>
        {adjustMutation.isError ? (
          <p className="mt-2 text-sm text-red-600">
            {(adjustMutation.error as Error).message}
          </p>
        ) : null}
        {adjustMutation.isSuccess ? (
          <p className="mt-2 text-sm text-emerald-700">
            Đã cập nhật — số dư mới{' '}
            {formatPrice(adjustMutation.data.balance)} (
            {adjustMutation.data.user.fullName}).
          </p>
        ) : null}
      </Panel>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setParam('tab', '');
            setPage(1);
          }}
          className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
            tab === 'wallets'
              ? 'bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]'
              : 'bg-[var(--color-canvas)] text-[var(--color-muted)]'
          }`}
        >
          Ví người dùng
        </button>
        <button
          type="button"
          onClick={() => {
            setParam('tab', 'tx');
            setPage(1);
          }}
          className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
            tab === 'tx'
              ? 'bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]'
              : 'bg-[var(--color-canvas)] text-[var(--color-muted)]'
          }`}
        >
          Giao dịch
        </button>
      </div>

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={
            tab === 'wallets'
              ? 'Tên, email, SĐT, user id…'
              : 'Mô tả, reference, tên…'
          }
        />
        {tab === 'wallets' ? (
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-muted)]">
            <input
              type="checkbox"
              checked={positiveOnly}
              onChange={(e) =>
                setParam('positiveOnly', e.target.checked ? '1' : '')
              }
            />
            Chỉ có số dư
          </label>
        ) : (
          <SelectFilter
            label="Mọi loại"
            value={type}
            onChange={(value) => setParam('type', value)}
            options={TX_TYPE_OPTIONS}
          />
        )}
      </FilterBar>

      {tab === 'wallets' ? (
        <>
          {walletsQuery.isLoading ? <p className="mt-6">Đang tải…</p> : null}
          {wallets && wallets.items.length === 0 ? (
            <EmptyState>Không có ví khớp bộ lọc.</EmptyState>
          ) : null}
          {wallets && wallets.items.length > 0 ? (
            <>
              <Panel className="mt-0 overflow-x-auto p-0 sm:p-0">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-line)] text-[var(--color-muted)]">
                      <th className="px-4 py-3 font-semibold">Người dùng</th>
                      <th className="py-3 font-semibold">Role</th>
                      <th className="py-3 font-semibold">Số dư</th>
                      <th className="py-3 font-semibold">Ngân hàng</th>
                      <th className="px-4 py-3 font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.items.map((w) => (
                      <tr
                        key={w.id}
                        className="border-b border-[var(--color-line)]/70 last:border-0"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{w.fullName}</div>
                          <div className="text-xs text-[var(--color-muted)]">
                            {w.email}
                          </div>
                          <div className="font-mono text-[10px] text-[var(--color-muted)]">
                            {w.id}
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge tone="neutral">{w.role}</Badge>
                        </td>
                        <td className="py-3 font-semibold">
                          {formatPrice(w.walletBalance)}
                        </td>
                        <td className="py-3 text-[var(--color-muted)]">
                          {w.bankName && w.bankAccountNo
                            ? `${w.bankName} · ${w.bankAccountNo}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="text-sm font-semibold text-[var(--color-brand-deep)]"
                            onClick={() => setAdjustUserId(w.id)}
                          >
                            Điều chỉnh
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
              <Pagination
                page={wallets.page}
                pageCount={wallets.pageCount}
                total={wallets.total}
                onChange={setPage}
              />
            </>
          ) : null}
        </>
      ) : (
        <>
          {txQuery.isLoading ? <p className="mt-6">Đang tải…</p> : null}
          {txs && txs.items.length === 0 ? (
            <EmptyState>Không có giao dịch.</EmptyState>
          ) : null}
          {txs && txs.items.length > 0 ? (
            <>
              <Panel className="mt-0 overflow-x-auto p-0 sm:p-0">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-line)] text-[var(--color-muted)]">
                      <th className="px-4 py-3 font-semibold">Thời gian</th>
                      <th className="py-3 font-semibold">User</th>
                      <th className="py-3 font-semibold">Loại</th>
                      <th className="py-3 font-semibold">Số tiền</th>
                      <th className="py-3 font-semibold">Sau GD</th>
                      <th className="px-4 py-3 font-semibold">Mô tả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txs.items.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-[var(--color-line)]/70 last:border-0"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-[var(--color-muted)]">
                          {formatDateTime(tx.createdAt)}
                        </td>
                        <td className="py-3">
                          <div className="font-medium">{tx.user.fullName}</div>
                          <div className="text-xs text-[var(--color-muted)]">
                            {tx.user.email}
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge tone="neutral">
                            {WALLET_TX_LABELS[tx.type as WalletTransactionType] ??
                              tx.type}
                          </Badge>
                        </td>
                        <td
                          className={`py-3 font-semibold ${
                            tx.amount >= 0 ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {tx.amount >= 0 ? '+' : '−'}
                          {formatPrice(Math.abs(tx.amount))}
                        </td>
                        <td className="py-3">{formatPrice(tx.balanceAfter)}</td>
                        <td className="px-4 py-3 text-[var(--color-muted)]">
                          {tx.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
              <Pagination
                page={txs.page}
                pageCount={txs.pageCount}
                total={txs.total}
                onChange={setPage}
              />
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
