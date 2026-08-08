import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  DashboardPageHeader,
  DashboardSurface,
} from '../components/dashboard/dashboard-chrome';
import { useAuth } from '../features/auth/auth-context';
import { toast } from '../lib/notify';
import { api, formatPrice, formatPriceNumber } from '../services/api';
import {
  TOP_UP_PRESETS,
  WALLET_TX_LABELS,
  type VietQrTopUpIntent,
  type WalletTransaction,
  type WalletTransactionType,
} from '../types/finance';

type HistoryFilter = 'day' | 'week' | 'month' | 'all';

const HISTORY_PAGE_SIZE = 5;

function historyPageNumbers(current: number, pageCount: number): Array<number | '…'> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, pageCount, current, current - 1, current + 1]);
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= pageCount - 2) {
    pages.add(pageCount - 1);
    pages.add(pageCount - 2);
    pages.add(pageCount - 3);
  }
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: Array<number | '…'> = [];
  for (const p of sorted) {
    if (out.length > 0) {
      const prev = out[out.length - 1];
      if (typeof prev === 'number' && p - prev > 1) out.push('…');
    }
    out.push(p);
  }
  return out;
}

export function WalletPage({ basePath }: { basePath: '/don-cua-toi' | '/doi-tac' }) {
  const { user, loading, refreshMe } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number>(TOP_UP_PRESETS[3]);
  const [intent, setIntent] = useState<VietQrTopUpIntent | null>(null);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const [historyPage, setHistoryPage] = useState(1);
  const paidHandledRef = useRef<string | null>(null);

  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: api.getWallet,
    enabled: Boolean(user),
  });

  const createIntentMutation = useMutation({
    mutationFn: (value: number) => api.createVietQrTopUpIntent(value),
    onSuccess: (data) => {
      setIntent(data);
      paidHandledRef.current = null;
      toast.info('Đã tạo mã VietQR', {
        description: `Quét QR để nạp ${formatPrice(data.amount)}`,
      });
    },
    onError: (err) => {
      toast.error('Không tạo được mã QR', {
        description: (err as Error).message,
      });
    },
  });

  const statusQuery = useQuery({
    queryKey: ['wallet', 'vietqr', intent?.intentId],
    queryFn: () => api.getVietQrTopUpStatus(intent!.intentId),
    enabled: Boolean(intent?.intentId),
    refetchInterval: (query) =>
      query.state.data?.status === 'PENDING' ? 3000 : false,
  });

  const confirmMutation = useMutation({
    mutationFn: (intentId: string) => api.confirmVietQrTopUpMock(intentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        refreshMe(),
      ]);
      if (intent) {
        await statusQuery.refetch();
      }
    },
    onError: (err) => {
      toast.error('Xác nhận nạp thất bại', {
        description: (err as Error).message,
      });
    },
  });

  const transactions = walletQuery.data?.transactions ?? [];
  const activeStatus = statusQuery.data;

  const filteredTransactions = useMemo(() => {
    if (historyFilter === 'all') return transactions;
    const now = Date.now();
    const start =
      historyFilter === 'day'
        ? now - 24 * 60 * 60 * 1000
        : historyFilter === 'week'
          ? now - 7 * 24 * 60 * 60 * 1000
          : now - 30 * 24 * 60 * 60 * 1000;
    return transactions.filter((tx) => new Date(tx.createdAt).getTime() >= start);
  }, [historyFilter, transactions]);

  const historyPageCount = Math.max(
    1,
    Math.ceil(filteredTransactions.length / HISTORY_PAGE_SIZE),
  );
  const safeHistoryPage = Math.min(historyPage, historyPageCount);

  const pagedTransactions = useMemo(() => {
    const start = (safeHistoryPage - 1) * HISTORY_PAGE_SIZE;
    return filteredTransactions.slice(start, start + HISTORY_PAGE_SIZE);
  }, [filteredTransactions, safeHistoryPage]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyFilter]);

  useEffect(() => {
    if (!intent || activeStatus?.status !== 'PAID') return;
    if (paidHandledRef.current === intent.intentId) return;
    paidHandledRef.current = intent.intentId;
    toast.success('Nạp tiền thành công', {
      description: `+${formatPrice(intent.amount)} đã vào ví`,
      confetti: true,
    });
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wallet'] }),
      refreshMe(),
    ]);
  }, [activeStatus?.status, intent, queryClient, refreshMe]);

  const secondsLeft = useMemo(() => {
    if (!intent) return 0;
    const diffMs = new Date(intent.expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diffMs / 1000));
  }, [intent, statusQuery.dataUpdatedAt]);

  if (loading) return <p>Đang tải…</p>;
  if (!user) {
    return <Navigate to={`/dang-nhap?redirect=${basePath}/vi`} replace />;
  }

  const balance = walletQuery.data?.balance ?? user.walletBalance ?? 0;

  function handleAmountChange(raw: string) {
    const digits = raw.replace(/[^\d]/g, '');
    setAmount(digits ? Number(digits) : 0);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 pb-2 lg:h-full">
      <DashboardPageHeader
        icon="wallet"
        title="Ví VNĐ"
        description="Nạp tiền qua VietQR (mô phỏng) và theo dõi biến động số dư."
        actions={
          <Link
            to={`${basePath}/rut-tien`}
            className="text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
          >
            Rút tiền →
          </Link>
        }
      />
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:overflow-hidden">
      <DashboardSurface className="no-scrollbar p-4 lg:min-h-0 lg:overflow-y-auto">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                Số dư khả dụng
              </p>
              <p className="mt-1.5 text-2xl font-extrabold text-[var(--color-gold)]">
                {formatPrice(balance)}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                Đơn vị VNĐ · thanh toán nội bộ trên sàn (mô phỏng)
              </p>
            </div>
            <h2 className="mt-3 font-extrabold">Nạp VNĐ</h2>
            <p className="mt-0.5 text-sm text-[var(--color-muted)]">
              Chọn mức hoặc nhập số tiền rồi tạo mã VietQR (tối thiểu 20.000 VNĐ).{' '}
              <Link to={`${basePath}/rut-tien`} className="font-semibold text-[var(--color-brand-deep)] underline">
                Rút tiền →
              </Link>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TOP_UP_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                    amount === preset
                      ? 'border-transparent bg-gradient-to-r from-fuchsia-600 via-sky-500 to-emerald-500 text-white shadow-[0_6px_16px_rgba(168,85,247,0.35)]'
                      : 'border-[var(--color-line)] text-[var(--color-ink)]'
                  }`}
                >
                  {formatPrice(preset)}
                </button>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-3 text-sm">
              <span className="shrink-0 font-semibold text-[var(--color-muted)]">Số tiền (VNĐ)</span>
              <input
                type="text"
                inputMode="numeric"
                value={amount > 0 ? formatPriceNumber(amount) : ''}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full max-w-xs rounded-lg border border-[var(--color-line)] px-3 py-2"
              />
            </label>
            {createIntentMutation.isError ? (
              <p className="mt-2 text-sm text-red-600">
                {(createIntentMutation.error as Error).message}
              </p>
            ) : null}
            <button
              type="button"
              disabled={createIntentMutation.isPending || amount < 20000}
              onClick={() => createIntentMutation.mutate(amount)}
              className="btn-primary mt-3 px-4 py-2 text-sm disabled:opacity-50"
            >
              {createIntentMutation.isPending
                ? 'Đang tạo mã…'
                : `Tạo QR ${formatPrice(amount)}`}
            </button>
          </div>

          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] p-3">
            {intent ? (
              <>
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={intent.qrImageUrl}
                    alt="VietQR nạp ví"
                    className="h-[220px] w-[165px] rounded-lg border border-[var(--color-line)] bg-white p-1 object-contain"
                  />
                  <div className="w-full space-y-0.5 text-sm">
                    <p>
                      <span className="font-semibold">Số tiền:</span> {formatPrice(intent.amount)}
                    </p>
                    <p>
                      <span className="font-semibold">Ngân hàng:</span> {intent.bankId} ·{' '}
                      {intent.accountNo}
                    </p>
                    <p>
                      <span className="font-semibold">Nội dung CK:</span> {intent.transferNote}
                    </p>
                    <p className="text-[var(--color-muted)]">
                      Hết hạn sau: {Math.floor(secondsLeft / 60)}:
                      {String(secondsLeft % 60).padStart(2, '0')}
                    </p>
                    {activeStatus?.status === 'PAID' ? (
                      <p className="font-semibold text-emerald-700">
                        Đã xác nhận nạp tiền thành công.
                      </p>
                    ) : (
                      <p className="text-[var(--color-muted)]">
                        Trạng thái: đang chờ xác nhận chuyển khoản.
                      </p>
                    )}
                  </div>
                </div>

                {confirmMutation.isError ? (
                  <p className="mt-2 text-sm text-red-600">
                    {(confirmMutation.error as Error).message}
                  </p>
                ) : null}
                {walletQuery.data?.mockPaymentsEnabled !== false ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={confirmMutation.isPending || activeStatus?.status === 'PAID'}
                    onClick={() => confirmMutation.mutate(intent.intentId)}
                    className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                  >
                    {confirmMutation.isPending
                      ? 'Đang xác nhận…'
                      : 'Tôi đã chuyển khoản (mock)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntent(null)}
                    className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm"
                  >
                    Đóng mã QR
                  </button>
                </div>
                ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  <p className="text-sm text-[var(--color-muted)]">
                    Đang chờ hệ thống xác nhận chuyển khoản (webhook).
                  </p>
                  <button
                    type="button"
                    onClick={() => setIntent(null)}
                    className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm"
                  >
                    Đóng mã QR
                  </button>
                </div>
                )}
              </>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">
                Tạo mã QR ở cột trái để hiện thông tin thanh toán tại đây.
              </p>
            )}
          </div>
        </div>
      </DashboardSurface>

      <DashboardSurface className="flex min-h-0 flex-col p-4 lg:h-full lg:max-h-full">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <h2 className="font-extrabold">Lịch sử ví</h2>
          <div className="flex flex-wrap gap-1.5">
            {[
              ['day', 'Ngày'],
              ['week', 'Tuần'],
              ['month', 'Tháng'],
              ['all', 'Tất cả'],
            ].map(([key, label]) => {
              const active = historyFilter === (key as HistoryFilter);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setHistoryFilter(key as HistoryFilter)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                    active
                      ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]'
                      : 'border-[var(--color-line)] text-[var(--color-muted)] hover:bg-[var(--color-canvas)]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        {walletQuery.isLoading ? (
          <p className="mt-2 text-sm text-[var(--color-muted)]">Đang tải…</p>
        ) : null}
        {filteredTransactions.length === 0 && !walletQuery.isLoading ? (
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Chưa có giao dịch.
          </p>
        ) : null}
        <ul className="mt-2 min-h-0 flex-1 divide-y divide-[var(--color-line)] overflow-hidden">
          {pagedTransactions.map((tx: WalletTransaction) => {
            const positive = tx.amount > 0;
            return (
              <li
                key={tx.id}
                className="flex items-start justify-between gap-2 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold leading-snug">
                    {WALLET_TX_LABELS[tx.type as WalletTransactionType] ?? tx.type}
                  </p>
                  <p className="truncate text-xs text-[var(--color-muted)]">
                    {tx.description}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--color-muted)]">
                    {new Date(tx.createdAt).toLocaleString('vi-VN')}
                    {tx.bookingId ? (
                      <>
                        {' · '}
                        <Link
                          to={
                            basePath === '/doi-tac'
                              ? `/doi-tac/viec/${tx.bookingId}`
                              : `/don-cua-toi/don/${tx.bookingId}`
                          }
                          className="font-semibold text-[var(--color-brand-deep)] hover:underline"
                        >
                          Đơn
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={`text-sm font-extrabold leading-snug ${
                      positive ? 'text-[var(--color-gold)]' : 'text-[var(--color-invoice)]'
                    }`}
                  >
                    {positive ? '+' : ''}
                    {formatPrice(tx.amount)}
                  </p>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Sau: {formatPrice(tx.balanceAfter)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        {historyPageCount > 1 ? (
          <div className="mt-2 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[var(--color-line)] pt-2 text-sm">
            <p className="text-xs text-[var(--color-muted)]">
              {filteredTransactions.length} GD · trang {safeHistoryPage}/{historyPageCount}
            </p>
            <nav className="flex flex-wrap items-center gap-1" aria-label="Phân trang lịch sử ví">
              <button
                type="button"
                disabled={safeHistoryPage <= 1}
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                className="border border-[var(--color-line)] bg-white px-2 py-0.5 text-xs font-semibold disabled:opacity-40"
              >
                Trước
              </button>
              {historyPageNumbers(safeHistoryPage, historyPageCount).map((item, idx) =>
                item === '…' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1 text-[var(--color-muted)]"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setHistoryPage(item)}
                    aria-current={item === safeHistoryPage ? 'page' : undefined}
                    className={`min-w-7 border px-2 py-0.5 text-xs font-bold ${
                      item === safeHistoryPage
                        ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]'
                        : 'border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-canvas)]'
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={safeHistoryPage >= historyPageCount}
                onClick={() =>
                  setHistoryPage((p) => Math.min(historyPageCount, p + 1))
                }
                className="border border-[var(--color-line)] bg-white px-2 py-0.5 text-xs font-semibold disabled:opacity-40"
              >
                Sau
              </button>
            </nav>
          </div>
        ) : null}
      </DashboardSurface>
      </div>
    </div>
  );
}
