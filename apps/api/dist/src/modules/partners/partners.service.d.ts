import { ReputationService } from '../../common/reputation.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EnablePartnerDto, SyncPartnerOfferingsDto, UpdatePartnerProfileDto } from './dto/update-partner-profile.dto';
export declare class PartnersService {
    private readonly prisma;
    private readonly reputation;
    constructor(prisma: PrismaService, reputation: ReputationService);
    private shapePublic;
    searchPublic(q: string, limit?: number): Promise<{
        userId: string;
        fullName: string;
        avatarUrl: string | null;
        headline: string | null;
        ratingAvg: number;
        level: number;
        isVerified: boolean;
        phoneVerified: boolean;
        bankVerified: boolean;
        serviceSlug: string | null;
        serviceName: string | null;
        price: number | null;
        unit: string | null;
        matchReason: "name" | "profession";
    }[]>;
    getPublicProfile(userId: string): Promise<{
        reputation: import("../../common/reputation.service").PartnerReputationSnapshot;
        id: string;
        userId: string;
        fullName: string;
        headline: string | null;
        bio: string | null;
        city: string | null;
        districts: string[];
        skills: string[];
        acceptingJobs: boolean;
        workModes: ("onsite" | "online")[];
        responseMinutes: number;
        ratingAvg: number;
        ratingCount: number;
        level: number;
        isVerified: boolean;
        phoneVerified: boolean;
        bankVerified: boolean;
        avatarUrl: string | null;
        gallery: string[];
        completedJobs: number;
        offerings: {
            id: string;
            price: number;
            headline: string | null;
            experienceYears: number;
            hoursWorked: number;
            includes: string | null;
            excludes: string | null;
            coverageNote: string | null;
            ratingAvg: number;
            ratingCount: number;
            service: {
                id: string;
                slug: string;
                name: string;
                unit: string;
                basePrice: number;
                category: {
                    id: string;
                    name: string;
                    slug: string;
                    group: {
                        id: string;
                        name: string;
                        slug: string;
                    };
                } | null;
            };
        }[];
        reviews: {
            id: string;
            rating: number;
            comment: string | null;
            createdAt: Date;
            fromName: string;
            serviceName: string;
            serviceSlug: string;
            groupSlug: string | null;
            groupName: string | null;
        }[];
    }>;
    getMine(userId: string): Promise<{
        skills: string[];
        gallery: string[];
        districtsList: string[];
        workModesList: ("onsite" | "online")[];
        serviceIds: string[];
        offerings: {
            hoursWorked: number;
            service: {
                name: string;
                id: string;
                isActive: boolean;
                slug: string;
                basePrice: number;
                unit: string;
                category: {
                    name: string;
                    id: string;
                    slug: string;
                    group: {
                        name: string;
                        id: string;
                        slug: string;
                    };
                };
            };
            includes: string | null;
            id: string;
            headline: string | null;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            partnerProfileId: string;
            serviceId: string;
            price: number | null;
            experienceYears: number;
            excludes: string | null;
            coverageNote: string | null;
        }[];
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.Role;
        };
        id: string;
        userId: string;
        headline: string | null;
        bio: string | null;
        city: string | null;
        districts: string | null;
        ratingAvg: number;
        ratingCount: number;
        level: number;
        onlineSeconds: number;
        lastOnlineAt: Date | null;
        isVerified: boolean;
        phoneVerified: boolean;
        bankVerified: boolean;
        avatarUrl: string | null;
        galleryJson: string | null;
        skillsJson: string | null;
        acceptingJobs: boolean;
        workModes: string | null;
        responseMinutes: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    enableOffering(userId: string, dto: EnablePartnerDto): Promise<{
        skills: string[];
        gallery: string[];
        districtsList: string[];
        workModesList: ("onsite" | "online")[];
        serviceIds: string[];
        offerings: {
            hoursWorked: number;
            service: {
                name: string;
                id: string;
                isActive: boolean;
                slug: string;
                basePrice: number;
                unit: string;
                category: {
                    name: string;
                    id: string;
                    slug: string;
                    group: {
                        name: string;
                        id: string;
                        slug: string;
                    };
                };
            };
            includes: string | null;
            id: string;
            headline: string | null;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            partnerProfileId: string;
            serviceId: string;
            price: number | null;
            experienceYears: number;
            excludes: string | null;
            coverageNote: string | null;
        }[];
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.Role;
        };
        id: string;
        userId: string;
        headline: string | null;
        bio: string | null;
        city: string | null;
        districts: string | null;
        ratingAvg: number;
        ratingCount: number;
        level: number;
        onlineSeconds: number;
        lastOnlineAt: Date | null;
        isVerified: boolean;
        phoneVerified: boolean;
        bankVerified: boolean;
        avatarUrl: string | null;
        galleryJson: string | null;
        skillsJson: string | null;
        acceptingJobs: boolean;
        workModes: string | null;
        responseMinutes: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private requireOrCreateProfile;
    updateMine(userId: string, dto: UpdatePartnerProfileDto): Promise<{
        skills: string[];
        gallery: string[];
        districtsList: string[];
        workModesList: ("onsite" | "online")[];
        serviceIds: string[];
        offerings: {
            hoursWorked: number;
            service: {
                name: string;
                id: string;
                isActive: boolean;
                slug: string;
                basePrice: number;
                unit: string;
                category: {
                    name: string;
                    id: string;
                    slug: string;
                    group: {
                        name: string;
                        id: string;
                        slug: string;
                    };
                };
            };
            includes: string | null;
            id: string;
            headline: string | null;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            partnerProfileId: string;
            serviceId: string;
            price: number | null;
            experienceYears: number;
            excludes: string | null;
            coverageNote: string | null;
        }[];
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.Role;
        };
        id: string;
        userId: string;
        headline: string | null;
        bio: string | null;
        city: string | null;
        districts: string | null;
        ratingAvg: number;
        ratingCount: number;
        level: number;
        onlineSeconds: number;
        lastOnlineAt: Date | null;
        isVerified: boolean;
        phoneVerified: boolean;
        bankVerified: boolean;
        avatarUrl: string | null;
        galleryJson: string | null;
        skillsJson: string | null;
        acceptingJobs: boolean;
        workModes: string | null;
        responseMinutes: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    syncOfferings(userId: string, dto: SyncPartnerOfferingsDto): Promise<{
        skills: string[];
        gallery: string[];
        districtsList: string[];
        workModesList: ("onsite" | "online")[];
        serviceIds: string[];
        offerings: {
            hoursWorked: number;
            service: {
                name: string;
                id: string;
                isActive: boolean;
                slug: string;
                basePrice: number;
                unit: string;
                category: {
                    name: string;
                    id: string;
                    slug: string;
                    group: {
                        name: string;
                        id: string;
                        slug: string;
                    };
                };
            };
            includes: string | null;
            id: string;
            headline: string | null;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            partnerProfileId: string;
            serviceId: string;
            price: number | null;
            experienceYears: number;
            excludes: string | null;
            coverageNote: string | null;
        }[];
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.Role;
        };
        id: string;
        userId: string;
        headline: string | null;
        bio: string | null;
        city: string | null;
        districts: string | null;
        ratingAvg: number;
        ratingCount: number;
        level: number;
        onlineSeconds: number;
        lastOnlineAt: Date | null;
        isVerified: boolean;
        phoneVerified: boolean;
        bankVerified: boolean;
        avatarUrl: string | null;
        galleryJson: string | null;
        skillsJson: string | null;
        acceptingJobs: boolean;
        workModes: string | null;
        responseMinutes: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getLevelBreakdown(userId: string): Promise<{
        inputs: {
            completedJobs: number;
            ratingAvg: number;
            ratingCount: number;
            isVerified: boolean;
            activeOfferings: number;
            onlineSeconds: number;
            onlineHours: number;
            lastOnlineAt: Date | null;
        };
        level: number;
        totalPoints: number;
        hoursPoints: number;
        onlineHours: number;
        jobsPoints: number;
        ratingPoints: number;
        reviewCountPoints: number;
        verifiedBonus: number;
        diversityBonus: number;
        storedLevel: number;
        formula: {
            readonly online: {
                readonly perHour: 0.25;
                readonly hoursCap: 180;
                readonly totalCap: 45;
            };
            readonly hours: {
                readonly perHour: 0.25;
                readonly perServiceHoursCap: 180;
                readonly totalCap: 45;
            };
            readonly jobs: {
                readonly perJob: 0.25;
                readonly cap: 80;
            };
            readonly rating: {
                readonly minReviews: 3;
                readonly maxPoints: 15;
            };
            readonly reviewCount: {
                readonly perReview: 0.125;
                readonly cap: 40;
            };
            readonly verifiedBonus: 10;
            readonly diversity: {
                readonly perOffering: 0.625;
                readonly cap: 8;
            };
            readonly levelRange: {
                readonly min: 1;
                readonly max: 100;
            };
        };
    }>;
    private syncOfferingsForProfile;
    listFavoriteIds(userId: string): Promise<string[]>;
    listFavorites(userId: string): Promise<{
        partnerUserId: string;
        fullName: string;
        headline: string | null;
        avatarUrl: string | null;
        ratingAvg: number;
        ratingCount: number;
        level: number;
        isVerified: boolean;
        phoneVerified: boolean;
        bankVerified: boolean;
        acceptingJobs: boolean;
        favoritedAt: Date;
        topOffering: {
            serviceSlug: string;
            serviceName: string;
            price: number;
            unit: string;
        } | null;
    }[]>;
    addFavorite(userId: string, partnerUserId: string): Promise<{
        partnerUserId: string;
        saved: boolean;
    }>;
    removeFavorite(userId: string, partnerUserId: string): Promise<{
        partnerUserId: string;
        saved: boolean;
    }>;
}
