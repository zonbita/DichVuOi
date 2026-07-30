import type { PrismaClient } from '@prisma/client';
export declare function minutesToWorkHours(minutes: number): number;
export declare function hoursWorkedByServiceIds(prisma: Pick<PrismaClient, 'booking'>, partnerUserId: string, serviceIds?: string[]): Promise<Map<string, number>>;
