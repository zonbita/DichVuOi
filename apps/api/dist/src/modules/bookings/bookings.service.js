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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../database/prisma/client");
const contact_privacy_1 = require("../../common/contact-privacy");
const assert_not_blocked_1 = require("../../common/assert-not-blocked");
const booking_requirements_1 = require("../../common/booking-requirements");
const escrow_1 = require("../../common/escrow");
const recalculate_partner_level_1 = require("../../common/recalculate-partner-level");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const finance_service_1 = require("../finance/finance.service");
const partner_realtime_service_1 = require("./partner-realtime.service");
const CONFIRM_WINDOW_HOURS = 48;
const applicationInclude = {
    partner: {
        select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            partnerProfile: {
                select: {
                    headline: true,
                    ratingAvg: true,
                    ratingCount: true,
                    level: true,
                    avatarUrl: true,
                    city: true,
                    isVerified: true,
                    phoneVerified: true,
                    bankVerified: true,
                    onlineSeconds: true,
                    offerings: {
                        select: { serviceId: true, price: true },
                    },
                },
            },
            reputationPeriods: {
                orderBy: { periodIndex: 'desc' },
                take: 1,
                select: { currentPoints: true },
            },
        },
    },
};
const bookingInclude = {
    service: {
        include: {
            category: {
                include: { group: true },
            },
        },
    },
    partner: {
        select: { id: true, fullName: true, phone: true, email: true },
    },
    user: {
        select: { id: true, fullName: true, phone: true, email: true },
    },
    reviews: {
        select: {
            id: true,
            fromUserId: true,
            toUserId: true,
            rating: true,
            comment: true,
            createdAt: true,
        },
    },
    requirements: {
        orderBy: { sortOrder: 'asc' },
    },
    applications: {
        orderBy: { createdAt: 'asc' },
        include: applicationInclude,
    },
};
let BookingsService = class BookingsService {
    prisma;
    realtime;
    finance;
    constructor(prisma, realtime, finance) {
        this.prisma = prisma;
        this.realtime = realtime;
        this.finance = finance;
    }
    viewerRole(booking, viewer, mode) {
        if (mode === 'open_queue')
            return 'open_queue';
        if (!viewer)
            return 'customer';
        if (viewer.role === client_1.Role.ADMIN)
            return 'admin';
        if (booking.partnerId && booking.partnerId === viewer.id)
            return 'partner';
        if (booking.userId === viewer.id)
            return 'customer';
        return 'customer';
    }
    shape(booking, viewer, mode) {
        const shaped = (0, contact_privacy_1.shapeBookingForViewer)(booking, this.viewerRole(booking, viewer, mode));
        const apps = Array.isArray(shaped.applications)
            ? shaped.applications
            : undefined;
        const viewerApplications = viewer &&
            viewer.role === client_1.Role.PARTNER &&
            booking.userId !== viewer.id &&
            apps
            ? apps.filter((a) => a.partnerId === viewer.id)
            : undefined;
        if (mode === 'open_queue') {
            const { applications: _drop, ...rest } = shaped;
            return {
                ...rest,
                applicationCount: apps?.length ?? 0,
                applications: viewerApplications,
                applyDepositAmount: (0, escrow_1.computeApplyDeposit)(Number(booking.totalPrice ?? 0), Number(booking.applyDepositBps ??
                    1000)),
                applyDepositBps: Number(booking.applyDepositBps ?? 1000),
                applyDepositPercent: Math.round(Number(booking.applyDepositBps ??
                    1000) / 100),
            };
        }
        if (viewerApplications) {
            return {
                ...shaped,
                applications: viewerApplications,
            };
        }
        return shaped;
    }
    async emitBookingUpdate(booking, viewer) {
        if (booking.partnerId) {
            this.realtime.emitPartnerBooking(booking.partnerId, 'booking:updated', this.shape(booking, {
                id: booking.partnerId,
                role: client_1.Role.PARTNER,
            }));
        }
        this.realtime.emitCustomerBooking(booking.userId, this.shape(booking, { id: booking.userId, role: client_1.Role.CUSTOMER }));
        return viewer ? this.shape(booking, viewer) : this.shape(booking, undefined);
    }
    async seedRequirementsIfEmpty(bookingId) {
        const existing = await this.prisma.bookingRequirement.count({
            where: { bookingId },
        });
        if (existing > 0)
            return;
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            select: {
                note: true,
                serviceId: true,
                partnerId: true,
                service: { select: { name: true } },
            },
        });
        if (!booking)
            return;
        let includes;
        if (booking.partnerId) {
            includes = await this.partnerIncludes(booking.serviceId, booking.partnerId);
        }
        let seeds = (0, booking_requirements_1.buildRequirementSeeds)({
            includes,
            customerNote: booking.note,
        });
        if (seeds.length === 0 && booking.service?.name) {
            seeds = [
                {
                    content: `Thực hiện dịch vụ: ${booking.service.name}`,
                    source: client_1.RequirementSource.MANUAL,
                    sortOrder: 0,
                },
            ];
        }
        if (seeds.length === 0)
            return;
        await this.prisma.bookingRequirement.createMany({
            data: seeds.map((item) => ({
                bookingId,
                content: item.content,
                source: item.source,
                sortOrder: item.sortOrder,
            })),
        });
    }
    async partnerIncludes(serviceId, partnerUserId) {
        const offering = await this.prisma.partnerService.findFirst({
            where: {
                serviceId,
                isActive: true,
                partnerProfile: { userId: partnerUserId },
            },
            select: { includes: true },
        });
        return offering?.includes;
    }
    async settleExpiredConfirmations(bookingId) {
        const expired = await this.prisma.booking.findMany({
            where: {
                ...(bookingId ? { id: bookingId } : {}),
                status: client_1.BookingStatus.AWAITING_CONFIRM,
                paymentStatus: client_1.PaymentStatus.HELD,
                confirmDeadlineAt: { lte: new Date() },
            },
            select: {
                id: true,
                partnerId: true,
                totalPrice: true,
                commissionBps: true,
            },
        });
        for (const booking of expired) {
            const released = await this.finance.releaseBooking(booking.id, {
                expectedStatus: client_1.BookingStatus.AWAITING_CONFIRM,
                status: client_1.BookingStatus.COMPLETED,
            });
            if (released && booking.partnerId) {
                await this.refundSelectedApplyDeposit(booking.id, booking.partnerId);
                await (0, recalculate_partner_level_1.recalculatePartnerLevel)(this.prisma, booking.partnerId);
            }
        }
    }
    async settleExpiredMatching(bookingId) {
        const expired = await this.prisma.booking.findMany({
            where: {
                ...(bookingId ? { id: bookingId } : {}),
                status: client_1.BookingStatus.PENDING,
                partnerId: null,
                matchingDeadlineAt: { lte: new Date() },
            },
            select: { id: true, paymentStatus: true, userId: true },
        });
        for (const booking of expired) {
            await this.refundOpenApplications(booking.id);
            if (booking.paymentStatus === client_1.PaymentStatus.HELD) {
                await this.finance.refundBooking(booking.id, {
                    status: client_1.BookingStatus.CANCELLED,
                    disputeResultNote: `Hết hạn ghép người làm (${escrow_1.MATCHING_WINDOW_DAYS} ngày) — hoàn cọc.`,
                });
            }
            else {
                await this.prisma.booking.update({
                    where: { id: booking.id },
                    data: {
                        status: client_1.BookingStatus.CANCELLED,
                        disputeResultNote: `Hết hạn ghép người làm (${escrow_1.MATCHING_WINDOW_DAYS} ngày).`,
                    },
                });
            }
            this.realtime.emitOpenRemoved(booking.id);
            const fresh = await this.prisma.booking.findUnique({
                where: { id: booking.id },
                include: bookingInclude,
            });
            if (fresh) {
                this.realtime.emitCustomerBooking(fresh.userId, this.shape(fresh, { id: fresh.userId, role: client_1.Role.CUSTOMER }));
            }
        }
    }
    async refundOpenApplications(bookingId) {
        const apps = await this.prisma.bookingApplication.findMany({
            where: {
                bookingId,
                depositStatus: client_1.PaymentStatus.HELD,
            },
        });
        for (const app of apps) {
            await this.finance.refundApplyDeposit(bookingId, app.partnerId, app.id, app.depositAmount);
            await this.prisma.bookingApplication.update({
                where: { id: app.id },
                data: {
                    depositStatus: client_1.PaymentStatus.REFUNDED,
                    status: app.status === client_1.ApplicationStatus.SELECTED ||
                        app.status === client_1.ApplicationStatus.APPLIED
                        ? client_1.ApplicationStatus.REFUNDED
                        : client_1.ApplicationStatus.REJECTED,
                },
            });
        }
    }
    async refundSelectedApplyDeposit(bookingId, partnerId) {
        const app = await this.prisma.bookingApplication.findUnique({
            where: {
                bookingId_partnerId: { bookingId, partnerId },
            },
        });
        if (!app || app.depositStatus !== client_1.PaymentStatus.HELD)
            return;
        await this.finance.refundApplyDeposit(bookingId, partnerId, app.id, app.depositAmount);
        await this.prisma.bookingApplication.update({
            where: { id: app.id },
            data: {
                depositStatus: client_1.PaymentStatus.REFUNDED,
                status: client_1.ApplicationStatus.REFUNDED,
            },
        });
    }
    async forfeitSelectedApplyDeposit(bookingId, partnerId, reason) {
        const app = await this.prisma.bookingApplication.findUnique({
            where: {
                bookingId_partnerId: { bookingId, partnerId },
            },
        });
        if (!app || app.depositStatus !== client_1.PaymentStatus.HELD)
            return;
        await this.finance.forfeitApplyDeposit(bookingId, partnerId, app.id, app.depositAmount, reason);
        await this.prisma.bookingApplication.update({
            where: { id: app.id },
            data: {
                depositStatus: client_1.PaymentStatus.RELEASED,
                status: client_1.ApplicationStatus.REJECTED,
            },
        });
    }
    async settleExpiredResponseSla(bookingId) {
        const expired = await this.prisma.booking.findMany({
            where: {
                ...(bookingId ? { id: bookingId } : {}),
                status: client_1.BookingStatus.CONFIRMED,
                partnerId: { not: null },
                responseDeadlineAt: { lte: new Date() },
            },
            select: {
                id: true,
                partnerId: true,
                userId: true,
                paymentStatus: true,
                matchingDeadlineAt: true,
            },
        });
        for (const booking of expired) {
            if (!booking.partnerId)
                continue;
            const partnerId = booking.partnerId;
            const reason = `Không vào làm trong ${escrow_1.RESPONSE_SLA_HOURS} giờ sau khi được chọn`;
            await this.forfeitSelectedApplyDeposit(booking.id, partnerId, reason);
            const matchingStillOpen = !booking.matchingDeadlineAt ||
                booking.matchingDeadlineAt.getTime() > Date.now();
            if (matchingStillOpen && booking.paymentStatus === client_1.PaymentStatus.HELD) {
                await this.prisma.booking.update({
                    where: { id: booking.id },
                    data: {
                        partnerId: null,
                        status: client_1.BookingStatus.PENDING,
                        responseDeadlineAt: null,
                        disputeResultNote: `${reason} — đã tịch thu cọc ứng tuyển, đơn mở lại hàng chờ.`,
                    },
                });
                const fresh = await this.prisma.booking.findUniqueOrThrow({
                    where: { id: booking.id },
                    include: bookingInclude,
                });
                this.realtime.emitOpenCreated(this.shape(fresh, undefined, 'open_queue'));
                this.realtime.emitPartnerBooking(partnerId, 'booking:updated', this.shape(fresh, { id: partnerId, role: client_1.Role.PARTNER }));
                this.realtime.emitCustomerBooking(fresh.userId, this.shape(fresh, { id: fresh.userId, role: client_1.Role.CUSTOMER }));
            }
            else {
                if (booking.paymentStatus === client_1.PaymentStatus.HELD) {
                    await this.finance.refundBooking(booking.id, {
                        status: client_1.BookingStatus.CANCELLED,
                        disputeResultNote: `${reason} — hết hạn ghép, hoàn cọc khách.`,
                    });
                }
                else {
                    await this.prisma.booking.update({
                        where: { id: booking.id },
                        data: {
                            status: client_1.BookingStatus.CANCELLED,
                            partnerId: null,
                            responseDeadlineAt: null,
                            disputeResultNote: reason,
                        },
                    });
                }
                this.realtime.emitOpenRemoved(booking.id);
                const fresh = await this.prisma.booking.findUnique({
                    where: { id: booking.id },
                    include: bookingInclude,
                });
                if (fresh) {
                    this.realtime.emitPartnerBooking(partnerId, 'booking:updated', this.shape(fresh, { id: partnerId, role: client_1.Role.PARTNER }));
                    this.realtime.emitCustomerBooking(fresh.userId, this.shape(fresh, { id: fresh.userId, role: client_1.Role.CUSTOMER }));
                }
            }
        }
    }
    async create(dto, customerId) {
        const service = await this.prisma.service.findUnique({
            where: { slug: dto.serviceSlug },
        });
        if (!service || !service.isActive) {
            throw new common_1.NotFoundException('Không tìm thấy dịch vụ');
        }
        const userId = customerId;
        if (!userId) {
            throw new common_1.BadRequestException('Cần đăng nhập để thuê dịch vụ');
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Không tìm thấy tài khoản');
        if (user.isBlocked) {
            throw new common_1.ForbiddenException('Tài khoản bị chặn. Bạn chỉ có thể khiếu nại hoặc chat hỗ trợ với admin.');
        }
        let partnerId;
        let totalPrice = service.basePrice;
        let status = client_1.BookingStatus.PENDING;
        let matchingDeadlineAt;
        let publishAt;
        if (dto.partnerId) {
            if (dto.publishAt) {
                throw new common_1.BadRequestException('Không hẹn giờ đăng khi thuê trực tiếp người làm');
            }
            const offering = await this.prisma.partnerService.findFirst({
                where: {
                    serviceId: service.id,
                    isActive: true,
                    partnerProfile: { userId: dto.partnerId },
                },
            });
            if (!offering) {
                throw new common_1.BadRequestException('Người làm không cung cấp dịch vụ này');
            }
            partnerId = dto.partnerId;
            totalPrice = offering.price ?? service.basePrice;
            status = client_1.BookingStatus.CONFIRMED;
        }
        else if (dto.publishAt) {
            publishAt = new Date(dto.publishAt);
            if (Number.isNaN(publishAt.getTime())) {
                throw new common_1.BadRequestException('Thời gian đăng không hợp lệ');
            }
            if (publishAt.getTime() <= Date.now()) {
                throw new common_1.BadRequestException('Thời gian đăng phải ở tương lai');
            }
            const workAt = new Date(dto.scheduledAt);
            if (Number.isNaN(workAt.getTime())) {
                throw new common_1.BadRequestException('Thời gian mong muốn không hợp lệ');
            }
            if (publishAt.getTime() >= workAt.getTime()) {
                throw new common_1.BadRequestException('Giờ đăng phải trước thời gian mong muốn làm việc');
            }
            status = client_1.BookingStatus.SCHEDULED;
        }
        else {
            matchingDeadlineAt = new Date(Date.now() + escrow_1.MATCHING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        }
        const noteResult = dto.note
            ? (0, contact_privacy_1.redactContactLeak)(dto.note)
            : { text: undefined, redacted: false };
        let budgetMin;
        let budgetMax;
        if (dto.budgetMin != null || dto.budgetMax != null) {
            const lo = dto.budgetMin ?? dto.budgetMax ?? 0;
            const hi = dto.budgetMax ?? dto.budgetMin ?? lo;
            budgetMin = Math.min(lo, hi);
            budgetMax = Math.max(lo, hi);
            if (!partnerId && budgetMax > 0) {
                totalPrice = budgetMax;
            }
        }
        const split = (0, escrow_1.computeEscrowSplit)(totalPrice);
        const depositBounds = (0, escrow_1.applyDepositPercentBounds)(totalPrice);
        let applyDepositPercent = depositBounds.defaultPercent;
        if (dto.applyDepositPercent != null) {
            const rounded = Math.round(dto.applyDepositPercent);
            if (rounded < depositBounds.min || rounded > depositBounds.max) {
                throw new common_1.BadRequestException(totalPrice > escrow_1.APPLY_DEPOSIT_BUDGET_THRESHOLD
                    ? `Ngân sách trên 5 triệu: cọc ứng tuyển từ ${depositBounds.min}% đến ${depositBounds.max}%`
                    : `Ngân sách từ 5 triệu trở xuống: cọc ứng tuyển từ ${depositBounds.min}% đến ${depositBounds.max}%`);
            }
            applyDepositPercent = rounded;
        }
        const applyDepositBps = applyDepositPercent * 100;
        const booking = await this.prisma.booking.create({
            data: {
                userId: user.id,
                serviceId: service.id,
                partnerId,
                status,
                address: dto.address,
                scheduledAt: new Date(dto.scheduledAt),
                publishAt,
                jobTitle: dto.jobTitle?.trim() || null,
                note: noteResult.text,
                budgetMin,
                budgetMax,
                applyDepositBps,
                totalPrice,
                customerName: dto.customerName || user.fullName,
                customerPhone: dto.customerPhone || user.phone || '',
                paymentStatus: client_1.PaymentStatus.UNPAID,
                commissionBps: split.commissionBps,
                commissionAmount: 0,
                partnerPayout: 0,
                matchingDeadlineAt,
            },
            include: bookingInclude,
        });
        try {
            await this.finance.holdBooking(booking.id, user.id);
        }
        catch (error) {
            await this.prisma.booking.delete({
                where: { id: booking.id },
            });
            throw error;
        }
        await this.seedRequirementsIfEmpty(booking.id);
        const fresh = await this.prisma.booking.findUniqueOrThrow({
            where: { id: booking.id },
            include: bookingInclude,
        });
        const shaped = this.shape(fresh, { id: user.id, role: user.role });
        if (fresh.status === client_1.BookingStatus.PENDING && !fresh.partnerId) {
            this.realtime.emitOpenCreated(this.shape(fresh, undefined, 'open_queue'));
        }
        if (partnerId) {
            this.realtime.emitPartnerBooking(partnerId, 'booking:assigned', shaped);
        }
        this.realtime.emitCustomerBooking(user.id, shaped);
        return shaped;
    }
    async findOne(id, viewer) {
        await this.publishDueScheduledBookings();
        await this.settleExpiredMatching(id);
        await this.settleExpiredResponseSla(id);
        await this.settleExpiredConfirmations(id);
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: bookingInclude,
        });
        if (!booking) {
            throw new common_1.NotFoundException('Không tìm thấy đơn đặt lịch');
        }
        const now = new Date();
        const isOpenBoard = booking.status === client_1.BookingStatus.PENDING &&
            !booking.partnerId &&
            booking.paymentStatus === client_1.PaymentStatus.HELD &&
            (booking.matchingDeadlineAt == null ||
                booking.matchingDeadlineAt > now);
        if (viewer && viewer.role !== client_1.Role.ADMIN) {
            const isCustomer = booking.userId === viewer.id;
            const isAssignedPartner = booking.partnerId === viewer.id;
            const isApplicant = !isCustomer &&
                !isAssignedPartner &&
                (await this.prisma.bookingApplication.findFirst({
                    where: {
                        bookingId: id,
                        partnerId: viewer.id,
                        status: {
                            in: [client_1.ApplicationStatus.APPLIED, client_1.ApplicationStatus.SELECTED],
                        },
                    },
                    select: { id: true },
                }));
            if (!isCustomer && !isAssignedPartner && !isApplicant && !isOpenBoard) {
                throw new common_1.ForbiddenException('Không xem được đơn này');
            }
        }
        if ((booking.partnerId || booking.note) &&
            (booking.requirements?.length ?? 0) === 0) {
            await this.seedRequirementsIfEmpty(id);
            const refreshed = await this.prisma.booking.findUniqueOrThrow({
                where: { id },
                include: bookingInclude,
            });
            const useOpenQueue = Boolean(viewer) &&
                viewer.role !== client_1.Role.ADMIN &&
                refreshed.userId !== viewer.id &&
                refreshed.partnerId !== viewer.id;
            return this.shape(refreshed, viewer, useOpenQueue ? 'open_queue' : undefined);
        }
        const useOpenQueue = Boolean(viewer) &&
            viewer.role !== client_1.Role.ADMIN &&
            booking.userId !== viewer.id &&
            booking.partnerId !== viewer.id;
        return this.shape(booking, viewer, useOpenQueue ? 'open_queue' : undefined);
    }
    async listMineAsCustomer(userId) {
        await this.publishDueScheduledBookings();
        await this.settleExpiredMatching();
        await this.settleExpiredResponseSla();
        await this.settleExpiredConfirmations();
        const rows = await this.prisma.booking.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: bookingInclude,
        });
        return rows.map((b) => this.shape(b, { id: userId, role: client_1.Role.CUSTOMER }));
    }
    async publishDueScheduledBookings() {
        const now = new Date();
        const due = await this.prisma.booking.findMany({
            where: {
                status: client_1.BookingStatus.SCHEDULED,
                partnerId: null,
                publishAt: { lte: now },
            },
            include: bookingInclude,
        });
        for (const booking of due) {
            const matchingDeadlineAt = new Date(now.getTime() + escrow_1.MATCHING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
            const updated = await this.prisma.booking.update({
                where: { id: booking.id },
                data: {
                    status: client_1.BookingStatus.PENDING,
                    matchingDeadlineAt,
                },
                include: bookingInclude,
            });
            this.realtime.emitOpenCreated(this.shape(updated, undefined, 'open_queue'));
            this.realtime.emitCustomerBooking(updated.userId, this.shape(updated, { id: updated.userId, role: client_1.Role.CUSTOMER }));
        }
    }
    async listCustomerPublishSchedule(userId, year, month) {
        await this.publishDueScheduledBookings();
        const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const end = new Date(year, month, 1, 0, 0, 0, 0);
        const daysInMonth = new Date(year, month, 0).getDate();
        const rows = await this.prisma.booking.findMany({
            where: {
                userId,
                publishAt: { gte: start, lt: end },
                status: { not: client_1.BookingStatus.CANCELLED },
            },
            orderBy: { publishAt: 'asc' },
            include: bookingInclude,
        });
        const PUBLISH_SLOT_MIN = 30;
        const items = rows.map((b) => {
            const shaped = this.shape(b, { id: userId, role: client_1.Role.CUSTOMER });
            const startAt = new Date(b.publishAt);
            const endAt = new Date(startAt.getTime() + PUBLISH_SLOT_MIN * 60_000);
            const startHour = startAt.getHours() +
                startAt.getMinutes() / 60 +
                startAt.getSeconds() / 3600;
            const endHourRaw = endAt.getHours() + endAt.getMinutes() / 60 + endAt.getSeconds() / 3600;
            const crossesDay = endAt.getDate() !== startAt.getDate();
            const endHour = crossesDay ? 24 : Math.max(startHour + 0.25, endHourRaw);
            return {
                ...shaped,
                day: startAt.getDate(),
                startHour,
                endHour,
                durationMin: PUBLISH_SLOT_MIN,
                durationHours: Math.round((PUBLISH_SLOT_MIN / 60) * 100) / 100,
            };
        });
        return { year, month, daysInMonth, items };
    }
    async getRebookHints(userId) {
        const rows = await this.prisma.booking.findMany({
            where: {
                userId,
                status: client_1.BookingStatus.COMPLETED,
                partnerId: { not: null },
            },
            orderBy: { scheduledAt: 'desc' },
            select: {
                partnerId: true,
                totalPrice: true,
                scheduledAt: true,
                partner: {
                    select: {
                        id: true,
                        fullName: true,
                        partnerProfile: { select: { avatarUrl: true } },
                    },
                },
                service: {
                    select: { slug: true, name: true, category: { select: { group: { select: { slug: true } } } } },
                },
            },
        });
        const byKey = new Map();
        for (const row of rows) {
            if (!row.partnerId || !row.partner)
                continue;
            const key = `${row.partnerId}:${row.service.slug}`;
            const existing = byKey.get(key);
            if (!existing) {
                byKey.set(key, {
                    partnerUserId: row.partnerId,
                    partnerName: row.partner.fullName,
                    partnerAvatarUrl: row.partner.partnerProfile?.avatarUrl ?? null,
                    serviceSlug: row.service.slug,
                    serviceName: row.service.name,
                    groupSlug: row.service.category.group.slug,
                    lastBookedAt: row.scheduledAt,
                    lastPrice: row.totalPrice,
                    bookingCount: 1,
                });
            }
            else {
                existing.bookingCount += 1;
            }
        }
        return [...byKey.values()]
            .sort((a, b) => b.lastBookedAt.getTime() - a.lastBookedAt.getTime())
            .slice(0, 12)
            .map((item) => ({
            ...item,
            lastBookedAt: item.lastBookedAt.toISOString(),
        }));
    }
    async listMineAsPartner(partnerId) {
        await this.settleExpiredResponseSla();
        await this.settleExpiredConfirmations();
        const rows = await this.prisma.booking.findMany({
            where: {
                OR: [
                    { partnerId },
                    {
                        applications: {
                            some: {
                                partnerId,
                                status: {
                                    in: [client_1.ApplicationStatus.APPLIED, client_1.ApplicationStatus.SELECTED],
                                },
                            },
                        },
                    },
                ],
            },
            orderBy: { updatedAt: 'desc' },
            include: bookingInclude,
        });
        for (const row of rows) {
            if ((row.requirements?.length ?? 0) === 0 &&
                (row.partnerId === partnerId || row.note)) {
                await this.seedRequirementsIfEmpty(row.id);
            }
        }
        const fresh = await this.prisma.booking.findMany({
            where: {
                OR: [
                    { partnerId },
                    {
                        applications: {
                            some: {
                                partnerId,
                                status: {
                                    in: [client_1.ApplicationStatus.APPLIED, client_1.ApplicationStatus.SELECTED],
                                },
                            },
                        },
                    },
                ],
            },
            orderBy: { updatedAt: 'desc' },
            include: bookingInclude,
        });
        return fresh.map((b) => {
            const assigned = b.partnerId === partnerId;
            return this.shape(b, { id: partnerId, role: client_1.Role.PARTNER }, assigned ? undefined : 'open_queue');
        });
    }
    async listPartnerSchedule(partnerId, year, month) {
        const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const end = new Date(year, month, 1, 0, 0, 0, 0);
        const daysInMonth = new Date(year, month, 0).getDate();
        const rows = await this.prisma.booking.findMany({
            where: {
                partnerId,
                scheduledAt: { gte: start, lt: end },
                status: { not: client_1.BookingStatus.CANCELLED },
            },
            orderBy: { scheduledAt: 'asc' },
            include: bookingInclude,
        });
        const items = rows.map((b) => {
            const shaped = this.shape(b, { id: partnerId, role: client_1.Role.PARTNER });
            const startAt = new Date(b.scheduledAt);
            const durationMin = b.service.durationMin || 60;
            const endAt = new Date(startAt.getTime() + durationMin * 60_000);
            const startHour = startAt.getHours() + startAt.getMinutes() / 60 + startAt.getSeconds() / 3600;
            const endHourRaw = endAt.getHours() + endAt.getMinutes() / 60 + endAt.getSeconds() / 3600;
            const crossesDay = endAt.getDate() !== startAt.getDate();
            const endHour = crossesDay ? 24 : Math.max(startHour + 0.25, endHourRaw);
            return {
                ...shaped,
                day: startAt.getDate(),
                startHour,
                endHour,
                durationMin,
                durationHours: Math.round((durationMin / 60) * 100) / 100,
            };
        });
        return { year, month, daysInMonth, items };
    }
    async listOpen(viewerId, limit) {
        await this.publishDueScheduledBookings();
        await this.settleExpiredMatching();
        await this.settleExpiredResponseSla();
        const take = limit != null && Number.isFinite(limit)
            ? Math.min(Math.max(Math.floor(limit), 1), 48)
            : undefined;
        const rows = await this.prisma.booking.findMany({
            where: {
                status: client_1.BookingStatus.PENDING,
                partnerId: null,
                paymentStatus: client_1.PaymentStatus.HELD,
                OR: [
                    { matchingDeadlineAt: null },
                    { matchingDeadlineAt: { gt: new Date() } },
                ],
            },
            orderBy: { createdAt: 'desc' },
            ...(take ? { take } : {}),
            include: bookingInclude,
        });
        const viewer = viewerId ? { id: viewerId, role: client_1.Role.PARTNER } : undefined;
        return rows.map((b) => this.shape(b, viewer, 'open_queue'));
    }
    async listOpenBoard(page = 1, pageSize = 8) {
        await this.publishDueScheduledBookings();
        await this.settleExpiredMatching();
        await this.settleExpiredResponseSla();
        const safePage = Math.max(1, Math.floor(page) || 1);
        const safeSize = Math.min(Math.max(Math.floor(pageSize) || 8, 1), 48);
        const where = {
            status: client_1.BookingStatus.PENDING,
            partnerId: null,
            paymentStatus: client_1.PaymentStatus.HELD,
            OR: [
                { matchingDeadlineAt: null },
                { matchingDeadlineAt: { gt: new Date() } },
            ],
        };
        const [total, rows] = await Promise.all([
            this.prisma.booking.count({ where }),
            this.prisma.booking.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (safePage - 1) * safeSize,
                take: safeSize,
                include: bookingInclude,
            }),
        ]);
        const pageCount = Math.max(1, Math.ceil(total / safeSize));
        return {
            items: rows.map((b) => this.shape(b, undefined, 'open_queue')),
            total,
            page: safePage,
            pageSize: safeSize,
            pageCount,
        };
    }
    async getPublicOpenBooking(id) {
        await this.publishDueScheduledBookings();
        await this.settleExpiredMatching(id);
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: bookingInclude,
        });
        if (!booking) {
            throw new common_1.NotFoundException('Không tìm thấy đơn');
        }
        const now = new Date();
        const isOpen = booking.status === client_1.BookingStatus.PENDING &&
            !booking.partnerId &&
            booking.paymentStatus === client_1.PaymentStatus.HELD &&
            (booking.matchingDeadlineAt == null ||
                booking.matchingDeadlineAt > now);
        if (!isOpen) {
            throw new common_1.NotFoundException('Đơn không còn mở trên bảng tin');
        }
        return this.shape(booking, undefined, 'open_queue');
    }
    async listPublicActivity(limit = 12) {
        const take = Math.min(Math.max(Math.floor(limit) || 12, 1), 24);
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [opens, apps, dones] = await Promise.all([
            this.prisma.booking.findMany({
                where: {
                    status: client_1.BookingStatus.PENDING,
                    partnerId: null,
                    paymentStatus: client_1.PaymentStatus.HELD,
                    createdAt: { gte: since },
                },
                orderBy: { createdAt: 'desc' },
                take,
                select: {
                    id: true,
                    createdAt: true,
                    jobTitle: true,
                    service: {
                        select: {
                            name: true,
                            category: { select: { group: { select: { slug: true } } } },
                        },
                    },
                },
            }),
            this.prisma.bookingApplication.findMany({
                where: { createdAt: { gte: since }, status: client_1.ApplicationStatus.APPLIED },
                orderBy: { createdAt: 'desc' },
                take,
                select: {
                    id: true,
                    createdAt: true,
                    booking: {
                        select: {
                            jobTitle: true,
                            service: {
                                select: {
                                    name: true,
                                    category: { select: { group: { select: { slug: true } } } },
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.booking.findMany({
                where: {
                    status: client_1.BookingStatus.COMPLETED,
                    OR: [
                        { releasedAt: { gte: since } },
                        { updatedAt: { gte: since } },
                    ],
                },
                orderBy: [{ releasedAt: 'desc' }, { updatedAt: 'desc' }],
                take,
                select: {
                    id: true,
                    releasedAt: true,
                    updatedAt: true,
                    jobTitle: true,
                    service: {
                        select: {
                            name: true,
                            category: { select: { group: { select: { slug: true } } } },
                        },
                    },
                },
            }),
        ]);
        const titleOf = (jobTitle, serviceName) => jobTitle?.trim() || serviceName;
        const items = [
            ...opens.map((b) => ({
                id: `open-${b.id}`,
                kind: 'open',
                title: titleOf(b.jobTitle, b.service.name),
                serviceName: b.service.name,
                groupSlug: b.service.category?.group?.slug ?? null,
                at: b.createdAt.toISOString(),
            })),
            ...apps.map((a) => ({
                id: `apply-${a.id}`,
                kind: 'apply',
                title: titleOf(a.booking.jobTitle, a.booking.service.name),
                serviceName: a.booking.service.name,
                groupSlug: a.booking.service.category?.group?.slug ?? null,
                at: a.createdAt.toISOString(),
            })),
            ...dones.map((b) => ({
                id: `done-${b.id}`,
                kind: 'completed',
                title: titleOf(b.jobTitle, b.service.name),
                serviceName: b.service.name,
                groupSlug: b.service.category?.group?.slug ?? null,
                at: (b.releasedAt ?? b.updatedAt).toISOString(),
            })),
        ]
            .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
            .slice(0, take);
        return { items };
    }
    async listRecentCompletedPublic(limit = 8) {
        const take = Math.min(Math.max(Math.floor(limit) || 8, 1), 24);
        const rows = await this.prisma.booking.findMany({
            where: {
                status: client_1.BookingStatus.COMPLETED,
                partnerId: { not: null },
                partner: { partnerProfile: { isNot: null } },
            },
            orderBy: [{ releasedAt: 'desc' }, { updatedAt: 'desc' }],
            take: take * 3,
            select: {
                id: true,
                partnerId: true,
                releasedAt: true,
                updatedAt: true,
                service: { select: { name: true, slug: true } },
                partner: {
                    select: {
                        id: true,
                        fullName: true,
                        partnerProfile: { select: { avatarUrl: true } },
                    },
                },
            },
        });
        const seenPartners = new Set();
        const items = [];
        for (const b of rows) {
            if (!b.partnerId || !b.partner)
                continue;
            if (seenPartners.has(b.partnerId))
                continue;
            seenPartners.add(b.partnerId);
            items.push({
                id: b.id,
                serviceName: b.service.name,
                serviceSlug: b.service.slug,
                completedAt: (b.releasedAt ?? b.updatedAt).toISOString(),
                partnerUserId: b.partnerId,
                partnerName: b.partner.fullName,
                partnerAvatarUrl: b.partner.partnerProfile?.avatarUrl ?? null,
            });
            if (items.length >= take)
                break;
        }
        return { items };
    }
    async accept(id, partnerId) {
        return this.apply(id, partnerId, {});
    }
    async apply(id, partnerId, dto = {}) {
        await (0, assert_not_blocked_1.assertUserNotBlocked)(this.prisma, partnerId);
        await this.settleExpiredMatching(id);
        const booking = await this.prisma.booking.findUnique({ where: { id } });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn');
        if (booking.status !== client_1.BookingStatus.PENDING || booking.partnerId) {
            throw new common_1.BadRequestException('Đơn không còn mở để ứng tuyển');
        }
        if (booking.matchingDeadlineAt &&
            booking.matchingDeadlineAt.getTime() <= Date.now()) {
            throw new common_1.BadRequestException('Đã hết hạn ghép người làm cho đơn này');
        }
        if (!(0, contact_privacy_1.isDepositHeld)(booking.paymentStatus)) {
            throw new common_1.BadRequestException('Khách chưa đặt cọc giữ chỗ — không thể ứng tuyển');
        }
        const offering = await this.prisma.partnerService.findFirst({
            where: {
                serviceId: booking.serviceId,
                isActive: true,
                partnerProfile: { userId: partnerId, acceptingJobs: true },
            },
        });
        if (!offering) {
            throw new common_1.BadRequestException('Hồ sơ bạn chưa có đăng ký nghề này');
        }
        const existing = await this.prisma.bookingApplication.findUnique({
            where: {
                bookingId_partnerId: { bookingId: id, partnerId },
            },
        });
        if (existing &&
            (existing.status === client_1.ApplicationStatus.APPLIED ||
                existing.status === client_1.ApplicationStatus.SELECTED) &&
            existing.depositStatus === client_1.PaymentStatus.HELD) {
            throw new common_1.BadRequestException('Bạn đã ứng tuyển đơn này');
        }
        const depositAmount = (0, escrow_1.computeApplyDeposit)(booking.totalPrice, booking.applyDepositBps);
        const noteResult = dto.note
            ? (0, contact_privacy_1.redactContactLeak)(dto.note)
            : { text: undefined };
        if (existing) {
            await this.prisma.bookingApplication.delete({
                where: { id: existing.id },
            });
        }
        const created = await this.prisma.bookingApplication.create({
            data: {
                bookingId: id,
                partnerId,
                depositAmount,
                depositStatus: depositAmount > 0 ? client_1.PaymentStatus.UNPAID : client_1.PaymentStatus.HELD,
                status: client_1.ApplicationStatus.APPLIED,
                note: noteResult.text,
            },
        });
        const applicationId = created.id;
        if (depositAmount > 0) {
            try {
                await this.finance.holdApplyDeposit(id, partnerId, applicationId, {
                    amount: depositAmount,
                });
                await this.prisma.bookingApplication.update({
                    where: { id: applicationId },
                    data: { depositStatus: client_1.PaymentStatus.HELD },
                });
            }
            catch (err) {
                await this.prisma.bookingApplication.delete({
                    where: { id: applicationId },
                });
                throw err;
            }
        }
        const fresh = await this.prisma.booking.findUniqueOrThrow({
            where: { id },
            include: bookingInclude,
        });
        const shapedCustomer = this.shape(fresh, {
            id: fresh.userId,
            role: client_1.Role.CUSTOMER,
        });
        this.realtime.emitCustomerBooking(fresh.userId, shapedCustomer);
        if (!fresh.partnerId && fresh.status === client_1.BookingStatus.PENDING) {
            this.realtime.emitOpenCreated(this.shape(fresh, undefined, 'open_queue'));
        }
        return {
            booking: this.shape(fresh, { id: partnerId, role: client_1.Role.PARTNER }),
            application: fresh.applications.find((a) => a.partnerId === partnerId),
            depositAmount,
        };
    }
    async selectApplicant(bookingId, applicationId, viewer) {
        await this.settleExpiredMatching(bookingId);
        await this.settleExpiredResponseSla(bookingId);
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { applications: true },
        });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn');
        if (viewer.role !== client_1.Role.ADMIN && booking.userId !== viewer.id) {
            throw new common_1.ForbiddenException('Chỉ chủ đơn chọn người làm');
        }
        if (booking.status !== client_1.BookingStatus.PENDING || booking.partnerId) {
            throw new common_1.BadRequestException('Đơn đã có người làm hoặc không còn mở');
        }
        if (!(0, contact_privacy_1.isDepositHeld)(booking.paymentStatus)) {
            throw new common_1.BadRequestException('Chưa đặt cọc giữ chỗ');
        }
        const selected = booking.applications.find((a) => a.id === applicationId);
        if (!selected || selected.status !== client_1.ApplicationStatus.APPLIED) {
            throw new common_1.BadRequestException('Ứng viên không hợp lệ hoặc đã xử lý');
        }
        if (selected.depositStatus !== client_1.PaymentStatus.HELD) {
            throw new common_1.BadRequestException('Cọc ứng tuyển của người này không còn giữ');
        }
        for (const app of booking.applications) {
            if (app.id === selected.id)
                continue;
            if (app.depositStatus === client_1.PaymentStatus.HELD) {
                await this.finance.refundApplyDeposit(bookingId, app.partnerId, app.id, app.depositAmount);
            }
            await this.prisma.bookingApplication.update({
                where: { id: app.id },
                data: {
                    status: client_1.ApplicationStatus.REJECTED,
                    depositStatus: app.depositStatus === client_1.PaymentStatus.HELD
                        ? client_1.PaymentStatus.REFUNDED
                        : app.depositStatus,
                },
            });
        }
        await this.prisma.bookingApplication.update({
            where: { id: selected.id },
            data: { status: client_1.ApplicationStatus.SELECTED },
        });
        const responseDeadlineAt = new Date(Date.now() + escrow_1.RESPONSE_SLA_HOURS * 60 * 60 * 1000);
        await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                partnerId: selected.partnerId,
                status: client_1.BookingStatus.CONFIRMED,
                responseDeadlineAt,
                disputeResultNote: null,
            },
        });
        await this.seedRequirementsIfEmpty(bookingId);
        const withReqs = await this.prisma.booking.findUniqueOrThrow({
            where: { id: bookingId },
            include: bookingInclude,
        });
        const shaped = this.shape(withReqs, viewer);
        this.realtime.emitOpenRemoved(bookingId);
        this.realtime.emitPartnerBooking(selected.partnerId, 'booking:assigned', this.shape(withReqs, { id: selected.partnerId, role: client_1.Role.PARTNER }));
        this.realtime.emitCustomerBooking(withReqs.userId, this.shape(withReqs, { id: withReqs.userId, role: client_1.Role.CUSTOMER }));
        return shaped;
    }
    async listApplications(bookingId, viewer) {
        await this.settleExpiredMatching(bookingId);
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            select: { userId: true, partnerId: true },
        });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn');
        if (viewer.role !== client_1.Role.ADMIN &&
            booking.userId !== viewer.id &&
            booking.partnerId !== viewer.id) {
            throw new common_1.ForbiddenException('Không xem được danh sách ứng tuyển');
        }
        return this.prisma.bookingApplication.findMany({
            where: { bookingId },
            orderBy: { createdAt: 'asc' },
            include: applicationInclude,
        });
    }
    async payEscrow(id, viewer) {
        const booking = await this.prisma.booking.findUnique({ where: { id } });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn');
        if (viewer.role !== client_1.Role.ADMIN && booking.userId !== viewer.id) {
            throw new common_1.ForbiddenException('Chỉ khách thuê đặt cọc đơn này');
        }
        await this.finance.holdBooking(id, booking.userId);
        const updated = await this.prisma.booking.findUniqueOrThrow({
            where: { id },
            include: bookingInclude,
        });
        const shaped = this.shape(updated, viewer);
        if (updated.status === client_1.BookingStatus.PENDING && !updated.partnerId) {
            this.realtime.emitOpenCreated(this.shape(updated, undefined, 'open_queue'));
        }
        if (updated.partnerId) {
            this.realtime.emitPartnerBooking(updated.partnerId, 'booking:updated', this.shape(updated, { id: updated.partnerId, role: client_1.Role.PARTNER }));
        }
        this.realtime.emitCustomerBooking(updated.userId, this.shape(updated, { id: updated.userId, role: client_1.Role.CUSTOMER }));
        return shaped;
    }
    async updateStatus(id, status, viewer, acceptIncomplete = false) {
        const raw = await this.prisma.booking.findUnique({
            where: { id },
            include: bookingInclude,
        });
        if (!raw)
            throw new common_1.NotFoundException('Không tìm thấy đơn đặt lịch');
        if (viewer.role !== client_1.Role.ADMIN &&
            raw.userId !== viewer.id &&
            raw.partnerId !== viewer.id) {
            throw new common_1.ForbiddenException('Không xem được đơn này');
        }
        const allowed = {
            [client_1.BookingStatus.SCHEDULED]: [client_1.BookingStatus.CANCELLED],
            [client_1.BookingStatus.PENDING]: [client_1.BookingStatus.CANCELLED],
            [client_1.BookingStatus.CONFIRMED]: [
                client_1.BookingStatus.IN_PROGRESS,
                client_1.BookingStatus.CANCELLED,
            ],
            [client_1.BookingStatus.IN_PROGRESS]: [
                client_1.BookingStatus.AWAITING_CONFIRM,
                client_1.BookingStatus.CANCELLED,
            ],
            [client_1.BookingStatus.AWAITING_CONFIRM]: [
                client_1.BookingStatus.COMPLETED,
                client_1.BookingStatus.DISPUTED,
                client_1.BookingStatus.CANCELLED,
            ],
            [client_1.BookingStatus.DISPUTED]: [
                client_1.BookingStatus.COMPLETED,
                client_1.BookingStatus.IN_PROGRESS,
                client_1.BookingStatus.AWAITING_CONFIRM,
                client_1.BookingStatus.CANCELLED,
            ],
            [client_1.BookingStatus.COMPLETED]: [],
            [client_1.BookingStatus.CANCELLED]: [],
        };
        if (!allowed[raw.status]?.includes(status)) {
            throw new common_1.BadRequestException(`Không chuyển từ ${raw.status} sang ${status}`);
        }
        if (status === client_1.BookingStatus.CANCELLED) {
            if (viewer.role !== client_1.Role.ADMIN &&
                raw.userId !== viewer.id &&
                raw.partnerId !== viewer.id) {
                throw new common_1.ForbiddenException();
            }
            if (viewer.role !== client_1.Role.ADMIN &&
                (raw.status === client_1.BookingStatus.IN_PROGRESS ||
                    raw.status === client_1.BookingStatus.AWAITING_CONFIRM ||
                    raw.status === client_1.BookingStatus.DISPUTED)) {
                throw new common_1.ForbiddenException('Không tự hủy ở giai đoạn này — dùng khiếu nại hoặc liên hệ ban kiểm duyệt');
            }
        }
        else if (status === client_1.BookingStatus.AWAITING_CONFIRM) {
            if (viewer.role !== client_1.Role.ADMIN && raw.partnerId !== viewer.id) {
                throw new common_1.ForbiddenException('Chỉ người nhận việc báo đã xong việc');
            }
        }
        else if (status === client_1.BookingStatus.COMPLETED) {
            if (viewer.role === client_1.Role.ADMIN) {
            }
            else if (raw.partnerId === viewer.id) {
                throw new common_1.ForbiddenException('Người làm báo xong → chờ xác nhận. Khách hoặc ban kiểm duyệt mới hoàn thành.');
            }
            else {
                throw new common_1.ForbiddenException('Hoàn thành thủ công chỉ cho admin. Khách dùng luồng nghiệm thu % (2 bên đồng ý).');
            }
            if (viewer.role !== client_1.Role.ADMIN) {
                throw new common_1.BadRequestException('Khách cần dùng đề xuất nghiệm thu % và hai bên cùng bấm đồng ý để hoàn thành đơn');
            }
            if (viewer.role !== client_1.Role.ADMIN &&
                raw.requirements.some((requirement) => !requirement.customerConfirmed) &&
                !acceptIncomplete) {
                throw new common_1.BadRequestException('Còn mục checklist chưa được khách xác nhận. Dùng thao tác đồng ý hoàn thành nếu chấp nhận thiếu.');
            }
        }
        else if (status === client_1.BookingStatus.DISPUTED) {
            if (viewer.role !== client_1.Role.ADMIN) {
                throw new common_1.ForbiddenException('Trạng thái tranh chấp chỉ qua gửi khiếu nại hoặc admin');
            }
        }
        else if (viewer.role !== client_1.Role.ADMIN && raw.partnerId !== viewer.id) {
            throw new common_1.ForbiddenException('Chỉ người nhận việc cập nhật tiến độ');
        }
        if (status === client_1.BookingStatus.IN_PROGRESS) {
            if (raw.paymentStatus !== client_1.PaymentStatus.HELD) {
                throw new common_1.BadRequestException('Khách chưa đặt cọc giữ chỗ. Không thể bắt đầu làm.');
            }
        }
        const data = { status };
        let settledByFinance = false;
        if (status === client_1.BookingStatus.IN_PROGRESS) {
            data.responseDeadlineAt = null;
        }
        if (status === client_1.BookingStatus.AWAITING_CONFIRM) {
            data.confirmDeadlineAt = new Date(Date.now() + CONFIRM_WINDOW_HOURS * 60 * 60 * 1000);
        }
        if (status === client_1.BookingStatus.COMPLETED) {
            if (raw.paymentStatus === client_1.PaymentStatus.HELD) {
                await this.finance.releaseBooking(id, {
                    status: client_1.BookingStatus.COMPLETED,
                });
                settledByFinance = true;
            }
            else if (raw.paymentStatus === client_1.PaymentStatus.UNPAID) {
                throw new common_1.BadRequestException('Không hoàn thành khi chưa đặt cọc giữ chỗ');
            }
            else if (raw.paymentStatus !== client_1.PaymentStatus.RELEASED) {
                throw new common_1.BadRequestException('Cọc đã hoàn — không thể hoàn thành');
            }
            data.confirmDeadlineAt = null;
            data.responseDeadlineAt = null;
        }
        if (status === client_1.BookingStatus.CANCELLED &&
            raw.paymentStatus === client_1.PaymentStatus.HELD) {
            await this.finance.refundBooking(id, {
                status: client_1.BookingStatus.CANCELLED,
            });
            settledByFinance = true;
        }
        if (status === client_1.BookingStatus.CANCELLED) {
            data.responseDeadlineAt = null;
            if (raw.status === client_1.BookingStatus.CONFIRMED &&
                raw.partnerId &&
                viewer.role !== client_1.Role.ADMIN &&
                viewer.id === raw.partnerId) {
                await this.forfeitSelectedApplyDeposit(id, raw.partnerId, 'Người làm hủy sau khi được chọn (chưa vào làm)');
            }
            else {
                await this.refundOpenApplications(id);
            }
        }
        const updated = settledByFinance
            ? await this.prisma.booking.findUniqueOrThrow({
                where: { id },
                include: bookingInclude,
            })
            : await this.prisma.booking.update({
                where: { id },
                data,
                include: bookingInclude,
            });
        if (status === client_1.BookingStatus.COMPLETED && updated.partnerId) {
            await this.refundSelectedApplyDeposit(id, updated.partnerId);
            await (0, recalculate_partner_level_1.recalculatePartnerLevel)(this.prisma, updated.partnerId);
        }
        const shaped = this.shape(updated, viewer);
        if (status === client_1.BookingStatus.CANCELLED &&
            raw.status === client_1.BookingStatus.PENDING &&
            !raw.partnerId) {
            this.realtime.emitOpenRemoved(id);
        }
        if (updated.partnerId) {
            this.realtime.emitPartnerBooking(updated.partnerId, 'booking:updated', this.shape(updated, {
                id: updated.partnerId,
                role: client_1.Role.PARTNER,
            }));
        }
        this.realtime.emitCustomerBooking(updated.userId, this.shape(updated, { id: updated.userId, role: client_1.Role.CUSTOMER }));
        return shaped;
    }
    async confirmCompletion(id, viewer, dto = {}) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: bookingInclude,
        });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn');
        if (viewer.role !== client_1.Role.ADMIN && booking.userId !== viewer.id) {
            throw new common_1.ForbiddenException('Chỉ khách thuê xác nhận hoàn thành');
        }
        if (booking.status !== client_1.BookingStatus.AWAITING_CONFIRM) {
            throw new common_1.BadRequestException('Đơn không ở trạng thái chờ xác nhận');
        }
        this.assertSettlementAllowed(booking);
        const incomplete = booking.requirements.filter((r) => !r.customerConfirmed);
        if (incomplete.length > 0 && !dto.acceptIncomplete) {
            throw new common_1.BadRequestException(`Còn ${incomplete.length} mục chưa tích xác nhận. Tích hết hoặc gửi acceptIncomplete=true nếu chấp nhận thiếu.`);
        }
        if (!booking.settlementPercent) {
            await this.proposeSettlement(id, viewer, 100);
        }
        return this.approveSettlement(id, viewer);
    }
    async proposeSettlement(id, viewer, percent) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: bookingInclude,
        });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn');
        this.assertBookingParty(booking, viewer);
        this.assertSettlementAllowed(booking);
        if (viewer.role !== client_1.Role.ADMIN && booking.userId !== viewer.id) {
            throw new common_1.ForbiddenException('Chỉ khách thuê đề xuất % nghiệm thu');
        }
        if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
            throw new common_1.BadRequestException('Phần trăm nghiệm thu phải trong khoảng 1..100');
        }
        const updated = await this.prisma.booking.update({
            where: { id },
            data: {
                settlementPercent: Math.round(percent),
                settlementProposedBy: viewer.role === client_1.Role.ADMIN ? client_1.Role.ADMIN : client_1.Role.CUSTOMER,
                customerSettlementApprovedAt: null,
                partnerSettlementApprovedAt: null,
                settlementResolvedAt: null,
            },
            include: bookingInclude,
        });
        return this.emitBookingUpdate(updated, viewer);
    }
    async approveSettlement(id, viewer) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: bookingInclude,
        });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn');
        this.assertBookingParty(booking, viewer);
        this.assertSettlementAllowed(booking);
        if (!booking.settlementPercent || booking.settlementPercent < 1) {
            throw new common_1.BadRequestException('Chưa có đề xuất % nghiệm thu');
        }
        const now = new Date();
        const data = {};
        if (viewer.role === client_1.Role.ADMIN || booking.userId === viewer.id) {
            data.customerSettlementApprovedAt = now;
        }
        if (viewer.role === client_1.Role.ADMIN || booking.partnerId === viewer.id) {
            data.partnerSettlementApprovedAt = now;
        }
        if (Object.keys(data).length === 0) {
            throw new common_1.ForbiddenException('Bạn không thuộc hai bên của đơn');
        }
        await this.prisma.booking.update({
            where: { id },
            data,
        });
        const afterApprove = await this.prisma.booking.findUniqueOrThrow({
            where: { id },
            include: bookingInclude,
        });
        const bothApproved = Boolean(afterApprove.customerSettlementApprovedAt) &&
            Boolean(afterApprove.partnerSettlementApprovedAt);
        if (!bothApproved) {
            return this.emitBookingUpdate(afterApprove, viewer);
        }
        const settledPercent = afterApprove.settlementPercent;
        if (!settledPercent) {
            throw new common_1.BadRequestException('Đề xuất % nghiệm thu không hợp lệ');
        }
        await this.finance.releaseBookingByPercent(id, settledPercent, {
            expectedStatus: client_1.BookingStatus.AWAITING_CONFIRM,
        });
        const settled = await this.prisma.booking.update({
            where: { id },
            data: { settlementResolvedAt: new Date() },
            include: bookingInclude,
        });
        if (settled.partnerId) {
            await this.refundSelectedApplyDeposit(id, settled.partnerId);
            await (0, recalculate_partner_level_1.recalculatePartnerLevel)(this.prisma, settled.partnerId);
        }
        return this.emitBookingUpdate(settled, viewer);
    }
    async addRequirement(_bookingId, _viewer, _dto) {
        throw new common_1.BadRequestException('Chỉ thêm công việc khi tạo đơn thuê. Sau khi đăng, checklist đã khóa.');
    }
    async updateRequirement(bookingId, requirementId, viewer, dto) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            select: {
                id: true,
                userId: true,
                partnerId: true,
                status: true,
            },
        });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn');
        this.assertBookingParty(booking, viewer);
        const req = await this.prisma.bookingRequirement.findFirst({
            where: { id: requirementId, bookingId },
        });
        if (!req)
            throw new common_1.NotFoundException('Không tìm thấy mục yêu cầu');
        const tickable = booking.status === client_1.BookingStatus.IN_PROGRESS ||
            booking.status === client_1.BookingStatus.AWAITING_CONFIRM ||
            booking.status === client_1.BookingStatus.DISPUTED ||
            booking.status === client_1.BookingStatus.CONFIRMED;
        if (!tickable && viewer.role !== client_1.Role.ADMIN) {
            throw new common_1.BadRequestException('Không cập nhật checklist khi đơn đã đóng');
        }
        const data = {};
        if (dto.partnerDone !== undefined) {
            if (viewer.role !== client_1.Role.ADMIN &&
                booking.partnerId !== viewer.id) {
                throw new common_1.ForbiddenException('Chỉ người làm đánh dấu «đã làm»');
            }
            data.partnerDone = dto.partnerDone;
            data.partnerDoneAt = dto.partnerDone ? new Date() : null;
        }
        if (dto.customerConfirmed !== undefined) {
            if (viewer.role !== client_1.Role.ADMIN && booking.userId !== viewer.id) {
                throw new common_1.ForbiddenException('Chỉ khách thuê tích xác nhận bàn giao');
            }
            data.customerConfirmed = dto.customerConfirmed;
            data.customerConfirmedAt = dto.customerConfirmed ? new Date() : null;
        }
        if (dto.evidenceUrl !== undefined) {
            data.evidenceUrl = dto.evidenceUrl.trim() || null;
        }
        if (Object.keys(data).length === 0) {
            throw new common_1.BadRequestException('Không có trường nào để cập nhật');
        }
        await this.prisma.bookingRequirement.update({
            where: { id: requirementId },
            data,
        });
        const updated = await this.prisma.booking.findUniqueOrThrow({
            where: { id: bookingId },
            include: bookingInclude,
        });
        return this.emitBookingUpdate(updated, viewer);
    }
    assertBookingParty(booking, viewer) {
        if (viewer.role === client_1.Role.ADMIN)
            return;
        if (booking.userId === viewer.id)
            return;
        if (booking.partnerId && booking.partnerId === viewer.id)
            return;
        throw new common_1.ForbiddenException('Chỉ khách hoặc người nhận việc được chat đơn này');
    }
    assertDepositForChat(booking) {
        if (!(0, contact_privacy_1.isDepositHeld)(booking.paymentStatus)) {
            throw new common_1.BadRequestException('Chat mở sau khi khách đặt cọc giữ chỗ trên sàn.');
        }
        if (!booking.partnerId) {
            throw new common_1.BadRequestException('Chat mở sau khi có người nhận việc. Không trao đổi SĐT ngoài sàn.');
        }
    }
    assertSettlementAllowed(booking) {
        if (booking.status !== client_1.BookingStatus.AWAITING_CONFIRM) {
            throw new common_1.BadRequestException('Chỉ thương lượng nghiệm thu khi đơn đang chờ xác nhận');
        }
        if (booking.paymentStatus !== client_1.PaymentStatus.HELD) {
            throw new common_1.BadRequestException('Cọc không còn đang giữ để thương lượng nghiệm thu');
        }
        if (!booking.partnerId) {
            throw new common_1.BadRequestException('Đơn chưa có người làm');
        }
    }
    async listMessages(bookingId, viewer) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn');
        this.assertBookingParty(booking, viewer);
        if (viewer.role !== client_1.Role.ADMIN) {
            this.assertDepositForChat(booking);
        }
        return this.prisma.bookingMessage.findMany({
            where: { bookingId },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, fullName: true } },
            },
        });
    }
    async postMessage(bookingId, viewer, dto) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn');
        this.assertBookingParty(booking, viewer);
        if (viewer.role !== client_1.Role.ADMIN) {
            this.assertDepositForChat(booking);
            const me = await this.prisma.user.findUnique({
                where: { id: viewer.id },
                select: { chatBanned: true },
            });
            if (me?.chatBanned) {
                throw new common_1.BadRequestException('Tài khoản đã bị khóa chat đơn. Liên hệ hỗ trợ hoặc gửi khiếu nại.');
            }
        }
        else if (!booking.partnerId) {
            throw new common_1.BadRequestException('Chat mở sau khi có người nhận việc. Không trao đổi SĐT ngoài sàn.');
        }
        if (booking.status === client_1.BookingStatus.CANCELLED ||
            booking.status === client_1.BookingStatus.COMPLETED) {
            throw new common_1.BadRequestException('Đơn đã đóng — không gửi thêm tin');
        }
        const { text, redacted } = (0, contact_privacy_1.redactContactLeak)(dto.body.trim());
        if (!text) {
            throw new common_1.BadRequestException('Nội dung tin nhắn trống');
        }
        const message = await this.prisma.bookingMessage.create({
            data: {
                bookingId,
                senderId: viewer.id,
                body: text,
                redacted,
            },
            include: {
                sender: { select: { id: true, fullName: true } },
            },
        });
        this.realtime.emitBookingMessage({ customerId: booking.userId, partnerId: booking.partnerId }, message);
        return message;
    }
    async createReview(bookingId, viewer, dto) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { reviews: true },
        });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn');
        if (booking.status !== client_1.BookingStatus.COMPLETED) {
            throw new common_1.BadRequestException('Chỉ đánh giá sau khi đơn hoàn thành');
        }
        if (!booking.partnerId) {
            throw new common_1.BadRequestException('Đơn chưa có người nhận việc');
        }
        const isCustomer = booking.userId === viewer.id;
        const isPartner = booking.partnerId === viewer.id;
        if (!isCustomer && !isPartner && viewer.role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Không đánh giá đơn này');
        }
        const fromUserId = viewer.id;
        const toUserId = isCustomer
            ? booking.partnerId
            : isPartner
                ? booking.userId
                : dto.toUserId || booking.partnerId;
        if (fromUserId === toUserId) {
            throw new common_1.BadRequestException('Không tự đánh giá chính mình');
        }
        const existing = booking.reviews.find((r) => r.fromUserId === fromUserId);
        if (existing) {
            throw new common_1.BadRequestException('Bạn đã đánh giá đơn này rồi');
        }
        const review = await this.prisma.review.create({
            data: {
                bookingId,
                fromUserId,
                toUserId,
                rating: dto.rating,
                comment: dto.comment?.trim() || null,
            },
        });
        if (toUserId === booking.partnerId) {
            const agg = await this.prisma.review.aggregate({
                where: { toUserId },
                _avg: { rating: true },
                _count: { rating: true },
            });
            await this.prisma.partnerProfile.updateMany({
                where: { userId: toUserId },
                data: {
                    ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10,
                    ratingCount: agg._count.rating,
                },
            });
            await (0, recalculate_partner_level_1.recalculatePartnerLevel)(this.prisma, toUserId);
        }
        return review;
    }
    async listReviews(bookingId, viewer) {
        await this.findOne(bookingId, viewer);
        return this.prisma.review.findMany({
            where: { bookingId },
            orderBy: { createdAt: 'asc' },
            include: {
                fromUser: { select: { id: true, fullName: true } },
                toUser: { select: { id: true, fullName: true } },
            },
        });
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        partner_realtime_service_1.PartnerRealtimeService,
        finance_service_1.FinanceService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map