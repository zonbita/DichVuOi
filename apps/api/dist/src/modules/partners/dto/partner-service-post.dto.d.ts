export declare class CreatePartnerServicePostDto {
    serviceId: string;
    title: string;
    body: string;
    priceMin: number;
    priceMax: number;
    images: string[];
}
export declare class UpdatePartnerServicePostDto {
    serviceId?: string;
    title?: string;
    body?: string;
    priceMin?: number;
    priceMax?: number;
    images?: string[];
}
