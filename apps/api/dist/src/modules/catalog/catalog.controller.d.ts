import { CatalogService } from './catalog.service';
export declare class CatalogController {
    private readonly catalogService;
    constructor(catalogService: CatalogService);
    findGroups(featured?: string, tree?: string): Promise<{} | null>;
    findGroup(slug: string): Promise<{} | null>;
    findServices(group?: string): Promise<{} | null>;
    findService(slug: string): Promise<{} | null>;
    findServiceProviders(slug: string): Promise<{
        id: string;
        price: number;
        headline: string | null;
        experienceYears: number;
        hoursWorked: number;
        includes: string | null;
        excludes: string | null;
        coverageNote: string | null;
        partner: {
            userId: string;
            fullName: string;
            city: string | null;
            districts: string[];
            skills: string[];
            acceptingJobs: boolean;
            workModes: ("onsite" | "online")[];
            responseMinutes: number;
            bio: string | null;
            headline: string | null;
            ratingAvg: number;
            ratingCount: number;
            isVerified: boolean;
            phoneVerified: boolean;
            bankVerified: boolean;
            level: number;
            avatarUrl: string | null;
            completedJobs: number;
            reputation: import("../../common/reputation.service").PartnerReputationSnapshot | null;
        };
    }[]>;
}
