import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context';
import { api } from '../../services/api';

/**
 * Chặn dùng app khi đã đăng nhập nhưng chưa đồng ý Nội quy
 * (tài khoản cũ / seed trước khi có trường termsAcceptedAt).
 * Admin / Moderator bỏ qua.
 */
export function TermsAcceptGate({ children }: { children: React.ReactNode }) {
  const { user, loading, applySession, token, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState(false);

  const needsAccept =
    Boolean(user) &&
    !user?.termsAcceptedAt &&
    user?.role !== 'ADMIN' &&
    user?.role !== 'MODERATOR';

  if (loading || !needsAccept) {
    return <>{children}</>;
  }

  async function onAccept() {
    if (!checked) {
      setError('Vui lòng tích đồng ý Nội quy và các quy tắc');
      return;
    }
    if (!token) return;
    setError('');
    setBusy(true);
    try {
      const next = await api.acceptTerms(token);
      applySession({ accessToken: token, user: next });
    } catch (err) {
      setError((err as Error).message || 'Không ghi nhận được đồng ý');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/50 p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="terms-gate-title"
          className="surface-card w-full max-w-lg p-6 shadow-2xl sm:p-8"
        >
          <h2 id="terms-gate-title" className="text-xl font-extrabold">
            Đồng ý Nội quy trước khi tiếp tục
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-muted)]">
            Tài khoản của bạn chưa xác nhận{' '}
            <Link
              to="/noi-quy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--color-brand-deep)] underline underline-offset-2"
            >
              Nội quy và các quy tắc
            </Link>{' '}
            (bảo vệ dữ liệu cá nhân & quy tắc sử dụng sàn). Đây là bước bắt buộc một lần.
          </p>
          <p className="mt-2">
            <Link
              to="/noi-quy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-[15px] font-semibold text-[var(--color-brand-deep)] underline underline-offset-2"
            >
              Xem nội quy đầy đủ
            </Link>
          </p>

          <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--color-line)]"
            />
            <span className="text-[var(--color-ink)]">
              Tôi đã đọc và đồng ý với{' '}
              <Link
                to="/noi-quy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--color-brand-deep)] underline underline-offset-2"
                onClick={(e) => e.stopPropagation()}
              >
                Nội quy và các quy tắc
              </Link>{' '}
              của Dịch Vụ Ơi.
            </span>
          </label>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onAccept()}
              className="btn-primary px-5 py-2.5 text-[15px] disabled:opacity-60"
            >
              {busy ? 'Đang lưu…' : 'Đồng ý và tiếp tục'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={logout}
              className="rounded-xl border border-[var(--color-line)] px-4 py-2.5 text-[15px] font-semibold text-[var(--color-muted)] hover:bg-[var(--color-canvas)]"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
