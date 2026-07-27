import type { RebookHint, Service } from '../types/catalog';

export type PersonalizeSignals = {
  /** Slug nhóm từ đơn cũ / thuê lại. */
  groupSlugs?: Set<string>;
  /** Slug dịch vụ đã từng thuê. */
  serviceSlugs?: Set<string>;
};

/** Sắp xếp dịch vụ nổi bật — ưu tiên lịch sử thuê, không shuffle ngẫu nhiên. */
export function rankFeaturedServices(
  services: Service[],
  activeGroupSlug: string,
  signals: PersonalizeSignals,
  limit: number,
): Service[] {
  const pool =
    activeGroupSlug === 'all'
      ? services
      : services.filter((s) => s.category.group.slug === activeGroupSlug);

  if (pool.length <= limit) return pool;

  const scored = pool.map((service) => {
    let score = 0;
    const groupSlug = service.category.group.slug;
    if (signals.serviceSlugs?.has(service.slug)) score += 100;
    if (signals.groupSlugs?.has(groupSlug)) score += 40;
    if (service._count?.partners) score += Math.min(service._count.partners, 10);
    return { service, score };
  });

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.service.name.localeCompare(b.service.name, 'vi'),
  );

  return scored.slice(0, limit).map((row) => row.service);
}

export function signalsFromRebookHints(hints: RebookHint[]): PersonalizeSignals {
  return {
    groupSlugs: new Set(hints.map((h) => h.groupSlug)),
    serviceSlugs: new Set(hints.map((h) => h.serviceSlug)),
  };
}
