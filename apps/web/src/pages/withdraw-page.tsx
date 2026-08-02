import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { toast } from '../lib/notify';
import { api, formatPrice, formatPriceNumber } from '../services/api';
import type { VietQrBank } from '../types/finance';

type Props = {
  basePath: '/don-cua-toi' | '/doi-tac';
};

function parseAmount(raw: string) {
  const digits = raw.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
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

  const banksQuery = useQuery({
    queryKey: ['vietqr', 'banks'],
    queryFn: () => api.getVietQrBanks(),
    staleTime: 24 * 60 * 60_000,
    enabled: Boolean(user),
  });

  const payout = walletQuery.data?.payout;
  const banks = banksQuery.data ?? [];

  useEffect(() => {
    if (!payout) return;
    if (payout.bankBin) setSelectedBin((prev) => prev || payout.bankBin!);
    if (payout.accountNo) setAccountNo((prev) => prev || payout.accountNo!);
    if (payout.accountName) setAccountName((prev) => prev || payout.accountName!);
  }, [payout]);

  const selectedBank: VietQrBank | undefined = banks.find(
    (b) => b.bin === selectedBin,
  );

  const filteredBanks = useMemo(() => {
    const q = bankQuery.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter(
      (b) =>
        b.shortName.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.bin.includes(q),
    );
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
    amount >= 20_000 &&
    amount <= balance &&
    Boolean(selectedBank) &&
    accountNo.trim().length >= 5 &&
    accountName.trim().length >= 2;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    withdrawMutation.mutate();
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Rút tiền</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Chọn ngân hàng VietQR, nhập STK nhận — trừ ví ngay (mock chuyển khoản).
          </p>
        </div>
        <Link
          to={`${basePath}/vi`}
          className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold"
        >
          Về Ví VNĐ
        </Link>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
        <form
          onSubmit={onSubmit}
          className="surface-card flex min-h-0 flex-col gap-3 overflow-hidden p-4 sm:p-5"
        >
          <div className="shrink-0 rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Số dư khả dụng
            </p>
            <p className="mt-1 text-2xl font-extrabold text-[var(--color-gold)]">
              {formatPrice(balance)}
            </p>
          </div>

          <label className="block shrink-0 space-y-1.5">
            <span className="text-sm font-semibold">Số tiền rút (tối thiểu 20.000)</span>
            <input
              type="text"
              inputMode="numeric"
              value={amount > 0 ? formatPriceNumber(amount) : ''}
              onChange={(e) => setAmount(parseAmount(e.target.value))}
              className="field-input w-full"
            />
          </label>

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <label className="block shrink-0 text-sm font-semibold" htmlFor="bank-search">
              Ngân hàng (VietQR — {banks.length || '…'} ngân hàng)
            </label>
            <input
              id="bank-search"
              value={bankQuery}
              onChange={(e) => setBankQuery(e.target.value)}
              className="field-input w-full shrink-0 text-sm"
              placeholder="Tìm Vietcombank, MB, 970436…"
            />
            {banksQuery.isLoading ? (
              <p className="text-sm text-[var(--color-muted)]">Đang tải danh sách NH…</p>
            ) : banksQuery.isError ? (
              <p className="text-sm text-red-600">
                {(banksQuery.error as Error).message}
              </p>
            ) : (
              <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain rounded-xl border border-[var(--color-line)] p-1.5">
                {filteredBanks.map((bank) => {
                  const active = bank.bin === selectedBin;
                  return (
                    <li key={`${bank.bin}-${bank.code}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBin(bank.bin);
                          setBankQuery(bank.shortName);
                        }}
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
                          <span className="block font-semibold text-[var(--color-ink)]">
                            {bank.shortName}
                          </span>
                          <span className="block truncate text-xs text-[var(--color-muted)]">
                            {bank.name} · BIN {bank.bin}
                          </span>
                        </span>
                        {bank.transferSupported ? (
                          <span className="shrink-0 text-[10px] font-bold uppercase text-emerald-700">
                            CK
                          </span>
                        ) : null}
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
            )}
          </div>

          <label className="block shrink-0 space-y-1.5">
            <span className="text-sm font-semibold">Số tài khoản</span>
            <input
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value.replace(/\D/g, ''))}
              className="field-input w-full"
              inputMode="numeric"
              placeholder="Chỉ chữ số"
            />
          </label>

          <label className="block shrink-0 space-y-1.5">
            <span className="text-sm font-semibold">Tên chủ tài khoản</span>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value.toUpperCase())}
              className="field-input w-full"
              placeholder="NGUYEN VAN A"
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit || withdrawMutation.isPending}
            className="btn-primary w-full shrink-0 py-2.5 text-sm !text-white disabled:opacity-50"
          >
            {withdrawMutation.isPending
              ? 'Đang xử lý…'
              : `Rút ${formatPrice(amount)}`}
          </button>
        </form>

        <aside className="surface-card flex shrink-0 flex-col gap-3 overflow-y-auto p-4 sm:p-5 lg:min-h-0 lg:overflow-y-auto">
          <h2 className="font-extrabold text-[var(--color-navy)]">Xác nhận</h2>
          {selectedBank ? (
            <div className="flex items-center gap-3">
              <img
                src={selectedBank.logo}
                alt=""
                className="h-12 w-12 rounded-lg border border-[var(--color-line)] bg-white object-contain p-1"
              />
              <div>
                <p className="font-bold">{selectedBank.shortName}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {selectedBank.code} · {selectedBank.bin}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">Chưa chọn ngân hàng</p>
          )}
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--color-muted)]">STK</dt>
              <dd className="font-semibold">{accountNo || '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--color-muted)]">Chủ TK</dt>
              <dd className="text-right font-semibold">{accountName || '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--color-muted)]">Số tiền</dt>
              <dd className="font-extrabold text-[var(--color-gold)]">
                {formatPrice(amount)}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-[var(--color-muted)]">
            Mock: trừ số dư ví ngay, chưa chuyển khoản ngân hàng thật. Lưu STK làm mặc định lần sau.
          </p>
        </aside>
      </div>
    </div>
  );
}
