import { useQuery } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { publicPartnerQueryOptions } from '../../lib/query-client';
import type { PublicPartnerProfile } from '../../types/auth';
import {
  PartnerVerificationBadges,
  computePartnerRankScore,
} from '../ui/partner-badges';
import { UserAvatar } from '../ui/user-avatar';

export type PartnerHoverSeed = {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  level?: number;
  acceptingJobs?: boolean;
};

type Props = {
  seed: PartnerHoverSeed;
  children: ReactNode;
  className?: string;
};

const OPEN_MS = 280;
const CLOSE_MS = 160;
/** Trên drawer dashboard (z-300) / modal thường — portal body. */
const PANEL_Z = 520;
const PANEL_W = 280;

type PanelPos = { top: number; left: number; place: 'above' | 'below' };

/**
 * Hover avatar/tên → bảng mini hồ sơ (lazy `getPublicPartner`).
 * Dùng trên marketplace/sảnh — không gắn navbar / user dashboard.
 */
export function PartnerHoverPreview({ seed, children, className = '' }: Props) {
  const panelId = useId();
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PanelPos | null>(null);

  const clearTimers = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const profileQuery = useQuery({
    queryKey: ['partner', 'public', seed.userId],
    queryFn: () => api.getPublicPartner(seed.userId),
    enabled: open && Boolean(seed.userId),
    ...publicPartnerQueryOptions,
  });

  const updatePos = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 8;
    const estimatedH = panelRef.current?.offsetHeight ?? 200;
    const spaceAbove = r.top;
    const place: 'above' | 'below' =
      spaceAbove >= estimatedH + gap + 12 ? 'above' : 'below';
    let top =
      place === 'above' ? r.top - gap - estimatedH : r.bottom + gap;
    let left = r.left;
    const maxLeft = window.innerWidth - PANEL_W - 8;
    left = Math.max(8, Math.min(left, maxLeft));
    top = Math.max(8, Math.min(top, window.innerHeight - estimatedH - 8));
    setPos({ top, left, place });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    updatePos();
    function onScrollOrResize() {
      updatePos();
    }
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, updatePos, profileQuery.dataUpdatedAt]);

  function scheduleOpen() {
    clearTimers();
    openTimer.current = setTimeout(() => setOpen(true), OPEN_MS);
  }

  function scheduleClose() {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_MS);
  }

  const data = profileQuery.data;
  const fullName = data?.fullName ?? seed.fullName;
  const avatarUrl = data?.avatarUrl ?? seed.avatarUrl;
  const accepting = data?.acceptingJobs ?? seed.acceptingJobs ?? false;
  const profileTo = `/user/${seed.userId}`;

  const panel =
    open && pos
      ? createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label={`Hồ sơ ${fullName}`}
            className="fixed w-[min(calc(100vw-1rem),17.5rem)] overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white p-3 shadow-[0_16px_40px_rgba(15,39,71,0.22)]"
            style={{
              top: pos.top,
              left: pos.left,
              zIndex: PANEL_Z,
            }}
            onMouseEnter={scheduleOpen}
            onMouseLeave={scheduleClose}
          >
            <HoverCardBody
              profileTo={profileTo}
              fullName={fullName}
              avatarUrl={avatarUrl}
              accepting={accepting}
              data={data}
              loading={profileQuery.isLoading && !data}
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <span
      ref={rootRef}
      className={`inline-flex max-w-full ${className}`}
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
      onFocus={scheduleOpen}
      onBlur={scheduleClose}
    >
      {children}
      {panel}
    </span>
  );
}

function HoverCardBody({
  profileTo,
  fullName,
  avatarUrl,
  accepting,
  data,
  loading,
}: {
  profileTo: string;
  fullName: string;
  avatarUrl?: string | null;
  accepting: boolean;
  data?: PublicPartnerProfile;
  loading: boolean;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-start gap-2.5">
        <Link to={profileTo} className="shrink-0" tabIndex={-1}>
          <UserAvatar
            name={fullName}
            src={avatarUrl}
            userId={data?.userId}
            rank={
              data?.rank ??
              (data
                ? computePartnerRankScore(
                    data.completedJobs,
                    data.hireSuccessCount ?? 0,
                  )
                : undefined)
            }
            size="lg"
            className="!h-12 !w-12"
            loading="eager"
          />
        </Link>
        <div className="min-w-0 flex-1 pt-0.5">
          <Link
            to={profileTo}
            className="block truncate text-sm font-extrabold text-[var(--color-navy)] hover:underline"
          >
            {fullName}
          </Link>
          {data?.headline ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-muted)]">
              {data.headline}
            </p>
          ) : loading ? (
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">Đang tải…</p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {data ? (
              <PartnerVerificationBadges
                isVerified={data.isVerified}
                phoneVerified={data.phoneVerified}
                bankVerified={data.bankVerified}
                variant="icon"
                className="!justify-start"
              />
            ) : null}
            {data?.isOnline ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Online
              </span>
            ) : null}
            {accepting ? (
              <span className="rounded-full bg-[var(--color-brand-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-brand-deep)]">
                Đang nhận việc
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {data ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--color-muted)]">
          <span>
            ★{' '}
            <span className="font-bold text-[var(--color-ink)]">
              {(data.ratingAvg ?? 0).toFixed(1)}
            </span>
            {data.ratingCount > 0 ? ` (${data.ratingCount})` : ''}
          </span>
          <span>
            {data.completedJobs} việc xong
            {typeof data.hireSuccessCount === 'number'
              ? ` · ${data.hireSuccessCount} thuê OK`
              : ''}
          </span>
          {data.city ? <span>{data.city}</span> : null}
        </div>
      ) : null}

      <Link
        to={profileTo}
        className="inline-flex h-9 w-full items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] text-xs font-bold text-[var(--color-navy)] transition hover:border-[var(--color-brand)] hover:bg-white"
      >
        Xem hồ sơ công khai
      </Link>
    </div>
  );
}
