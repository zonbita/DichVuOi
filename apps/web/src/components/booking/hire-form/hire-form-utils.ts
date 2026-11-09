import type { CatalogTreeService, ServiceGroupTree } from '../../../types/catalog';
import { marketPriceRange } from '../../../utils/market-price';
import type { CatalogServicePick } from '../../home/catalog-menu-shared';
import { PRICE_SLIDER_MIN } from '../../ui/price-range-slider';

export type ServiceOption = CatalogServicePick &
  Pick<
    CatalogTreeService,
    'basePrice' | 'priceMin' | 'priceMax' | 'unit' | 'durationMin'
  >;

export function flattenServices(groups: ServiceGroupTree[]): ServiceOption[] {
  return groups.flatMap((group) =>
    (group.categories ?? []).flatMap((category) =>
      category.services.map((service) => ({
        id: service.id,
        slug: service.slug,
        name: service.name,
        categoryName: category.name,
        groupSlug: group.slug,
        groupName: group.name,
        basePrice: service.basePrice,
        priceMin: service.priceMin,
        priceMax: service.priceMax,
        unit: service.unit,
        durationMin: service.durationMin,
      })),
    ),
  );
}

export function defaultBudgetForService(service: ServiceOption | null) {
  if (!service) {
    return { min: PRICE_SLIDER_MIN, max: 5_000_000 };
  }
  return marketPriceRange({
    basePrice: service.basePrice,
    priceMin: service.priceMin,
    priceMax: service.priceMax,
  });
}

export const STEPS = [
  { id: 1, label: 'Chọn dịch vụ' },
  { id: 2, label: 'Thông tin' },
  { id: 3, label: 'Xác nhận' },
] as const;
