import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { catalogQueries } from '../../lib/catalog-queries';
import { displayStats } from '../../utils/catalog-display';
import { DealCard } from '../common/deal-card';
import { ScrollRail } from '../common/scroll-rail';
import { Icon } from '../ui/icon';

const HOT_SERVICES_LIMIT = 20;

/**
 * Nghề (dịch vụ) có nhiều người tham gia nhất — rail ngang, kéo giữ chuột.
 */
export function HomeHotJobsSection() {
  const servicesQuery = useQuery(catalogQueries.services);

  const hotServices = useMemo(() => {
    const services = servicesQuery.data ?? [];
    return [...services]
      .sort((a, b) => {
        const partnersA = a._count?.partners ?? 0;
        const partnersB = b._count?.partners ?? 0;
        if (partnersB !== partnersA) return partnersB - partnersA;
        // Tie-break: điểm trưng bày (reviews demo) — ổn định UI.
        return displayStats(b.id).reviews - displayStats(a.id).reviews;
      })
      .slice(0, HOT_SERVICES_LIMIT);
  }, [servicesQuery.data]);

  return (
    <section className="page-shell mt-10">
      <div className="section-container min-w-0">
        <div className="min-w-0 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-[var(--color-brand-soft)] p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="section-header-bar mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3.5 sm:px-5 sm:py-4">
            <h2 className="text-xl font-bold tracking-tight text-[var(--color-navy)] sm:text-2xl">
              Nghề nhiều người tham gia nhất
            </h2>
            <span className="text-sm font-medium text-[var(--color-muted)]">
              Kéo ngang để xem thêm
            </span>
            <div className="ml-auto flex shrink-0 items-center gap-3">
              <Link
                to="/nhom"
                className="text-[15px] font-semibold !text-[var(--color-brand)] transition hover:!text-[var(--color-navy)]"
              >
                <span className="inline-flex items-center gap-1">
                  Xem tất cả
                  <Icon name="chevronRight" className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>

          {servicesQuery.isLoading ? (
            <p className="text-base text-[var(--color-muted)]">
              Đang tải nghề hot...
            </p>
          ) : null}

          {!servicesQuery.isLoading && hotServices.length === 0 ? (
            <p className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-8 text-center text-base text-[var(--color-muted)]">
              Chưa có dịch vụ để hiển thị.
            </p>
          ) : null}

          {hotServices.length > 0 ? (
            <ScrollRail showArrows={false}>
              {hotServices.map((service) => (
                <DealCard key={service.id} service={service} />
              ))}
            </ScrollRail>
          ) : null}
        </div>
      </div>
    </section>
  );
}
