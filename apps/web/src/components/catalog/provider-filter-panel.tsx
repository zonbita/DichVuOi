import type { ReactNode } from 'react';
import { Icon } from '../ui/icon';
import {
  PriceRangeSlider,
  PRICE_SLIDER_MAX,
  PRICE_SLIDER_MIN,
} from '../ui/price-range-slider';

export type ProviderSortKey = 'rating' | 'price-asc' | 'price-desc' | 'name' | 'experience';

type ProviderFilterPanelProps = {
  nameQuery: string;
  onNameQueryChange: (value: string) => void;
  cityQuery: string;
  onCityQueryChange: (value: string) => void;
  expMin: string;
  onExpMinChange: (value: string) => void;
  sortKey: ProviderSortKey;
  onSortKeyChange: (value: ProviderSortKey) => void;
  priceMin: number;
  priceMax: number;
  onPriceRangeChange: (next: { min: number; max: number }) => void;
  onClear: () => void;
};

function FilterField({
  label,
  icon,
  withChevron = false,
  children,
}: {
  label: string;
  icon: 'search' | 'pin' | 'briefcase' | 'chart';
  withChevron?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0 text-sm" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="filter-field relative">
        <Icon
          name={icon}
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-brand)]"
        />
        {children}
        {withChevron ? (
          <Icon
            name="chevronDown"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-brand)]"
          />
        ) : null}
      </div>
    </label>
  );
}

export function ProviderFilterPanel({
  nameQuery,
  onNameQueryChange,
  cityQuery,
  onCityQueryChange,
  expMin,
  onExpMinChange,
  sortKey,
  onSortKeyChange,
  priceMin,
  priceMax,
  onPriceRangeChange,
  onClear,
}: ProviderFilterPanelProps) {
  return (
    <div className="surface-card overflow-hidden p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,1fr)_auto] xl:items-center">
        <FilterField label="Tên / chuyên môn" icon="search">
          <input
            value={nameQuery}
            onChange={(e) => onNameQueryChange(e.target.value)}
            placeholder="Tìm theo tên..."
            className="field-input filter-field-input"
          />
        </FilterField>

        <FilterField label="Khu vực" icon="pin" withChevron>
          <input
            value={cityQuery}
            onChange={(e) => onCityQueryChange(e.target.value)}
            placeholder="TP / tỉnh"
            className="field-input filter-field-input filter-field-select"
          />
        </FilterField>

        <FilterField label="KN tối thiểu (năm)" icon="briefcase">
          <input
            value={expMin}
            onChange={(e) => onExpMinChange(e.target.value)}
            type="number"
            min={0}
            placeholder="Năm KN"
            className="field-input filter-field-input"
          />
        </FilterField>

        <FilterField label="Sắp xếp" icon="chart" withChevron>
          <select
            value={sortKey}
            onChange={(e) => onSortKeyChange(e.target.value as ProviderSortKey)}
            className="field-input filter-field-input filter-field-select appearance-none"
          >
            <option value="rating">Rating cao</option>
            <option value="price-asc">Giá tham khảo thấp đến cao</option>
            <option value="price-desc">Giá tham khảo cao đến thấp</option>
            <option value="name">Tên A–Z</option>
            <option value="experience">Kinh nghiệm nhiều</option>
          </select>
        </FilterField>

        <div className="flex items-center sm:col-span-2 xl:col-span-1">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--color-brand)] px-4 py-2.5 text-[15px] font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-soft)] xl:w-auto xl:min-w-[7.5rem]"
          >
            <Icon name="trash" className="h-4 w-4" />
            Xóa lọc
          </button>
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--color-line)] pt-4">
        <PriceRangeSlider
          layout="split"
          min={priceMin}
          max={priceMax}
          onChange={onPriceRangeChange}
        />
      </div>
    </div>
  );
}

export { PRICE_SLIDER_MIN, PRICE_SLIDER_MAX };
