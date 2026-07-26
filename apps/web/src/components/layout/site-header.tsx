import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo-icon.png';
import { useAuth } from '../../features/auth/auth-context';
import { Icon } from '../ui/icon';
import { HeaderGroupsMenu } from './header-groups-menu';
import { LocationPicker } from './location-picker';
import { ModeSwitcher } from './mode-switcher';

function SearchBox({ className = '' }: { className?: string }) {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    navigate(keyword.trim() ? `/nhom?q=${encodeURIComponent(keyword.trim())}` : '/nhom');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center gap-2.5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-canvas)] px-4 py-2.5 transition focus-within:border-[var(--color-brand)] focus-within:bg-white focus-within:shadow-sm ${className}`}
    >
      <Icon name="search" className="h-5 w-5 shrink-0 text-[var(--color-muted)]" />
      <input
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="Tìm dịch vụ, thợ, gia sư..."
        aria-label="Tìm dịch vụ"
        className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--color-muted)]"
      />
      <LocationPicker className="border-l border-[var(--color-line)] pl-3" />
    </form>
  );
}

export function SiteHeader() {
  const { user, mode } = useAuth();

  return (
    <header className="sticky top-0 z-[200] bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)]">
      <div className="relative z-20 bg-white">
        <div className="page-shell">
          <div className="chrome-container">
            <div className="relative flex w-full items-center gap-3 py-3 sm:gap-4 sm:py-3.5">
              <div className="relative z-10 flex shrink-0 items-center gap-1 sm:gap-2">
                <Link to="/" className="flex items-center gap-2 sm:gap-2.5">
                  <img src={logo} alt="Dịch Vụ Ơi" className="h-9 w-9 rounded-xl sm:h-10 sm:w-10" />
                  <span className="whitespace-nowrap text-[1.35rem] font-extrabold leading-none tracking-tight sm:text-[1.5rem]">
                    Dịch Vụ <span className="text-[var(--color-brand)]">Ơi</span>
                  </span>
                </Link>
                <HeaderGroupsMenu />
              </div>

              <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 justify-center px-4 md:flex">
                <SearchBox className="pointer-events-auto w-full max-w-[800px]" />
              </div>

              <div className="relative z-10 ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
                {user ? (
                  <>
                    {user.role === 'ADMIN' ? (
                      <Link
                        to="/admin"
                        className="hidden items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 text-[15px] font-semibold shadow-sm transition hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)] sm:flex"
                      >
                        Admin
                      </Link>
                    ) : null}
                    {mode === 'hire' ? (
                      <Link
                        to="/don-cua-toi"
                        aria-label="Đơn thuê"
                        className="flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-2 py-1.5 text-[15px] font-semibold shadow-sm transition hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)] sm:px-3"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-soft)]">
                          <Icon name="calendar" className="h-4 w-4 text-[var(--color-brand-deep)]" />
                        </span>
                        <span className="hidden pr-1 sm:inline">Đơn thuê</span>
                      </Link>
                    ) : (
                      <Link
                        to="/doi-tac"
                        aria-label="Nhận việc"
                        className="flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-2 py-1.5 text-[15px] font-semibold shadow-sm transition hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)] sm:px-3"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-soft)]">
                          <Icon name="briefcase" className="h-4 w-4 text-[var(--color-brand-deep)]" />
                        </span>
                        <span className="hidden pr-1 sm:inline">Nhận việc</span>
                      </Link>
                    )}
                    <ModeSwitcher />
                  </>
                ) : (
                  <>
                    <Link
                      to="/dang-ky"
                      className="hidden rounded-full px-3.5 py-2 text-[15px] font-semibold transition hover:bg-[var(--color-brand-soft)] sm:inline"
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

            <SearchBox className="mb-3 md:hidden" />
          </div>
        </div>
      </div>
    </header>
  );
}
