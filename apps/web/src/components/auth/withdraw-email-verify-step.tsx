import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../features/auth/auth-context';
import { toast } from '../../lib/notify';
import { api } from '../../services/api';

type Props = {
  onVerified?: () => void;
};

/**
 * Bước 1 rút tiền (user email/MK, chưa Google):
 * ô email trống — user tự nhập, OTP Gmail, rồi mới nhập NH.
 * Chỉ hiện mã mock khi API chưa cấu hình Gmail (dev). Max 5 OTP/giờ.
 */
export function WithdrawEmailVerifyStep({ onVerified }: Props) {
  const { refreshMe } = useAuth();
  const [email, setEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [issuedEmailCode, setIssuedEmailCode] = useState<string | null>(null);
  const [channel, setChannel] = useState<'gmail' | 'mock' | null>(null);

  const requestEmail = useMutation({
    mutationFn: () => api.requestEmailOtp(email.trim()),
    onSuccess: (data) => {
      if (data.alreadyVerified) {
        toast.success('Email đã xác minh');
        void refreshMe();
        onVerified?.();
        return;
      }
      const ch = data.channel === 'gmail' ? 'gmail' : 'mock';
      setChannel(ch);
      setIssuedEmailCode(data.code ?? null);
      if (data.code) setEmailCode(data.code);
      if (ch === 'mock') {
        toast.warning(data.message, {
          description: data.code
            ? `Mã OTP: ${data.code} — bấm Hoàn thành bên dưới`
            : undefined,
        });
      } else {
        toast.success(data.message);
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const confirmEmail = useMutation({
    mutationFn: () => api.confirmEmailOtp(emailCode),
    onSuccess: async () => {
      toast.success('Đã xác minh email — tiếp tục nhập ngân hàng');
      setIssuedEmailCode(null);
      setEmailCode('');
      setChannel(null);
      await refreshMe();
      onVerified?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-amber-800/80">
        Bước 1 / 2
      </p>
      <h2 className="mt-1 text-lg font-extrabold text-[var(--color-navy)]">
        Xác minh email
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Nhập email nhận mã OTP. Xác nhận xong mới nhập ngân hàng. Google login
        thì bỏ qua bước này.
      </p>

      <label className="mt-4 block space-y-1.5">
        <span className="text-sm font-semibold">Email của bạn</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="nhap@gmail.com"
          className="field-input w-full"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={requestEmail.isPending || !email.trim().includes('@')}
          onClick={() => requestEmail.mutate()}
          className="btn-primary px-4 py-2.5 text-sm !text-white disabled:opacity-50"
        >
          {requestEmail.isPending ? 'Đang gửi…' : 'Gửi mã xác minh'}
        </button>
      </div>

      {channel === 'mock' && issuedEmailCode ? (
        <div className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-amber-950">
          <p className="font-semibold">Chưa gửi được vào hộp thư</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
            Môi trường dev chưa cấu hình Gmail — dùng mã dưới đây. Production
            (đã có App Password) sẽ chỉ gửi vào hộp thư, không hiện mã trên web.
          </p>
          <p className="mt-2 font-mono text-lg font-extrabold tracking-widest text-[var(--color-navy)]">
            {issuedEmailCode}
          </p>
        </div>
      ) : null}

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          confirmEmail.mutate();
        }}
        className="mt-4 space-y-2 rounded-xl border border-[var(--color-line)] bg-white p-3 sm:p-4"
      >
        {channel === 'gmail' ? (
          <p className="text-xs text-[var(--color-muted)]">
            Đã gửi mail — nhập mã 6 số trong hộp thư
          </p>
        ) : issuedEmailCode ? (
          <p className="text-xs text-[var(--color-muted)]">
            Nhập (hoặc giữ) mã mock ở trên rồi bấm hoàn thành
          </p>
        ) : (
          <p className="text-xs text-[var(--color-muted)]">
            Nhập mã 6 số sau khi gửi
          </p>
        )}
        <input
          value={emailCode}
          onChange={(e) =>
            setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))
          }
          className="field-input w-full text-sm"
          placeholder="123456"
          inputMode="numeric"
          autoComplete="one-time-code"
        />
        <button
          type="submit"
          disabled={confirmEmail.isPending || emailCode.length < 4}
          className="w-full rounded-full bg-[var(--color-navy)] px-4 py-2.5 text-sm font-semibold !text-white disabled:opacity-50"
        >
          {confirmEmail.isPending
            ? 'Đang xác minh…'
            : 'Hoàn thành — tiếp tục nhập ngân hàng'}
        </button>
      </form>
    </div>
  );
}
