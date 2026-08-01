import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../lib/notify';
import { api } from '../../services/api';
import {
  BankVerificationBadge,
  PhoneVerificationBadge,
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
  const [phone, setPhone] = useState(defaultPhone || profile.user?.phone || '');
  const [otp, setOtp] = useState('');
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [bankName, setBankName] = useState(profile.bankName ?? 'Vietcombank');
  const [accountNo, setAccountNo] = useState(profile.bankAccountNo ?? '');
  const [accountName, setAccountName] = useState(profile.bankAccountName ?? '');
  const [bankBin, setBankBin] = useState('970436');
  const [qr, setQr] = useState<{
    intentId: string;
    qrImageUrl: string;
    amount: number;
  } | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['partner', 'me'] });
    void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
  };

  const otpRequest = useMutation({
    mutationFn: () => api.requestPartnerPhoneOtp(phone),
    onSuccess: (data) => {
      setDebugCode(data.debugCode);
      setOtp(data.debugCode);
      toast.success('Đã gửi OTP mock', {
        description: `Mã test: ${data.debugCode}`,
      });
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const otpConfirm = useMutation({
    mutationFn: () => api.confirmPartnerPhoneOtp(otp),
    onSuccess: () => {
      toast.success('Đã xác minh SĐT');
      setDebugCode(null);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

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

  function onOtpRequest(e: FormEvent) {
    e.preventDefault();
    otpRequest.mutate();
  }

  function onOtpConfirm(e: FormEvent) {
    e.preventDefault();
    otpConfirm.mutate();
  }

  function onBankLink(e: FormEvent) {
    e.preventDefault();
    bankLink.mutate();
  }

  return (
    <section className="surface-card space-y-5 p-4 sm:p-5">
      <div>
        <h3 className="text-lg font-extrabold text-[var(--color-navy)]">Xác minh danh tính</h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          OTP SMS mock + VietQR xác minh tài khoản nhận payout (dev). eKYC hồ sơ vẫn do admin duyệt.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <VerificationBadge verified={Boolean(profile.isVerified)} />
          <PhoneVerificationBadge verified={Boolean(profile.phoneVerified)} />
          <BankVerificationBadge verified={Boolean(profile.bankVerified)} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <form
            onSubmit={onOtpRequest}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)]/60 p-4"
          >
            <p className="font-bold text-[var(--color-ink)]">1. Xác minh SĐT (OTP)</p>
            <label className="mt-3 mb-1 block text-sm font-semibold" htmlFor="verify-phone">
              Số điện thoại
            </label>
            <input
              id="verify-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="field-input w-full text-sm"
              placeholder="090…"
              disabled={profile.phoneVerified}
            />
            {profile.phoneVerified ? (
              <p className="mt-2 text-sm text-emerald-700">SĐT đã xác minh.</p>
            ) : (
              <button
                type="submit"
                disabled={otpRequest.isPending || phone.trim().length < 9}
                className="btn-primary mt-3 px-4 py-2 text-sm !text-white disabled:opacity-50"
              >
                {otpRequest.isPending ? 'Đang gửi…' : 'Gửi OTP mock'}
              </button>
            )}
          </form>
          {!profile.phoneVerified && debugCode ? (
            <form
              onSubmit={onOtpConfirm}
              className="space-y-2 rounded-xl border border-[var(--color-line)] bg-white p-3"
            >
              <p className="text-xs text-[var(--color-muted)]">
                Mã test (SMS mock): <strong>{debugCode}</strong>
              </p>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="field-input w-full text-sm"
                placeholder="Nhập OTP"
                maxLength={8}
              />
              <button
                type="submit"
                disabled={otpConfirm.isPending || otp.trim().length < 4}
                className="rounded-full bg-[var(--color-navy)] px-4 py-2 text-sm font-semibold !text-white disabled:opacity-50"
              >
                {otpConfirm.isPending ? 'Đang xác minh…' : 'Xác nhận OTP'}
              </button>
            </form>
          ) : null}
        </div>

        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)]/60 p-4">
          <p className="font-bold text-[var(--color-ink)]">2. Liên kết ngân hàng (VietQR)</p>
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
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
