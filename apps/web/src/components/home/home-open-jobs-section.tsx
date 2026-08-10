import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { OpenJobCard } from '../common/open-job-card';
import { Icon } from '../ui/icon';
import { SectionHeaderBar, SectionHeaderViewAll } from './section-header-bar';

export function HomeOpenJobsSection() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const openJobsQuery = useQuery({
    queryKey: ['open-jobs-board', page, pageSize],
    queryFn: () => api.getOpenJobsBoard(page, pageSize),
    staleTime: 10_000,
    refetchInterval: 12_000,
    placeholderData: keepPreviousData,
  });

  const board = openJobsQuery.data;
  const jobs = board?.items ?? [];
  const total = board?.total ?? 0;
  const pageCount = board?.pageCount ?? 1;

  return (
    <section className="page-shell mt-10">
      <div className="section-container min-w-0">
        <div className="min-w-0 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-line)] p-4 shadow-[var(--shadow-card)] sm:p-5">
          <SectionHeaderBar
            icon="briefcase"
            title="Việc mới đăng tuyển"
            badge={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white/90 ring-1 ring-white/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Live
              </span>
            }
            action={<SectionHeaderViewAll to="/doi-tac/don-thue" />}
          />

          {openJobsQuery.isLoading ? (
            <p className="text-base text-[var(--color-muted)]">Đang tải việc mới...</p>
          ) : null}

          {!openJobsQuery.isLoading && jobs.length === 0 ? (
            <p className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-8 text-center text-base text-[var(--color-muted)]">
              Chưa có đơn mở. Khi khách đặt cọc, việc mới sẽ hiện tại đây.
            </p>
          ) : null}

          {jobs.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {jobs.map((booking) => (
                  <OpenJobCard
                    key={booking.id}
                    booking={booking}
                    layout="portrait"
                    detailTo={`/viec-moi/${booking.id}`}
                    footerRight={
                      <Link
                        to={`/viec-moi/${booking.id}`}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[var(--color-brand)] px-4 py-2.5 text-sm font-bold !text-white transition hover:bg-[var(--color-brand-deep)]"
                      >
                        Xem đơn
                        <Icon name="chevronRight" className="h-4 w-4" />
                      </Link>
                    }
                  />
                ))}
              </div>

              {total > pageSize ? (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[var(--color-muted)]">
                    {total} việc · trang {page}/{pageCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1 || openJobsQuery.isFetching}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-canvas)] disabled:opacity-40"
                    >
                      <Icon name="chevronLeft" className="h-4 w-4" />
                      Trước
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                        (n) => (
                          <button
                            key={n}
                            type="button"
                            disabled={openJobsQuery.isFetching}
                            onClick={() => setPage(n)}
                            aria-current={n === page ? 'page' : undefined}
                            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2.5 text-sm font-bold transition ${
                              n === page
                                ? 'bg-[var(--color-navy)] text-white'
                                : 'border border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-canvas)]'
                            }`}
                          >
                            {n}
                          </button>
                        ),
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={page >= pageCount || openJobsQuery.isFetching}
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-canvas)] disabled:opacity-40"
                    >
                      Sau
                      <Icon name="chevronRight" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
