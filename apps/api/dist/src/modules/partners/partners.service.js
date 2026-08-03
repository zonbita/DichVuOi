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
const recalculate_partner_level_1 = require("../../common/recalculate-partner-level");
const reputation_service_1 = require("../../common/reputation.service");
const security_env_1 = require("../../common/security-env");
const portrait_avatar_1 = require("../../common/portrait-avatar");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
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
    shapePublic(profile, completedJobs, reviews = [], hoursByServiceId = new Map()) {
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
            return {
                id: o.id,
                price: o.price ?? o.service.basePrice,
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
            offerings,
            reviews: reviews.map((r) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt,
                fromName: r.fromUser.fullName,
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
                user: { select: userPublicSelect },
                offerings: {
                    where: { isActive: true },
                    take: 40,
                    select: {
                        id: true,
                        serviceId: true,
                        price: true,
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
        const [completedJobs, reviews, hoursByServiceId, reputation] = await Promise.all([
            this.prisma.booking.count({
                where: { partnerId: userId, status: 'COMPLETED' },
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
        ]);
        const shaped = this.shapePublic(profile, completedJobs, reviews, hoursByServiceId);
        return { ...shaped, reputation };
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
        const completedJobs = await this.prisma.booking.count({
            where: { partnerId: userId, status: 'COMPLETED' },
        });
        const breakdown = (0, partner_level_1.computePartnerLevel)({
            onlineHours: profile.onlineSeconds / 3600,
            completedJobs,
            ratingAvg: profile.ratingAvg,
            ratingCount: profile.ratingCount,
            isVerified: profile.isVerified,
            activeOfferings: profile.offerings.length,
        });
        return {
            storedLevel: profile.level,
            formula: partner_level_1.PARTNER_LEVEL_FORMULA,
            ...breakdown,
            inputs: {
                completedJobs,
                ratingAvg: profile.ratingAvg,
                ratingCount: profile.ratingCount,
                isVerified: profile.isVerified,
                activeOfferings: profile.offerings.length,
                onlineSeconds: profile.onlineSeconds,
                onlineHours: breakdown.onlineHours,
                lastOnlineAt: profile.lastOnlineAt,
            },
        };
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