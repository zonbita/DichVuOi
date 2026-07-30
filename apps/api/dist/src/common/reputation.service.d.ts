import { PrismaService } from '../database/prisma/prisma.service';
export type PartnerReputationSnapshot = {
    currentPoints: number;
    startingPoints: number;
    percent: number;
    periodIndex: number;
    periodStart: string;
    periodEnd: string;
    deductedThisPeriod: number;
};
export declare class ReputationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getPartnerAnchorDate;
    ensureCurrentPeriod(partnerUserId: string): Promise<{
        period: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            partnerUserId: string;
            periodIndex: number;
            startingPoints: number;
            currentPoints: number;
        };
        bounds: {
            start: Date;
            end: Date;
        };
        anchorDate: Date;
    }>;
    getSnapshot(partnerUserId: string): Promise<PartnerReputationSnapshot>;
    applyDeduction(partnerUserId: string, deductionPoints: number, reason: string, complaintId?: string): Promise<PartnerReputationSnapshot>;
    getSnapshotsBatch(partnerUserIds: string[]): Promise<Map<string, PartnerReputationSnapshot>>;
}
