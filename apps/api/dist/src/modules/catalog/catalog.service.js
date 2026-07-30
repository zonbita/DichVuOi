"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const partner_profile_fields_1 = require("../../common/partner-profile-fields");
const partner_work_hours_1 = require("../../common/partner-work-hours");
const reputation_service_1 = require("../../common/reputation.service");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const CATALOG_MEMORY_TTL_MS = 60_000;
let CatalogService = class CatalogService {
    prisma;
    reputation;
    constructor(prisma, reputation) {
        this.prisma = prisma;
        this.reputation = reputation;
    }
    memoryCache = new Map();
    onlineServiceWhere = {
        isActive: true,
        supportsOnline: true,
    };
    hasOnlineServicesWhere = {
        categories: {
            some: {
                services: { some: { isActive: true, supportsOnline: true } },
            },
        },
    };
    invalidateCache() {
        this.memoryCache.clear();
    }
    getCached(key) {
        const hit = this.memoryCache.get(key);
        if (!hit)
            return undefined;
        if (Date.now() - hit.at > CATALOG_MEMORY_TTL_MS) {
            this.memoryCache.delete(key);
            return undefined;
        }
        return hit.data;
    }
    setCached(key, data) {
        this.memoryCache.set(key, { at: Date.now(), data });
        return data;
    }
    async findGroups(featuredOnly = false, withTree = false) {
        const key = `groups:featured=${featuredOnly}:tree=${withTree}`;
        const cached = this.getCached(key);
        if (cached !== undefined)
            return cached;
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
            categories: group.categories.filter((category) => category.services.length > 0),
        }));
        return this.setCached(key, shaped);
    }
    async findGroupBySlug(slug) {
        const key = `group:${slug}`;
        const cached = this.getCached(key);
        if (cached !== undefined)
            return cached;
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
        const categories = (group?.categories ?? []).filter((category) => category.services.length > 0);
        if (!group || categories.length === 0) {
            throw new common_1.NotFoundException('Không tìm thấy nhóm dịch vụ');
        }
        return this.setCached(key, { ...group, categories });
    }
    async findServices(groupSlug) {
        const key = `services:group=${groupSlug ?? ''}`;
        const cached = this.getCached(key);
        if (cached !== undefined)
            return cached;
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
    async findServiceBySlug(slug) {
        const key = `service:${slug}`;
        const cached = this.getCached(key);
        if (cached !== undefined)
            return cached;
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
            throw new common_1.NotFoundException('Không tìm thấy dịch vụ');
        }
        return this.setCached(key, service);
    }
    async findServiceProviders(slug) {
        const service = await this.prisma.service.findUnique({
            where: { slug },
            select: { id: true, basePrice: true, isActive: true, supportsOnline: true },
        });
        if (!service || !service.isActive || !service.supportsOnline) {
            throw new common_1.NotFoundException('Không tìm thấy dịch vụ');
        }
        const offerings = await this.prisma.partnerService.findMany({
            where: {
                serviceId: service.id,
                isActive: true,
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
            Promise.all(partnerUserIds.map((partnerId) => this.prisma.booking.count({
                where: { partnerId, status: 'COMPLETED' },
            }))),
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
        const minutesByPartner = new Map();
        for (const row of completedForService) {
            if (!row.partnerId)
                continue;
            const add = row.service.durationMin > 0 ? row.service.durationMin : 60;
            minutesByPartner.set(row.partnerId, (minutesByPartner.get(row.partnerId) ?? 0) + add);
        }
        const withStats = offerings.map((offering, index) => {
            const partnerUserId = offering.partnerProfile.user.id;
            const mins = minutesByPartner.get(partnerUserId) ?? 0;
            return {
                id: offering.id,
                price: offering.price ?? service.basePrice,
                headline: offering.headline,
                experienceYears: offering.experienceYears,
                hoursWorked: (0, partner_work_hours_1.minutesToWorkHours)(mins),
                includes: offering.includes,
                excludes: offering.excludes,
                coverageNote: offering.coverageNote,
                partner: {
                    userId: partnerUserId,
                    fullName: offering.partnerProfile.user.fullName,
                    city: offering.partnerProfile.city,
                    districts: (0, partner_profile_fields_1.parseDistricts)(offering.partnerProfile.districts),
                    skills: (0, partner_profile_fields_1.parseSkills)(offering.partnerProfile.skillsJson),
                    acceptingJobs: offering.partnerProfile.acceptingJobs,
                    workModes: (0, partner_profile_fields_1.parseWorkModes)(offering.partnerProfile.workModes),
                    responseMinutes: offering.partnerProfile.responseMinutes,
                    bio: offering.partnerProfile.bio,
                    headline: offering.partnerProfile.headline,
                    ratingAvg: offering.partnerProfile.ratingAvg,
                    ratingCount: offering.partnerProfile.ratingCount,
                    isVerified: offering.partnerProfile.isVerified,
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
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        reputation_service_1.ReputationService])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map