export type SeedService = {
    slug: string;
    name: string;
    description: string;
    basePrice: number;
    priceMin: number;
    priceMax: number;
    unit: string;
    durationMin: number;
    supportsOnline: boolean;
};
export type SeedCategory = {
    slug: string;
    name: string;
    services: SeedService[];
};
export type SeedGroup = {
    slug: string;
    name: string;
    description: string;
    icon: string;
    sortOrder: number;
    isFeatured: boolean;
    categories: SeedCategory[];
};
export declare const catalogGroups: SeedGroup[];
export declare const obsoleteCategorySlugs: string[];
