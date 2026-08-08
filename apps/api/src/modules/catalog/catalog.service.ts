import { Injectable, NotFoundException } from '@nestjs/common';
import {
  parseDistricts,
  parseSkills,
  parseWorkModes,
} from '../../common/partner-profile-fields';
import { minutesToWorkHours } from '../../common/partner-work-hours';
import { ReputationService } from '../../common/reputation.service';
import { PrismaService } from '../../database/prisma/prisma.service';

type CacheEntry = { at: number; data: unknown };

/** TTL in-memory — giảm hit DB khi nhiều client đọc catalog. */
const CATALOG_MEMORY_TTL_MS = 60_000;

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reputation: ReputationService,
  ) {}

  private readonly memoryCache = new Map<string, CacheEntry>();

  private readonly onlineServiceWhere = {
    isActive: true,
    supportsOnline: true,
  } as const;

  private readonly hasOnlineServicesWhere = {
    categories: {
      some: {
        services: { some: { isActive: true, supportsOnline: true } },
      },
    },
  } as const;

  /** Xóa cache khi admin tạo/sửa dịch vụ hoặc nhóm. */
  invalidateCache() {
    this.memoryCache.clear();
  }

  private getCached<T>(key: string): T | undefined {
    const hit = this.memoryCache.get(key);
    if (!hit) return undefined;
    if (Date.now() - hit.at > CATALOG_MEMORY_TTL_MS) {
      this.memoryCache.delete(key);
      return undefined;
    }
    return hit.data as T;
  }

  private setCached<T>(key: string, data: T): T {
    this.memoryCache.set(key, { at: Date.now(), data });
    return data;
  }

  async findGroups(featuredOnly = false, withTree = false) {
    const key = `groups:featured=${featuredOnly}:tree=${withTree}`;
    const cached = this.getCached<unknown>(key);
    if (cached !== undefined) return cached;

    const where = {
      ...(featuredOnly ? { isFeatured: true } : {}),
      ...this.hasOnlineServicesWhere,
    };

    if (!withTree) {
      const rows = await this.prisma.serviceGroup.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { categories: true } } },
      });
      return this.setCached(key, rows);
    }

    const groups = await this.prisma.serviceGroup.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { categories: true } },
        categories: {
          orderBy: { name: 'asc' },
          include: {
            services: {
              where: this.onlineServiceWhere,
              orderBy: { name: 'asc' },
              select: {
                id: true,
                slug: true,
                name: true,
                basePrice: true,
                priceMin: true,
                priceMax: true,
                unit: true,
                durationMin: true,
                supportsOnline: true,
              },
            },
          },
        },
      },
    });

    const shaped = groups.map((group) => ({
      ...group,
      categories: group.categories.filter(
        (category) => category.services.length > 0,
      ),
    }));
    return this.setCached(key, shaped);
  }

  async findGroupBySlug(slug: string) {
    const key = `group:${slug}`;
    const cached = this.getCached<unknown>(key);
    if (cached !== undefined) return cached;

    const group = await this.prisma.serviceGroup.findUnique({
      where: { slug },
      include: {
        categories: {
          include: {
            services: {
              where: this.onlineServiceWhere,
              orderBy: { name: 'asc' },
              include: {
                _count: {
                  select: {
                    partners: {
                      where: {
                        isActive: true,
                        partnerProfile: { acceptingJobs: true },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    const categories = (group?.categories ?? []).filter(
      (category) => category.services.length > 0,
    );

    if (!group || categories.length === 0) {
      throw new NotFoundException('Không tìm thấy nhóm dịch vụ');
    }

    return this.setCached(key, { ...group, categories });
  }

  async findServices(groupSlug?: string) {
    const key = `services:group=${groupSlug ?? ''}`;
    const cached = this.getCached<unknown>(key);
    if (cached !== undefined) return cached;

    const rows = await this.prisma.service.findMany({
      where: {
        ...this.onlineServiceWhere,
        ...(groupSlug
          ? { category: { group: { slug: groupSlug } } }
          : undefined),
      },
      include: {
        category: {
          include: { group: true },
        },
        _count: {
          select: {
            partners: {
              where: {
                isActive: true,
                partnerProfile: { acceptingJobs: true },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return this.setCached(key, rows);
  }

  async findServiceBySlug(slug: string) {
    const key = `service:${slug}`;
    const cached = this.getCached<unknown>(key);
    if (cached !== undefined) return cached;

    const service = await this.prisma.service.findUnique({
      where: { slug },
      include: {
        category: {
          include: { group: true },
        },
        _count: {
          select: {
            partners: {
              where: {
                isActive: true,
                partnerProfile: { acceptingJobs: true },
              },
            },
          },
        },
      },
    });

    if (!service || !service.isActive || !service.supportsOnline) {
      throw new NotFoundException('Không tìm thấy dịch vụ');
    }

    return this.setCached(key, service);
  }

  async findServiceProviders(slug: string) {
    const service = await this.prisma.service.findUnique({
      where: { slug },
      select: { id: true, basePrice: true, isActive: true, supportsOnline: true },
    });

    if (!service || !service.isActive || !service.supportsOnline) {
      throw new NotFoundException('Không tìm thấy dịch vụ');
    }

    const offerings = await this.prisma.partnerService.findMany({
      where: {
        serviceId: service.id,
        isActive: true,
        // Chỉ người đã gắn nghề này (PartnerService) và đang nhận việc.
        partnerProfile: { acceptingJobs: true },
      },
      include: {
        partnerProfile: {
          include: {
            user: {
              select: { id: true, fullName: true },
            },
          },
        },
      },
    });

    const partnerUserIds = offerings.map((o) => o.partnerProfile.user.id);
    const [completedCounts, completedForService, reputationByPartner] = await Promise.all([
      Promise.all(
        partnerUserIds.map((partnerId) =>
          this.prisma.booking.count({
            where: { partnerId, status: 'COMPLETED' },
          }),
        ),
      ),
      this.prisma.booking.findMany({
        where: {
          partnerId: { in: partnerUserIds },
          serviceId: service.id,
          status: 'COMPLETED',
        },
        select: {
          partnerId: true,
          service: { select: { durationMin: true } },
        },
      }),
      this.reputation.getSnapshotsBatch(partnerUserIds),
    ]);

    const minutesByPartner = new Map<string, number>();
    for (const row of completedForService) {
      if (!row.partnerId) continue;
      const add = row.service.durationMin > 0 ? row.service.durationMin : 60;
      minutesByPartner.set(
        row.partnerId,
        (minutesByPartner.get(row.partnerId) ?? 0) + add,
      );
    }

    const withStats = offerings.map((offering, index) => {
      const partnerUserId = offering.partnerProfile.user.id;
      const mins = minutesByPartner.get(partnerUserId) ?? 0;
      return {
        id: offering.id,
        price: offering.price ?? service.basePrice,
        priceMin:
          offering.priceMin && offering.priceMin > 0
            ? offering.priceMin
            : offering.price ?? service.basePrice,
        priceMax:
          offering.priceMax && offering.priceMax > 0
            ? Math.max(
                offering.priceMax,
                offering.priceMin && offering.priceMin > 0
                  ? offering.priceMin
                  : offering.price ?? service.basePrice,
              )
            : offering.price ?? service.basePrice,
        headline: offering.headline,
        experienceYears: offering.experienceYears,
        hoursWorked: minutesToWorkHours(mins),
        includes: offering.includes,
        excludes: offering.excludes,
        coverageNote: offering.coverageNote,
        partner: {
          userId: partnerUserId,
          fullName: offering.partnerProfile.user.fullName,
          city: offering.partnerProfile.city,
          districts: parseDistricts(offering.partnerProfile.districts),
          skills: parseSkills(offering.partnerProfile.skillsJson),
          acceptingJobs: offering.partnerProfile.acceptingJobs,
          workModes: parseWorkModes(offering.partnerProfile.workModes),
          responseMinutes: offering.partnerProfile.responseMinutes,
          bio: offering.partnerProfile.bio,
          headline: offering.partnerProfile.headline,
          ratingAvg: offering.partnerProfile.ratingAvg,
          ratingCount: offering.partnerProfile.ratingCount,
          isVerified: offering.partnerProfile.isVerified,
          phoneVerified: offering.partnerProfile.phoneVerified,
          bankVerified: offering.partnerProfile.bankVerified,
          level: offering.partnerProfile.level,
          avatarUrl: offering.partnerProfile.avatarUrl,
          completedJobs: completedCounts[index] ?? 0,
          reputation: reputationByPartner.get(partnerUserId) ?? null,
        },
      };
    });

    return withStats.sort((a, b) => {
      if (b.partner.level !== a.partner.level) {
        return b.partner.level - a.partner.level;
      }
      if (b.partner.isVerified !== a.partner.isVerified) {
        return Number(b.partner.isVerified) - Number(a.partner.isVerified);
      }
      return b.partner.ratingAvg - a.partner.ratingAvg;
    });
  }
}
