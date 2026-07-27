import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo-icon.png';
import { useAuth } from '../../features/auth/auth-context';
import { Icon } from '../ui/icon';
import { HeaderGroupsMenu } from './header-groups-menu';
import { LocationPicker } from './location-picker';
import { ModeSwitcher } from './mode-switcher';

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
      className={`flex items-center gap-2.5 rounded-full border px-4 py-2.5 transition-[border-color,background,box-shadow] duration-[180ms] ease-in-out focus-within:shadow-sm ${
        onDark
          ? 'border-white/15 bg-white/10 focus-within:border-white/30 focus-within:bg-white/15'
          : 'border-[var(--color-line)] bg-[var(--color-canvas)] focus-within:border-[var(--color-brand)] focus-within:bg-white'
      } ${className}`}
    >
      <Icon
        name="search"
        className={`h-5 w-5 shrink-0 ${onDark ? 'text-white/70' : 'text-[var(--color-muted)]'}`}
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
  const { user, mode } = useAuth();

  return (
    <header className="sticky top-0 z-[200] bg-[var(--color-navy)] text-white shadow-[0_2px_12px_rgba(5,45,71,0.25)]">
      <div className="relative z-20">
        <div className="page-shell w-full max-w-none">
          <div className="flex w-full flex-col">
            <div className="flex w-full items-center gap-3 py-3 sm:gap-4 sm:py-3.5 lg:gap-5">
              <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
                <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5">
                  <img
                    src={logo}
                    alt="Dịch Vụ Ơi"
                    className="h-9 w-9 rounded-xl ring-1 ring-white/15 sm:h-10 sm:w-10"
                  />
                  <span className="whitespace-nowrap text-[1.35rem] font-bold leading-none tracking-tight sm:text-[1.5rem]">
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
                  className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3.5 py-2.5"
                />
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
                {user ? (
                  <>
                    {user.role === 'ADMIN' ? (
                      <Link
                        to="/admin"
                        className="hidden items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-[15px] font-semibold transition hover:bg-white/10 sm:flex"
                      >
                        Admin
                      </Link>
                    ) : null}
                    {mode === 'hire' ? (
                      <Link
                        to="/don-cua-toi"
                        aria-label="Đơn thuê"
                        className="btn-outline-gold flex items-center gap-2 px-2 py-1.5 text-[15px] sm:px-3"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                          <Icon name="calendar" className="h-4 w-4 text-[var(--color-gold)]" />
                        </span>
                        <span className="hidden pr-1 sm:inline">Đơn thuê</span>
                      </Link>
                    ) : (
                      <Link
                        to="/doi-tac"
                        aria-label="Nhận việc"
                        className="flex items-center gap-2 rounded-full border border-white/20 px-2 py-1.5 text-[15px] font-semibold transition hover:bg-white/10 sm:px-3"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                          <Icon name="briefcase" className="h-4 w-4 text-[var(--color-brand)]" />
                        </span>
                        <span className="hidden pr-1 sm:inline">Nhận việc</span>
                      </Link>
                    )}
                    <ModeSwitcher onDark />
                  </>
                ) : (
                  <>
                    <Link
                      to="/dang-ky"
                      className="hidden rounded-full px-3.5 py-2 text-[15px] font-semibold text-white/90 transition hover:bg-white/10 sm:inline"
                    >
                      Đăng ký
                    </Link>
                    <Link
                      to="/dang-nhap"
                      className="btn-primary flex items-center gap-2 rounded-full px-3.5 py-2 text-[15px] sm:px-4 sm:py-2.5"
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
                className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-2.5"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export { SiteHeader as Header };
