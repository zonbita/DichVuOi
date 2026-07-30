export declare function marketPriceRange(input: {
    basePrice: number;
    priceMin?: number | null;
    priceMax?: number | null;
}): {
    min: number;
    max: number;
};
export declare function defaultMarketRangeFromBase(basePrice: number): {
    priceMin: number;
    priceMax: number;
};
