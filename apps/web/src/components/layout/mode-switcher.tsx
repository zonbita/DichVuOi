import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

/** Route thuộc menu Hồ sơ (ví, rút tiền, hóa đơn…) — cùng tài khoản, không đổi vai. */
const PROFILE_PATH_PREFIXES = [
  '/don-cua-toi/ho-so',
  '/don-cua-toi/vi',
  '/don-cua-toi/rut-tien',
  '/don-cua-toi/hoa-don',
  '/don-cua-toi/tro-giup',
  '/don-cua-toi/khieu-nai',
  '/don-cua-toi/noi-quy',
  '/doi-tac/ho-so',
  '/doi-tac/vi',
  '/doi-tac/rut-tien',
  '/doi-tac/hoa-don',
];

function isAccountProfilePath(pathname: string) {
  return PROFILE_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function ModeSwitcher({ onDark = false }: { onDark?: boolean }) {
  const { user, mode, setMode, logout, canOffer } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const onAccountProfile = isAccountProfilePath(pathname);

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
  /** Trên /vi, /ho-so… hiện «Hồ sơ» — không nhầm với chuyển vai Khách thuê / Người làm. */
  const statusLabel = onAccountProfile ? 'Hồ sơ' : current.label;

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
        aria-label={`Tài khoản: ${user.fullName}, ${statusLabel}`}
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
          loading="eager"
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
            {statusLabel}
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
          className="absolute right-0 z-[9990] mt-2 w-[min(320px,calc(100dvw-2rem))] overflow-hidden rounded-[22px] border border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-[0_18px_44px_rgba(5,45,71,0.18),0_4px_14px_rgba(5,45,71,0.1)]"
        >
          <div
            className="relative overflow-hidden px-4 py-4 text-white"
            style={{
              background:
                'radial-gradient(ellipse 130% 180% at 18% -40%, #0a5678 0%, #073b5c 42%, #052d47 78%, #041f32 100%)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(2,20,32,0.35)',
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.14),transparent_70%)]"
            />
            <div className="relative flex items-center gap-3">
              <UserAvatar
                name={user.fullName}
                src={avatarSrc}
                userId={user.id}
                email={user.email}
                size="lg"
                className="!h-12 !w-12 !text-base ring-[2.5px] ring-white/90"
              />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-extrabold uppercase leading-tight tracking-wide">
                  {user.fullName}
                </p>
                <p className="mt-0.5 truncate text-xs text-white/72">{user.email}</p>
              </div>
            </div>
            <div className="relative mt-3 flex flex-col gap-2">
              <span className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-[var(--color-gold-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-gold)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                <Icon name="wallet" className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Ví · {formatPrice(user.walletBalance ?? 0)}</span>
              </span>
              <Link
                to={`/user/${user.id}`}
                onClick={() => setOpen(false)}
                className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/95 transition hover:border-white/40 hover:bg-white/18"
              >
                <Icon name="eye" className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Xem hồ sơ công khai</span>
              </Link>
            </div>
          </div>

          <div className="px-3 pb-3 pt-3">
            <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              {isBlocked
                ? 'Tài khoản bị chặn'
                : 'Chuyển vai trên cùng tài khoản'}
            </p>

            {isBlocked ? (
              <div className="mb-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800">
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
              <div className="flex flex-col gap-1.5">
                {modes.map((item) => {
                  const active = item.id === mode && !onAccountProfile;
                  const offerLocked = item.id === 'offer' && !canOffer;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => switchMode(item.id)}
                      className={`flex w-full items-center gap-2 rounded-[14px] px-3 py-2.5 text-left transition ${
                        active
                          ? 'border border-[var(--color-brand)]/20 bg-[var(--color-brand-soft)] shadow-[inset_3px_0_0_0_var(--color-brand)]'
                          : 'border border-[var(--color-line)] bg-white hover:border-[var(--color-brand)]/30 hover:bg-[var(--color-canvas)]'
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2 text-[15px] font-bold text-[var(--color-ink)]">
                          {item.label}
                          {active ? (
                            <span className="shrink-0 rounded-full bg-[var(--color-brand)] px-2 py-0.5 text-[11px] font-semibold text-white">
                              Đang dùng
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-sm text-[var(--color-muted)]">
                          {offerLocked
                            ? 'Chưa bật hồ sơ — sẽ mở form kích hoạt'
                            : item.hint}
                        </span>
                      </span>
                      {!active ? (
                        <Icon
                          name="chevronRight"
                          className="h-4 w-4 shrink-0 text-[var(--color-muted)]/70"
                        />
                      ) : null}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setMode('hire');
                    setOpen(false);
                    navigate('/don-cua-toi/ho-so');
                  }}
                  className={`mt-0.5 flex w-full items-center gap-2.5 rounded-[14px] border px-3 py-2.5 text-left transition ${
                    onAccountProfile
                      ? 'border-[var(--color-brand)]/20 bg-[var(--color-brand-soft)] shadow-[inset_3px_0_0_0_var(--color-brand)]'
                      : 'border-[var(--color-line)] bg-white hover:border-[var(--color-brand)]/30 hover:bg-[var(--color-canvas)]'
                  }`}
                >
                  <Icon name="user" className="h-5 w-5 shrink-0 text-[var(--color-brand)]" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 text-[15px] font-bold text-[var(--color-ink)]">
                      Hồ sơ
                      {onAccountProfile ? (
                        <span className="shrink-0 rounded-full bg-[var(--color-brand)] px-2 py-0.5 text-[11px] font-semibold text-white">
                          Đang dùng
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-sm text-[var(--color-muted)]">
                      Ví, rút tiền, hóa đơn, hỗ trợ
                    </span>
                  </span>
                  <Icon
                    name="chevronRight"
                    className="h-4 w-4 shrink-0 text-[var(--color-muted)]/70"
                  />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
                navigate('/');
              }}
              className="mt-2 flex w-full items-center gap-2.5 rounded-[14px] border border-red-100 bg-gradient-to-r from-red-50 to-rose-50/80 px-3 py-2.5 text-left text-[15px] font-semibold text-red-600 transition hover:from-red-50 hover:to-red-50"
            >
              <Icon name="logOut" className="h-5 w-5 shrink-0" />
              Đăng xuất
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
