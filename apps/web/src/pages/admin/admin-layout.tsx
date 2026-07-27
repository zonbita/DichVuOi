import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import logo from '../../assets/logo-icon.png';
import { Icon } from '../../components/ui/icon';
import type { IconName } from '../../components/ui/icon';
import { useAuth } from '../../features/auth/auth-context';
import { api } from '../../services/api';

type NavItem = {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
  badge?: 'partners' | 'flagged' | 'complaints';
};

const navItems: NavItem[] = [
  { to: '/admin', label: 'Tổng quan', icon: 'home', end: true },
  { to: '/admin/bookings', label: 'Đơn hàng', icon: 'calendar' },
  { to: '/admin/catalog', label: 'Dịch vụ', icon: 'sparkles' },
  { to: '/admin/partners', label: 'Đối tác', icon: 'briefcase', badge: 'partners' },
  { to: '/admin/users', label: 'Khách hàng', icon: 'users' },
  { to: '/admin/reviews', label: 'Đánh giá', icon: 'heart' },
  { to: '/admin/complaints', label: 'Khiếu nại', icon: 'message', badge: 'complaints' },
];

const soonItems: Array<{ label: string; icon: IconName }> = [
  { label: 'Báo cáo', icon: 'chart' },
  { label: 'Cài đặt', icon: 'settings' },
];

export function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = Boolean(user && user.role === 'ADMIN');

  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: api.adminStats,
    enabled: isAdmin,
  });

  if (loading) {
    return (
      <div className="admin-shell flex items-center justify-center text-sm text-[var(--color-muted)]">
        Đang tải…
      </div>
    );
  }
  if (!user) return <Navigate to="/dang-nhap?redirect=/admin" replace />;
  if (!isAdmin) {
    return (
      <div className="admin-shell mx-auto flex max-w-lg items-center p-8">
        <div className="admin-card w-full p-6">
          <h1 className="text-xl font-extrabold">Không có quyền admin</h1>
          <p className="mt-2 text-[var(--color-muted)]">
            Tài khoản hiện tại không phải ADMIN.{' '}
            <Link to="/" className="font-semibold text-[var(--color-brand-deep)]">
              Về trang chủ
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const pendingVerify = statsQuery.data?.partnersPendingVerify ?? 0;
  const flagged = statsQuery.data?.redactedMessages ?? 0;
  const complaintsPending = statsQuery.data?.complaintsPending ?? 0;

  function badgeFor(kind?: NavItem['badge']) {
    if (kind === 'partners' && pendingVerify > 0) {
      return (
        <span className="admin-badge admin-badge-amber ml-auto">{pendingVerify}</span>
      );
    }
    if (kind === 'complaints' && complaintsPending > 0) {
      return (
        <span className="admin-badge admin-badge-red ml-auto">{complaintsPending}</span>
      );
    }
    if (kind === 'flagged' && flagged > 0) {
      return (
        <span className="admin-badge admin-badge-red ml-auto">{flagged}</span>
      );
    }
    return null;
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <img src={logo} alt="" className="h-9 w-9 rounded-xl" />
        <p className="truncate text-[15px] font-extrabold tracking-tight">
          Dịch Vụ <span className="text-[var(--color-brand)]">Ơi</span>{' '}
          <span className="font-semibold text-[var(--color-muted)]">Admin</span>
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 pb-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? 'is-active' : ''}`
            }
          >
            <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
            <span>{item.label}</span>
            {badgeFor(item.badge)}
          </NavLink>
        ))}

        <div className="mx-5 my-3 border-t border-[var(--admin-border)]" />

        {soonItems.map((item) => (
          <div
            key={item.label}
            className="admin-nav-link cursor-not-allowed opacity-45"
            title="Sắp có"
          >
            <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="relative border-t border-[var(--admin-border)] p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-[var(--admin-bg)]"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-sm font-bold text-[var(--color-brand-deep)]">
            {user.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{user.fullName}</p>
            <p className="truncate text-xs text-[var(--color-muted)]">Quản trị viên</p>
          </div>
          <Icon name="chevronDown" className="h-4 w-4 text-[var(--color-muted)]" />
        </button>

        {menuOpen ? (
          <div className="absolute right-3 bottom-[4.5rem] left-3 overflow-hidden rounded-xl border border-[var(--admin-border)] bg-white shadow-lg">
            <Link
              to="/"
              className="block px-3 py-2.5 text-sm font-semibold hover:bg-[var(--admin-bg)]"
              onClick={() => setMenuOpen(false)}
            >
              Về sàn
            </Link>
            <button
              type="button"
              className="block w-full px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
            >
              Đăng xuất
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="admin-shell flex">
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 border-r border-[var(--admin-border)] bg-white lg:block">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute inset-0 bg-black/35"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-xl">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--admin-border)] bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Mở menu"
            className="rounded-xl border border-[var(--admin-border)] p-2"
            onClick={() => setMobileOpen(true)}
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <p className="font-extrabold">
            Dịch Vụ <span className="text-[var(--color-brand)]">Ơi</span> Admin
          </p>
        </header>

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
