import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo-icon.webp';
import { useAuth } from '../../features/auth/auth-context';
import { Icon } from '../ui/icon';
import { HeaderGroupsMenu } from './header-groups-menu';
import { LocationPicker } from './location-picker';
import { HeaderQuickNav } from './header-quick-nav';
import { ModeSwitcher } from './mode-switcher';

const NAV_SOFT_CONTROL =
  'rounded-[14px] border border-white/15 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_8px_rgba(5,45,71,0.2)] transition-[border-color,background,box-shadow] duration-[180ms] ease-in-out hover:bg-white/15 hover:border-white/25 focus-within:border-white/30 focus-within:bg-white/15 focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_14px_rgba(5,45,71,0.22)]';

const NAV_BAR_STYLE = {
  background:
    'radial-gradient(ellipse 130% 180% at 18% -40%, #0a5678 0%, #073b5c 42%, #052d47 78%, #041f32 100%)',
  boxShadow:
    '0 10px 28px rgba(5, 45, 71, 0.32), 0 2px 8px rgba(5, 45, 71, 0.2), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(2, 20, 32, 0.35)',
} as const;

function SearchBox({ className = '', onDark = false }: { className?: string; onDark?: boolean }) {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    navigate(keyword.trim() ? `/nhom?q=${encodeURIComponent(keyword.trim())}` : '/nhom');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center gap-2.5 px-4 py-2.5 ${
        onDark
          ? NAV_SOFT_CONTROL
          : 'rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)] transition-[border-color,background,box-shadow] duration-[180ms] ease-in-out focus-within:border-[var(--color-brand)] focus-within:bg-white focus-within:shadow-sm'
      } ${className}`}
    >
      <Icon
        name="search"
        className={`h-5 w-5 shrink-0 ${onDark ? 'text-white/75 drop-shadow-sm' : 'text-[var(--color-muted)]'}`}
      />
      <input
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="Tìm dịch vụ, thợ, gia sư..."
        aria-label="Tìm dịch vụ"
        className={`min-w-0 flex-1 bg-transparent text-[15px] outline-none ${
          onDark ? 'text-white placeholder:text-white/55' : 'placeholder:text-[var(--color-muted)]'
        }`}
      />
    </form>
  );
}

export function SiteHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-[200] text-white" style={NAV_BAR_STYLE}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1),transparent_70%)]"
      />
      <div className="relative z-20">
        <div className="page-shell w-full max-w-none overflow-x-clip">
          <div className="flex w-full min-w-0 flex-col">
            <div className="flex w-full min-w-0 items-center gap-2 py-3 sm:gap-4 sm:py-3.5 lg:gap-5">
              <div className="flex min-w-0 flex-1 items-center gap-1 overflow-visible sm:gap-2">
                <Link to="/" className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5">
                  <span className="relative shrink-0 rounded-[13px] shadow-[0_4px_12px_rgba(5,45,71,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-white/15">
                    <img
                      src={logo}
                      alt="Dịch Vụ Ơi"
                      className="h-9 w-9 rounded-[13px] sm:h-10 sm:w-10"
                      width={40}
                      height={40}
                      decoding="async"
                      loading="eager"
                      fetchPriority="high"
                    />
                  </span>
                  <span className="hidden truncate whitespace-nowrap text-[1.35rem] font-bold leading-none tracking-tight drop-shadow-sm min-[380px]:inline sm:text-[1.5rem]">
                    Dịch Vụ <span className="text-[var(--color-brand)]">Ơi</span>
                  </span>
                </Link>
                <span aria-hidden className="mx-1 hidden h-7 w-px shrink-0 bg-white/15 lg:block" />
                <HeaderGroupsMenu onDark />
              </div>

              <div className="hidden min-w-0 flex-1 items-center gap-3 px-2 md:flex lg:gap-4 lg:px-4">
                <SearchBox onDark className="min-w-0 flex-1" />
                <LocationPicker
                  onDark
                  className={`shrink-0 px-3.5 py-2.5 ${NAV_SOFT_CONTROL}`}
                />
                <HeaderQuickNav />
              </div>

              <div className="ml-auto flex min-w-0 shrink items-center gap-1.5 sm:gap-2.5">
                <HeaderQuickNav className="md:hidden" />
                {user ? (
                  <>
                    {user.role === 'ADMIN' || user.role === 'MODERATOR' ? (
                      <Link
                        to={user.role === 'MODERATOR' ? '/admin/support' : '/admin'}
                        aria-label={user.role === 'MODERATOR' ? 'Mod' : 'Admin'}
                        className={`flex items-center gap-2 px-2 py-1.5 text-[15px] font-semibold sm:px-3 ${NAV_SOFT_CONTROL}`}
                      >
                        <Icon name="shield" className="h-4 w-4 shrink-0 drop-shadow-sm" />
                        <span className="hidden sm:inline">
                          {user.role === 'MODERATOR' ? 'Mod' : 'Admin'}
                        </span>
                      </Link>
                    ) : null}
                    <ModeSwitcher onDark />
                  </>
                ) : (
                  <>
                    <Link
                      to="/dang-ky"
                      className={`hidden px-3.5 py-2 text-[15px] font-semibold text-white/90 sm:inline ${NAV_SOFT_CONTROL}`}
                    >
                      Đăng ký
                    </Link>
                    <Link
                      to="/dang-nhap"
                      className="btn-primary flex items-center gap-2 rounded-[14px] px-3.5 py-2 text-[15px] shadow-[0_4px_14px_rgba(0,156,149,0.28),inset_0_1px_0_rgba(255,255,255,0.25)] sm:px-4 sm:py-2.5"
                    >
                      <Icon name="user" className="h-5 w-5" />
                      <span className="hidden sm:inline">Đăng nhập</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="mb-3 flex items-center gap-2 md:hidden">
              <SearchBox onDark className="min-w-0 flex-1" />
              <LocationPicker
                onDark
                className={`shrink-0 px-3 py-2.5 ${NAV_SOFT_CONTROL}`}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export { SiteHeader as Header };
