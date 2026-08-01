import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { OpenJobCard } from '../common/open-job-card';
import { Icon } from '../ui/icon';

export function HomeOpenJobsSection() {
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const openJobsQuery = useQuery({
    queryKey: ['open-jobs-board', page, pageSize],
    queryFn: () => api.getOpenJobsBoard(page, pageSize),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const board = openJobsQuery.data;
  const jobs = board?.items ?? [];
  const total = board?.total ?? 0;
  const pageCount = board?.pageCount ?? 1;

  return (
    <section className="page-shell mt-10">
      <div className="section-container">
        <div className="section-header-bar mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3.5 sm:px-5 sm:py-4">
          <h2 className="text-xl font-bold tracking-tight text-[var(--color-navy)] sm:text-2xl">
            Việc mới đăng tuyển
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
          <div className="ml-auto">
            <Link
              to="/doi-tac/viec"
              className="group flex items-center gap-1 text-[15px] font-semibold text-[var(--color-brand)] transition hover:text-[var(--color-navy)]"
            >
              Xem tất cả
              <Icon
                name="chevronRight"
                className="h-4 w-4 transition group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>

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
            <div className="grid gap-3 md:grid-cols-2">
              {jobs.map((booking) => (
                <OpenJobCard
                  key={booking.id}
                  booking={booking}
                  footerRight={
                    <Link
                      to="/doi-tac/viec"
                      className="inline-flex min-w-[132px] items-center justify-center rounded-full bg-[var(--color-brand)] px-5 py-2.5 text-sm font-bold !text-white transition hover:bg-[var(--color-brand-deep)]"
                    >
                      Ứng tuyển
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
    </section>
  );
}
