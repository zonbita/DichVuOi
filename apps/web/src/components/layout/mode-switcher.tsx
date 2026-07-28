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

  const current = modes.find((item) => item.id === mode) ?? modes[0];
  const avatarSrc = user.partnerProfile?.avatarUrl;

  function switchMode(next: AppMode) {
    setMode(next);
    setOpen(false);
    if (next === 'hire') {
      navigate('/don-cua-toi');
      return;
    }
    navigate('/doi-tac');
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`group flex max-w-[14rem] items-center gap-2.5 rounded-full border py-1 pl-1 pr-2.5 text-left transition sm:max-w-[16rem] sm:pr-3 ${
          onDark
            ? open
              ? 'border-white/30 bg-white/15'
              : 'border-white/20 bg-white/10 hover:border-white/30 hover:bg-white/15'
            : open
              ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)] shadow-sm'
              : 'border-[var(--color-line)] bg-white shadow-sm hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]/60'
        }`}
      >
        <UserAvatar
          name={user.fullName}
          src={avatarSrc}
          userId={user.id}
          email={user.email}
          size="md"
        />
        <span className="min-w-0 flex-1 py-0.5">
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
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${
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
          className="absolute right-0 z-[9990] mt-2 w-[280px] overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-2xl"
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
            Chuyển vai trên cùng tài khoản
          </p>
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
                  active ? 'bg-[var(--color-brand-soft)] ring-1 ring-[var(--color-brand)]/25' : ''
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
                  {offerLocked ? 'Chưa bật hồ sơ — sẽ mở form kích hoạt' : item.hint}
                </span>
              </button>
            );
          })}
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
