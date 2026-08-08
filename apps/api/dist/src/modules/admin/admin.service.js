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
        const [users, partners, partnersPendingVerify, bookings, held, released, completed, cancelled, reviews, redactedMessages, openJobs, complaintsPending, servicePostsPending, supportOpen,] = await Promise.all([
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
            this.prisma.partnerServicePost.count({
                where: { status: client_1.PartnerServicePostStatus.PENDING },
            }),
            this.prisma.supportThread.count({
                where: { status: client_1.SupportThreadStatus.OPEN },
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
            servicePostsPending,
            supportOpen,
        };
    }
    async financeOverview() {
        const [walletAgg, walletsPositive, held, escrowAgg, commissionAgg, withdrawSum, recentTx,] = await Promise.all([
            this.prisma.user.aggregate({ _sum: { walletBalance: true } }),
            this.prisma.user.count({ where: { walletBalance: { gt: 0 } } }),
            this.prisma.booking.count({
                where: { paymentStatus: client_1.PaymentStatus.HELD },
            }),
            this.prisma.booking.aggregate({
                where: { paymentStatus: client_1.PaymentStatus.HELD },
                _sum: { totalPrice: true },
            }),
            this.prisma.booking.aggregate({
                where: { paymentStatus: client_1.PaymentStatus.RELEASED },
                _sum: { commissionAmount: true },
            }),
            this.prisma.walletTransaction.aggregate({
                where: { type: client_1.WalletTransactionType.WITHDRAW },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.findMany({
                take: 15,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, fullName: true, email: true } },
                    booking: {
                        select: { id: true, service: { select: { name: true } } },
                    },
                },
            }),
        ]);
        return {
            currency: 'VND',
            totalWalletBalance: walletAgg._sum.walletBalance ?? 0,
            walletsWithBalance: walletsPositive,
            escrowHeldCount: held,
            escrowHeldAmount: escrowAgg._sum.totalPrice ?? 0,
            commissionEarned: commissionAgg._sum.commissionAmount ?? 0,
            withdrawnTotal: Math.abs(withdrawSum._sum.amount ?? 0),
            recentTransactions: recentTx,
        };
    }
    async listFinanceWallets(query) {
        const page = resolvePage(query);
        const q = query.q?.trim();
        const where = {
            ...(query.positiveOnly ? { walletBalance: { gt: 0 } } : {}),
            ...(q
                ? {
                    OR: [
                        { fullName: { contains: q } },
                        { email: { contains: q } },
                        { phone: { contains: q } },
                        { id: { contains: q } },
                    ],
                }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip: page.skip,
                take: page.take,
                orderBy: { walletBalance: 'desc' },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    phone: true,
                    role: true,
                    walletBalance: true,
                    bankName: true,
                    bankAccountNo: true,
                    bankAccountName: true,
                    updatedAt: true,
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        return paginated(items, total, page);
    }
    async listFinanceTransactions(query) {
        const page = resolvePage(query);
        const q = query.q?.trim();
        const type = query.type?.trim();
        const validType = type && Object.values(client_1.WalletTransactionType).includes(type)
            ? type
            : undefined;
        const where = {
            ...(validType ? { type: validType } : {}),
            ...(query.userId ? { userId: query.userId } : {}),
            ...(q
                ? {
                    OR: [
                        { description: { contains: q } },
                        { reference: { contains: q } },
                        { user: { fullName: { contains: q } } },
                        { user: { email: { contains: q } } },
                    ],
                }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.walletTransaction.findMany({
                where,
                skip: page.skip,
                take: page.take,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, fullName: true, email: true } },
                    booking: {
                        select: { id: true, service: { select: { name: true } } },
                    },
                },
            }),
            this.prisma.walletTransaction.count({ where }),
        ]);
        return paginated(items, total, page);
    }
    async adjustWallet(userId, dto) {
        return this.finance.adminAdjustBalance(userId, dto.amount, dto.reason);
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
        if (dto.role === undefined && dto.chatBanned === undefined) {
            throw new common_1.BadRequestException('Thiếu trường cập nhật');
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                ...(dto.role !== undefined ? { role: dto.role } : {}),
                ...(dto.chatBanned !== undefined
                    ? { chatBanned: dto.chatBanned }
                    : {}),
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                isBlocked: true,
                chatBanned: true,
                createdAt: true,
            },
        });
        return updated;
    }
    async gmvSeries(days = 30) {
        const safeDays = Math.min(90, Math.max(7, days));
        const since = new Date();
        since.setHours(0, 0, 0, 0);
        since.setDate(since.getDate() - (safeDays - 1));
        const rows = await this.prisma.booking.findMany({
            where: {
                status: client_1.BookingStatus.COMPLETED,
                OR: [
                    { releasedAt: { gte: since } },
                    { releasedAt: null, updatedAt: { gte: since } },
                ],
            },
            select: { releasedAt: true, updatedAt: true, totalPrice: true },
        });
        const byDay = new Map();
        for (let i = 0; i < safeDays; i++) {
            const d = new Date(since);
            d.setDate(since.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            byDay.set(key, 0);
        }
        for (const row of rows) {
            const at = row.releasedAt ?? row.updatedAt;
            const key = at.toISOString().slice(0, 10);
            if (byDay.has(key)) {
                byDay.set(key, (byDay.get(key) ?? 0) + (row.totalPrice ?? 0));
            }
        }
        return {
            days: safeDays,
            points: [...byDay.entries()].map(([date, gmv]) => ({ date, gmv })),
            total: [...byDay.values()].reduce((a, b) => a + b, 0),
        };
    }
    async writeAudit(input) {
        return this.prisma.adminAuditLog.create({
            data: {
                actorId: input.actorId,
                action: input.action,
                targetType: input.targetType,
                targetId: input.targetId,
                metaJson: input.meta ? JSON.stringify(input.meta) : null,
            },
        });
    }
    async listAuditLogs(query) {
        const page = resolvePage(query);
        const q = query.q?.trim();
        const where = q
            ? {
                OR: [
                    { action: { contains: q } },
                    { targetType: { contains: q } },
                    { targetId: { contains: q } },
                    { actor: { fullName: { contains: q } } },
                    { actor: { email: { contains: q } } },
                ],
            }
            : {};
        const [items, total] = await Promise.all([
            this.prisma.adminAuditLog.findMany({
                where,
                skip: page.skip,
                take: page.take,
                orderBy: { createdAt: 'desc' },
                include: {
                    actor: { select: { id: true, fullName: true, email: true } },
                },
            }),
            this.prisma.adminAuditLog.count({ where }),
        ]);
        return paginated(items.map((row) => ({
            id: row.id,
            action: row.action,
            targetType: row.targetType,
            targetId: row.targetId,
            meta: row.metaJson
                ? JSON.parse(row.metaJson)
                : null,
            createdAt: row.createdAt,
            actor: row.actor,
        })), total, page);
    }
    async listPartners(query) {
        const page = resolvePage(query);
        const q = query.q?.trim();
        const where = {
            ...(query.verified !== undefined ? { isVerified: query.verified } : {}),
            ...(query.acceptingJobs !== undefined
                ? { acceptingJobs: query.acceptingJobs }
                : {}),
            ...(query.blocked !== undefined
                ? { user: { isBlocked: query.blocked } }
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
                            isBlocked: true,
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
        if (dto.isBlocked !== undefined) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { isBlocked: dto.isBlocked },
            });
            if (dto.isBlocked) {
                await this.prisma.partnerProfile.update({
                    where: { userId },
                    data: { acceptingJobs: false },
                });
            }
        }
        const updated = await this.prisma.partnerProfile.update({
            where: { userId },
            data: {
                ...(dto.isVerified !== undefined
                    ? { isVerified: dto.isVerified }
                    : {}),
                ...(dto.acceptingJobs !== undefined && dto.isBlocked !== true
                    ? { acceptingJobs: dto.acceptingJobs }
                    : {}),
                ...(dto.phoneVerified !== undefined
                    ? {
                        phoneVerified: dto.phoneVerified,
                        ...(dto.phoneVerified
                            ? { phoneOtpCode: null, phoneOtpExpiresAt: null }
                            : {}),
                    }
                    : {}),
                ...(dto.bankVerified !== undefined
                    ? {
                        bankVerified: dto.bankVerified,
                        ...(dto.bankVerified
                            ? { bankVerifyIntentId: null, bankVerifyExpiresAt: null }
                            : {}),
                    }
                    : {}),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        phone: true,
                        role: true,
                        isBlocked: true,
                    },
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
                    sender: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            chatBanned: true,
                        },
                    },
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
    async listServicePostQueue(query) {
        const page = resolvePage(query);
        const q = query.q?.trim();
        const pendingWhere = {
            status: client_1.PartnerServicePostStatus.PENDING,
            ...(q
                ? {
                    OR: [
                        {
                            partnerProfile: {
                                user: {
                                    OR: [
                                        { fullName: { contains: q } },
                                        { email: { contains: q } },
                                    ],
                                },
                            },
                        },
                        { title: { contains: q } },
                        { service: { name: { contains: q } } },
                    ],
                }
                : {}),
        };
        const grouped = await this.prisma.partnerServicePost.groupBy({
            by: ['partnerProfileId'],
            where: pendingWhere,
            _count: { _all: true },
            _min: { createdAt: true },
            orderBy: { _min: { createdAt: 'asc' } },
            skip: page.skip,
            take: page.take,
        });
        const totalGroups = await this.prisma.partnerServicePost.groupBy({
            by: ['partnerProfileId'],
            where: pendingWhere,
        });
        const profileIds = grouped.map((g) => g.partnerProfileId);
        const profiles = await this.prisma.partnerProfile.findMany({
            where: { id: { in: profileIds } },
            select: {
                id: true,
                userId: true,
                avatarUrl: true,
                level: true,
                user: { select: { id: true, fullName: true, email: true } },
            },
        });
        const profileById = new Map(profiles.map((p) => [p.id, p]));
        const pendingPosts = await this.prisma.partnerServicePost.findMany({
            where: {
                partnerProfileId: { in: profileIds },
                status: client_1.PartnerServicePostStatus.PENDING,
            },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                title: true,
                createdAt: true,
                partnerProfileId: true,
                service: { select: { name: true } },
            },
        });
        const postsByProfile = new Map();
        for (const post of pendingPosts) {
            const list = postsByProfile.get(post.partnerProfileId) ?? [];
            list.push(post);
            postsByProfile.set(post.partnerProfileId, list);
        }
        const items = grouped.map((g) => {
            const profile = profileById.get(g.partnerProfileId);
            const posts = postsByProfile.get(g.partnerProfileId) ?? [];
            return {
                partnerProfileId: g.partnerProfileId,
                userId: profile?.userId ?? '',
                fullName: profile?.user.fullName ?? '—',
                email: profile?.user.email ?? '',
                avatarUrl: profile?.avatarUrl ?? null,
                level: profile?.level ?? 1,
                pendingCount: g._count._all,
                oldestPendingAt: g._min.createdAt,
                firstPostId: posts[0]?.id ?? null,
                posts: posts.map((p) => ({
                    id: p.id,
                    title: p.title,
                    serviceName: p.service.name,
                    createdAt: p.createdAt,
                })),
            };
        });
        return paginated(items, totalGroups.length, page);
    }
    async getServicePostDetail(id) {
        const item = await this.prisma.partnerServicePost.findUnique({
            where: { id },
            include: {
                service: {
                    select: {
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
                    },
                },
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
                        user: { select: { id: true, fullName: true, email: true } },
                    },
                },
            },
        });
        if (!item)
            throw new common_1.NotFoundException('Không tìm thấy bài đăng');
        let images = [];
        if (item.imagesJson) {
            try {
                const parsed = JSON.parse(item.imagesJson);
                if (Array.isArray(parsed)) {
                    images = parsed.filter((u) => typeof u === 'string');
                }
            }
            catch {
            }
        }
        if (!images.length && item.coverUrl)
            images = [item.coverUrl];
        const offering = await this.prisma.partnerService.findFirst({
            where: {
                partnerProfileId: item.partnerProfileId,
                serviceId: item.serviceId,
                isActive: true,
            },
            select: {
                id: true,
                price: true,
                headline: true,
                experienceYears: true,
                includes: true,
                excludes: true,
                coverageNote: true,
            },
        });
        const siblingPending = await this.prisma.partnerServicePost.findMany({
            where: {
                partnerProfileId: item.partnerProfileId,
                status: client_1.PartnerServicePostStatus.PENDING,
            },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                title: true,
                service: { select: { name: true } },
            },
        });
        return {
            post: {
                id: item.id,
                title: item.title,
                body: item.body,
                coverUrl: images[0] ?? item.coverUrl,
                images,
                serviceId: item.serviceId,
                status: item.status,
                rejectReason: item.rejectReason,
                reviewedAt: item.reviewedAt,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                service: item.service,
            },
            seller: {
                userId: item.partnerProfile.userId,
                fullName: item.partnerProfile.user.fullName,
                email: item.partnerProfile.user.email,
                headline: item.partnerProfile.headline,
                city: item.partnerProfile.city,
                avatarUrl: item.partnerProfile.avatarUrl,
                level: item.partnerProfile.level,
                isVerified: item.partnerProfile.isVerified,
                phoneVerified: item.partnerProfile.phoneVerified,
                bankVerified: item.partnerProfile.bankVerified,
                ratingAvg: item.partnerProfile.ratingAvg,
                ratingCount: item.partnerProfile.ratingCount,
                responseMinutes: item.partnerProfile.responseMinutes,
                acceptingJobs: item.partnerProfile.acceptingJobs,
            },
            offering: offering
                ? {
                    id: offering.id,
                    price: offering.price,
                    headline: offering.headline,
                    experienceYears: offering.experienceYears,
                    includes: offering.includes,
                    excludes: offering.excludes,
                    coverageNote: offering.coverageNote,
                    unit: item.service.unit,
                }
                : null,
            siblingPending: siblingPending.map((p) => ({
                id: p.id,
                title: p.title,
                serviceName: p.service.name,
            })),
        };
    }
    async listServicePosts(query) {
        const page = resolvePage(query);
        const q = query.q?.trim();
        const status = query.status;
        const where = {
            ...(status ? { status } : {}),
            ...(q
                ? {
                    OR: [
                        { title: { contains: q } },
                        { body: { contains: q } },
                        {
                            partnerProfile: {
                                user: { fullName: { contains: q } },
                            },
                        },
                        { service: { name: { contains: q } } },
                    ],
                }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.partnerServicePost.findMany({
                where,
                skip: page.skip,
                take: page.take,
                orderBy: [
                    { status: 'asc' },
                    { createdAt: 'desc' },
                ],
                include: {
                    service: {
                        select: {
                            id: true,
                            slug: true,
                            name: true,
                            category: {
                                select: {
                                    name: true,
                                    group: { select: { name: true, slug: true } },
                                },
                            },
                        },
                    },
                    partnerProfile: {
                        select: {
                            userId: true,
                            user: { select: { id: true, fullName: true, email: true } },
                        },
                    },
                },
            }),
            this.prisma.partnerServicePost.count({ where }),
        ]);
        return paginated(items.map((item) => {
            let images = [];
            if (item.imagesJson) {
                try {
                    const parsed = JSON.parse(item.imagesJson);
                    if (Array.isArray(parsed)) {
                        images = parsed.filter((u) => typeof u === 'string');
                    }
                }
                catch {
                }
            }
            if (!images.length && item.coverUrl)
                images = [item.coverUrl];
            return {
                id: item.id,
                title: item.title,
                body: item.body,
                coverUrl: images[0] ?? item.coverUrl,
                images,
                status: item.status,
                rejectReason: item.rejectReason,
                reviewedAt: item.reviewedAt,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                service: item.service,
                partner: {
                    userId: item.partnerProfile.userId,
                    fullName: item.partnerProfile.user.fullName,
                    email: item.partnerProfile.user.email,
                },
            };
        }), total, page);
    }
    async reviewServicePost(id, adminUserId, dto) {
        const post = await this.prisma.partnerServicePost.findUnique({
            where: { id },
        });
        if (!post)
            throw new common_1.NotFoundException('Không tìm thấy bài đăng');
        if (dto.status !== client_1.PartnerServicePostStatus.APPROVED &&
            dto.status !== client_1.PartnerServicePostStatus.REJECTED) {
            throw new common_1.BadRequestException('Chỉ duyệt hoặc từ chối bài đăng.');
        }
        if (dto.status === client_1.PartnerServicePostStatus.REJECTED &&
            !dto.rejectReason?.trim()) {
            throw new common_1.BadRequestException('Cần ghi lý do từ chối.');
        }
        const updated = await this.prisma.partnerServicePost.update({
            where: { id },
            data: {
                status: dto.status,
                rejectReason: dto.status === client_1.PartnerServicePostStatus.REJECTED
                    ? dto.rejectReason.trim()
                    : null,
                reviewedAt: new Date(),
                reviewedById: adminUserId,
            },
            include: {
                service: { select: { id: true, slug: true, name: true } },
                partnerProfile: {
                    select: {
                        userId: true,
                        user: { select: { id: true, fullName: true } },
                    },
                },
            },
        });
        return {
            id: updated.id,
            title: updated.title,
            status: updated.status,
            rejectReason: updated.rejectReason,
            reviewedAt: updated.reviewedAt,
            service: updated.service,
            partner: {
                userId: updated.partnerProfile.userId,
                fullName: updated.partnerProfile.user.fullName,
            },
        };
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