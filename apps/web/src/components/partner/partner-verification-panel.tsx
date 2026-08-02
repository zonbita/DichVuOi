import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PhoneOtpVerifyCard } from '../auth/phone-otp-verify-card';
import { toast } from '../../lib/notify';
import { api } from '../../services/api';
import {
  BankVerificationBadge,
  VerificationBadge,
} from '../ui/partner-badges';

type ProfileLike = {
  phoneVerified?: boolean;
  bankVerified?: boolean;
  isVerified?: boolean;
  bankName?: string | null;
  bankAccountNo?: string | null;
  bankAccountName?: string | null;
  bankVerifyPending?: boolean;
  user?: { phone?: string | null };
};

type Props = {
  profile: ProfileLike;
  defaultPhone?: string;
};

export function PartnerVerificationPanel({ profile, defaultPhone = '' }: Props) {
  const queryClient = useQueryClient();
  const [bankName, setBankName] = useState(profile.bankName ?? 'Vietcombank');
  const [accountNo, setAccountNo] = useState(profile.bankAccountNo ?? '');
  const [accountName, setAccountName] = useState(profile.bankAccountName ?? '');
  const [bankBin, setBankBin] = useState('970436');
  const [qr, setQr] = useState<{
    intentId: string;
    qrImageUrl: string;
    amount: number;
    mockConfirmEnabled?: boolean;
  } | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['partner', 'me'] });
    void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
  };

  const bankLink = useMutation({
    mutationFn: () =>
      api.linkPartnerBank({
        bankName,
        accountNo,
        accountName,
        bankBin,
      }),
    onSuccess: (data) => {
      setQr({
        intentId: data.intentId,
        qrImageUrl: data.qrImageUrl,
        amount: data.amount,
        mockConfirmEnabled: data.mockConfirmEnabled,
      });
      toast.success('Đã tạo VietQR xác minh NH');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const bankConfirm = useMutation({
    mutationFn: () => api.confirmPartnerBankVerify(qr!.intentId),
    onSuccess: () => {
      toast.success('Đã xác minh ngân hàng');
      setQr(null);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function onBankLink(e: FormEvent) {
    e.preventDefault();
    bankLink.mutate();
  }

  return (
    <section className="surface-card space-y-5 p-4 sm:p-5">
      <div>
        <h3 className="text-lg font-extrabold text-[var(--color-navy)]">Xác minh danh tính</h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          SĐT dùng key một lần (tên + mã). Ngân hàng: VietQR mock. eKYC hồ sơ do admin duyệt.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <VerificationBadge verified={Boolean(profile.isVerified)} />
          <BankVerificationBadge verified={Boolean(profile.bankVerified)} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <PhoneOtpVerifyCard
          defaultPhone={defaultPhone || profile.user?.phone || ''}
          onVerified={invalidate}
        />

        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)]/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-[var(--color-ink)]">Liên kết ngân hàng (VietQR)</p>
            <BankVerificationBadge verified={Boolean(profile.bankVerified)} />
          </div>
          {profile.bankVerified ? (
            <p className="mt-3 text-sm text-emerald-700">
              Đã xác minh: {profile.bankName} · {profile.bankAccountNo} ·{' '}
              {profile.bankAccountName}
            </p>
          ) : (
            <form onSubmit={onBankLink} className="mt-3 space-y-2">
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="field-input w-full text-sm"
                placeholder="Tên ngân hàng"
              />
              <input
                value={bankBin}
                onChange={(e) => setBankBin(e.target.value)}
                className="field-input w-full text-sm"
                placeholder="BIN VietQR (VD 970436 = VCB)"
              />
              <input
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                className="field-input w-full text-sm"
                placeholder="Số tài khoản"
              />
              <input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="field-input w-full text-sm"
                placeholder="Tên chủ TK (IN HOA)"
              />
              <button
                type="submit"
                disabled={
                  bankLink.isPending ||
                  accountNo.trim().length < 5 ||
                  accountName.trim().length < 2
                }
                className="btn-primary px-4 py-2 text-sm !text-white disabled:opacity-50"
              >
                {bankLink.isPending ? 'Đang tạo QR…' : 'Tạo VietQR xác minh'}
              </button>
            </form>
          )}

          {qr && !profile.bankVerified ? (
            <div className="mt-4 space-y-2">
              <img
                src={qr.qrImageUrl}
                alt="VietQR xác minh NH"
                className="mx-auto h-44 w-44 rounded-lg border border-[var(--color-line)] bg-white object-contain"
              />
              {qr.mockConfirmEnabled !== false ? (
                <>
                  <p className="text-center text-xs text-[var(--color-muted)]">
                    Mock: chuyển {qr.amount.toLocaleString('vi-VN')} VNĐ rồi bấm xác nhận.
                  </p>
                  <button
                    type="button"
                    disabled={bankConfirm.isPending}
                    onClick={() => bankConfirm.mutate()}
                    className="w-full rounded-full bg-[var(--color-navy)] px-4 py-2 text-sm font-semibold !text-white disabled:opacity-50"
                  >
                    {bankConfirm.isPending ? 'Đang xác nhận…' : 'Tôi đã chuyển (mock)'}
                  </button>
                </>
              ) : (
                <p className="text-center text-xs text-[var(--color-muted)]">
                  Đã tạo yêu cầu. Hệ thống sẽ xác minh qua chuyển khoản thật (mock đã tắt).
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
