import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type AppMode } from '../../features/auth/auth-context';
import { formatPrice } from '../../services/api';
import { Icon } from '../ui/icon';
import { UserAvatar } from '../ui/user-avatar';

const modes: { id: AppMode; label: string; hint: string }[] = [
  {
    id: 'hire',
    label: 'Khách thuê',
    hint: 'Tìm & thuê dịch vụ',
  },
  {
    id: 'offer',
    label: 'Người làm',
    hint: 'Nhận việc / hồ sơ',
  },
];

export function ModeSwitcher({ onDark = false }: { onDark?: boolean }) {
  const { user, mode, setMode, logout, canOffer } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!user) return null;

  const isBlocked = Boolean(user.isBlocked);
  const current = modes.find((item) => item.id === mode) ?? modes[0];
  const avatarSrc = user.partnerProfile?.avatarUrl;

  function switchMode(next: AppMode) {
    if (isBlocked) {
      setMode('hire');
      setOpen(false);
      navigate('/don-cua-toi/khieu-nai');
      return;
    }
    setMode(next);
    setOpen(false);
    if (next === 'hire') {
      navigate('/don-cua-toi');
      return;
    }
    navigate('/doi-tac');
  }

  return (
    <div ref={rootRef} className="relative min-w-0 shrink">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Tài khoản: ${user.fullName}, ${current.label}`}
        onClick={() => setOpen((value) => !value)}
        className={`group flex min-w-0 items-center gap-1.5 border py-1 pl-1 pr-1.5 text-left transition sm:max-w-[16rem] sm:gap-2.5 sm:pr-3 ${
          onDark
            ? open
              ? 'rounded-[14px] border-white/25 bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(5,45,71,0.22)]'
              : 'rounded-[14px] border-white/15 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_2px_8px_rgba(5,45,71,0.2)] hover:border-white/25 hover:bg-white/15'
            : open
              ? 'rounded-full border-[var(--color-brand)] bg-[var(--color-brand-soft)] shadow-sm'
              : 'rounded-full border-[var(--color-line)] bg-white shadow-sm hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]/60'
        }`}
      >
        <UserAvatar
          name={user.fullName}
          src={avatarSrc}
          userId={user.id}
          email={user.email}
          size="md"
        />
        <span className="hidden min-w-0 flex-1 py-0.5 sm:block">
          <span
            className={`block truncate text-sm font-bold leading-tight tracking-tight ${
              onDark ? 'text-white' : 'text-[var(--color-ink)]'
            }`}
          >
            {user.fullName}
          </span>
          <span
            className={`mt-0.5 block truncate text-[11px] font-medium ${
              onDark ? 'text-white/65' : 'text-[var(--color-muted)]'
            }`}
          >
            {current.label}
          </span>
        </span>
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition sm:h-6 sm:w-6 ${
            onDark
              ? open
                ? 'rotate-180 bg-white/20 text-white'
                : 'bg-white/10 text-white/70 group-hover:bg-white/15'
              : open
                ? 'rotate-180 bg-white text-[var(--color-brand-deep)]'
                : 'bg-[var(--color-canvas)] text-[var(--color-muted)] group-hover:bg-white'
          }`}
        >
          <Icon name="chevronDown" className="h-3.5 w-3.5" />
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-[9990] mt-2 w-[min(280px,calc(100dvw-2rem))] overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-2xl"
        >
          <div className="flex items-center gap-3 border-b border-[var(--color-line)] bg-[var(--color-canvas)] px-3.5 py-3">
            <UserAvatar
              name={user.fullName}
              src={avatarSrc}
              userId={user.id}
              email={user.email}
              size="lg"
            />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold leading-tight">{user.fullName}</p>
              <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">{user.email}</p>
              <p className="mt-1 truncate text-xs font-semibold text-[var(--color-gold)]">
                Ví: {formatPrice(user.walletBalance ?? 0)}
              </p>
            </div>
          </div>

          <p className="px-3.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            {isBlocked
              ? 'Tài khoản bị chặn'
              : 'Chuyển vai trên cùng tài khoản'}
          </p>
          {isBlocked ? (
            <div className="mx-2 mb-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800">
              Chỉ còn khiếu nại và chat hỗ trợ với admin.
              <button
                type="button"
                className="mt-2 block font-semibold text-[var(--color-brand-deep)] underline"
                onClick={() => {
                  setOpen(false);
                  navigate('/don-cua-toi/khieu-nai');
                }}
              >
                Mở khiếu nại
              </button>
            </div>
          ) : (
            <>
              {modes.map((item) => {
                const active = item.id === mode;
                const offerLocked = item.id === 'offer' && !canOffer;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => switchMode(item.id)}
                    className={`mx-2 mb-1 flex w-[calc(100%-1rem)] flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition hover:bg-[var(--color-brand-soft)] ${
                      active
                        ? 'bg-[var(--color-brand-soft)] ring-1 ring-[var(--color-brand)]/25'
                        : ''
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2 text-[15px] font-bold">
                      {item.label}
                      {active ? (
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[var(--color-brand-deep)]">
                          Đang dùng
                        </span>
                      ) : null}
                    </span>
                    <span className="text-sm text-[var(--color-muted)]">
                      {offerLocked
                        ? 'Chưa bật hồ sơ — sẽ mở form kích hoạt'
                        : item.hint}
                    </span>
                  </button>
                );
              })}

              <div className="mx-2 my-1 h-px bg-[var(--color-line)]" />

              <button
                type="button"
                onClick={() => {
                  setMode('hire');
                  setOpen(false);
                  navigate('/don-cua-toi/ho-so');
                }}
                className="mx-2 mb-1 flex w-[calc(100%-1rem)] items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition hover:bg-[var(--color-brand-soft)]"
              >
                <Icon name="user" className="h-5 w-5 shrink-0 text-sky-600" />
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold">Hồ sơ</span>
                  <span className="block text-sm text-[var(--color-muted)]">
                    Ví, rút tiền, hóa đơn, hỗ trợ
                  </span>
                </span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
              navigate('/');
            }}
            className="mt-1 w-full border-t border-[var(--color-line)] px-3.5 py-3 text-left text-[15px] font-semibold text-red-600 hover:bg-red-50"
          >
            Đăng xuất
          </button>
        </div>
      ) : null}
    </div>
  );
}
