import { useEffect, useMemo, useState } from 'react';
import type { Booking } from '../../types/catalog';
import { phraseMatch } from '../../utils/search';
import {
  OPEN_JOB_PORTRAIT_GRID,
  OpenJobCard,
  openJobTitle,
} from '../common/open-job-card';
import {
  dashboardSurfaceClass,
} from '../dashboard/dashboard-chrome';
import { ListPagination } from '../ui/list-pagination';
import { Icon } from '../ui/icon';
import {
  PartnerProfessionTabs,
  type ProfessionTab,
} from './partner-profession-tabs';

const PAGE_SIZE = 10;

type IncomingStatusFilter = 'all' | 'open' | 'urgent' | 'matching' | 'not_applied';
type IncomingSortKey = 'newest' | 'deadline' | 'budget-desc';

const STATUS_FILTERS: Array<{ id: IncomingStatusFilter; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'open', label: 'Mở mới' },
  { id: 'urgent', label: 'Sắp hết hạn' },
  { id: 'matching', label: 'Đang ghép' },
  { id: 'not_applied', label: 'Chưa ứng tuyển' },
];

function isUrgent(booking: Booking) {
  const deadlineMs = booking.matchingDeadlineAt
    ? new Date(booking.matchingDeadlineAt).getTime() - Date.now()
    : null;
  return deadlineMs != null && deadlineMs > 0 && deadlineMs < 24 * 60 * 60 * 1000;
}

function hasApplied(
  booking: Booking,
  appliedIds: string[],
) {
  return (
    appliedIds.includes(booking.id) ||
    (booking.applications?.some((application) =>
      ['APPLIED', 'SELECTED'].includes(application.status),
    ) ??
      false)
  );
}

function matchesStatusFilter(
  booking: Booking,
  filter: IncomingStatusFilter,
  appliedIds: string[],
) {
  switch (filter) {
    case 'all':
      return true;
    case 'open':
      return (booking.applicationCount ?? 0) === 0 && !isUrgent(booking);
    case 'urgent':
      return isUrgent(booking);
    case 'matching':
      return (booking.applicationCount ?? 0) > 0;
    case 'not_applied':
      return !hasApplied(booking, appliedIds);
    default:
      return true;
  }
}

function sortIncomingBookings(bookings: Booking[], sortKey: IncomingSortKey) {
  const list = bookings.slice();
  if (sortKey === 'deadline') {
    return list.sort((a, b) => {
      const ta = a.matchingDeadlineAt
        ? new Date(a.matchingDeadlineAt).getTime()
        : Number.POSITIVE_INFINITY;
      const tb = b.matchingDeadlineAt
        ? new Date(b.matchingDeadlineAt).getTime()
        : Number.POSITIVE_INFINITY;
      return ta - tb;
    });
  }
  if (sortKey === 'budget-desc') {
    return list.sort((a, b) => {
      const pa = a.budgetMax ?? a.budgetMin ?? a.totalPrice;
      const pb = b.budgetMax ?? b.budgetMin ?? b.totalPrice;
      return pb - pa;
    });
  }
  return list.sort((a, b) => {
    const ta = new Date(a.createdAt ?? a.scheduledAt).getTime();
    const tb = new Date(b.createdAt ?? b.scheduledAt).getTime();
    return tb - ta;
  });
}

type Props = {
  bookings: Booking[];
  /** Tổng đơn trước lọc nghề — empty copy. */
  sourceTotal?: number;
  loading?: boolean;
  onApply: (id: string) => void;
  applyingId?: string | null;
  appliedIds?: string[];
  emptyHint?: string;
  professionTabs?: ProfessionTab[];
  professionId?: string;
  onProfessionChange?: (id: string) => void;
};

/** Danh sách đơn mở — portrait card giống trang chủ (5/hàng). */
export function PartnerIncomingList({
  bookings,
  sourceTotal,
  loading,
  onApply,
  applyingId,
  appliedIds = [],
  emptyHint,
  professionTabs,
  professionId = 'all',
  onProfessionChange,
}: Props) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<IncomingStatusFilter>('all');
  const [sortKey, setSortKey] = useState<IncomingSortKey>('newest');

  const poolSize = sourceTotal ?? bookings.length;
  const showProfessionFilter = Boolean(professionTabs?.length && onProfessionChange);

  const statusCounts = useMemo(() => {
    const counts: Record<IncomingStatusFilter, number> = {
      all: bookings.length,
      open: 0,
      urgent: 0,
      matching: 0,
      not_applied: 0,
    };
    for (const booking of bookings) {
      if ((booking.applicationCount ?? 0) === 0 && !isUrgent(booking)) counts.open += 1;
      if (isUrgent(booking)) counts.urgent += 1;
      if ((booking.applicationCount ?? 0) > 0) counts.matching += 1;
      if (!hasApplied(booking, appliedIds)) counts.not_applied += 1;
    }
    return counts;
  }, [bookings, appliedIds]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim();
    const matched = bookings.filter((booking) => {
      if (!matchesStatusFilter(booking, statusFilter, appliedIds)) return false;
      if (!query) return true;
      const haystack = [
        openJobTitle(booking),
        booking.service.name,
        booking.customerName,
        booking.address,
      ]
        .filter(Boolean)
        .join(' ');
      return phraseMatch(haystack, query);
    });
    return sortIncomingBookings(matched, sortKey);
  }, [bookings, searchQuery, statusFilter, sortKey, appliedIds]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  useEffect(() => {
    setPage(1);
  }, [professionId, searchQuery, statusFilter, sortKey]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== 'all' ||
    sortKey !== 'newest';

  function clearFilters() {
    setSearchQuery('');
    setStatusFilter('all');
    setSortKey('newest');
  }

  const emptyMessage =
    emptyHint ??
    (poolSize === 0
      ? 'Chưa có đơn mở. Khi khách đặt cọc, đơn sẽ hiện tại đây.'
      : filtered.length === 0
        ? hasActiveFilters
          ? 'Không có đơn khớp bộ lọc. Thử đổi từ khoá hoặc trạng thái.'
          : 'Không có đơn phù hợp.'
        : null);

  return (
    <section
      className={`${dashboardSurfaceClass} flex flex-col p-4 sm:p-5`}
    >
      <div className="shrink-0 space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[auto_16rem_10.5rem_auto] xl:items-center">
          {showProfessionFilter ? (
            <PartnerProfessionTabs
              tabs={professionTabs!}
              value={professionId}
              onChange={onProfessionChange!}
              orientation="vertical"
              layout="inline"
            />
          ) : null}

          <label className="field-input flex h-11 w-full max-w-[16rem] items-center gap-2.5 px-3 focus-within:border-[var(--color-brand)] focus-within:shadow-[0_0_0_3px_rgba(0,156,149,0.15)] xl:w-[16rem] xl:shrink-0">
            <span className="sr-only">Tìm đơn thuê</span>
            <Icon
              name="search"
              className="h-4 w-4 shrink-0 text-[var(--color-brand)]"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm theo tên việc, nghề, khu vực..."
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] outline-none"
            />
          </label>

          <label className="field-input flex h-11 min-w-0 items-center gap-2 px-3 focus-within:border-[var(--color-brand)] focus-within:shadow-[0_0_0_3px_rgba(0,156,149,0.15)]">
            <span className="sr-only">Sắp xếp</span>
            <Icon
              name="chart"
              className="h-4 w-4 shrink-0 text-[var(--color-brand)]"
            />
            <select
              value={sortKey}
              onChange={(event) =>
                setSortKey(event.target.value as IncomingSortKey)
              }
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] outline-none appearance-none"
            >
              <option value="newest">Mới nhất</option>
              <option value="deadline">Sắp hết hạn trước</option>
              <option value="budget-desc">Ngân sách cao → thấp</option>
            </select>
            <Icon
              name="chevronDown"
              className="h-4 w-4 shrink-0 text-[var(--color-muted)]"
            />
          </label>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[12px] border border-[var(--color-line)] bg-white px-4 text-sm font-semibold text-[var(--color-navy)] transition hover:bg-[var(--color-canvas)] disabled:cursor-not-allowed disabled:opacity-45 xl:justify-self-end"
          >
            <Icon name="rotateCcw" className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
            Xóa lọc
          </button>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Lọc trạng thái đơn thuê"
        >
          {STATUS_FILTERS.map((item) => {
            const active = statusFilter === item.id;
            const count = statusCounts[item.id];
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  active
                    ? 'bg-[var(--color-navy)] text-white'
                    : 'border border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:border-[var(--color-brand)]/35 hover:bg-[var(--color-brand-soft)]/50'
                }`}
              >
                {item.label}
                <span
                  className={`text-xs ${active ? 'text-white/80' : 'text-[var(--color-muted)]'}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        {paged.length > 0 ? (
          <div className={OPEN_JOB_PORTRAIT_GRID}>
            {paged.map((booking) => {
              const isApplying = applyingId === booking.id;
              const isApplied = hasApplied(booking, appliedIds);

              return (
                <OpenJobCard
                  key={booking.id}
                  booking={booking}
                  layout="portrait"
                  detailTo={`/viec-moi/${booking.id}`}
                  footerRight={
                    <button
                      type="button"
                      disabled={isApplying || isApplied}
                      onClick={() => onApply(booking.id)}
                      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-bold transition ${
                        isApplied
                          ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
                          : isApplying
                            ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
                            : 'bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-deep)]'
                      } disabled:opacity-100`}
                    >
                      {isApplied
                        ? 'Đã ứng tuyển'
                        : isApplying
                          ? 'Đang ứng tuyển…'
                          : 'Ứng tuyển'}
                      <Icon
                        name={isApplied ? 'check' : 'chevronRight'}
                        className="h-4 w-4"
                      />
                    </button>
                  }
                />
              );
            })}
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-[var(--color-muted)]">Đang tải…</p>
        ) : null}
        {!loading && emptyMessage ? (
          <p className="rounded-xl bg-[var(--color-canvas)]/80 px-3 py-6 text-center text-sm text-[var(--color-muted)]">
            {emptyMessage}
          </p>
        ) : null}
      </div>

      <div className="mt-3 shrink-0">
        <ListPagination
          page={safePage}
          pageCount={pageCount}
          total={filtered.length}
          unitLabel="đơn"
          onChange={setPage}
          ariaLabel="Phân trang đơn thuê"
        />
      </div>
    </section>
  );
}
