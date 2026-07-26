import type { PrismaClient } from '@prisma/client';
import {
  computePartnerLevel,
  type PartnerLevelBreakdown,
} from './partner-level';
import { hoursWorkedByServiceIds } from './partner-work-hours';

/**
 * Tính lại level từ dữ liệu thật trên sàn và ghi vào PartnerProfile.level.
 */
export async function recalculatePartnerLevel(
  prisma: Pick<
    PrismaClient,
    'partnerProfile' | 'booking' | 'partnerService'
  >,
  partnerUserId: string,
): Promise<PartnerLevelBreakdown | null> {
  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: partnerUserId },
    select: {
      id: true,
      ratingAvg: true,
      ratingCount: true,
      isVerified: true,
    },
  });
  if (!profile) return null;

  const [completedJobs, activeOfferings, hoursByService] = await Promise.all([
    prisma.booking.count({
      where: { partnerId: partnerUserId, status: 'COMPLETED' },
    }),
    prisma.partnerService.count({
      where: { partnerProfileId: profile.id, isActive: true },
    }),
    hoursWorkedByServiceIds(prisma, partnerUserId),
  ]);

  const breakdown = computePartnerLevel({
    hoursByService,
    completedJobs,
    ratingAvg: profile.ratingAvg,
    ratingCount: profile.ratingCount,
    isVerified: profile.isVerified,
    activeOfferings,
  });

  await prisma.partnerProfile.update({
    where: { userId: partnerUserId },
    data: { level: breakdown.level },
  });

  return breakdown;
}
