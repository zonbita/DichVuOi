import type { PrismaClient } from '@prisma/client';
import {
  computePartnerLevel,
  type PartnerLevelBreakdown,
} from './partner-level';

/**
 * Tính lại level từ giờ online + đơn/★… và ghi vào PartnerProfile.level.
 */
export async function recalculatePartnerLevel(
  prisma: Pick<PrismaClient, 'partnerProfile' | 'booking' | 'partnerService'>,
  partnerUserId: string,
): Promise<PartnerLevelBreakdown | null> {
  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: partnerUserId },
    select: {
      id: true,
      ratingAvg: true,
      ratingCount: true,
      isVerified: true,
      onlineSeconds: true,
    },
  });
  if (!profile) return null;

  const [completedJobs, activeOfferings] = await Promise.all([
    prisma.booking.count({
      where: { partnerId: partnerUserId, status: 'COMPLETED' },
    }),
    prisma.partnerService.count({
      where: { partnerProfileId: profile.id, isActive: true },
    }),
  ]);

  const breakdown = computePartnerLevel({
    onlineHours: profile.onlineSeconds / 3600,
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
