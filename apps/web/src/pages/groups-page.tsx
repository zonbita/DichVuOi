import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GroupTile } from '../components/common/group-card';
import { RetentionPartnerCard } from '../components/home/retention-partner-card';
import { SectionHeaderBar } from '../components/home/section-header-bar';
import { Icon } from '../components/ui/icon';
import { catalogQueries } from '../lib/catalog-queries';
import { api } from '../services/api';
import { groupColor } from '../utils/catalog-colors';
import { phraseMatch } from '../utils/search';

type SortMode = 'default' | 'name-asc' | 'name-desc';

export function GroupsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = (searchParams.get('q') ?? '').trim();
  const [draftQuery, setDraftQuery] = useState(keyword);
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [filterOpen, setFilterOpen] = useState(false);

  const { data, isLoading, isError } = useQuery(catalogQueries.groupsTree);

  const partnersQuery = useQuery({
    queryKey: ['partners', 'search', keyword],
    queryFn: () => api.searchPartners(keyword, 24),
    enabled: Boolean(keyword),
  });

  const groups = useMemo(() => {
    const list = [...(data ?? [])];
    if (sortMode === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } else if (sortMode === 'name-desc') {
      list.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
    }
    return list;
  }, [data, sortMode]);

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

  function commitSearch(value: string) {
    const next = value.trim();
    setDraftQuery(next);
    if (next) setSearchParams({ q: next });
    else setSearchParams({});
  }

  return (
    <div>
      <SectionHeaderBar
        icon="grid"
        title={keyword ? `Kết quả cho “${keyword}”` : 'Tất cả ngành nghề'}
        subtitle={
          keyword ? null : 'Khám phá dịch vụ phù hợp với nhu cầu của bạn'
        }
        action={
          <div className="flex w-full min-w-0 items-center gap-2">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Tìm kiếm ngành nghề</span>
              <Icon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-muted)]"
              />
              <input
                type="search"
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitSearch(draftQuery);
                }}
                placeholder="Tìm kiếm ngành nghề..."
                className="w-full rounded-full border border-white/20 bg-white py-1.5 pr-3 pl-9 text-xs font-medium text-[var(--color-navy)] shadow-sm outline-none placeholder:text-[var(--color-muted)] focus:ring-2 focus:ring-white/40 sm:text-sm"
              />
            </label>

            <div className="relative shrink-0">
              <button
                type="button"
                aria-expanded={filterOpen}
                onClick={() => setFilterOpen((open) => !open)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-navy)] shadow-sm transition hover:bg-white/95 sm:gap-2 sm:px-3.5 sm:text-sm"
              >
                <Icon name="settings" className="h-3.5 w-3.5" />
                Bộ lọc
                <Icon
                  name="chevronDown"
                  className="h-3.5 w-3.5 text-[var(--color-muted)]"
                />
              </button>
              {filterOpen ? (
                <div className="absolute right-0 z-[60] mt-2 w-48 overflow-hidden rounded-xl border border-[var(--color-line)] bg-white py-1 shadow-[var(--shadow-hover)]">
                  {(
                    [
                      ['default', 'Mặc định'],
                      ['name-asc', 'Tên A → Z'],
                      ['name-desc', 'Tên Z → A'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setSortMode(value);
                        setFilterOpen(false);
                      }}
                      className={`block w-full px-3.5 py-2 text-left text-sm font-medium transition hover:bg-[var(--color-canvas)] ${
                        sortMode === value
                          ? 'text-[var(--color-brand-deep)]'
                          : 'text-[var(--color-ink)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        }
      />

      {isLoading && <p className="mt-6">Đang tải...</p>}
      {isError && <p className="mt-6 text-red-600">Lỗi tải danh mục.</p>}

      {noResults ? (
        <p className="mt-6 text-[var(--color-muted)]">
          Không tìm thấy kết quả phù hợp cho “{keyword}”.
        </p>
      ) : null}

      {!keyword && groups.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {groups.map((group) => (
            <GroupTile key={group.id} group={group} />
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
