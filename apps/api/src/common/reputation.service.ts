import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import {
  getReputationPeriodBounds,
  getReputationPeriodIndex,
  REPUTATION_STARTING_POINTS,
  REPUTATION_SUSPEND_THRESHOLD,
  reputationPercent,
} from './partner-reputation';

export type PartnerReputationSnapshot = {
  currentPoints: number;
  startingPoints: number;
  percent: number;
  periodIndex: number;
  periodStart: string;
  periodEnd: string;
  deductedThisPeriod: number;
};

@Injectable()
export class ReputationService {
  constructor(private readonly prisma: PrismaService) {}

  private async getPartnerAnchorDate(partnerUserId: string): Promise<Date> {
    const user = await this.prisma.user.findUnique({
      where: { id: partnerUserId },
      select: { createdAt: true, partnerProfile: { select: { createdAt: true } } },
    });
    if (!user?.partnerProfile) {
      throw new NotFoundException('Không tìm thấy hồ sơ người làm');
    }
    return user.partnerProfile.createdAt ?? user.createdAt;
  }

  async ensureCurrentPeriod(partnerUserId: string) {
    const anchorDate = await this.getPartnerAnchorDate(partnerUserId);
    const periodIndex = getReputationPeriodIndex(anchorDate);
    const bounds = getReputationPeriodBounds(anchorDate, periodIndex);

    const period = await this.prisma.partnerReputationPeriod.upsert({
      where: {
        partnerUserId_periodIndex: { partnerUserId, periodIndex },
      },
      create: {
        partnerUserId,
        periodIndex,
        startingPoints: REPUTATION_STARTING_POINTS,
        currentPoints: REPUTATION_STARTING_POINTS,
      },
      update: {},
    });

    return { period, bounds, anchorDate };
  }

  async getSnapshot(partnerUserId: string): Promise<PartnerReputationSnapshot> {
    const { period, bounds } = await this.ensureCurrentPeriod(partnerUserId);
    const deductedThisPeriod = Math.max(0, period.startingPoints - period.currentPoints);

    return {
      currentPoints: period.currentPoints,
      startingPoints: period.startingPoints,
      percent: reputationPercent(period.currentPoints, period.startingPoints),
      periodIndex: period.periodIndex,
      periodStart: bounds.start.toISOString(),
      periodEnd: bounds.end.toISOString(),
      deductedThisPeriod,
    };
  }

  async applyDeduction(
    partnerUserId: string,
    deductionPoints: number,
    reason: string,
    complaintId?: string,
  ) {
    const { period } = await this.ensureCurrentPeriod(partnerUserId);
    const nextPoints = Math.max(0, period.currentPoints - deductionPoints);

    await this.prisma.$transaction([
      this.prisma.partnerReputationPeriod.update({
        where: { id: period.id },
        data: { currentPoints: nextPoints },
      }),
      this.prisma.reputationLedgerEntry.create({
        data: {
          periodId: period.id,
          delta: -deductionPoints,
          reason,
          complaintId,
        },
      }),
    ]);

    if (nextPoints < REPUTATION_SUSPEND_THRESHOLD) {
      await this.prisma.partnerProfile.updateMany({
        where: { userId: partnerUserId, acceptingJobs: true },
        data: { acceptingJobs: false },
      });
    }

    return this.getSnapshot(partnerUserId);
  }

  /** Batch snapshot cho lưới người làm — tránh N+1. */
  async getSnapshotsBatch(
    partnerUserIds: string[],
  ): Promise<Map<string, PartnerReputationSnapshot>> {
    const result = new Map<string, PartnerReputationSnapshot>();
    const uniqueIds = [...new Set(partnerUserIds)];
    if (!uniqueIds.length) return result;

    const profiles = await this.prisma.partnerProfile.findMany({
      where: { userId: { in: uniqueIds } },
      select: {
        userId: true,
        createdAt: true,
        user: { select: { createdAt: true } },
      },
    });

    const keyed = profiles.map((profile) => {
      const anchorDate = profile.createdAt ?? profile.user.createdAt;
      const periodIndex = getReputationPeriodIndex(anchorDate);
      const bounds = getReputationPeriodBounds(anchorDate, periodIndex);
      return { partnerUserId: profile.userId, periodIndex, bounds };
    });

    if (!keyed.length) return result;

    const existing = await this.prisma.partnerReputationPeriod.findMany({
      where: {
        OR: keyed.map((k) => ({
          partnerUserId: k.partnerUserId,
          periodIndex: k.periodIndex,
        })),
      },
    });

    const periodByKey = new Map(
      existing.map((p) => [`${p.partnerUserId}:${p.periodIndex}`, p]),
    );

    const missing = keyed.filter(
      (k) => !periodByKey.has(`${k.partnerUserId}:${k.periodIndex}`),
    );
    for (const k of missing) {
      const period = await this.prisma.partnerReputationPeriod.upsert({
        where: {
          partnerUserId_periodIndex: {
            partnerUserId: k.partnerUserId,
            periodIndex: k.periodIndex,
          },
        },
        create: {
          partnerUserId: k.partnerUserId,
          periodIndex: k.periodIndex,
          startingPoints: REPUTATION_STARTING_POINTS,
          currentPoints: REPUTATION_STARTING_POINTS,
        },
        update: {},
      });
      periodByKey.set(`${k.partnerUserId}:${k.periodIndex}`, period);
    }

    for (const k of keyed) {
      const period = periodByKey.get(`${k.partnerUserId}:${k.periodIndex}`);
      if (!period) continue;
      const deductedThisPeriod = Math.max(0, period.startingPoints - period.currentPoints);
      result.set(k.partnerUserId, {
        currentPoints: period.currentPoints,
        startingPoints: period.startingPoints,
        percent: reputationPercent(period.currentPoints, period.startingPoints),
        periodIndex: period.periodIndex,
        periodStart: k.bounds.start.toISOString(),
        periodEnd: k.bounds.end.toISOString(),
        deductedThisPeriod,
      });
    }

    return result;
  }
}
