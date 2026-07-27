import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HireServiceForm } from '../components/booking/hire-service-form';
import type { CatalogServicePick } from '../components/home/catalog-menu-shared';
import { api } from '../services/api';

export function HireServicePage() {
  const [searchParams] = useSearchParams();
  const preselectSlug = (searchParams.get('dich-vu') ?? '').trim();

  const treeQuery = useQuery({
    queryKey: ['groups', 'tree'],
    queryFn: api.getGroupsTree,
  });

  const groups = treeQuery.data ?? [];
  const [selected, setSelected] = useState<CatalogServicePick | null>(null);

  const preselectPick = useMemo(() => {
    if (!preselectSlug || groups.length === 0) return null;
    for (const group of groups) {
      for (const category of group.categories ?? []) {
        const service = category.services.find((item) => item.slug === preselectSlug);
        if (service) {
          return {
            id: service.id,
            slug: service.slug,
            name: service.name,
            categoryName: category.name,
            groupSlug: group.slug,
            groupName: group.name,
          } satisfies CatalogServicePick;
        }
      }
    }
    return null;
  }, [groups, preselectSlug]);

  useEffect(() => {
    if (preselectPick) setSelected(preselectPick);
  }, [preselectPick]);

  if (treeQuery.isLoading) {
    return <p className="text-sm text-[var(--color-muted)]">Đang tải danh mục...</p>;
  }

  if (treeQuery.isError) {
    return <p className="text-red-600">Không tải được danh mục dịch vụ.</p>;
  }

  return (
    <div className="animate-fade-up mx-auto max-w-3xl">
      <HireServiceForm groups={groups} selected={selected} onSelectedChange={setSelected} />
    </div>
  );
}
