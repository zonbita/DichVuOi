import { Injectable, NotFoundException } from '@nestjs/common';
import { PartnerServicePostStatus } from '@prisma/client';
import { phraseMatch } from '../../common/text-match';
import { hoursWorkedByServiceIds } from '../../common/partner-work-hours';
import { ReputationService } from '../../common/reputation.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  servicePostServiceSelect,
  userPublicSelect,
  isPartnerOnline,
  shapePublic,
  offeringPriceRange,
  shapeServicePost,
} from './partners.shared';
import { PartnerRankingService } from './partner-ranking.service';

@Injectable()
export class PartnerPublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reputation: ReputationService,
    private readonly ranking: PartnerRankingService,
  ) {}

  /**
   * Tìm người làm công khai theo tên hoặc nghề (cụm từ, không dấu).
   * Không trả SĐT/email.
   */
  async searchPublic(q: string, limit = 24) {
    const keyword = q.trim();
    if (!keyword) return [];

    const take = Math.min(Math.max(limit, 1), 48);
    const profiles = await this.prisma.partnerProfile.findMany({
      where: { acceptingJobs: true },
      select: {
        userId: true,
        headline: true,
        bio: true,
        skillsJson: true,
        ratingAvg: true,
        level: true,
        isVerified: true,
        phoneVerified: true,
        bankVerified: true,
        avatarUrl: true,
        user: { select: { id: true, fullName: true } },
        offerings: {
          where: { isActive: true },
          select: {
            price: true,
            headline: true,
            service: {
              select: {
                slug: true,
                name: true,
                unit: true,
                basePrice: true,
              },
            },
          },
          take: 40,
        },
      },
      orderBy: [{ ratingAvg: 'desc' }, { level: 'desc' }],
      take: 300,
    });

    const hits: Array<{
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
      matchReason: 'name' | 'profession';
    }> = [];

    for (const profile of profiles) {
      if (hits.length >= take) break;

      const nameHit = phraseMatch(profile.user.fullName, keyword);
      const professionHay = [
        profile.headline ?? '',
        profile.bio ?? '',
        profile.skillsJson ?? '',
        ...profile.offerings.map(
          (o) => `${o.service.name} ${o.headline ?? ''}`,
        ),
      ].join(' ');
      const professionHit = phraseMatch(professionHay, keyword);
      if (!nameHit && !professionHit) continue;

      const matchedOffering =
        profile.offerings.find((o) =>
          phraseMatch(`${o.service.name} ${o.headline ?? ''}`, keyword),
        ) ??
        profile.offerings[0] ??
        null;

      hits.push({
        userId: profile.userId,
        fullName: profile.user.fullName,
        avatarUrl: profile.avatarUrl,
        headline: profile.headline,
        ratingAvg: profile.ratingAvg,
        level: profile.level,
        isVerified: profile.isVerified,
        phoneVerified: profile.phoneVerified,
        bankVerified: profile.bankVerified,
        serviceSlug: matchedOffering?.service.slug ?? null,
        serviceName: matchedOffering?.service.name ?? null,
        price: matchedOffering
          ? (matchedOffering.price ?? matchedOffering.service.basePrice)
          : null,
        unit: matchedOffering?.service.unit ?? null,
        matchReason: nameHit ? 'name' : 'profession',
      });
    }

    return hits;
  }

  async getPublicProfile(userId: string) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        headline: true,
        bio: true,
        city: true,
        districts: true,
        skillsJson: true,
        acceptingJobs: true,
        workModes: true,
        responseMinutes: true,
        ratingAvg: true,
        ratingCount: true,
        level: true,
        isVerified: true,
        phoneVerified: true,
        bankVerified: true,
        avatarUrl: true,
        galleryJson: true,
        lastOnlineAt: true,
        user: { select: userPublicSelect },
        offerings: {
          where: { isActive: true },
          take: 40,
          select: {
            id: true,
            serviceId: true,
            price: true,
            priceMin: true,
            priceMax: true,
            headline: true,
            experienceYears: true,
            includes: true,
            excludes: true,
            coverageNote: true,
            service: {
              select: {
                id: true,
                slug: true,
                name: true,
                unit: true,
                basePrice: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    group: { select: { id: true, name: true, slug: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!profile) throw new NotFoundException('Không tìm thấy hồ sơ người làm');

    const offeringServiceIds = profile.offerings.map((o) => o.serviceId);

    const [
      completedJobs,
      hireSuccessCount,
      reviews,
      hoursByServiceId,
      reputation,
      servicePosts,
      onTimeStats,
    ] = await Promise.all([
      this.prisma.booking.count({
        where: { partnerId: userId, status: 'COMPLETED' },
      }),
      this.prisma.booking.count({
        where: { userId, status: 'COMPLETED' },
      }),
      this.prisma.review.findMany({
        where: { toUserId: userId },
        orderBy: { createdAt: 'desc' },
        take: 24,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          fromUser: { select: { id: true, fullName: true } },
          booking: {
            select: {
              service: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  category: {
                    select: {
                      group: { select: { slug: true, name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      hoursWorkedByServiceIds(this.prisma, userId, offeringServiceIds),
      this.reputation.getSnapshot(userId),
      this.prisma.partnerServicePost.findMany({
        where: {
          partnerProfileId: profile.id,
          status: PartnerServicePostStatus.APPROVED,
        },
        orderBy: { updatedAt: 'desc' },
        take: 40,
        select: {
          id: true,
          title: true,
          body: true,
          coverUrl: true,
          imagesJson: true,
          serviceId: true,
          createdAt: true,
          updatedAt: true,
          service: { select: servicePostServiceSelect },
        },
      }),
      this.ranking.computeOnTimeStats(userId),
    ]);

    const shaped = shapePublic(
      profile,
      completedJobs,
      reviews,
      hoursByServiceId,
      hireSuccessCount,
    );
    const priceByService = new Map(
      profile.offerings.map(
        (o) => [o.serviceId, offeringPriceRange(o)] as const,
      ),
    );

    return {
      ...shaped,
      onTimeRate: onTimeStats.onTimeRate,
      onTimeSampleSize: onTimeStats.sampleSize,
      reputation,
      servicePosts: servicePosts.map((post) =>
        shapeServicePost(post, priceByService.get(post.serviceId) ?? null),
      ),
    };
  }

  /** Danh sách bài đăng đã duyệt — trang chủ / khám phá. */
  async listApprovedServicePosts(page = 1, pageSize = 12) {
    const take = Math.min(24, Math.max(1, pageSize));
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * take;
    const where = { status: PartnerServicePostStatus.APPROVED };

    const [total, posts] = await Promise.all([
      this.prisma.partnerServicePost.count({ where }),
      this.prisma.partnerServicePost.findMany({
        where,
        orderBy: [{ reviewedAt: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take,
        select: {
          id: true,
          title: true,
          body: true,
          coverUrl: true,
          imagesJson: true,
          serviceId: true,
          createdAt: true,
          updatedAt: true,
          service: { select: servicePostServiceSelect },
          partnerProfile: {
            select: {
              userId: true,
              headline: true,
              city: true,
              avatarUrl: true,
              level: true,
              isVerified: true,
              ratingAvg: true,
              ratingCount: true,
              lastOnlineAt: true,
              acceptingJobs: true,
              user: { select: { fullName: true } },
              offerings: {
                where: { isActive: true },
                select: {
                  serviceId: true,
                  price: true,
                  priceMin: true,
                  priceMax: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const reputations = await this.reputation.getSnapshotsBatch(
      posts.map((post) => post.partnerProfile.userId),
    );
    const rankByUserId = await this.ranking.getPartnerRankScoresBatch(
      posts.map((post) => post.partnerProfile.userId),
    );

    return {
      items: posts.map((post) => {
        const offering = post.partnerProfile.offerings.find(
          (o) => o.serviceId === post.serviceId,
        );
        const shaped = shapeServicePost(post, offeringPriceRange(offering));
        const rankInfo = rankByUserId.get(post.partnerProfile.userId);
        return {
          ...shaped,
          seller: {
            userId: post.partnerProfile.userId,
            fullName: post.partnerProfile.user.fullName,
            headline: post.partnerProfile.headline,
            city: post.partnerProfile.city,
            avatarUrl: post.partnerProfile.avatarUrl,
            level: post.partnerProfile.level,
            isVerified: post.partnerProfile.isVerified,
            ratingAvg: post.partnerProfile.ratingAvg,
            ratingCount: post.partnerProfile.ratingCount,
            isOnline: isPartnerOnline(post.partnerProfile.lastOnlineAt),
            acceptingJobs: post.partnerProfile.acceptingJobs,
            reputation: reputations.get(post.partnerProfile.userId) ?? null,
            completedJobs: rankInfo?.completedJobs ?? 0,
            hireSuccessCount: rankInfo?.hireSuccessCount ?? 0,
            rank: rankInfo?.rank ?? 1,
          },
        };
      }),
      total,
      page: safePage,
      pageSize: take,
      pageCount: Math.max(1, Math.ceil(total / take)),
    };
  }

  /** Chi tiết 1 bài đăng đã duyệt — trang gig công khai. */
  async getPublicServicePost(userId: string, postId: string) {
    // Profile+post chung 1 query; rank chạy song song (không phụ thuộc post).
    const [post, rankInfo] = await Promise.all([
      this.prisma.partnerServicePost.findFirst({
        where: {
          id: postId,
          status: PartnerServicePostStatus.APPROVED,
          partnerProfile: { userId },
        },
        select: {
          id: true,
          title: true,
          body: true,
          coverUrl: true,
          imagesJson: true,
          serviceId: true,
          createdAt: true,
          updatedAt: true,
          service: { select: servicePostServiceSelect },
          partnerProfile: {
            select: {
              id: true,
              userId: true,
              headline: true,
              city: true,
              responseMinutes: true,
              ratingAvg: true,
              ratingCount: true,
              level: true,
              isVerified: true,
              phoneVerified: true,
              bankVerified: true,
              avatarUrl: true,
              acceptingJobs: true,
              user: { select: { id: true, fullName: true } },
            },
          },
        },
      }),
      this.ranking.getPartnerRankScore(userId),
    ]);
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài đăng');
    }
    const profile = post.partnerProfile;

    const [offering, reviews] = await Promise.all([
      this.prisma.partnerService.findFirst({
        where: {
          partnerProfileId: profile.id,
          serviceId: post.serviceId,
          isActive: true,
        },
        select: {
          id: true,
          price: true,
          priceMin: true,
          priceMax: true,
          headline: true,
          experienceYears: true,
          includes: true,
          excludes: true,
          coverageNote: true,
        },
      }),
      this.prisma.review.findMany({
        where: {
          toUserId: userId,
          booking: { serviceId: post.serviceId },
        },
        orderBy: { createdAt: 'desc' },
        take: 24,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          fromUser: { select: { id: true, fullName: true } },
        },
      }),
    ]);

    const ratingCount = reviews.length;
    const ratingAvg =
      ratingCount > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount) * 10,
          ) / 10
        : 0;

    const offeringRange = offeringPriceRange(offering);

    return {
      post: shapeServicePost(post, offeringRange),
      seller: {
        userId: profile.userId,
        fullName: profile.user.fullName,
        headline: profile.headline,
        city: profile.city,
        avatarUrl: profile.avatarUrl,
        level: profile.level,
        isVerified: profile.isVerified,
        phoneVerified: profile.phoneVerified,
        bankVerified: profile.bankVerified,
        ratingAvg: profile.ratingAvg,
        ratingCount: profile.ratingCount,
        responseMinutes: profile.responseMinutes,
        acceptingJobs: profile.acceptingJobs,
        completedJobs: rankInfo.completedJobs,
        hireSuccessCount: rankInfo.hireSuccessCount,
        rank: rankInfo.rank,
      },
      offering: offering
        ? {
            id: offering.id,
            price: offeringRange.price,
            priceMin: offeringRange.priceMin,
            priceMax: offeringRange.priceMax,
            headline: offering.headline,
            experienceYears: offering.experienceYears,
            includes: offering.includes,
            excludes: offering.excludes,
            coverageNote: offering.coverageNote,
            ratingAvg,
            ratingCount,
            unit: post.service.unit,
          }
        : null,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        fromName: r.fromUser.fullName,
      })),
    };
  }
}
