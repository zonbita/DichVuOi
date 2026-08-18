import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { WalletHistoryPanel } from '../components/wallet/wallet-history-panel';
import { Icon } from '../components/ui/icon';
import { useAuth } from '../features/auth/auth-context';
import { toast } from '../lib/notify';
import { api, formatPrice, formatPriceNumber } from '../services/api';
import {
  TOP_UP_PRESETS,
  type VietQrTopUpIntent,
} from '../types/finance';
import type { HistoryFilter } from '../components/wallet/wallet-history-panel';

const HISTORY_PAGE_SIZE = 5;

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
      toast.info('Đã tạo mã QR', {
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
    <div className="flex min-h-0 flex-col gap-4 lg:h-[calc(100dvh-var(--site-header-h)-2.75rem)]">
      <div className="grid min-h-0 flex-1 gap-4 lg:h-full lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-col gap-4 lg:h-full">
            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_4px_14px_rgba(24,49,63,0.06)] backdrop-blur-md">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-gold-soft)] text-[var(--color-gold)]">
                <Icon name="wallet" className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Số dư khả dụng
                </p>
                <p className="mt-0.5 text-[1.65rem] font-extrabold leading-tight text-[var(--color-gold)]">
                  {formatPrice(balance)}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                  Đơn vị VNĐ · thanh toán nội bộ trên sàn (mô phỏng)
                </p>
              </div>
            </div>

          <div className="glass-card flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
            {intent ? (
              <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 sm:gap-4">
                <div className="flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-white/85 bg-white p-1.5 shadow-[0_6px_18px_rgba(15,39,71,0.08)]">
                  <img
                    src={intent.qrImageUrl}
                    alt="Mã QR nạp ví"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex h-full min-h-0 min-w-0 flex-col">
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--color-navy)]">
                        {intent.provider === 'payos'
                          ? 'Thanh toán VietQR · payOS'
                          : 'Thanh toán VietQR'}
                      </p>
                      {activeStatus?.status === 'PAID' ? (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          Đã nạp
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Chờ CK
                        </span>
                      )}
                    </div>
                    <dl className="grid grid-cols-[5.75rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2.5 text-sm">
                      <dt className="pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                        Số tiền
                      </dt>
                      <dd className="font-extrabold text-[var(--color-gold)]">
                        {formatPrice(intent.amount)}
                      </dd>
                      <dt className="pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                        Ngân hàng
                      </dt>
                      <dd className="break-all font-semibold text-[var(--color-navy)]">
                        {intent.bankId} · {intent.accountNo}
                      </dd>
                      <dt className="pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                        Nội dung
                      </dt>
                      <dd className="min-w-0 font-semibold leading-snug text-[var(--color-navy)]">
                        <span className="block break-all">{user.email}</span>
                        <span className="mt-0.5 block break-words">
                          {intent.accountName}
                        </span>
                      </dd>
                      <dt className="pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                        Hết hạn
                      </dt>
                      <dd className="font-semibold tabular-nums text-[var(--color-navy)]">
                        {Math.floor(secondsLeft / 60)}:
                        {String(secondsLeft % 60).padStart(2, '0')}
                      </dd>
                    </dl>
                  </div>
                  {confirmMutation.isError ? (
                    <p className="mt-1 truncate text-xs text-red-600">
                      {(confirmMutation.error as Error).message}
                    </p>
                  ) : null}
                  {walletQuery.data?.mockPaymentsEnabled !== false ? (
                    <div className="mt-auto flex shrink-0 gap-2 pt-2">
                      <button
                        type="button"
                        disabled={confirmMutation.isPending || activeStatus?.status === 'PAID'}
                        onClick={() => confirmMutation.mutate(intent.intentId)}
                        className="inline-flex h-8 min-w-0 flex-1 items-center justify-center rounded-lg bg-[var(--color-brand)] px-2 text-[12px] font-bold text-white transition hover:bg-[var(--color-brand-deep)] disabled:opacity-50"
                      >
                        {confirmMutation.isPending ? 'Đang xác nhận…' : 'Đã chuyển khoản'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIntent(null)}
                        className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-line)] bg-white/80 px-2.5 text-[12px] font-semibold text-[var(--color-navy)]"
                      >
                        Đóng
                      </button>
                    </div>
                  ) : (
                    <div className="mt-auto flex shrink-0 items-center gap-2 pt-2">
                      <p className="min-w-0 flex-1 truncate text-[11px] text-[var(--color-muted)]">
                        {walletQuery.data?.payosEnabled
                          ? 'Đang chờ payOS xác minh giao dịch.'
                          : 'Đang chờ webhook xác nhận.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIntent(null)}
                        className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-line)] bg-white/80 px-2.5 text-[12px] font-semibold text-[var(--color-navy)]"
                      >
                        Đóng
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]">
                  <Icon name="qrCode" className="h-5 w-5" />
                </span>
                <p className="max-w-[16rem] text-sm text-[var(--color-muted)]">
                  Tạo mã QR bên dưới để hiện thông tin thanh toán tại đây.
                </p>
              </div>
            )}
          </div>

            <div className="glass-card shrink-0 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]">
                  <Icon name="wallet" className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-navy)]">
                    Nạp VNĐ
                  </h2>
                  <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                    Chọn mức hoặc nhập số tiền rồi tạo mã QR (tối thiểu 20.000 VNĐ).
                    Giao dịch được{' '}
                    <a
                      href="https://payos.vn/"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-[var(--color-brand-deep)] underline-offset-2 hover:underline"
                    >
                      payOS
                    </a>{' '}
                    xác minh sau khi chuyển khoản.{' '}
                    <Link
                      to={`${basePath}/rut-tien`}
                      className="font-semibold text-[var(--color-brand-deep)] underline-offset-2 hover:underline"
                    >
                      Rút tiền
                    </Link>
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {TOP_UP_PRESETS.map((preset) => {
                  const active = amount === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`inline-flex items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
                        active
                          ? 'border-transparent bg-gradient-to-r from-fuchsia-600 via-sky-500 to-emerald-500 text-white shadow-[0_6px_16px_rgba(168,85,247,0.35)]'
                          : 'border-[var(--color-line)] bg-white text-[var(--color-navy)] hover:border-[var(--color-brand)]/30'
                      }`}
                    >
                      {active ? (
                        <Icon name="check" className="h-3.5 w-3.5 shrink-0" />
                      ) : null}
                      <span className="truncate">{formatPrice(preset)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Số tiền (VNĐ)
                </span>
                <label className="field-input flex h-11 min-w-0 flex-1 items-center gap-2.5 px-3 focus-within:border-[var(--color-brand)] focus-within:shadow-[0_0_0_3px_rgba(0,156,149,0.15)]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]">
                    <Icon name="card" className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount > 0 ? formatPriceNumber(amount) : ''}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 font-semibold text-[var(--color-navy)] outline-none"
                    placeholder="0"
                  />
                </label>
              </div>

              {createIntentMutation.isError ? (
                <p className="mt-2 text-sm text-red-600">
                  {(createIntentMutation.error as Error).message}
                </p>
              ) : null}
              <button
                type="button"
                disabled={createIntentMutation.isPending || amount < 20000}
                onClick={() => createIntentMutation.mutate(amount)}
                className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] text-sm font-bold uppercase tracking-wide text-white shadow-[0_4px_12px_rgba(0,156,149,0.28)] transition hover:bg-[var(--color-brand-deep)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="qrCode" className="h-4 w-4" />
                {createIntentMutation.isPending ? 'Đang tạo mã…' : 'Tạo mã QR'}
              </button>
            </div>
      </div>

      <div className="flex min-h-0 flex-col rounded-[22px] bg-[#F4F8FB] p-1 sm:p-1.5 lg:h-full lg:overflow-hidden">
        <WalletHistoryPanel
          basePath={basePath}
          historyFilter={historyFilter}
          onHistoryFilterChange={setHistoryFilter}
          isLoading={walletQuery.isLoading}
          transactions={pagedTransactions}
          totalCount={filteredTransactions.length}
          historyPage={historyPage}
          historyPageCount={historyPageCount}
          onHistoryPageChange={setHistoryPage}
        />
      </div>
      </div>
    </div>
  );
}
