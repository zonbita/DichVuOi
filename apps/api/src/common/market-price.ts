/**
 * Khoảng giá tham khảo thị trường (₫) từ Service.
 * Nếu priceMin/priceMax chưa set (=0) → suy ra từ basePrice (~±20%).
 */
export function marketPriceRange(input: {
  basePrice: number;
  priceMin?: number | null;
  priceMax?: number | null;
}): { min: number; max: number } {
  const base = Math.max(0, Math.round(input.basePrice || 0));
  const rawMin =
    input.priceMin && input.priceMin > 0
      ? input.priceMin
      : Math.round((base * 0.85) / 1000) * 1000;
  const rawMax =
    input.priceMax && input.priceMax > 0
      ? input.priceMax
      : Math.round((base * 1.25) / 1000) * 1000 || base;
  const min = Math.min(rawMin, rawMax);
  const max = Math.max(rawMin, rawMax, min);
  return { min, max };
}

/** Gán khoảng thị trường mặc định khi seed / tạo service chỉ có basePrice. */
export function defaultMarketRangeFromBase(basePrice: number): {
  priceMin: number;
  priceMax: number;
} {
  const { min, max } = marketPriceRange({ basePrice });
  return { priceMin: min, priceMax: max };
}
