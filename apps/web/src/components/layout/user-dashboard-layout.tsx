import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  badge?: 'hireAction' | 'openJobs' | 'partnerAction';
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
    to: '/don-cua-toi/lich-dang',
    label: 'Lịch đăng đơn',
    icon: 'clock',
    iconClass: 'text-violet-600',
  },
];

/** Menu tài khoản — mở từ dropdown «Hồ sơ», không hiện trên sidebar Đơn thuê / Đối tác. */
const profileNav: NavItem[] = [
  {
    to: '/don-cua-toi/ho-so',
    label: 'Hồ sơ',
    icon: 'user',
    iconClass: 'text-sky-600',
  },
  {
    to: '/don-cua-toi/vi',
    label: 'Ví VNĐ',
    icon: 'card',
    iconClass: 'text-[var(--color-brand)]',
  },
  {
    to: '/don-cua-toi/rut-tien',
    label: 'Rút tiền',
    icon: 'bank',
    iconClass: 'text-violet-600',
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
  {
    to: '/don-cua-toi/noi-quy',
    label: 'Nội quy',
    icon: 'shield',
    iconClass: 'text-teal-700',
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
    to: '/doi-tac/dich-vu',
    label: 'Dịch vụ của tôi',
    icon: 'pencil',
    iconClass: 'text-[var(--color-brand)]',
  },
  {
    to: '/doi-tac/don-thue',
    label: 'Đơn thuê realtime',
    icon: 'sparkles',
    iconClass: 'text-emerald-600',
    badge: 'openJobs',
  },
  {
    to: '/doi-tac/viec',
    label: 'Việc của tôi',
    icon: 'briefcase',
    iconClass: 'text-[var(--color-navy)]',
    badge: 'partnerAction',
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

/** Khi bị admin chặn — chỉ khiếu nại + trợ giúp (chat support popup vẫn dùng được). */
const blockedNav: NavItem[] = [
  {
    to: '/don-cua-toi/khieu-nai',
    label: 'Khiếu nại',
    icon: 'message',
    iconClass: 'text-amber-600',
  },
  {
    to: '/don-cua-toi/tro-giup',
    label: 'Chat / Trợ giúp',
    icon: 'headset',
    iconClass: 'text-sky-600',
  },
];

const PROFILE_PATH_PREFIXES = [
  '/don-cua-toi/ho-so',
  '/don-cua-toi/vi',
  '/don-cua-toi/rut-tien',
  '/don-cua-toi/hoa-don',
  '/don-cua-toi/tro-giup',
  '/don-cua-toi/khieu-nai',
  '/don-cua-toi/noi-quy',
  // Deep-link / CTA cũ từ khu vực đối tác vẫn mở cùng nhóm menu hồ sơ
  '/doi-tac/ho-so',
  '/doi-tac/vi',
  '/doi-tac/rut-tien',
  '/doi-tac/hoa-don',
];

const BLOCKED_ALLOWED_PREFIXES = [
  '/don-cua-toi/khieu-nai',
  '/don-cua-toi/tro-giup',
];

function isProfilePath(pathname: string) {
  return PROFILE_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

function isBlockedPathAllowed(pathname: string) {
  return BLOCKED_ALLOWED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

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
  if (b.status === 'SCHEDULED' && b.paymentStatus === 'HELD') return true;
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
  const { user, loading, setMode, canOffer } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOfferPath = pathname.startsWith('/doi-tac');
  const isBlocked = Boolean(user?.isBlocked);
  const onProfile = isProfilePath(pathname);
  const navItems = isBlocked
    ? blockedNav
    : onProfile
      ? profileNav
      : isOfferPath
        ? offerNav
        : hireNav;
  const title = isBlocked
    ? 'Tài khoản bị hạn chế'
    : onProfile
      ? 'Hồ sơ'
      : isOfferPath
        ? 'Người làm'
        : 'Khách thuê';

  useEffect(() => {
    if (isBlocked) {
      setMode('hire');
      return;
    }
    if (pathname.startsWith('/doi-tac')) setMode('offer');
    else if (pathname.startsWith('/don-cua-toi')) setMode('hire');
  }, [pathname, setMode, isBlocked]);

  const hireQuery = useQuery({
    queryKey: ['bookings', 'mine'],
    queryFn: api.getMyBookings,
    enabled: Boolean(user) && !isOfferPath && !isBlocked,
  });

  const openQuery = useQuery({
    queryKey: ['bookings', 'open'],
    queryFn: api.getOpenBookings,
    enabled: Boolean(user) && isOfferPath && canOffer && !isBlocked,
  });

  const partnerMineQuery = useQuery({
    queryKey: ['bookings', 'partner'],
    queryFn: api.getPartnerBookings,
    enabled: Boolean(user) && isOfferPath && canOffer && !isBlocked,
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
    };
  }, [hireQuery.data, openQuery.data, partnerMineQuery.data, user]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted)]">
        Đang tải…
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(pathname || '/don-cua-toi');
    return <Navigate to={`/dang-nhap?redirect=${redirect}`} replace />;
  }

  if (user.isBlocked && !isBlockedPathAllowed(pathname)) {
    return <Navigate to="/don-cua-toi/khieu-nai" replace />;
  }

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
    <div className="dash-sidebar">
      <div className="shrink-0 p-3.5 pb-2">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <span className="dash-profile-avatar">
              <Icon name="user" className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold tracking-tight text-[var(--color-navy)]">
                {title}
              </p>
              <p className="mt-0.5 truncate text-sm text-[var(--color-muted)]">
                {user?.fullName ?? 'Tài khoản'}
              </p>
            </div>
          </div>
          {user && !isBlocked ? (
            <>
              <div className="my-3.5 h-px bg-[var(--color-line)]/80" />
              <p className="flex items-center gap-2 text-sm font-bold text-[#F59E0B]">
                <Icon name="wallet" className="h-4 w-4 shrink-0" />
                Ví: {formatPrice(user.walletBalance ?? 0)}
              </p>
            </>
          ) : null}
          {isBlocked ? (
            <>
              <div className="my-3.5 h-px bg-[var(--color-line)]/80" />
              <p className="text-xs font-semibold leading-relaxed text-red-700">
                Tài khoản bị chặn. Chỉ còn khiếu nại và chat hỗ trợ với admin.
              </p>
            </>
          ) : null}
        </div>
      </div>

      <nav className="dash-nav">
        {navItems.map((item) => {
          const active = navActive(pathname, item);
          const count = badgeValue(item.badge);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={`dash-nav-link ${active ? 'is-active' : ''}`}
            >
              <Icon
                name={item.icon}
                className={`h-[18px] w-[18px] shrink-0 ${item.iconClass}`}
              />
              <span>{item.label}</span>
              {count > 0 ? <span className="dash-nav-badge">{count}</span> : null}
            </NavLink>
          );
        })}
      </nav>

      {!isBlocked && canOffer ? (
        <div className="dash-sidebar-foot">
          <button type="button" onClick={switchRole} className="dash-nav-link w-full text-left">
            <Icon
              name="swap"
              className="h-[18px] w-[18px] shrink-0 text-[var(--color-brand)]"
            />
            <span>{isOfferPath ? 'Sang Đơn thuê' : 'Sang Nhận việc'}</span>
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="admin-shell glass-page flex h-full min-h-0 w-full flex-1 overflow-hidden !min-h-0">
      <aside className="hidden h-full w-[272px] shrink-0 p-3 pr-1 lg:block">
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
          <aside className="absolute inset-y-0 left-0 flex h-full w-[300px] flex-col p-3">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b border-white/50 bg-white/70 px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            type="button"
            aria-label="Mở menu"
            className="rounded-xl border border-white/70 bg-white/80 p-2 shadow-sm"
            onClick={() => setMobileOpen(true)}
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <p className="font-extrabold">{title}</p>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
          <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-y-auto overscroll-contain">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
