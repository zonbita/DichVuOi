/**
 * Khoảng giá tham khảo thị trường (₫) — đồng bộ logic với API `market-price.ts`.
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

export function formatMarketPriceRange(
  input: {
    basePrice: number;
    priceMin?: number | null;
    priceMax?: number | null;
  },
  formatPrice: (n: number) => string,
): string {
  const { min, max } = marketPriceRange(input);
  if (min === max) return formatPrice(min);
  return `${formatPrice(min)} – ${formatPrice(max)}`;
}
