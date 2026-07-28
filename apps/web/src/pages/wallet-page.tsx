import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
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

export function WalletPage({ basePath }: { basePath: '/don-cua-toi' | '/doi-tac' }) {
  const { user, loading, refreshMe } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number>(TOP_UP_PRESETS[3]);
  const [intent, setIntent] = useState<VietQrTopUpIntent | null>(null);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
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

  if (loading) return <p>Đang tải…</p>;
  if (!user) {
    return <Navigate to={`/dang-nhap?redirect=${basePath}/vi`} replace />;
  }

  const balance = walletQuery.data?.balance ?? user.walletBalance ?? 0;
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

  function handleAmountChange(raw: string) {
    const digits = raw.replace(/[^\d]/g, '');
    setAmount(digits ? Number(digits) : 0);
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section className="border border-[var(--color-line)] bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                Số dư khả dụng
              </p>
              <p className="mt-2 text-3xl font-extrabold text-[var(--color-gold)]">
                {formatPrice(balance)}
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Đơn vị VNĐ · thanh toán nội bộ trên sàn (mô phỏng)
              </p>
            </div>
            <h2 className="mt-4 font-extrabold">Nạp VNĐ</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Chọn mức hoặc nhập số tiền rồi tạo mã VietQR (tối thiểu 20.000 VNĐ).
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
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
            <label className="mt-4 flex items-center gap-3 text-sm">
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
              className="btn-primary mt-4 px-4 py-2 text-sm disabled:opacity-50"
            >
              {createIntentMutation.isPending
                ? 'Đang tạo mã…'
                : `Tạo QR ${formatPrice(amount)}`}
            </button>
          </div>

          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] p-4">
            {intent ? (
              <>
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={intent.qrImageUrl}
                    alt="VietQR nạp ví"
                    className="h-[400px] w-[300px] rounded-lg border border-[var(--color-line)] bg-white p-1 object-contain"
                  />
                  <div className="w-full space-y-1 text-sm">
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
                  <p className="mt-3 text-sm text-red-600">
                    {(confirmMutation.error as Error).message}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
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
              </>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">
                Tạo mã QR ở cột trái để hiện thông tin thanh toán tại đây.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="border border-[var(--color-line)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
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
          <p className="mt-3 text-sm text-[var(--color-muted)]">Đang tải…</p>
        ) : null}
        {filteredTransactions.length === 0 && !walletQuery.isLoading ? (
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            Chưa có giao dịch.
          </p>
        ) : null}
        <ul className="mt-3 divide-y divide-[var(--color-line)]">
          {filteredTransactions.map((tx: WalletTransaction) => {
            const positive = tx.amount > 0;
            return (
              <li
                key={tx.id}
                className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold">
                    {WALLET_TX_LABELS[tx.type as WalletTransactionType] ?? tx.type}
                  </p>
                  <p className="text-[var(--color-muted)]">{tx.description}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
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
                <div className="text-right">
                  <p
                    className={`font-extrabold ${
                      positive ? 'text-[var(--color-gold)]' : 'text-[var(--color-invoice)]'
                    }`}
                  >
                    {positive ? '+' : ''}
                    {formatPrice(tx.amount)}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    Sau GD: {formatPrice(tx.balanceAfter)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      </div>
    </div>
  );
}
