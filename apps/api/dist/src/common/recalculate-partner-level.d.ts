import type { PrismaClient } from '@prisma/client';
import { type PartnerLevelBreakdown } from './partner-level';
export declare function recalculatePartnerLevel(prisma: Pick<PrismaClient, 'partnerProfile' | 'booking' | 'partnerService'>, partnerUserId: string): Promise<PartnerLevelBreakdown | null>;
