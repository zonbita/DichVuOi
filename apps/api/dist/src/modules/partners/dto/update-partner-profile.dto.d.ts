export declare class EnablePartnerDto {
    phone?: string;
    headline?: string;
    bio?: string;
    city?: string;
    districts?: string;
    skills?: string[];
    workModes?: string;
    acceptingJobs?: boolean;
    responseMinutes?: number;
    serviceIds?: string[];
}
export declare class UpdatePartnerProfileDto {
    phone?: string;
    headline?: string;
    bio?: string;
    city?: string;
    districts?: string;
    skills?: string[];
    workModes?: string;
    acceptingJobs?: boolean;
    responseMinutes?: number;
    avatarUrl?: string;
    gallery?: string[];
}
export declare class SyncPartnerOfferingsDto {
    serviceIds: string[];
}
