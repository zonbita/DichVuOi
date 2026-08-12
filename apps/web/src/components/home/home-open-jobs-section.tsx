import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../services/api';
import {
  OPEN_JOB_PORTRAIT_GRID,
  OpenJobCard,
} from '../common/open-job-card';
import { ListPagination } from '../ui/list-pagination';
import { SectionHeaderBar, SectionHeaderViewAll } from './section-header-bar';

const PAGE_SIZE = 10;

function OpenJobCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[16px] border border-[var(--color-line)] bg-white p-3">
      <div className="h-[132px] w-full animate-pulse rounded-[14px] bg-[var(--color-canvas)]" />
      <div className="mt-2.5 h-4 w-4/5 animate-pulse rounded bg-[var(--color-canvas)]" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-[var(--color-canvas)]" />
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <div className="h-6 animate-pulse rounded-lg bg-[var(--color-canvas)]" />
        <div className="h-6 animate-pulse rounded-lg bg-[var(--color-canvas)]" />
        <div className="h-6 animate-pulse rounded-lg bg-[var(--color-canvas)]" />
        <div className="h-6 animate-pulse rounded-lg bg-[var(--color-canvas)]" />
      </div>
      <div className="mt-auto pt-2">
        <div className="h-8 animate-pulse rounded-xl bg-[var(--color-canvas)]" />
        <div className="mt-1.5 h-10 animate-pulse rounded-full bg-[var(--color-canvas)]" />
      </div>
    </div>
  );
}

export function HomeOpenJobsSection() {
  const [page, setPage] = useState(1);

  const openJobsQuery = useQuery({
    queryKey: ['open-jobs-board', page, PAGE_SIZE],
    queryFn: () => api.getOpenJobsBoard(page, PAGE_SIZE),
    staleTime: 10_000,
    refetchInterval: 12_000,
    placeholderData: keepPreviousData,
  });

  const board = openJobsQuery.data;
  const jobs = board?.items ?? [];
  const total = board?.total ?? 0;
  const pageCount = board?.pageCount ?? 1;
  const showSkeleton = openJobsQuery.isLoading && jobs.length === 0;
  const showError = openJobsQuery.isError && jobs.length === 0;

  return (
    <section className="page-shell mt-10">
      <div className="section-container min-w-0">
        <div className="min-w-0 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-line)] p-4 shadow-[var(--shadow-card)] sm:p-5">
          <SectionHeaderBar
            icon="briefcase"
            title="Việc mới đăng tuyển"
            tone="red"
            badge={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-white/30">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                Live
              </span>
            }
            action={<SectionHeaderViewAll to="/doi-tac/don-thue" />}
          />

          {showSkeleton ? (
            <div className={OPEN_JOB_PORTRAIT_GRID}>
              {Array.from({ length: PAGE_SIZE }, (_, i) => (
                <OpenJobCardSkeleton key={i} />
              ))}
            </div>
          ) : null}

          {showError ? (
            <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-8 text-center">
              <p className="text-base text-[var(--color-muted)]">
                Không tải được việc mới. Kiểm tra kết nối rồi thử lại.
              </p>
              <button
                type="button"
                onClick={() => void openJobsQuery.refetch()}
                className="btn-primary mt-3 inline-flex px-4 py-2 text-sm"
              >
                Thử lại
              </button>
            </div>
          ) : null}

          {!showSkeleton && !showError && jobs.length === 0 ? (
            <p className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-8 text-center text-base text-[var(--color-muted)]">
              Chưa có đơn mở. Khi khách đặt cọc, việc mới sẽ hiện tại đây.
            </p>
          ) : null}

          {jobs.length > 0 ? (
            <>
              <div className={OPEN_JOB_PORTRAIT_GRID}>
                {jobs.map((booking, index) => (
                  <OpenJobCard
                    key={booking.id}
                    booking={booking}
                    layout="portrait"
                    detailTo={`/viec-moi/${booking.id}`}
                    priority={index === 0}
                  />
                ))}
              </div>

              <ListPagination
                page={page}
                pageCount={pageCount}
                total={total}
                unitLabel="việc"
                onChange={setPage}
                ariaLabel="Phân trang việc mới"
              />
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
