import { ReputationService } from '../../common/reputation.service';
import { PrismaService } from '../../database/prisma/prisma.service';
export declare class CatalogService {
    private readonly prisma;
    private readonly reputation;
    constructor(prisma: PrismaService, reputation: ReputationService);
    private readonly memoryCache;
    private readonly onlineServiceWhere;
    private readonly hasOnlineServicesWhere;
    invalidateCache(): void;
    private getCached;
    private setCached;
    findGroups(featuredOnly?: boolean, withTree?: boolean): Promise<{} | null>;
    findGroupBySlug(slug: string): Promise<{} | null>;
    findServices(groupSlug?: string): Promise<{} | null>;
    findServiceBySlug(slug: string): Promise<{} | null>;
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
