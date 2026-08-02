import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../features/auth/auth-context';
import { toast } from '../../lib/notify';
import { api } from '../../services/api';
import { PhoneVerificationBadge } from '../ui/partner-badges';

type Props = {
  /** Số mặc định khi mở form. */
  defaultPhone?: string;
  className?: string;
  onVerified?: () => void;
};

/** Xác minh SĐT bằng key một lần: TenUser-XXXXXX (eSMS hoặc mock web). */
export function PhoneOtpVerifyCard({
  defaultPhone = '',
  className = '',
  onVerified,
}: Props) {
  const { user, refreshMe } = useAuth();
  const [phone, setPhone] = useState(defaultPhone || user?.phone || '');
  const [key, setKey] = useState('');
  const [issuedKey, setIssuedKey] = useState<string | null>(null);
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [channel, setChannel] = useState<string | null>(null);

  const requestMutation = useMutation({
    mutationFn: () => api.requestPhoneOtpKey(phone),
    onSuccess: (data) => {
      setChannel(data.channel);
      setAwaitingCode(true);
      if (data.key) {
        setIssuedKey(data.key);
        setKey(data.key);
        toast.success('Đã tạo key (mock)', { description: data.key });
      } else {
        setIssuedKey(null);
        setKey('');
        toast.success('Đã gửi SMS', {
          description: data.message,
        });
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const confirmMutation = useMutation({
    mutationFn: () => api.confirmPhoneOtpKey(key),
    onSuccess: async () => {
      toast.success('Đã xác minh SĐT — key đã hết hiệu lực');
      setIssuedKey(null);
      setAwaitingCode(false);
      setChannel(null);
      setKey('');
      await refreshMe();
      onVerified?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const verified = Boolean(user?.phoneVerified);
  const viaSms = channel === 'esms' || channel === 'esms_sandbox';

  function onRequest(e: FormEvent) {
    e.preventDefault();
    requestMutation.mutate();
  }

  function onConfirm(e: FormEvent) {
    e.preventDefault();
    confirmMutation.mutate();
  }

  return (
    <div
      className={`rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)]/60 p-4 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-[var(--color-ink)]">Xác minh SĐT</p>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            Key một lần <strong>TenUser-XXXXXX</strong>
            {viaSms ? ' — gửi qua SMS eSMS.' : ' — mock trên web nếu chưa cấu hình eSMS.'}
          </p>
        </div>
        <PhoneVerificationBadge verified={verified} />
      </div>

      {verified ? (
        <p className="mt-3 text-sm text-emerald-700">
          Đã xác minh{user?.phone ? `: ${user.phone}` : ''}.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <form onSubmit={onRequest} className="space-y-2">
            <label className="block text-sm font-semibold" htmlFor="otp-phone">
              Số điện thoại
            </label>
            <input
              id="otp-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="field-input w-full text-sm"
              placeholder="090…"
              inputMode="tel"
            />
            <button
              type="submit"
              disabled={requestMutation.isPending || phone.trim().length < 9}
              className="btn-primary px-4 py-2 text-sm !text-white disabled:opacity-50"
            >
              {requestMutation.isPending
                ? 'Đang gửi…'
                : viaSms || awaitingCode
                  ? 'Gửi lại mã'
                  : 'Gửi mã xác minh'}
            </button>
          </form>

          {awaitingCode ? (
            <form
              onSubmit={onConfirm}
              className="space-y-2 rounded-lg border border-[var(--color-line)] bg-white p-3"
            >
              {issuedKey ? (
                <>
                  <p className="text-xs text-[var(--color-muted)]">
                    Key mock (chỉ dùng 1 lần):
                  </p>
                  <p className="break-all font-mono text-base font-extrabold text-[var(--color-navy)]">
                    {issuedKey}
                  </p>
                </>
              ) : (
                <p className="text-xs text-[var(--color-muted)]">
                  Nhập key trong SMS (dạng TenUser-XXXXXX)
                  {channel === 'esms_sandbox' ? ' · sandbox eSMS' : ''}.
                </p>
              )}
              <input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="field-input w-full text-sm"
                placeholder="TenUser-XXXXXX hoặc mã 6 số"
                autoComplete="one-time-code"
              />
              <button
                type="submit"
                disabled={confirmMutation.isPending || key.trim().length < 4}
                className="rounded-full bg-[var(--color-navy)] px-4 py-2 text-sm font-semibold !text-white disabled:opacity-50"
              >
                {confirmMutation.isPending ? 'Đang xác minh…' : 'Xác nhận'}
              </button>
            </form>
          ) : null}
        </div>
      )}
    </div>
  );
}
