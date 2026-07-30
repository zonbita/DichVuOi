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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const escrow_1 = require("../../common/escrow");
const market_price_1 = require("../../common/market-price");
const recalculate_partner_level_1 = require("../../common/recalculate-partner-level");
const slug_1 = require("../../common/slug");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const catalog_service_1 = require("../catalog/catalog.service");
const finance_service_1 = require("../finance/finance.service");
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
function resolvePage(query) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE));
    return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}
function paginated(items, total, page) {
    return {
        items,
        total,
        page: page.page,
        pageSize: page.pageSize,
        pageCount: Math.max(1, Math.ceil(total / page.pageSize)),
    };
}
let AdminService = class AdminService {
    prisma;
    finance;
    catalog;
    constructor(prisma, finance, catalog) {
        this.prisma = prisma;
        this.finance = finance;
        this.catalog = catalog;
    }
    async stats() {
        const [users, partners, partnersPendingVerify, bookings, held, released, completed, cancelled, reviews, redactedMessages, openJobs, complaintsPending,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.partnerProfile.count(),
            this.prisma.partnerProfile.count({ where: { isVerified: false } }),
            this.prisma.booking.count(),
            this.prisma.booking.count({
                where: { paymentStatus: client_1.PaymentStatus.HELD },
            }),
            this.prisma.booking.count({
                where: { paymentStatus: client_1.PaymentStatus.RELEASED },
            }),
            this.prisma.booking.count({
                where: { status: client_1.BookingStatus.COMPLETED },
            }),
            this.prisma.booking.count({
                where: { status: client_1.BookingStatus.CANCELLED },
            }),
            this.prisma.review.count(),
            this.prisma.bookingMessage.count({ where: { redacted: true } }),
            this.prisma.booking.count({
                where: { status: client_1.BookingStatus.PENDING, partnerId: null },
            }),
            this.prisma.complaint.count({
                where: {
                    status: { in: [client_1.ComplaintStatus.SUBMITTED, client_1.ComplaintStatus.UNDER_REVIEW] },
                },
            }),
        ]);
        const escrowAgg = await this.prisma.booking.aggregate({
            where: { paymentStatus: client_1.PaymentStatus.HELD },
            _sum: { totalPrice: true },
        });
        const commissionAgg = await this.prisma.booking.aggregate({
            where: { paymentStatus: client_1.PaymentStatus.RELEASED },
            _sum: { commissionAmount: true },
        });
        const gmvAgg = await this.prisma.booking.aggregate({
            where: { status: client_1.BookingStatus.COMPLETED },
            _sum: { totalPrice: true },
        });
        return {
            users,
            partners,
            partnersPendingVerify,
            bookings,
            openJobs,
            completed,
            cancelled,
            escrowHeldCount: held,
            escrowHeldAmount: escrowAgg._sum.totalPrice ?? 0,
            escrowReleasedCount: released,
            commissionEarned: commissionAgg._sum.commissionAmount ?? 0,
            gmvCompleted: gmvAgg._sum.totalPrice ?? 0,
            reviews,
            redactedMessages,
            complaintsPending,
        };
    }
    async listUsers(query) {
        const page = resolvePage(query);
        const q = query.q?.trim();
        const where = {
            ...(query.role ? { role: query.role } : {}),
            ...(q
                ? {
                    OR: [
                        { fullName: { contains: q } },
                        { email: { contains: q } },
                        { phone: { contains: q } },
                    ],
                }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip: page.skip,
                take: page.take,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    phone: true,
                    role: true,
                    createdAt: true,
                    partnerProfile: {
                        select: {
                            id: true,
                            isVerified: true,
                            ratingAvg: true,
                            ratingCount: true,
                            acceptingJobs: true,
                            level: true,
                        },
                    },
                    _count: {
                        select: {
                            customerBookings: true,
                            partnerBookings: true,
                        },
                    },
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        return paginated(items, total, page);
    }
    async updateUser(id, dto) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Không tìm thấy user');
        if (!dto.role)
            throw new common_1.BadRequestException('Thiếu role');
        return this.prisma.user.update({
            where: { id },
            data: { role: dto.role },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });
    }
    async listPartners(query) {
        const page = resolvePage(query);
        const q = query.q?.trim();
        const where = {
            ...(query.verified !== undefined ? { isVerified: query.verified } : {}),
            ...(query.acceptingJobs !== undefined
                ? { acceptingJobs: query.acceptingJobs }
                : {}),
            ...(query.city ? { city: query.city } : {}),
            ...(q
                ? {
                    OR: [
                        { headline: { contains: q } },
                        { city: { contains: q } },
                        { user: { fullName: { contains: q } } },
                        { user: { email: { contains: q } } },
                    ],
                }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.partnerProfile.findMany({
                where,
                skip: page.skip,
                take: page.take,
                orderBy: [{ isVerified: 'asc' }, { createdAt: 'desc' }],
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                            phone: true,
                            role: true,
                        },
                    },
                    _count: { select: { offerings: true } },
                },
            }),
            this.prisma.partnerProfile.count({ where }),
        ]);
        return paginated(items, total, page);
    }
    async updatePartner(userId, dto) {
        const profile = await this.prisma.partnerProfile.findUnique({
            where: { userId },
        });
        if (!profile)
            throw new common_1.NotFoundException('Không tìm thấy hồ sơ partner');
        const updated = await this.prisma.partnerProfile.update({
            where: { userId },
            data: {
                ...(dto.isVerified !== undefined
                    ? { isVerified: dto.isVerified }
                    : {}),
                ...(dto.acceptingJobs !== undefined
                    ? { acceptingJobs: dto.acceptingJobs }
                    : {}),
            },
            include: {
                user: {
                    select: { id: true, email: true, fullName: true, role: true },
                },
                _count: { select: { offerings: true } },
            },
        });
        if (dto.isVerified !== undefined) {
            await (0, recalculate_partner_level_1.recalculatePartnerLevel)(this.prisma, userId);
            const refreshed = await this.prisma.partnerProfile.findUnique({
                where: { userId },
                select: { level: true },
            });
            return { ...updated, level: refreshed?.level ?? updated.level };
        }
        return updated;
    }
    async listBookings(query) {
        const page = resolvePage(query);
        const q = query.q?.trim();
        const createdAt = {};
        if (query.from)
            createdAt.gte = new Date(query.from);
        if (query.to)
            createdAt.lte = new Date(query.to);
        const where = {
            ...(query.status ? { status: query.status } : {}),
            ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
            ...(query.from || query.to ? { createdAt } : {}),
            ...(q
                ? {
                    OR: [
                        { customerName: { contains: q } },
                        { service: { name: { contains: q } } },
                        { user: { fullName: { contains: q } } },
                        { user: { email: { contains: q } } },
                        { partner: { fullName: { contains: q } } },
                    ],
                }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.booking.findMany({
                where,
                skip: page.skip,
                take: page.take,
                orderBy: { createdAt: 'desc' },
                include: {
                    service: { select: { id: true, name: true, slug: true } },
                    user: { select: { id: true, fullName: true, email: true } },
                    partner: { select: { id: true, fullName: true, email: true } },
                    _count: { select: { messages: true, reviews: true } },
                },
            }),
            this.prisma.booking.count({ where }),
        ]);
        return paginated(items, total, page);
    }
    async getBooking(id) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: {
                service: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        basePrice: true,
                        unit: true,
                    },
                },
                user: {
                    select: { id: true, fullName: true, email: true, phone: true },
                },
                partner: {
                    select: { id: true, fullName: true, email: true, phone: true },
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: { select: { id: true, fullName: true, email: true } },
                    },
                },
                reviews: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        fromUser: { select: { id: true, fullName: true } },
                        toUser: { select: { id: true, fullName: true } },
                    },
                },
                requirements: {
                    orderBy: { sortOrder: 'asc' },
                },
                complaints: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        reporter: { select: { id: true, fullName: true } },
                        against: { select: { id: true, fullName: true } },
                        resolvedBy: { select: { id: true, fullName: true } },
                    },
                },
            },
        });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn');
        return booking;
    }
    async updateBooking(id, dto) {
        const booking = await this.prisma.booking.findUnique({ where: { id } });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn');
        const data = {};
        if (dto.note !== undefined)
            data.note = dto.note;
        if (dto.status)
            data.status = dto.status;
        if (dto.paymentStatus) {
            data.paymentStatus = dto.paymentStatus;
            if (dto.paymentStatus === client_1.PaymentStatus.HELD && !booking.paidAt) {
                data.paidAt = new Date();
            }
            if (dto.paymentStatus === client_1.PaymentStatus.RELEASED) {
                const split = (0, escrow_1.computeEscrowSplit)(booking.totalPrice, booking.commissionBps || escrow_1.DEFAULT_COMMISSION_BPS);
                data.commissionAmount = split.commissionAmount;
                data.partnerPayout = split.partnerPayout;
                data.releasedAt = new Date();
            }
            if (dto.paymentStatus === client_1.PaymentStatus.REFUNDED) {
                data.refundedAt = new Date();
            }
        }
        if (dto.status === client_1.BookingStatus.COMPLETED &&
            (dto.paymentStatus === client_1.PaymentStatus.RELEASED ||
                booking.paymentStatus === client_1.PaymentStatus.HELD)) {
            if (!dto.paymentStatus &&
                booking.paymentStatus === client_1.PaymentStatus.HELD) {
                const split = (0, escrow_1.computeEscrowSplit)(booking.totalPrice, booking.commissionBps || escrow_1.DEFAULT_COMMISSION_BPS);
                data.paymentStatus = client_1.PaymentStatus.RELEASED;
                data.commissionAmount = split.commissionAmount;
                data.partnerPayout = split.partnerPayout;
                data.releasedAt = new Date();
            }
        }
        if (dto.status === client_1.BookingStatus.CANCELLED &&
            booking.paymentStatus === client_1.PaymentStatus.HELD &&
            !dto.paymentStatus) {
            data.paymentStatus = client_1.PaymentStatus.REFUNDED;
            data.refundedAt = new Date();
        }
        return this.prisma.booking.update({
            where: { id },
            data,
            include: {
                service: { select: { id: true, name: true, slug: true } },
                user: { select: { id: true, fullName: true, email: true } },
                partner: { select: { id: true, fullName: true, email: true } },
                _count: { select: { messages: true, reviews: true } },
            },
        });
    }
    async listReviews(query) {
        const page = resolvePage(query);
        const q = query.q?.trim();
        const where = q
            ? {
                OR: [
                    { comment: { contains: q } },
                    { fromUser: { fullName: { contains: q } } },
                    { toUser: { fullName: { contains: q } } },
                ],
            }
            : {};
        const [items, total] = await Promise.all([
            this.prisma.review.findMany({
                where,
                skip: page.skip,
                take: page.take,
                orderBy: { createdAt: 'desc' },
                include: {
                    fromUser: { select: { id: true, fullName: true, email: true } },
                    toUser: { select: { id: true, fullName: true, email: true } },
                    booking: {
                        select: {
                            id: true,
                            status: true,
                            service: { select: { name: true } },
                        },
                    },
                },
            }),
            this.prisma.review.count({ where }),
        ]);
        return paginated(items, total, page);
    }
    async listFlaggedMessages(query) {
        const page = resolvePage(query);
        const q = query.q?.trim();
        const where = {
            redacted: true,
            ...(q
                ? {
                    OR: [
                        { body: { contains: q } },
                        { sender: { fullName: { contains: q } } },
                        { sender: { email: { contains: q } } },
                    ],
                }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.bookingMessage.findMany({
                where,
                skip: page.skip,
                take: page.take,
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: { select: { id: true, fullName: true, email: true } },
                    booking: {
                        select: {
                            id: true,
                            status: true,
                            service: { select: { name: true } },
                        },
                    },
                },
            }),
            this.prisma.bookingMessage.count({ where }),
        ]);
        return paginated(items, total, page);
    }
    listCatalogSummary() {
        return this.prisma.serviceGroup.findMany({
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                slug: true,
                name: true,
                isFeatured: true,
                _count: { select: { categories: true } },
                categories: {
                    orderBy: { name: 'asc' },
                    select: {
                        id: true,
                        name: true,
                        _count: { select: { services: true } },
                    },
                },
            },
        });
    }
    async listCategoryOptions() {
        const categories = await this.prisma.category.findMany({
            orderBy: [{ group: { sortOrder: 'asc' } }, { name: 'asc' }],
            select: {
                id: true,
                name: true,
                slug: true,
                group: { select: { id: true, name: true, slug: true } },
            },
        });
        return categories;
    }
    async listServices(query) {
        const page = resolvePage(query);
        const q = query.q?.trim();
        const where = {
            ...(query.categoryId ? { categoryId: query.categoryId } : {}),
            ...(query.groupId ? { category: { groupId: query.groupId } } : {}),
            ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
            ...(q
                ? {
                    OR: [
                        { name: { contains: q } },
                        { slug: { contains: q } },
                        { category: { name: { contains: q } } },
                    ],
                }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.service.findMany({
                where,
                skip: page.skip,
                take: page.take,
                orderBy: { createdAt: 'desc' },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            group: { select: { id: true, name: true, slug: true } },
                        },
                    },
                    _count: { select: { bookings: true, partners: true } },
                },
            }),
            this.prisma.service.count({ where }),
        ]);
        return paginated(items, total, page);
    }
    async createService(dto) {
        const category = await this.prisma.category.findUnique({
            where: { id: dto.categoryId },
        });
        if (!category)
            throw new common_1.NotFoundException('Không tìm thấy danh mục');
        const slug = (0, slug_1.slugify)(dto.slug?.trim() || dto.name);
        if (!slug)
            throw new common_1.BadRequestException('Slug không hợp lệ');
        const existing = await this.prisma.service.findUnique({ where: { slug } });
        if (existing)
            throw new common_1.ConflictException(`Slug «${slug}» đã tồn tại`);
        const defaults = (0, market_price_1.defaultMarketRangeFromBase)(dto.basePrice);
        let priceMin = dto.priceMin ?? defaults.priceMin;
        let priceMax = dto.priceMax ?? defaults.priceMax;
        if (priceMin > priceMax) {
            const t = priceMin;
            priceMin = priceMax;
            priceMax = t;
        }
        const created = await this.prisma.service.create({
            data: {
                slug,
                name: dto.name.trim(),
                description: dto.description?.trim() || null,
                basePrice: dto.basePrice,
                priceMin,
                priceMax,
                unit: dto.unit?.trim() || 'giờ',
                supportsOnline: dto.supportsOnline ?? false,
                durationMin: dto.durationMin ?? 60,
                isActive: dto.isActive ?? true,
                categoryId: dto.categoryId,
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        group: { select: { id: true, name: true, slug: true } },
                    },
                },
                _count: { select: { bookings: true, partners: true } },
            },
        });
        this.catalog.invalidateCache();
        return created;
    }
    async updateService(id, dto) {
        const service = await this.prisma.service.findUnique({ where: { id } });
        if (!service)
            throw new common_1.NotFoundException('Không tìm thấy dịch vụ');
        if (dto.categoryId) {
            const category = await this.prisma.category.findUnique({
                where: { id: dto.categoryId },
            });
            if (!category)
                throw new common_1.NotFoundException('Không tìm thấy danh mục');
        }
        let slug;
        if (dto.slug !== undefined) {
            slug = (0, slug_1.slugify)(dto.slug);
            if (!slug)
                throw new common_1.BadRequestException('Slug không hợp lệ');
            const clash = await this.prisma.service.findUnique({ where: { slug } });
            if (clash && clash.id !== id) {
                throw new common_1.ConflictException(`Slug «${slug}» đã tồn tại`);
            }
        }
        const updated = await this.prisma.service.update({
            where: { id },
            data: {
                ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
                ...(slug !== undefined ? { slug } : {}),
                ...(dto.description !== undefined
                    ? { description: dto.description.trim() || null }
                    : {}),
                ...(dto.basePrice !== undefined ? { basePrice: dto.basePrice } : {}),
                ...(dto.priceMin !== undefined ? { priceMin: dto.priceMin } : {}),
                ...(dto.priceMax !== undefined ? { priceMax: dto.priceMax } : {}),
                ...(dto.unit !== undefined ? { unit: dto.unit.trim() || 'giờ' } : {}),
                ...(dto.supportsOnline !== undefined
                    ? { supportsOnline: dto.supportsOnline }
                    : {}),
                ...(dto.durationMin !== undefined
                    ? { durationMin: dto.durationMin }
                    : {}),
                ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
                ...(dto.categoryId !== undefined
                    ? { categoryId: dto.categoryId }
                    : {}),
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        group: { select: { id: true, name: true, slug: true } },
                    },
                },
                _count: { select: { bookings: true, partners: true } },
            },
        });
        this.catalog.invalidateCache();
        return updated;
    }
    async updateGroup(id, dto) {
        const group = await this.prisma.serviceGroup.findUnique({ where: { id } });
        if (!group)
            throw new common_1.NotFoundException('Không tìm thấy nhóm');
        const updated = await this.prisma.serviceGroup.update({
            where: { id },
            data: {
                ...(dto.isFeatured !== undefined
                    ? { isFeatured: dto.isFeatured }
                    : {}),
            },
            select: { id: true, slug: true, name: true, isFeatured: true },
        });
        this.catalog.invalidateCache();
        return updated;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        finance_service_1.FinanceService,
        catalog_service_1.CatalogService])
], AdminService);
//# sourceMappingURL=admin.service.js.map