import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context';
import { HIRE_PAGE_MIN_WALLET_VND } from '../../features/booking/hire-wallet-gate';
import { formatPrice } from '../../services/api';
import { Icon } from '../ui/icon';

type Props = {
  balance: number;
  minBalance?: number;
};

/** Màn chặn khi ví chưa đủ để vào form thuê — hướng sang nạp (khu Hồ sơ / Ví). */
export function HireWalletGate({
  balance,
  minBalance = HIRE_PAGE_MIN_WALLET_VND,
}: Props) {
  const navigate = useNavigate();
  const { setMode } = useAuth();
  const shortfall = Math.max(0, minBalance - balance);

  function goTopUp() {
    // Ví nằm trong menu Hồ sơ (cùng tài khoản Khách thuê) — không chuyển sang Người làm.
    setMode('hire');
    navigate('/don-cua-toi/vi');
  }

  return (
    <div className="animate-fade-up flex h-full min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-center">
      <section className="glass-card w-full max-w-lg overflow-hidden !rounded-xl p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)] ring-1 ring-[var(--glass-line,rgba(23,32,51,0.08))]">
            <Icon name="wallet" className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-lg font-extrabold tracking-tight text-[var(--glass-ink,#172033)] sm:text-xl">
            Cần nạp ví trước khi thuê
          </h1>
          <p className="mt-2 text-sm text-[var(--glass-muted,#7c8799)]">
            Trang đăng ký thuê mở khi số dư ví tối thiểu{' '}
            <strong className="text-[var(--glass-ink,#172033)]">
              {formatPrice(minBalance)}
            </strong>
            . Tạo đơn sẽ giam cọc từ ví — hãy nạp đủ rồi quay lại.
          </p>
        </div>

        <dl className="mt-6 grid gap-2 rounded-xl border border-[var(--glass-line,rgba(23,32,51,0.08))] bg-white/40 px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[var(--glass-muted,#7c8799)]">Số dư hiện tại</dt>
            <dd className="font-bold tabular-nums text-[var(--glass-ink,#172033)]">
              {formatPrice(balance)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[var(--glass-muted,#7c8799)]">Tối thiểu để vào trang</dt>
            <dd className="font-bold tabular-nums text-[var(--glass-ink,#172033)]">
              {formatPrice(minBalance)}
            </dd>
          </div>
          {shortfall > 0 ? (
            <div className="flex items-center justify-between gap-3 border-t border-[var(--glass-line,rgba(23,32,51,0.08))] pt-2">
              <dt className="text-[var(--glass-muted,#7c8799)]">Còn thiếu</dt>
              <dd className="font-bold tabular-nums text-[#C98518]">
                {formatPrice(shortfall)}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={goTopUp}
            className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm"
          >
            <Icon name="wallet" className="h-4 w-4" />
            Nạp ví ngay
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('hire');
              navigate('/don-cua-toi');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--glass-line,rgba(23,32,51,0.12))] bg-white/50 px-5 py-2.5 text-sm font-semibold text-[var(--glass-ink,#172033)] transition hover:bg-white/80"
          >
            Về đơn của tôi
          </button>
        </div>
      </section>
    </div>
  );
}
