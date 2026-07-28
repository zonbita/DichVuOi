import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { GroupCard } from '../components/common/group-card';
import { RetentionPartnerCard } from '../components/home/retention-partner-card';
import { catalogQueries } from '../lib/catalog-queries';
import { api } from '../services/api';
import { groupColor } from '../utils/catalog-colors';
import { phraseMatch } from '../utils/search';

export function GroupsPage() {
  const [searchParams] = useSearchParams();
  const keyword = (searchParams.get('q') ?? '').trim();

  const { data, isLoading, isError } = useQuery(catalogQueries.groupsTree);

  const partnersQuery = useQuery({
    queryKey: ['partners', 'search', keyword],
    queryFn: () => api.searchPartners(keyword, 24),
    enabled: Boolean(keyword),
  });

  const groups = data ?? [];
  const partnerHits = partnersQuery.data ?? [];

  const serviceHits = keyword
    ? groups.flatMap((group) =>
        (group.categories ?? []).flatMap((category) =>
          category.services
            .filter((service) =>
              phraseMatch(
                `${service.name} ${category.name} ${group.name}`,
                keyword,
              ),
            )
            .map((service) => ({ service, category, group })),
        ),
      )
    : [];

  const searching = Boolean(keyword);
  const noResults =
    searching &&
    !isLoading &&
    !partnersQuery.isLoading &&
    serviceHits.length === 0 &&
    partnerHits.length === 0;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">
          {keyword ? `Kết quả cho “${keyword}”` : 'Tất cả nhóm dịch vụ'}
        </h1>
        {!keyword ? (
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)] sm:text-base">
            Chỉ hiện nghề có thể thực hiện hoàn toàn online.
          </p>
        ) : null}
      </div>

      {isLoading && <p className="mt-6">Đang tải...</p>}
      {isError && <p className="mt-6 text-red-600">Lỗi tải danh mục.</p>}

      {noResults ? (
        <p className="mt-6 text-[var(--color-muted)]">
          Không tìm thấy kết quả phù hợp cho “{keyword}”.
        </p>
      ) : null}

      {!keyword && groups.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} to={`/nhom/${group.slug}`} />
          ))}
        </div>
      ) : null}

      {keyword && partnerHits.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-lg font-bold">Người làm khớp</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {partnerHits.map((partner) => (
              <RetentionPartnerCard
                key={partner.userId}
                partnerUserId={partner.userId}
                fullName={partner.fullName}
                avatarUrl={partner.avatarUrl}
                subtitle={partner.headline}
                ratingAvg={partner.ratingAvg}
                level={partner.level}
                isVerified={partner.isVerified}
                serviceSlug={partner.serviceSlug ?? undefined}
                serviceName={partner.serviceName ?? undefined}
                price={partner.price ?? undefined}
                unit={partner.unit ?? undefined}
                badge={
                  partner.matchReason === 'name' ? 'Khớp tên' : 'Khớp nghề'
                }
                ctaLabel="Xem hồ sơ"
              />
            ))}
          </div>
        </section>
      ) : null}

      {keyword && partnersQuery.isLoading ? (
        <p className="mt-6 text-sm text-[var(--color-muted)]">
          Đang tìm người làm...
        </p>
      ) : null}

      {keyword && serviceHits.length > 0 ? (
        <>
          <h2 className="mt-8 text-lg font-bold">Dịch vụ khớp</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {serviceHits.slice(0, 24).map(({ service, category, group }) => {
              const color = groupColor(group.slug);
              return (
                <Link
                  key={service.id}
                  to={`/dich-vu/${service.slug}`}
                  className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
                  style={{ borderLeft: `4px solid ${color.main}` }}
                >
                  <span
                    className="inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-bold"
                    style={{ backgroundColor: color.soft, color: color.ink }}
                  >
                    {group.name}
                  </span>
                  <span className="mt-2 text-base font-bold">{service.name}</span>
                  <span className="mt-1 text-sm text-[var(--color-muted)]">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
