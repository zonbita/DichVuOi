"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketPriceRange = marketPriceRange;
exports.defaultMarketRangeFromBase = defaultMarketRangeFromBase;
function marketPriceRange(input) {
    const base = Math.max(0, Math.round(input.basePrice || 0));
    const rawMin = input.priceMin && input.priceMin > 0
        ? input.priceMin
        : Math.round((base * 0.85) / 1000) * 1000;
    const rawMax = input.priceMax && input.priceMax > 0
        ? input.priceMax
        : Math.round((base * 1.25) / 1000) * 1000 || base;
    const min = Math.min(rawMin, rawMax);
    const max = Math.max(rawMin, rawMax, min);
    return { min, max };
}
function defaultMarketRangeFromBase(basePrice) {
    const { min, max } = marketPriceRange({ basePrice });
    return { priceMin: min, priceMax: max };
}
//# sourceMappingURL=market-price.js.map