import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { GroupCard } from '../components/common/group-card';
import { api } from '../services/api';
import { groupColor } from '../utils/catalog-colors';
import { fuzzyMatch } from '../utils/search';

export function GroupsPage() {
  const [searchParams] = useSearchParams();
  const keyword = (searchParams.get('q') ?? '').trim();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['groups', 'tree'],
    queryFn: api.getGroupsTree,
  });

  const groups = data ?? [];

  const filteredGroups = keyword
    ? groups.filter((group) =>
        fuzzyMatch(`${group.name} ${group.description ?? ''}`, keyword),
      )
    : groups;

  const serviceHits = keyword
    ? groups.flatMap((group) =>
        (group.categories ?? []).flatMap((category) =>
          category.services
            .filter((service) =>
              fuzzyMatch(`${service.name} ${category.name} ${group.name}`, keyword),
            )
            .map((service) => ({ service, category, group })),
        ),
      )
    : [];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">
          {keyword ? `Kết quả cho “${keyword}”` : 'Tất cả nhóm dịch vụ'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)] sm:text-base">
          {keyword
            ? 'Tìm không dấu và gần đúng — gõ «sua», «dien lanh», «giasu» vẫn ra kết quả.'
            : 'Chỉ hiện nghề có thể thực hiện hoàn toàn online.'}
        </p>
      </div>

      {isLoading && <p className="mt-6">Đang tải...</p>}
      {isError && <p className="mt-6 text-red-600">Lỗi tải danh mục.</p>}

      {!isLoading && keyword && filteredGroups.length === 0 && serviceHits.length === 0 && (
        <p className="mt-6 text-[var(--color-muted)]">
          Không tìm thấy kết quả phù hợp cho “{keyword}”.
        </p>
      )}

      {filteredGroups.length > 0 && (
        <>
          {keyword ? (
            <h2 className="mt-6 text-lg font-bold">Nhóm dịch vụ</h2>
          ) : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGroups.map((group) => (
              <GroupCard key={group.id} group={group} to={`/nhom/${group.slug}`} />
            ))}
          </div>
        </>
      )}

      {keyword && serviceHits.length > 0 && (
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
                  <span className="mt-1 text-sm text-[var(--color-muted)]">{category.name}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
