import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { api, formatPrice } from '../services/api';
import {
  TOP_UP_PRESETS,
  WALLET_TX_LABELS,
  type WalletTransactionType,
} from '../types/finance';

export function WalletPage({ basePath }: { basePath: '/don-cua-toi' | '/doi-tac' }) {
  const { user, loading, refreshMe } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number>(TOP_UP_PRESETS[3]);
  const invoicesPath = `${basePath}/hoa-don`;

  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: api.getWallet,
    enabled: Boolean(user),
  });

  const topUpMutation = useMutation({
    mutationFn: (value: number) => api.topUpWallet(value),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        refreshMe(),
      ]);
    },
  });

  if (loading) return <p>Đang tải…</p>;
  if (!user) {
    return <Navigate to={`/dang-nhap?redirect=${basePath}/vi`} replace />;
  }

  const balance = walletQuery.data?.balance ?? user.walletBalance ?? 0;
  const transactions = walletQuery.data?.transactions ?? [];

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Ví VNĐ</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Nạp tiền để đặt cọc đơn. Hoàn cọc / giải ngân cũng về ví này.
          </p>
        </div>
        <Link
          to={invoicesPath}
          className="text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
        >
          Xem hóa đơn →
        </Link>
      </div>

      <section className="border border-[var(--color-line)] bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Số dư khả dụng
        </p>
        <p className="mt-2 text-3xl font-extrabold text-[var(--color-ink)]">
          {formatPrice(balance)}
        </p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Đơn vị VNĐ · thanh toán nội bộ trên sàn (mô phỏng)
        </p>
      </section>

      <section className="border border-[var(--color-line)] bg-white p-5 shadow-sm">
        <h2 className="font-extrabold">Nạp VNĐ</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Chọn mức hoặc nhập số tiền (tối thiểu 10.000₫).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TOP_UP_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(preset)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                amount === preset
                  ? 'border-[var(--color-brand-deep)] bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]'
                  : 'border-[var(--color-line)] text-[var(--color-ink)]'
              }`}
            >
              {formatPrice(preset)}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-sm">
          <span className="font-semibold text-[var(--color-muted)]">Số tiền (VNĐ)</span>
          <input
            type="number"
            min={10000}
            step={10000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="mt-1 w-full max-w-xs rounded-lg border border-[var(--color-line)] px-3 py-2"
          />
        </label>
        {topUpMutation.isError ? (
          <p className="mt-2 text-sm text-red-600">
            {(topUpMutation.error as Error).message}
          </p>
        ) : null}
        {topUpMutation.isSuccess ? (
          <p className="mt-2 text-sm font-semibold text-emerald-700">
            Đã nạp thành công.
          </p>
        ) : null}
        <button
          type="button"
          disabled={topUpMutation.isPending || amount < 10000}
          onClick={() => topUpMutation.mutate(amount)}
          className="btn-primary mt-4 px-4 py-2 text-sm disabled:opacity-50"
        >
          {topUpMutation.isPending ? 'Đang nạp…' : `Nạp ${formatPrice(amount)}`}
        </button>
      </section>

      <section className="border border-[var(--color-line)] bg-white p-5 shadow-sm">
        <h2 className="font-extrabold">Lịch sử ví</h2>
        {walletQuery.isLoading ? (
          <p className="mt-3 text-sm text-[var(--color-muted)]">Đang tải…</p>
        ) : null}
        {transactions.length === 0 && !walletQuery.isLoading ? (
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            Chưa có giao dịch.
          </p>
        ) : null}
        <ul className="mt-3 divide-y divide-[var(--color-line)]">
          {transactions.map((tx) => {
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
                      positive ? 'text-emerald-700' : 'text-[var(--color-ink)]'
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
  );
}
