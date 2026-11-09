import { Injectable, NotFoundException } from '@nestjs/common';
import {
  computePartnerLevel,
  PARTNER_LEVEL_FORMULA,
} from '../../common/partner-level';
import { computePartnerRankScore } from '../../common/partner-rank';
import { PrismaService } from '../../database/prisma/prisma.service';
import { isPartnerOnline, maskReviewerName } from './partners.shared';

@Injectable()
export class PartnerRankingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Công thức + điểm chi tiết cấp hiện tại (cho dashboard đối tác). */
  async getLevelBreakdown(userId: string) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        level: true,
        ratingAvg: true,
        ratingCount: true,
        isVerified: true,
        onlineSeconds: true,
        lastOnlineAt: true,
        offerings: {
          where: { isActive: true },
          select: {
            serviceId: true,
            service: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
    if (!profile) throw new NotFoundException('Chưa có hồ sơ đối tác');

    const [completedJobs, hireSuccessCount, onTimeStats] = await Promise.all([
      this.prisma.booking.count({
        where: { partnerId: userId, status: 'COMPLETED' },
      }),
      this.prisma.booking.count({
        where: { userId, status: 'COMPLETED' },
      }),
      this.computeOnTimeStats(userId),
    ]);

    const breakdown = computePartnerLevel({
      onlineHours: profile.onlineSeconds / 3600,
      completedJobs,
      ratingAvg: profile.ratingAvg,
      ratingCount: profile.ratingCount,
      isVerified: profile.isVerified,
      activeOfferings: profile.offerings.length,
    });

    const rank = computePartnerRankScore(completedJobs, hireSuccessCount);

    return {
      storedLevel: profile.level,
      formula: PARTNER_LEVEL_FORMULA,
      ...breakdown,
      onTimeRate: onTimeStats.onTimeRate,
      onTimeSampleSize: onTimeStats.sampleSize,
      rank,
      hireSuccessCount,
      inputs: {
        completedJobs,
        hireSuccessCount,
        ratingAvg: profile.ratingAvg,
        ratingCount: profile.ratingCount,
        isVerified: profile.isVerified,
        activeOfferings: profile.offerings.length,
        onlineSeconds: profile.onlineSeconds,
        onlineHours: breakdown.onlineHours,
        lastOnlineAt: profile.lastOnlineAt,
        isOnline: isPartnerOnline(profile.lastOnlineAt),
      },
    };
  }

  /** Rank 1–1000 = đơn hoàn thành (partner) + đơn thuê thành công (customer). */
  async getPartnerRankScore(userId: string) {
    const [completedJobs, hireSuccessCount] = await Promise.all([
      this.prisma.booking.count({
        where: { partnerId: userId, status: 'COMPLETED' },
      }),
      this.prisma.booking.count({
        where: { userId, status: 'COMPLETED' },
      }),
    ]);
    return {
      completedJobs,
      hireSuccessCount,
      rank: computePartnerRankScore(completedJobs, hireSuccessCount),
    };
  }

  async getPartnerRankScoresBatch(userIds: string[]) {
    const unique = [...new Set(userIds.filter(Boolean))];
    const result = new Map<
      string,
      { completedJobs: number; hireSuccessCount: number; rank: number }
    >();
    if (unique.length === 0) return result;

    const [asPartner, asCustomer] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ['partnerId'],
        where: { partnerId: { in: unique }, status: 'COMPLETED' },
        _count: { _all: true },
      }),
      this.prisma.booking.groupBy({
        by: ['userId'],
        where: { userId: { in: unique }, status: 'COMPLETED' },
        _count: { _all: true },
      }),
    ]);

    const partnerMap = new Map(
      asPartner
        .filter((row) => row.partnerId)
        .map((row) => [row.partnerId as string, row._count._all]),
    );
    const customerMap = new Map(
      asCustomer.map((row) => [row.userId, row._count._all]),
    );

    for (const id of unique) {
      const completedJobs = partnerMap.get(id) ?? 0;
      const hireSuccessCount = customerMap.get(id) ?? 0;
      result.set(id, {
        completedJobs,
        hireSuccessCount,
        rank: computePartnerRankScore(completedJobs, hireSuccessCount),
      });
    }
    return result;
  }

  /** % đúng hạn: hoàn tất (released/updated) ≤ lịch hẹn + thời lượng + 1h grace. */
  async computeOnTimeStats(partnerId: string) {
    const rows = await this.prisma.booking.findMany({
      where: { partnerId, status: 'COMPLETED' },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        scheduledAt: true,
        releasedAt: true,
        updatedAt: true,
        service: { select: { durationMin: true } },
      },
    });
    if (rows.length === 0) {
      return { onTimeRate: null as number | null, sampleSize: 0 };
    }
    const graceMs = 60 * 60 * 1000;
    let onTime = 0;
    for (const b of rows) {
      const durationMin =
        b.service.durationMin > 0 ? b.service.durationMin : 60;
      const deadline = b.scheduledAt.getTime() + durationMin * 60_000 + graceMs;
      const done = (b.releasedAt ?? b.updatedAt).getTime();
      if (done <= deadline) onTime += 1;
    }
    return {
      onTimeRate: Math.round((onTime / rows.length) * 100),
      sampleSize: rows.length,
    };
  }

  /** Review nổi bật trang chủ — ẩn tên đầy đủ. */
  async listFeaturedReviews(limit = 8) {
    const take = Math.min(Math.max(Math.floor(limit) || 8, 1), 16);
    const rows = await this.prisma.review.findMany({
      where: {
        rating: { gte: 4 },
        comment: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: take * 3,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        fromUser: { select: { fullName: true } },
        toUser: {
          select: {
            id: true,
            fullName: true,
            partnerProfile: {
              select: { avatarUrl: true, level: true, city: true },
            },
          },
        },
        booking: {
          select: {
            service: { select: { name: true, slug: true } },
          },
        },
      },
    });

    const items = rows
      .filter((r) => (r.comment ?? '').trim().length >= 12)
      .slice(0, take)
      .map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: (r.comment ?? '').trim().slice(0, 220),
        createdAt: r.createdAt.toISOString(),
        fromNameMasked: maskReviewerName(r.fromUser.fullName),
        serviceName: r.booking.service.name,
        serviceSlug: r.booking.service.slug,
        partner: {
          userId: r.toUser.id,
          fullName: r.toUser.fullName,
          avatarUrl: r.toUser.partnerProfile?.avatarUrl ?? null,
          level: r.toUser.partnerProfile?.level ?? 1,
          city: r.toUser.partnerProfile?.city ?? null,
        },
      }));

    return { items };
  }
}
