import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { toast } from '../lib/notify';
import { api, formatPrice, formatPriceNumber } from '../services/api';
import type { VietQrBank } from '../types/finance';
import { Icon } from '../components/ui/icon';
import { WithdrawEmailVerifyStep } from '../components/auth/withdraw-email-verify-step';

type Props = {
  basePath: '/don-cua-toi' | '/doi-tac';
};

const AMOUNT_PRESETS = [100_000, 500_000, 1_000_000] as const;

const POPULAR_BANK_HINTS = [
  ['ICB', 'vietinbank', 'ctg'],
  ['VCB', 'vietcombank'],
  ['BIDV', 'bidv'],
  ['VBA', 'agribank', 'agr'],
] as const;

function parseAmount(raw: string) {
  const digits = raw.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

function bankMatchesQuery(bank: VietQrBank, q: string) {
  return (
    bank.shortName.toLowerCase().includes(q) ||
    bank.name.toLowerCase().includes(q) ||
    bank.code.toLowerCase().includes(q) ||
    bank.bin.includes(q)
  );
}

function popularBanks(banks: VietQrBank[]) {
  const picks: VietQrBank[] = [];
  for (const hints of POPULAR_BANK_HINTS) {
    const found = banks.find((b) => {
      const code = b.code.toUpperCase();
      const short = b.shortName.toLowerCase();
      const name = b.name.toLowerCase();
      return hints.some(
        (h) =>
          code === h.toUpperCase() ||
          short.includes(h) ||
          name.includes(h),
      );
    });
    if (found && !picks.some((p) => p.bin === found.bin)) picks.push(found);
  }
  if (picks.length >= 4) return picks.slice(0, 4);
  return [...picks, ...banks.filter((b) => !picks.some((p) => p.bin === b.bin))].slice(
    0,
    4,
  );
}

function WalletVerifiedIcon({ className = 'h-11 w-11' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="5"
        y="15"
        width="32"
        height="22"
        rx="5"
        fill="var(--color-brand)"
      />
      <path
        d="M11 15V11.5A3.5 3.5 0 0 1 14.5 8h11A3.5 3.5 0 0 1 29 11.5V15"
        fill="var(--color-brand-deep)"
      />
      <rect x="12" y="24.5" width="18" height="2.5" rx="1.25" fill="#fff" />
      <circle cx="35" cy="34" r="9" fill="#fff" />
      <circle cx="35" cy="34" r="7.25" fill="var(--color-brand)" />
      <path
        d="M31.8 34.1 34.1 36.4 38.4 31.8"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WithdrawPage({ basePath }: Props) {
  const { user, loading, refreshMe } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(100_000);
  const [bankQuery, setBankQuery] = useState('');
  const [selectedBin, setSelectedBin] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');

  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.getWallet(),
    enabled: Boolean(user),
  });

  const canEnterBank =
    Boolean(user?.emailVerified) || Boolean(walletQuery.data?.canWithdraw);

  const banksQuery = useQuery({
    queryKey: ['vietqr', 'banks'],
    queryFn: () => api.getVietQrBanks(),
    staleTime: 24 * 60 * 60_000,
    enabled: Boolean(user) && canEnterBank,
  });

  const payout = walletQuery.data?.payout;
  const banks = banksQuery.data ?? [];

  useEffect(() => {
    if (!payout || !canEnterBank) return;
    if (payout.bankBin) setSelectedBin((prev) => prev || payout.bankBin!);
    if (payout.accountNo) setAccountNo((prev) => prev || payout.accountNo!);
    if (payout.accountName) setAccountName((prev) => prev || payout.accountName!);
  }, [payout, canEnterBank]);

  const selectedBank: VietQrBank | undefined = banks.find(
    (b) => b.bin === selectedBin,
  );

  const featuredBanks = useMemo(() => popularBanks(banks), [banks]);

  const filteredBanks = useMemo(() => {
    const q = bankQuery.trim().toLowerCase();
    if (!q) return [];
    return banks.filter((b) => bankMatchesQuery(b, q)).slice(0, 12);
  }, [banks, bankQuery]);

  const withdrawMutation = useMutation({
    mutationFn: () => {
      if (!selectedBank) throw new Error('Chọn ngân hàng');
      return api.withdrawWallet({
        amount,
        bankBin: selectedBank.bin,
        bankCode: selectedBank.code,
        bankName: selectedBank.shortName || selectedBank.name,
        accountNo,
        accountName,
      });
    },
    onSuccess: async (data) => {
      toast.success('Đã gửi yêu cầu rút (mock)', {
        description: data.message,
      });
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
      await refreshMe();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (loading) return <p>Đang tải...</p>;
  if (!user) {
    return <Navigate to={`/dang-nhap?redirect=${basePath}/rut-tien`} replace />;
  }

  const balance = walletQuery.data?.balance ?? user.walletBalance ?? 0;
  const canSubmit =
    canEnterBank &&
    amount >= 20_000 &&
    amount <= balance &&
    Boolean(selectedBank) &&
    accountNo.trim().length >= 5 &&
    accountName.trim().length >= 2;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    withdrawMutation.mutate();
  }

  function selectBank(bank: VietQrBank) {
    setSelectedBin(bank.bin);
    setBankQuery('');
  }

  function onEmailVerified() {
    void queryClient.invalidateQueries({ queryKey: ['wallet'] });
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain pb-4">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-navy)] sm:text-3xl">
            Rút tiền
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {canEnterBank
              ? 'Bước 2: chọn ngân hàng và STK nhận — trừ Ví ngay (mock).'
              : 'Bước 1: xác minh email tài khoản trước khi nhập ngân hàng.'}
          </p>
        </div>
        <Link
          to={`${basePath}/vi`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[var(--color-brand-deep)] transition hover:bg-[var(--color-brand-soft)]"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
          Về Ví VNĐ
        </Link>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-brand)]/20 bg-gradient-to-r from-[var(--color-brand-soft)] via-[#f0faf9] to-white px-4 py-4 sm:px-5">
        <WalletVerifiedIcon className="h-12 w-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted)]">
            Số dư khả dụng
          </p>
          <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-[#F59E0B] sm:text-[28px]">
            {formatPrice(balance)}
          </p>
        </div>
        <div className="flex items-start gap-2 text-sm text-[var(--color-brand-deep)]">
          <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="leading-snug">
            <span className="font-semibold">Rút tiền nhanh chóng</span>
            <br />
            <span className="text-[var(--color-muted)]">An toàn &amp; bảo mật</span>
          </p>
        </div>
      </div>

      {!canEnterBank ? (
        <div className="mx-auto w-full max-w-lg">
          <WithdrawEmailVerifyStep onVerified={onEmailVerified} />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-5 rounded-2xl border border-[var(--color-line)] bg-white p-4 shadow-[0_4px_16px_rgba(24,49,63,0.04)] sm:p-5"
          >
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-800">
              Email đã xác minh ({user.email}) — nhập ngân hàng bên dưới.
            </div>

            <div className="space-y-2.5">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">
                Số tiền rút (tối thiểu 20.000)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount > 0 ? formatPriceNumber(amount) : ''}
                  onChange={(e) => setAmount(parseAmount(e.target.value))}
                  className="field-input w-full pr-14"
                />
                <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm font-semibold text-[var(--color-muted)]">
                  VNĐ
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {AMOUNT_PRESETS.map((preset) => {
                  const active = amount === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                        active
                          ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]'
                          : 'border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-brand)]/40'
                      }`}
                    >
                      {formatPriceNumber(preset)}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setAmount(balance)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                    amount === balance && balance > 0
                      ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]'
                      : 'border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-brand)]/40'
                  }`}
                >
                  Tất cả
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-sm font-semibold" htmlFor="bank-search">
                Ngân hàng (VietQR – {banks.length || '…'} ngân hàng)
              </label>
              <div className="relative">
                <input
                  id="bank-search"
                  value={bankQuery}
                  onChange={(e) => setBankQuery(e.target.value)}
                  className="field-input w-full pr-10 text-sm"
                  placeholder="Tìm ngân hàng (VietQR)..."
                />
                <Icon
                  name="search"
                  className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
                />
              </div>

              {banksQuery.isLoading ? (
                <p className="text-sm text-[var(--color-muted)]">Đang tải danh sách NH…</p>
              ) : banksQuery.isError ? (
                <p className="text-sm text-red-600">
                  {(banksQuery.error as Error).message}
                </p>
              ) : bankQuery.trim() ? (
                <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-[var(--color-line)] p-1.5">
                  {filteredBanks.map((bank) => {
                    const active = bank.bin === selectedBin;
                    return (
                      <li key={`${bank.bin}-${bank.code}`}>
                        <button
                          type="button"
                          onClick={() => selectBank(bank)}
                          className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition ${
                            active
                              ? 'bg-[var(--color-brand-soft)] ring-1 ring-[var(--color-brand)]'
                              : 'hover:bg-[var(--color-canvas)]'
                          }`}
                        >
                          <img
                            src={bank.logo}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded object-contain bg-white"
                            loading="lazy"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold">{bank.shortName}</span>
                            <span className="block truncate text-xs text-[var(--color-muted)]">
                              {bank.name}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {filteredBanks.length === 0 ? (
                    <li className="px-3 py-4 text-center text-sm text-[var(--color-muted)]">
                      Không khớp ngân hàng
                    </li>
                  ) : null}
                </ul>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {featuredBanks.map((bank) => {
                    const active = bank.bin === selectedBin;
                    return (
                      <button
                        key={bank.bin}
                        type="button"
                        onClick={() => selectBank(bank)}
                        className={`relative flex flex-col items-center gap-2 rounded-xl border bg-white px-2 py-3 text-center transition ${
                          active
                            ? 'border-[var(--color-brand)] shadow-[0_0_0_1px_var(--color-brand)]'
                            : 'border-[var(--color-line)] hover:border-[var(--color-brand)]/40'
                        }`}
                      >
                        {active ? (
                          <span className="absolute top-1.5 right-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-brand)] text-white">
                            <Icon name="check" className="h-2.5 w-2.5" />
                          </span>
                        ) : null}
                        <img
                          src={bank.logo}
                          alt=""
                          className="h-9 w-9 object-contain"
                          loading="lazy"
                        />
                        <span className="truncate text-xs font-semibold text-[var(--color-ink)]">
                          {bank.shortName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Số tài khoản</span>
                <input
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value.replace(/\D/g, ''))}
                  className="field-input w-full"
                  inputMode="numeric"
                  placeholder="Chỉ chữ số"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Tên chủ tài khoản</span>
                <input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  className="field-input w-full"
                  placeholder="NGUYEN VAN A"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || withdrawMutation.isPending}
              className="btn-primary w-full py-3 text-[15px] font-bold uppercase tracking-wide !text-white disabled:opacity-50"
            >
              {withdrawMutation.isPending
                ? 'Đang xử lý…'
                : `Rút ${formatPrice(amount)}`}
            </button>
          </form>

          <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-[var(--color-line)] bg-white p-4 shadow-[0_4px_16px_rgba(24,49,63,0.04)] sm:p-5">
            <h2 className="text-lg font-extrabold text-[var(--color-navy)]">Xác nhận</h2>

            {selectedBank ? (
              <div className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)]/60 p-3">
                <img
                  src={selectedBank.logo}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-lg bg-white object-contain p-1"
                />
                <div className="min-w-0">
                  <p className="font-bold text-[var(--color-ink)]">
                    {selectedBank.shortName}
                  </p>
                  <p className="truncate text-xs text-[var(--color-muted)]">
                    {selectedBank.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                    · BIN {selectedBank.bin}
                  </p>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-[var(--color-line)] px-3 py-4 text-center text-sm text-[var(--color-muted)]">
                Chưa chọn ngân hàng
              </p>
            )}

            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--color-muted)]">STK</dt>
                <dd className="font-semibold tabular-nums">{accountNo || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--color-muted)]">Chủ TK</dt>
                <dd className="max-w-[60%] truncate text-right font-semibold">
                  {accountName || '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--color-muted)]">Số tiền</dt>
                <dd className="font-extrabold tabular-nums text-[#F59E0B]">
                  {formatPrice(amount)}
                </dd>
              </div>
            </dl>

            <div className="border-t border-dashed border-[var(--color-line)] pt-4">
              <div className="flex gap-2.5">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                  <Icon name="shield" className="h-4 w-4" />
                </span>
                <p className="text-xs leading-relaxed text-[var(--color-muted)]">
                  Mock: trừ số dư ví ngay, chưa chuyển khoản ngân hàng thật. Lưu STK
                  làm mặc định lần sau.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
