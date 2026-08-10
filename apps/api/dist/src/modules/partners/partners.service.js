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
exports.PartnersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const partner_profile_fields_1 = require("../../common/partner-profile-fields");
const text_match_1 = require("../../common/text-match");
const partner_work_hours_1 = require("../../common/partner-work-hours");
const partner_level_1 = require("../../common/partner-level");
const partner_rank_1 = require("../../common/partner-rank");
const recalculate_partner_level_1 = require("../../common/recalculate-partner-level");
const reputation_service_1 = require("../../common/reputation.service");
const security_env_1 = require("../../common/security-env");
const portrait_avatar_1 = require("../../common/portrait-avatar");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
const servicePostServiceSelect = {
    id: true,
    slug: true,
    name: true,
    unit: true,
    category: {
        select: {
            id: true,
            name: true,
            slug: true,
            group: { select: { id: true, name: true, slug: true } },
        },
    },
};
const BANK_VERIFY_TTL_MS = 15 * 60 * 1000;
const DEFAULT_VIETQR_BIN = process.env.VIETQR_BANK_ID ?? '970436';
const userPublicSelect = {
    id: true,
    fullName: true,
    role: true,
};
const userPrivateSelect = {
    id: true,
    email: true,
    fullName: true,
    phone: true,
    phoneVerified: true,
    role: true,
};
const ONLINE_WINDOW_MS = 2 * 60 * 1000;
function isPartnerOnline(lastOnlineAt) {
    if (!lastOnlineAt)
        return false;
    return Date.now() - lastOnlineAt.getTime() < ONLINE_WINDOW_MS;
}
function maskReviewerName(fullName) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0)
        return 'Khách';
    if (parts.length === 1)
        return `${parts[0].slice(0, 1)}***`;
    return `${parts[0]} ${parts[parts.length - 1].slice(0, 1)}.`;
}
const offeringInclude = {
    service: {
        select: {
            id: true,
            slug: true,
            name: true,
            unit: true,
            basePrice: true,
            isActive: true,
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
};
let PartnersService = class PartnersService {
    prisma;
    reputation;
    authService;
    constructor(prisma, reputation, authService) {
        this.prisma = prisma;
        this.reputation = reputation;
        this.authService = authService;
    }
    shapePublic(profile, completedJobs, reviews = [], hoursByServiceId = new Map(), hireSuccessCount = 0) {
        const reviewedBySlug = new Map();
        for (const r of reviews) {
            const slug = r.booking.service.slug;
            const entry = reviewedBySlug.get(slug) ?? {
                ratings: [],
                service: r.booking.service,
            };
            entry.ratings.push(r.rating);
            reviewedBySlug.set(slug, entry);
        }
        const offerings = (profile.offerings ?? [])
            .map((o) => {
            const stats = reviewedBySlug.get(o.service.slug);
            const ratingCount = stats?.ratings.length ?? 0;
            const ratingAvg = ratingCount > 0
                ? Math.round((stats.ratings.reduce((s, n) => s + n, 0) / ratingCount) * 10) / 10
                : 0;
            const priceMin = o.priceMin && o.priceMin > 0
                ? o.priceMin
                : o.price && o.price > 0
                    ? o.price
                    : o.service.basePrice;
            const priceMax = o.priceMax && o.priceMax > 0
                ? Math.max(o.priceMax, priceMin)
                : priceMin;
            return {
                id: o.id,
                price: priceMin,
                priceMin,
                priceMax,
                headline: o.headline,
                experienceYears: o.experienceYears,
                hoursWorked: hoursByServiceId.get(o.service.id) ?? 0,
                includes: o.includes,
                excludes: o.excludes,
                coverageNote: o.coverageNote,
                ratingAvg,
                ratingCount,
                service: {
                    id: o.service.id,
                    slug: o.service.slug,
                    name: o.service.name,
                    unit: o.service.unit,
                    basePrice: o.service.basePrice,
                    category: o.service.category
                        ? {
                            id: o.service.category.id,
                            name: o.service.category.name,
                            slug: o.service.category.slug,
                            group: o.service.category.group,
                        }
                        : null,
                },
            };
        })
            .sort((a, b) => b.ratingCount - a.ratingCount || b.ratingAvg - a.ratingAvg);
        return {
            id: profile.id,
            userId: profile.userId,
            fullName: profile.user.fullName,
            headline: profile.headline,
            bio: profile.bio,
            city: profile.city,
            districts: (0, partner_profile_fields_1.parseDistricts)(profile.districts),
            skills: (0, partner_profile_fields_1.parseSkills)(profile.skillsJson),
            acceptingJobs: profile.acceptingJobs,
            workModes: (0, partner_profile_fields_1.parseWorkModes)(profile.workModes),
            responseMinutes: profile.responseMinutes,
            ratingAvg: profile.ratingAvg,
            ratingCount: profile.ratingCount,
            level: profile.level,
            isVerified: profile.isVerified,
            phoneVerified: profile.phoneVerified,
            bankVerified: profile.bankVerified,
            avatarUrl: profile.avatarUrl,
            gallery: (0, partner_profile_fields_1.parseGallery)(profile.galleryJson),
            completedJobs,
            hireSuccessCount,
            rank: (0, partner_rank_1.computePartnerRankScore)(completedJobs, hireSuccessCount),
            isOnline: isPartnerOnline(profile.lastOnlineAt),
            lastOnlineAt: profile.lastOnlineAt?.toISOString() ?? null,
            offerings,
            reviews: reviews.map((r) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt,
                fromName: r.fromUser.fullName,
                serviceId: r.booking.service.id,
                serviceName: r.booking.service.name,
                serviceSlug: r.booking.service.slug,
                groupSlug: r.booking.service.category?.group.slug ?? null,
                groupName: r.booking.service.category?.group.name ?? null,
            })),
        };
    }
    async searchPublic(q, limit = 24) {
        const keyword = q.trim();
        if (!keyword)
            return [];
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
        const hits = [];
        for (const profile of profiles) {
            if (hits.length >= take)
                break;
            const nameHit = (0, text_match_1.phraseMatch)(profile.user.fullName, keyword);
            const professionHay = [
                profile.headline ?? '',
                profile.bio ?? '',
                profile.skillsJson ?? '',
                ...profile.offerings.map((o) => `${o.service.name} ${o.headline ?? ''}`),
            ].join(' ');
            const professionHit = (0, text_match_1.phraseMatch)(professionHay, keyword);
            if (!nameHit && !professionHit)
                continue;
            const matchedOffering = profile.offerings.find((o) => (0, text_match_1.phraseMatch)(`${o.service.name} ${o.headline ?? ''}`, keyword)) ?? profile.offerings[0] ?? null;
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
                    ? matchedOffering.price ?? matchedOffering.service.basePrice
                    : null,
                unit: matchedOffering?.service.unit ?? null,
                matchReason: nameHit ? 'name' : 'profession',
            });
        }
        return hits;
    }
    async getPublicProfile(userId) {
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
        if (!profile)
            throw new common_1.NotFoundException('Không tìm thấy hồ sơ người làm');
        const offeringServiceIds = profile.offerings.map((o) => o.serviceId);
        const [completedJobs, hireSuccessCount, reviews, hoursByServiceId, reputation, servicePosts, onTimeStats] = await Promise.all([
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
            (0, partner_work_hours_1.hoursWorkedByServiceIds)(this.prisma, userId, offeringServiceIds),
            this.reputation.getSnapshot(userId),
            this.prisma.partnerServicePost.findMany({
                where: {
                    partnerProfileId: profile.id,
                    status: client_1.PartnerServicePostStatus.APPROVED,
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
            this.computeOnTimeStats(userId),
        ]);
        const shaped = this.shapePublic(profile, completedJobs, reviews, hoursByServiceId, hireSuccessCount);
        const priceByService = new Map(profile.offerings.map((o) => [o.serviceId, this.offeringPriceRange(o)]));
        return {
            ...shaped,
            onTimeRate: onTimeStats.onTimeRate,
            onTimeSampleSize: onTimeStats.sampleSize,
            reputation,
            servicePosts: servicePosts.map((post) => this.shapeServicePost(post, priceByService.get(post.serviceId) ?? null)),
        };
    }
    async listApprovedServicePosts(page = 1, pageSize = 12) {
        const take = Math.min(24, Math.max(1, pageSize));
        const safePage = Math.max(1, page);
        const skip = (safePage - 1) * take;
        const where = { status: client_1.PartnerServicePostStatus.APPROVED };
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
                                select: { serviceId: true, price: true, priceMin: true, priceMax: true },
                            },
                        },
                    },
                },
            }),
        ]);
        const reputations = await this.reputation.getSnapshotsBatch(posts.map((post) => post.partnerProfile.userId));
        const rankByUserId = await this.getPartnerRankScoresBatch(posts.map((post) => post.partnerProfile.userId));
        return {
            items: posts.map((post) => {
                const offering = post.partnerProfile.offerings.find((o) => o.serviceId === post.serviceId);
                const shaped = this.shapeServicePost(post, this.offeringPriceRange(offering));
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
    async getPublicServicePost(userId, postId) {
        const [post, rankInfo] = await Promise.all([
            this.prisma.partnerServicePost.findFirst({
                where: {
                    id: postId,
                    status: client_1.PartnerServicePostStatus.APPROVED,
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
            this.getPartnerRankScore(userId),
        ]);
        if (!post) {
            throw new common_1.NotFoundException('Không tìm thấy bài đăng');
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
        const ratingAvg = ratingCount > 0
            ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount) * 10) / 10
            : 0;
        const offeringRange = this.offeringPriceRange(offering);
        return {
            post: this.shapeServicePost(post, offeringRange),
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
    parsePostImages(imagesJson, coverUrl) {
        if (imagesJson) {
            try {
                const parsed = JSON.parse(imagesJson);
                if (Array.isArray(parsed)) {
                    const urls = parsed
                        .filter((u) => typeof u === 'string')
                        .map((u) => u.trim())
                        .filter(Boolean);
                    if (urls.length)
                        return urls.slice(0, 8);
                }
            }
            catch {
            }
        }
        return coverUrl?.trim() ? [coverUrl.trim()] : [];
    }
    serializePostImages(images) {
        const urls = images
            .map((u) => u.trim())
            .filter(Boolean)
            .slice(0, 8);
        if (!urls.length) {
            throw new common_1.BadRequestException('Cần ít nhất một ảnh');
        }
        return {
            images: urls,
            imagesJson: JSON.stringify(urls),
            coverUrl: urls[0],
        };
    }
    normalizePostBody(raw) {
        let html = raw.trim();
        html = html
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
            .replace(/<\/?a\b[^>]*>/gi, '')
            .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
            .replace(/javascript:/gi, '');
        const plain = html
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (plain.length < 20) {
            throw new common_1.BadRequestException('Nội dung cần ít nhất 20 ký tự');
        }
        if (html.length > 8000) {
            throw new common_1.BadRequestException('Nội dung quá dài (tối đa 8000 ký tự)');
        }
        return html;
    }
    offeringPriceRange(offering) {
        if (!offering) {
            return { price: null, priceMin: null, priceMax: null };
        }
        const min = offering.priceMin && offering.priceMin > 0
            ? offering.priceMin
            : offering.price && offering.price > 0
                ? offering.price
                : null;
        if (min == null) {
            return { price: null, priceMin: null, priceMax: null };
        }
        const max = offering.priceMax && offering.priceMax > 0
            ? Math.max(offering.priceMax, min)
            : min;
        return { price: min, priceMin: min, priceMax: max };
    }
    assertPriceRange(priceMin, priceMax) {
        if (priceMax < priceMin) {
            throw new common_1.BadRequestException('Giá max phải lớn hơn hoặc bằng giá min');
        }
    }
    shapeServicePost(post, range) {
        const images = this.parsePostImages(post.imagesJson, post.coverUrl);
        const normalized = typeof range === 'number' || range == null
            ? this.offeringPriceRange(range == null ? null : { price: range, priceMin: range, priceMax: range })
            : this.offeringPriceRange(range);
        return {
            id: post.id,
            title: post.title,
            body: post.body,
            coverUrl: images[0] ?? post.coverUrl,
            images,
            serviceId: post.serviceId,
            price: normalized.price,
            priceMin: normalized.priceMin,
            priceMax: normalized.priceMax,
            ...(post.status !== undefined ? { status: post.status } : {}),
            ...(post.rejectReason !== undefined
                ? { rejectReason: post.rejectReason }
                : {}),
            ...(post.reviewedAt !== undefined
                ? { reviewedAt: post.reviewedAt }
                : {}),
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            service: post.service,
        };
    }
    async listMyServicePosts(userId, serviceId) {
        const profile = await this.prisma.partnerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!profile)
            throw new common_1.NotFoundException('Chưa có hồ sơ đối tác');
        const posts = await this.prisma.partnerServicePost.findMany({
            where: {
                partnerProfileId: profile.id,
                ...(serviceId ? { serviceId } : {}),
            },
            orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
            include: { service: { select: servicePostServiceSelect } },
        });
        const offerings = await this.prisma.partnerService.findMany({
            where: {
                partnerProfileId: profile.id,
                serviceId: { in: posts.map((p) => p.serviceId) },
            },
            select: { serviceId: true, price: true, priceMin: true, priceMax: true },
        });
        const priceByService = new Map(offerings.map((o) => [o.serviceId, this.offeringPriceRange(o)]));
        return posts.map((p) => this.shapeServicePost(p, priceByService.get(p.serviceId) ?? null));
    }
    async createServicePost(userId, dto) {
        const profile = await this.prisma.partnerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!profile)
            throw new common_1.NotFoundException('Chưa có hồ sơ đối tác');
        const offering = await this.prisma.partnerService.findFirst({
            where: {
                partnerProfileId: profile.id,
                serviceId: dto.serviceId,
                isActive: true,
            },
        });
        if (!offering) {
            throw new common_1.BadRequestException('Chỉ đăng bài cho nghề đang gắn trên hồ sơ. Cập nhật nghề ở Hồ sơ trước.');
        }
        const existingForService = await this.prisma.partnerServicePost.findFirst({
            where: {
                partnerProfileId: profile.id,
                serviceId: dto.serviceId,
            },
            select: { id: true },
        });
        if (existingForService) {
            throw new common_1.ConflictException('Nghề này đã có bài đăng. Chỉ được sửa bài hiện có, không tạo mới.');
        }
        const { imagesJson, coverUrl } = this.serializePostImages(dto.images);
        const body = this.normalizePostBody(dto.body);
        const priceMin = Math.round(dto.priceMin);
        const priceMax = Math.round(dto.priceMax);
        this.assertPriceRange(priceMin, priceMax);
        const post = await this.prisma.$transaction(async (tx) => {
            await tx.partnerService.update({
                where: { id: offering.id },
                data: { price: priceMin, priceMin, priceMax },
            });
            return tx.partnerServicePost.create({
                data: {
                    partnerProfileId: profile.id,
                    serviceId: dto.serviceId,
                    title: dto.title.trim(),
                    body,
                    coverUrl,
                    imagesJson,
                    status: client_1.PartnerServicePostStatus.PENDING,
                    rejectReason: null,
                    reviewedAt: null,
                    reviewedById: null,
                },
                include: { service: { select: servicePostServiceSelect } },
            });
        });
        return this.shapeServicePost(post, { price: priceMin, priceMin, priceMax });
    }
    async updateServicePost(userId, postId, dto) {
        const profile = await this.prisma.partnerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!profile)
            throw new common_1.NotFoundException('Chưa có hồ sơ đối tác');
        const existing = await this.prisma.partnerServicePost.findFirst({
            where: { id: postId, partnerProfileId: profile.id },
        });
        if (!existing)
            throw new common_1.NotFoundException('Không tìm thấy bài đăng');
        const imageFields = dto.images !== undefined
            ? this.serializePostImages(dto.images)
            : null;
        const hasPriceUpdate = dto.priceMin !== undefined || dto.priceMax !== undefined;
        let nextRange;
        if (hasPriceUpdate) {
            const current = await this.prisma.partnerService.findFirst({
                where: {
                    partnerProfileId: profile.id,
                    serviceId: existing.serviceId,
                },
                select: { price: true, priceMin: true, priceMax: true },
            });
            const fallback = this.offeringPriceRange(current);
            const priceMin = Math.round(dto.priceMin ?? fallback.priceMin ?? fallback.price ?? 0);
            const priceMax = Math.round(dto.priceMax ?? fallback.priceMax ?? priceMin);
            if (priceMin < 1000) {
                throw new common_1.BadRequestException('Giá min tối thiểu 1.000 VNĐ');
            }
            this.assertPriceRange(priceMin, priceMax);
            nextRange = { price: priceMin, priceMin, priceMax };
        }
        const post = await this.prisma.$transaction(async (tx) => {
            if (nextRange) {
                await tx.partnerService.updateMany({
                    where: {
                        partnerProfileId: profile.id,
                        serviceId: existing.serviceId,
                    },
                    data: {
                        price: nextRange.price,
                        priceMin: nextRange.priceMin,
                        priceMax: nextRange.priceMax,
                    },
                });
            }
            return tx.partnerServicePost.update({
                where: { id: postId },
                data: {
                    ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
                    ...(dto.body !== undefined
                        ? { body: this.normalizePostBody(dto.body) }
                        : {}),
                    ...(imageFields
                        ? {
                            coverUrl: imageFields.coverUrl,
                            imagesJson: imageFields.imagesJson,
                        }
                        : {}),
                    status: client_1.PartnerServicePostStatus.PENDING,
                    rejectReason: null,
                    reviewedAt: null,
                    reviewedById: null,
                },
                include: { service: { select: servicePostServiceSelect } },
            });
        });
        const offering = await this.prisma.partnerService.findFirst({
            where: {
                partnerProfileId: profile.id,
                serviceId: existing.serviceId,
            },
            select: { price: true, priceMin: true, priceMax: true },
        });
        return this.shapeServicePost(post, nextRange ?? this.offeringPriceRange(offering));
    }
    async deleteServicePost(userId, postId) {
        const profile = await this.prisma.partnerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!profile)
            throw new common_1.NotFoundException('Chưa có hồ sơ đối tác');
        const existing = await this.prisma.partnerServicePost.findFirst({
            where: { id: postId, partnerProfileId: profile.id },
            select: { id: true },
        });
        if (!existing)
            throw new common_1.NotFoundException('Không tìm thấy bài đăng');
        await this.prisma.partnerServicePost.delete({ where: { id: postId } });
        return { ok: true };
    }
    async getMine(userId) {
        const profile = await this.prisma.partnerProfile.findUnique({
            where: { userId },
            include: {
                user: { select: userPrivateSelect },
                offerings: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'asc' },
                    include: offeringInclude,
                },
            },
        });
        if (!profile)
            throw new common_1.NotFoundException('Chưa có hồ sơ đối tác');
        const hoursByServiceId = await (0, partner_work_hours_1.hoursWorkedByServiceIds)(this.prisma, userId, profile.offerings.map((o) => o.serviceId));
        const { phoneOtpCode: _otp, phoneOtpExpiresAt: _otpExp, bankVerifyIntentId: _bIntent, bankVerifyExpiresAt: _bExp, ...safeProfile } = profile;
        return {
            ...safeProfile,
            phoneVerified: Boolean(profile.user.phoneVerified ??
                profile.phoneVerified),
            skills: (0, partner_profile_fields_1.parseSkills)(profile.skillsJson),
            gallery: (0, partner_profile_fields_1.parseGallery)(profile.galleryJson),
            districtsList: (0, partner_profile_fields_1.parseDistricts)(profile.districts),
            workModesList: (0, partner_profile_fields_1.parseWorkModes)(profile.workModes),
            serviceIds: profile.offerings.map((o) => o.serviceId),
            offerings: profile.offerings.map((o) => ({
                ...o,
                hoursWorked: hoursByServiceId.get(o.serviceId) ?? 0,
            })),
            bankVerifyPending: Boolean(profile.bankVerifyIntentId &&
                profile.bankVerifyExpiresAt &&
                profile.bankVerifyExpiresAt.getTime() > Date.now() &&
                !profile.bankVerified),
        };
    }
    async enableOffering(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { partnerProfile: true },
        });
        if (!user)
            throw new common_1.NotFoundException('Không tìm thấy tài khoản');
        if (user.partnerProfile) {
            throw new common_1.ConflictException('Bạn đã bật nhận việc rồi');
        }
        const role = user.role === client_1.Role.ADMIN ? client_1.Role.ADMIN : client_1.Role.PARTNER;
        const phone = dto.phone !== undefined ? dto.phone.trim().slice(0, 20) || null : undefined;
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                role,
                ...(phone !== undefined ? { phone } : {}),
            },
        });
        const profile = await this.prisma.partnerProfile.create({
            data: {
                userId,
                headline: dto.headline?.trim() || 'Freelancer trên Dịch Vụ Ơi',
                bio: dto.bio?.trim() || '',
                city: dto.city?.trim() || 'Hồ Chí Minh',
                districts: (0, partner_profile_fields_1.serializeDistricts)(dto.districts),
                skillsJson: (0, partner_profile_fields_1.serializeSkills)(dto.skills),
                workModes: (0, partner_profile_fields_1.serializeWorkModes)(dto.workModes),
                acceptingJobs: dto.acceptingJobs ?? true,
                responseMinutes: dto.responseMinutes ?? 30,
                level: 1,
                avatarUrl: (0, portrait_avatar_1.portraitAvatarUrl)(userId),
            },
            include: { user: { select: userPrivateSelect } },
        });
        if (dto.serviceIds?.length) {
            await this.syncOfferingsForProfile(profile.id, dto.serviceIds);
        }
        return this.getMine(userId);
    }
    async requireOrCreateProfile(userId) {
        const existing = await this.prisma.partnerProfile.findUnique({
            where: { userId },
        });
        if (existing)
            return existing;
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Không tìm thấy tài khoản');
        if (user.role === client_1.Role.CUSTOMER) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { role: client_1.Role.PARTNER },
            });
        }
        return this.prisma.partnerProfile.create({
            data: {
                userId,
                headline: 'Freelancer trên Dịch Vụ Ơi',
                bio: '',
                city: 'Hồ Chí Minh',
                level: 1,
                avatarUrl: (0, portrait_avatar_1.portraitAvatarUrl)(userId),
                acceptingJobs: true,
                responseMinutes: 30,
            },
        });
    }
    async updateMine(userId, dto) {
        await this.requireOrCreateProfile(userId);
        if (dto.phone !== undefined) {
            const nextPhone = dto.phone.trim().slice(0, 20) || null;
            const current = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { phone: true },
            });
            await this.prisma.user.update({
                where: { id: userId },
                data: { phone: nextPhone },
            });
            if (current?.phone !== nextPhone) {
                await this.prisma.partnerProfile.update({
                    where: { userId },
                    data: {
                        phoneVerified: false,
                        phoneOtpCode: null,
                        phoneOtpExpiresAt: null,
                    },
                });
            }
        }
        await this.prisma.partnerProfile.update({
            where: { userId },
            data: {
                headline: dto.headline,
                bio: dto.bio,
                city: dto.city,
                ...(dto.districts !== undefined
                    ? { districts: (0, partner_profile_fields_1.serializeDistricts)(dto.districts) }
                    : {}),
                ...(dto.skills !== undefined
                    ? { skillsJson: (0, partner_profile_fields_1.serializeSkills)(dto.skills) }
                    : {}),
                ...(dto.workModes !== undefined
                    ? { workModes: (0, partner_profile_fields_1.serializeWorkModes)(dto.workModes) }
                    : {}),
                ...(dto.acceptingJobs !== undefined
                    ? { acceptingJobs: dto.acceptingJobs }
                    : {}),
                ...(dto.responseMinutes !== undefined
                    ? { responseMinutes: dto.responseMinutes }
                    : {}),
                ...(dto.avatarUrl !== undefined
                    ? {
                        avatarUrl: dto.avatarUrl.trim()
                            ? dto.avatarUrl.trim().slice(0, 500)
                            : null,
                    }
                    : {}),
                ...(dto.gallery !== undefined
                    ? { galleryJson: (0, partner_profile_fields_1.serializeGallery)(dto.gallery) }
                    : {}),
            },
        });
        return this.getMine(userId);
    }
    async syncOfferings(userId, dto) {
        const profile = await this.requireOrCreateProfile(userId);
        await this.syncOfferingsForProfile(profile.id, dto.serviceIds ?? []);
        await (0, recalculate_partner_level_1.recalculatePartnerLevel)(this.prisma, userId);
        return this.getMine(userId);
    }
    async getLevelBreakdown(userId) {
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
        if (!profile)
            throw new common_1.NotFoundException('Chưa có hồ sơ đối tác');
        const [completedJobs, hireSuccessCount, onTimeStats] = await Promise.all([
            this.prisma.booking.count({
                where: { partnerId: userId, status: 'COMPLETED' },
            }),
            this.prisma.booking.count({
                where: { userId, status: 'COMPLETED' },
            }),
            this.computeOnTimeStats(userId),
        ]);
        const breakdown = (0, partner_level_1.computePartnerLevel)({
            onlineHours: profile.onlineSeconds / 3600,
            completedJobs,
            ratingAvg: profile.ratingAvg,
            ratingCount: profile.ratingCount,
            isVerified: profile.isVerified,
            activeOfferings: profile.offerings.length,
        });
        const rank = (0, partner_rank_1.computePartnerRankScore)(completedJobs, hireSuccessCount);
        return {
            storedLevel: profile.level,
            formula: partner_level_1.PARTNER_LEVEL_FORMULA,
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
    async getPartnerRankScore(userId) {
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
            rank: (0, partner_rank_1.computePartnerRankScore)(completedJobs, hireSuccessCount),
        };
    }
    async getPartnerRankScoresBatch(userIds) {
        const unique = [...new Set(userIds.filter(Boolean))];
        const result = new Map();
        if (unique.length === 0)
            return result;
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
        const partnerMap = new Map(asPartner
            .filter((row) => row.partnerId)
            .map((row) => [row.partnerId, row._count._all]));
        const customerMap = new Map(asCustomer.map((row) => [row.userId, row._count._all]));
        for (const id of unique) {
            const completedJobs = partnerMap.get(id) ?? 0;
            const hireSuccessCount = customerMap.get(id) ?? 0;
            result.set(id, {
                completedJobs,
                hireSuccessCount,
                rank: (0, partner_rank_1.computePartnerRankScore)(completedJobs, hireSuccessCount),
            });
        }
        return result;
    }
    async computeOnTimeStats(partnerId) {
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
            return { onTimeRate: null, sampleSize: 0 };
        }
        const graceMs = 60 * 60 * 1000;
        let onTime = 0;
        for (const b of rows) {
            const durationMin = b.service.durationMin > 0 ? b.service.durationMin : 60;
            const deadline = b.scheduledAt.getTime() + durationMin * 60_000 + graceMs;
            const done = (b.releasedAt ?? b.updatedAt).getTime();
            if (done <= deadline)
                onTime += 1;
        }
        return {
            onTimeRate: Math.round((onTime / rows.length) * 100),
            sampleSize: rows.length,
        };
    }
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
    async syncOfferingsForProfile(partnerProfileId, serviceIds) {
        const uniqueIds = [...new Set(serviceIds.map((id) => id.trim()).filter(Boolean))];
        if (uniqueIds.length > 40) {
            throw new common_1.BadRequestException('Tối đa 40 nghề trên một hồ sơ');
        }
        const services = uniqueIds.length
            ? await this.prisma.service.findMany({
                where: { id: { in: uniqueIds }, isActive: true },
                select: { id: true, name: true, basePrice: true },
            })
            : [];
        if (services.length !== uniqueIds.length) {
            throw new common_1.BadRequestException('Có nghề không hợp lệ hoặc đã tắt');
        }
        const existing = await this.prisma.partnerService.findMany({
            where: { partnerProfileId },
        });
        const byServiceId = new Map(existing.map((row) => [row.serviceId, row]));
        if (uniqueIds.length === 0) {
            await this.prisma.partnerService.updateMany({
                where: { partnerProfileId, isActive: true },
                data: { isActive: false },
            });
        }
        else {
            await this.prisma.partnerService.updateMany({
                where: {
                    partnerProfileId,
                    serviceId: { notIn: uniqueIds },
                    isActive: true,
                },
                data: { isActive: false },
            });
        }
        for (const service of services) {
            const row = byServiceId.get(service.id);
            if (row) {
                if (!row.isActive) {
                    await this.prisma.partnerService.update({
                        where: { id: row.id },
                        data: { isActive: true },
                    });
                }
            }
            else {
                await this.prisma.partnerService.create({
                    data: {
                        partnerProfileId,
                        serviceId: service.id,
                        price: service.basePrice,
                        headline: service.name,
                        experienceYears: 0,
                        isActive: true,
                    },
                });
            }
        }
    }
    async listFavoriteIds(userId) {
        const rows = await this.prisma.partnerFavorite.findMany({
            where: { userId },
            select: { partnerUserId: true },
            orderBy: { createdAt: 'desc' },
        });
        return rows.map((r) => r.partnerUserId);
    }
    async listFavorites(userId) {
        const rows = await this.prisma.partnerFavorite.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                partnerUser: {
                    select: {
                        id: true,
                        fullName: true,
                        partnerProfile: {
                            select: {
                                headline: true,
                                avatarUrl: true,
                                ratingAvg: true,
                                ratingCount: true,
                                level: true,
                                isVerified: true,
                                phoneVerified: true,
                                bankVerified: true,
                                acceptingJobs: true,
                                offerings: {
                                    where: { isActive: true },
                                    orderBy: { updatedAt: 'desc' },
                                    take: 1,
                                    select: {
                                        price: true,
                                        service: {
                                            select: {
                                                slug: true,
                                                name: true,
                                                unit: true,
                                                basePrice: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        return rows
            .filter((r) => r.partnerUser.partnerProfile)
            .map((r) => {
            const profile = r.partnerUser.partnerProfile;
            const top = profile.offerings[0];
            return {
                partnerUserId: r.partnerUser.id,
                fullName: r.partnerUser.fullName,
                headline: profile.headline,
                avatarUrl: profile.avatarUrl,
                ratingAvg: profile.ratingAvg,
                ratingCount: profile.ratingCount,
                level: profile.level,
                isVerified: profile.isVerified,
                phoneVerified: profile.phoneVerified,
                bankVerified: profile.bankVerified,
                acceptingJobs: profile.acceptingJobs,
                favoritedAt: r.createdAt,
                topOffering: top
                    ? {
                        serviceSlug: top.service.slug,
                        serviceName: top.service.name,
                        price: top.price ?? top.service.basePrice,
                        unit: top.service.unit,
                    }
                    : null,
            };
        });
    }
    async addFavorite(userId, partnerUserId) {
        if (userId === partnerUserId) {
            throw new common_1.BadRequestException('Không thể lưu chính mình');
        }
        const partner = await this.prisma.partnerProfile.findUnique({
            where: { userId: partnerUserId },
            select: { id: true },
        });
        if (!partner) {
            throw new common_1.NotFoundException('Không tìm thấy hồ sơ người làm');
        }
        await this.prisma.partnerFavorite.upsert({
            where: {
                userId_partnerUserId: { userId, partnerUserId },
            },
            create: { userId, partnerUserId },
            update: {},
        });
        return { partnerUserId, saved: true };
    }
    async removeFavorite(userId, partnerUserId) {
        await this.prisma.partnerFavorite.deleteMany({
            where: { userId, partnerUserId },
        });
        return { partnerUserId, saved: false };
    }
    async requestPhoneOtp(userId, dto) {
        await this.requireOrCreateProfile(userId);
        const result = await this.authService.requestPhoneOtp(userId, dto);
        return {
            ...result,
            debugCode: 'key' in result ? result.key : undefined,
        };
    }
    async confirmPhoneOtp(userId, dto) {
        await this.requireOrCreateProfile(userId);
        await this.authService.confirmPhoneOtp(userId, { key: dto.code });
        return this.getMine(userId);
    }
    async linkBankAccount(userId, dto) {
        await this.requireOrCreateProfile(userId);
        const intentId = `bv_${Date.now().toString(36)}_${userId.slice(-6)}`;
        const expiresAt = new Date(Date.now() + BANK_VERIFY_TTL_MS);
        const bin = (dto.bankBin ?? DEFAULT_VIETQR_BIN).trim();
        const amount = 1000;
        const addInfo = encodeURIComponent(`DVO verify ${intentId.slice(-8)}`);
        const qrImageUrl = `https://img.vietqr.io/image/${bin}-${dto.accountNo}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${encodeURIComponent(dto.accountName)}`;
        await this.prisma.partnerProfile.update({
            where: { userId },
            data: {
                bankName: dto.bankName.trim(),
                bankAccountNo: dto.accountNo.trim(),
                bankAccountName: dto.accountName.trim().toUpperCase(),
                bankVerified: false,
                bankVerifyIntentId: intentId,
                bankVerifyExpiresAt: expiresAt,
            },
        });
        return {
            ok: true,
            intentId,
            amount,
            expiresAt: expiresAt.toISOString(),
            qrImageUrl,
            bankName: dto.bankName.trim(),
            accountNo: dto.accountNo.trim(),
            accountName: dto.accountName.trim().toUpperCase(),
            mockConfirmEnabled: (0, security_env_1.allowMockPayments)(),
            message: (0, security_env_1.allowMockPayments)()
                ? 'Quét VietQR (mock) hoặc bấm xác nhận đã chuyển để hoàn tất xác minh NH.'
                : 'Đã tạo yêu cầu xác minh. Production cần webhook/micro-deposit — mock confirm đã tắt.',
        };
    }
    async confirmBankVerify(userId, dto) {
        if (!(0, security_env_1.allowMockPayments)()) {
            throw new common_1.ForbiddenException('Xác minh ngân hàng mô phỏng đã tắt. Production cần webhook/micro-deposit thật.');
        }
        const profile = await this.prisma.partnerProfile.findUnique({
            where: { userId },
        });
        if (!profile)
            throw new common_1.NotFoundException('Chưa có hồ sơ đối tác');
        if (!profile.bankVerifyIntentId || !profile.bankVerifyExpiresAt) {
            throw new common_1.BadRequestException('Chưa tạo yêu cầu xác minh ngân hàng.');
        }
        if (profile.bankVerifyIntentId !== dto.intentId.trim()) {
            throw new common_1.BadRequestException('Mã xác minh không khớp.');
        }
        if (profile.bankVerifyExpiresAt.getTime() < Date.now()) {
            throw new common_1.BadRequestException('Yêu cầu xác minh đã hết hạn. Tạo lại QR.');
        }
        if (!profile.bankAccountNo) {
            throw new common_1.BadRequestException('Thiếu số tài khoản.');
        }
        await this.prisma.partnerProfile.update({
            where: { userId },
            data: {
                bankVerified: true,
                bankVerifyIntentId: null,
                bankVerifyExpiresAt: null,
            },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                bankVerified: true,
                bankName: profile.bankName,
                bankAccountNo: profile.bankAccountNo,
                bankAccountName: profile.bankAccountName,
            },
        });
        return this.getMine(userId);
    }
};
exports.PartnersService = PartnersService;
exports.PartnersService = PartnersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        reputation_service_1.ReputationService,
        auth_service_1.AuthService])
], PartnersService);
//# sourceMappingURL=partners.service.js.map