import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context';
import {
  countSupportUnread,
  getSupportChatReadAt,
  markSupportChatRead,
  openChatbot,
} from '../../lib/support-chat-read';
import { api } from '../../services/api';
import type { Booking } from '../../types/catalog';
import { Icon } from '../ui/icon';
import type { IconName } from '../ui/icon';

function hireNeedsAction(b: Booking, userId: string) {
  if (b.status === 'CANCELLED') return false;
  if (b.paymentStatus === 'UNPAID') return true;
  if (b.status === 'COMPLETED') {
    return !(b.reviews ?? []).some((r) => r.fromUserId === userId);
  }
  if (b.status === 'PENDING' && b.paymentStatus === 'HELD' && !b.partnerId) {
    return true;
  }
  return false;
}

function partnerNeedsAction(b: Booking, userId: string) {
  if (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') return true;
  if (b.status === 'COMPLETED') {
    return !(b.reviews ?? []).some((r) => r.fromUserId === userId);
  }
  return false;
}

function NavIconButton({
  label,
  icon,
  count,
  onClick,
  to,
}: {
  label: string;
  icon: IconName;
  count?: number;
  onClick?: () => void;
  to?: string;
}) {
  const badge =
    count && count > 0 ? (
      <span
        className="absolute -right-0.5 -top-0.5 z-[2] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E41E3F] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[var(--color-navy)] shadow-[0_2px_6px_rgba(5,45,71,0.3)]"
        aria-hidden
      >
        {count > 9 ? '9+' : count}
      </span>
    ) : null;

  const className =
    'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-white/15 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_8px_rgba(5,45,71,0.2)] transition hover:bg-white/20 hover:border-white/25 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_12px_rgba(5,45,71,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60';

  if (to) {
    return (
      <Link to={to} aria-label={label} title={label} className={className}>
        <Icon name={icon} className="h-5 w-5" />
        {badge}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={className}
    >
      <Icon name={icon} className="h-5 w-5" />
      {badge}
    </button>
  );
}

/** Icon nhanh kiểu Facebook — Chat / Đơn thuê / Đơn làm, đặt cạnh Location. */
export function HeaderQuickNav({ className = '' }: { className?: string }) {
  const { user, canOffer } = useAuth();
  const [supportReadAt, setSupportReadAt] = useState<string | null>(null);

  const isBlocked = Boolean(user?.isBlocked);
  const isStaff = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  useEffect(() => {
    if (!user) {
      setSupportReadAt(null);
      return;
    }
    const userId = user.id;
    setSupportReadAt(getSupportChatReadAt(userId));
    function onRead(event: Event) {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (detail?.userId && detail.userId !== userId) return;
      setSupportReadAt(getSupportChatReadAt(userId));
    }
    window.addEventListener('dichvuoi-support-read', onRead);
    return () => window.removeEventListener('dichvuoi-support-read', onRead);
  }, [user]);

  const supportQuery = useQuery({
    queryKey: ['support', 'my'],
    queryFn: api.getMySupportChat,
    enabled: Boolean(user) && !isStaff,
    staleTime: 20_000,
    refetchInterval: 60_000,
  });

  const hireQuery = useQuery({
    queryKey: ['bookings', 'mine'],
    queryFn: api.getMyBookings,
    enabled: Boolean(user) && !isBlocked,
    staleTime: 30_000,
  });

  const partnerQuery = useQuery({
    queryKey: ['bookings', 'partner'],
    queryFn: api.getPartnerBookings,
    enabled: Boolean(user) && canOffer && !isBlocked,
    staleTime: 30_000,
  });

  const chatCount = useMemo(() => {
    if (!user || isStaff) return 0;
    return countSupportUnread(
      supportQuery.data?.messages ?? [],
      user.id,
      supportReadAt,
    );
  }, [user, isStaff, supportQuery.data?.messages, supportReadAt]);

  const hireCount = useMemo(() => {
    if (!user || !hireQuery.data) return 0;
    return hireQuery.data.filter((b) => hireNeedsAction(b, user.id)).length;
  }, [hireQuery.data, user]);

  const jobCount = useMemo(() => {
    if (!user || !partnerQuery.data) return 0;
    return partnerQuery.data.filter((b) => partnerNeedsAction(b, user.id))
      .length;
  }, [partnerQuery.data, user]);

  if (!user) return null;

  const userId = user.id;

  function onOpenChat() {
    if (isStaff) {
      openChatbot({ tab: 'ai' });
      return;
    }
    markSupportChatRead(userId);
    openChatbot({ tab: 'support' });
  }

  return (
    <div
      className={`flex shrink-0 items-center gap-1.5 sm:gap-2 ${className}`}
      role="navigation"
      aria-label="Lối tắt thông báo"
    >
      <NavIconButton
        label={chatCount > 0 ? `Chat (${chatCount} mới)` : 'Chat'}
        icon="message"
        count={chatCount}
        onClick={onOpenChat}
      />
      {!isBlocked ? (
        <>
          <NavIconButton
            label={
              hireCount > 0 ? `Đơn thuê (${hireCount} cần xử lý)` : 'Đơn thuê'
            }
            icon="calendar"
            count={hireCount}
            to="/don-cua-toi"
          />
          {canOffer ? (
            <NavIconButton
              label={
                jobCount > 0 ? `Đơn làm (${jobCount} cần xử lý)` : 'Đơn làm'
              }
              icon="briefcase"
              count={jobCount}
              to="/doi-tac/viec"
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
