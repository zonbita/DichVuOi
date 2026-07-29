import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context';
import { api } from '../../services/api';
import type { Booking } from '../../types/catalog';
import { Icon } from '../ui/icon';
import type { IconName } from '../ui/icon';
import { formatPrice } from '../../services/api';

type NavItem = {
  to: string;
  label: string;
  icon: IconName;
  /** Màu icon (currentColor trên SVG). */
  iconClass: string;
  end?: boolean;
  badge?: 'hireAction' | 'openJobs' | 'partnerAction' | 'jobsHub';
};

const hireNav: NavItem[] = [
  {
    to: '/don-cua-toi',
    label: 'Đơn thuê',
    icon: 'calendar',
    iconClass: 'text-[var(--color-brand)]',
    end: true,
    badge: 'hireAction',
  },
  {
    to: '/don-cua-toi/thue',
    label: 'Thuê dịch vụ',
    icon: 'sparkles',
    iconClass: 'text-[var(--color-gold)]',
  },
  {
    to: '/don-cua-toi/ho-so',
    label: 'Hồ sơ',
    icon: 'user',
    iconClass: 'text-sky-600',
  },
  {
    to: '/don-cua-toi/vi',
    label: 'Ví VNĐ',
    icon: 'wallet',
    iconClass: 'text-emerald-600',
  },
  {
    to: '/don-cua-toi/hoa-don',
    label: 'Hóa đơn',
    icon: 'receipt',
    iconClass: 'text-[var(--color-navy)]',
  },
  {
    to: '/don-cua-toi/tro-giup',
    label: 'Trợ giúp',
    icon: 'headset',
    iconClass: 'text-sky-600',
  },
  {
    to: '/don-cua-toi/khieu-nai',
    label: 'Khiếu nại',
    icon: 'message',
    iconClass: 'text-amber-600',
  },
];

const offerNav: NavItem[] = [
  {
    to: '/doi-tac',
    label: 'Tổng quan',
    icon: 'home',
    iconClass: 'text-[var(--color-brand)]',
    end: true,
  },
  {
    to: '/doi-tac/viec',
    label: 'Việc của tôi',
    icon: 'briefcase',
    iconClass: 'text-[var(--color-navy)]',
    badge: 'jobsHub',
  },
  {
    to: '/doi-tac/vi',
    label: 'Ví VNĐ',
    icon: 'wallet',
    iconClass: 'text-emerald-600',
  },
  {
    to: '/doi-tac/hoa-don',
    label: 'Hóa đơn',
    icon: 'receipt',
    iconClass: 'text-[var(--color-gold)]',
  },
  {
    to: '/doi-tac/ho-so',
    label: 'Hồ sơ',
    icon: 'user',
    iconClass: 'text-sky-600',
  },
  {
    to: '/doi-tac/cap-do',
    label: 'Cấp độ',
    icon: 'chart',
    iconClass: 'text-orange-600',
  },
  {
    to: '/doi-tac/quy-trinh',
    label: 'Quy trình',
    icon: 'shield',
    iconClass: 'text-teal-700',
  },
];

function navActive(pathname: string, item: NavItem) {
  const url = new URL(item.to, 'http://local');
  const itemPath = url.pathname;

  if (itemPath.startsWith('/don-cua-toi')) {
    if (item.end) {
      return (
        pathname === '/don-cua-toi' || pathname.startsWith('/don-cua-toi/don/')
      );
    }
    return pathname === itemPath || pathname.startsWith(itemPath + '/');
  }

  if (itemPath === '/doi-tac' && item.end) {
    return pathname === '/doi-tac';
  }

  return pathname === itemPath || pathname.startsWith(itemPath + '/');
}

function hireNeedsAction(b: Booking, userId: string) {
  if (b.status === 'CANCELLED') return false;
  if (b.paymentStatus === 'UNPAID') return true;
  if (b.status === 'COMPLETED') {
    return !(b.reviews ?? []).some((r) => r.fromUserId === userId);
  }
  if (b.status === 'PENDING' && b.paymentStatus === 'HELD' && !b.partnerId) return true;
  return false;
}

function partnerNeedsAction(b: Booking, userId: string) {
  if (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') return true;
  if (b.status === 'COMPLETED') {
    return !(b.reviews ?? []).some((r) => r.fromUserId === userId);
  }
  return false;
}

/**
 * Cột sidebar + nội dung — cùng pattern admin dashboard.
 * Dùng cho /don-cua-toi/* và /doi-tac/*.
 */
export function UserDashboardLayout() {
  const { user, setMode, canOffer } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOfferPath = pathname.startsWith('/doi-tac');
  const navItems = isOfferPath ? offerNav : hireNav;
  const title = isOfferPath ? 'Người làm' : 'Khách thuê';

  useEffect(() => {
    if (pathname.startsWith('/doi-tac')) setMode('offer');
    else if (pathname.startsWith('/don-cua-toi')) setMode('hire');
  }, [pathname, setMode]);

  const hireQuery = useQuery({
    queryKey: ['bookings', 'mine'],
    queryFn: api.getMyBookings,
    enabled: Boolean(user) && !isOfferPath,
  });

  const openQuery = useQuery({
    queryKey: ['bookings', 'open'],
    queryFn: api.getOpenBookings,
    enabled: Boolean(user) && isOfferPath && canOffer,
  });

  const partnerMineQuery = useQuery({
    queryKey: ['bookings', 'partner'],
    queryFn: api.getPartnerBookings,
    enabled: Boolean(user) && isOfferPath && canOffer,
  });

  const badges = useMemo(() => {
    const hireAction =
      user && hireQuery.data
        ? hireQuery.data.filter((b) => hireNeedsAction(b, user.id)).length
        : 0;
    const openJobs = openQuery.data?.length ?? 0;
    const partnerAction =
      user && partnerMineQuery.data
        ? partnerMineQuery.data.filter((b) => partnerNeedsAction(b, user.id)).length
        : 0;
    return {
      hireAction,
      openJobs,
      partnerAction,
      jobsHub: openJobs + partnerAction,
    };
  }, [hireQuery.data, openQuery.data, partnerMineQuery.data, user]);

  function badgeValue(kind?: NavItem['badge']) {
    if (!kind) return 0;
    return badges[kind] ?? 0;
  }

  function switchRole() {
    if (isOfferPath) {
      setMode('hire');
      navigate('/don-cua-toi');
    } else {
      setMode('offer');
      navigate('/doi-tac');
    }
    setMobileOpen(false);
  }

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-5 py-5">
        <p className="text-[15px] font-extrabold tracking-tight">{title}</p>
        <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
          {user?.fullName ?? 'Tài khoản'}
        </p>
        {user ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-gold)]">
            <Icon name="wallet" className="h-3.5 w-3.5 shrink-0" />
            Ví: {formatPrice(user.walletBalance ?? 0)}
          </p>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pb-2">
        {navItems.map((item) => {
          const active = navActive(pathname, item);
          const count = badgeValue(item.badge);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={`admin-nav-link ${active ? 'is-active' : ''}`}
            >
              <Icon
                name={item.icon}
                className={`h-[18px] w-[18px] shrink-0 ${item.iconClass}`}
              />
              <span>{item.label}</span>
              {count > 0 ? (
                <span className="admin-badge admin-badge-amber ml-auto">{count}</span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-[var(--admin-border)] p-2">
        <button type="button" onClick={switchRole} className="admin-nav-link w-full text-left">
          <Icon
            name={isOfferPath ? 'calendar' : 'briefcase'}
            className={`h-[18px] w-[18px] shrink-0 ${
              isOfferPath ? 'text-[var(--color-brand)]' : 'text-[var(--color-navy)]'
            }`}
          />
          <span>{isOfferPath ? 'Sang Đơn thuê' : 'Sang Nhận việc'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-shell flex min-h-[calc(100dvh-4.5rem)] w-full flex-1">
      <aside className="sticky top-[4.5rem] hidden h-[calc(100dvh-4.5rem)] w-[248px] shrink-0 border-r border-[var(--admin-border)] bg-white lg:block">
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
          <aside className="absolute inset-y-0 left-0 flex h-full w-[280px] flex-col bg-white shadow-xl">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-[calc(100dvh-4.5rem)] min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b border-[var(--admin-border)] bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Mở menu"
            className="rounded-xl border border-[var(--admin-border)] p-2"
            onClick={() => setMobileOpen(true)}
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <p className="font-extrabold">{title}</p>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
