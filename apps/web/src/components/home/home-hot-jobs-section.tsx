import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { catalogQueries } from '../../lib/catalog-queries';
import { displayStats } from '../../utils/catalog-display';
import { DealCard } from '../common/deal-card';
import { ScrollRail } from '../common/scroll-rail';
import { SectionHeaderBar, SectionHeaderViewAll } from './section-header-bar';

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
        <div className="min-w-0 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-line)] p-4 shadow-[var(--shadow-card)] sm:p-5">
          <SectionHeaderBar
            icon="chart"
            title="Nghề nhiều người tham gia nhất"
            subtitle="Kéo ngang để xem thêm"
            tone="gold"
            action={<SectionHeaderViewAll to="/nhom" />}
          />

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
            <ScrollRail showArrows>
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
