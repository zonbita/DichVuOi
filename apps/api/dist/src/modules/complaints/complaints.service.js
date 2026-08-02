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
exports.ComplaintsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../database/prisma/client");
const partner_reputation_1 = require("../../common/partner-reputation");
const recalculate_partner_level_1 = require("../../common/recalculate-partner-level");
const reputation_service_1 = require("../../common/reputation.service");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const finance_service_1 = require("../finance/finance.service");
const complaintInclude = {
    booking: {
        select: {
            id: true,
            customerName: true,
            status: true,
            paymentStatus: true,
            partnerId: true,
            service: { select: { name: true, slug: true } },
            requirements: {
                orderBy: { sortOrder: 'asc' },
                select: {
                    id: true,
                    content: true,
                    partnerDone: true,
                    customerConfirmed: true,
                },
            },
        },
    },
    reporter: { select: { id: true, fullName: true } },
    partner: { select: { id: true, fullName: true } },
    against: { select: { id: true, fullName: true } },
    resolvedBy: { select: { id: true, fullName: true } },
};
let ComplaintsService = class ComplaintsService {
    prisma;
    reputation;
    finance;
    constructor(prisma, reputation, finance) {
        this.prisma = prisma;
        this.reputation = reputation;
        this.finance = finance;
    }
    parseRequirementIds(json) {
        if (!json)
            return [];
        try {
            const parsed = JSON.parse(json);
            return Array.isArray(parsed)
                ? parsed.filter((x) => typeof x === 'string')
                : [];
        }
        catch {
            return [];
        }
    }
    shapeComplaint(row) {
        return {
            id: row.id,
            bookingId: row.bookingId,
            category: row.category,
            description: row.description,
            status: row.status,
            deductionPoints: row.deductionPoints,
            adminNote: row.adminNote,
            resolutionAction: row.resolutionAction,
            requirementIds: this.parseRequirementIds(row.requirementIdsJson),
            evidenceNote: row.evidenceNote,
            resolvedAt: row.resolvedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            booking: row.booking,
            reporter: row.reporter,
            partner: row.partner,
            against: row.against,
            resolvedBy: row.resolvedBy,
        };
    }
    async createForBooking(bookingId, userId, dto) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            select: {
                id: true,
                userId: true,
                partnerId: true,
                status: true,
                paymentStatus: true,
            },
        });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn');
        if (!booking.partnerId) {
            throw new common_1.BadRequestException('Đơn chưa có người làm — không thể khiếu nại');
        }
        const isCustomer = booking.userId === userId;
        const isPartner = booking.partnerId === userId;
        if (!isCustomer && !isPartner) {
            throw new common_1.ForbiddenException('Chỉ khách thuê hoặc người làm của đơn mới gửi khiếu nại');
        }
        const openWindow = booking.status === client_1.BookingStatus.AWAITING_CONFIRM ||
            booking.status === client_1.BookingStatus.DISPUTED;
        if (!openWindow) {
            throw new common_1.BadRequestException('Chỉ khiếu nại khi đơn đang chờ xác nhận hoặc đang tranh chấp');
        }
        if (booking.paymentStatus !== client_1.PaymentStatus.HELD) {
            throw new common_1.BadRequestException('Cọc không còn đang giữ — không mở khiếu nại');
        }
        const existing = await this.prisma.complaint.findFirst({
            where: {
                bookingId,
                reporterUserId: userId,
                status: { in: [client_1.ComplaintStatus.SUBMITTED, client_1.ComplaintStatus.UNDER_REVIEW] },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Đã có khiếu nại đang xử lý của bạn cho đơn này');
        }
        const againstUserId = isCustomer ? booking.partnerId : booking.userId;
        const requirementIds = [...new Set((dto.requirementIds ?? []).filter(Boolean))];
        if (requirementIds.length > 0) {
            const validCount = await this.prisma.bookingRequirement.count({
                where: {
                    bookingId,
                    id: { in: requirementIds },
                },
            });
            if (validCount !== requirementIds.length) {
                throw new common_1.BadRequestException('Có mục checklist không thuộc đơn này');
            }
        }
        const row = await this.prisma.$transaction(async (tx) => {
            const complaint = await tx.complaint.create({
                data: {
                    bookingId,
                    reporterUserId: userId,
                    partnerUserId: booking.partnerId,
                    againstUserId,
                    category: dto.category.trim(),
                    description: dto.description.trim(),
                    evidenceNote: dto.evidenceNote.trim(),
                    requirementIdsJson: requirementIds.length > 0 ? JSON.stringify(requirementIds) : null,
                },
                include: complaintInclude,
            });
            if (booking.status === client_1.BookingStatus.AWAITING_CONFIRM) {
                await tx.booking.update({
                    where: { id: bookingId },
                    data: {
                        status: client_1.BookingStatus.DISPUTED,
                        disputeResultNote: null,
                    },
                });
            }
            return complaint;
        });
        return this.shapeComplaint(row);
    }
    async listMineAsCustomer(userId) {
        const rows = await this.prisma.complaint.findMany({
            where: {
                OR: [{ reporterUserId: userId }, { againstUserId: userId }],
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: complaintInclude,
        });
        return rows.map((row) => this.shapeComplaint(row));
    }
    async listForAdmin(status) {
        const rows = await this.prisma.complaint.findMany({
            where: status ? { status } : undefined,
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: complaintInclude,
        });
        return rows.map((row) => this.shapeComplaint(row));
    }
    async resolveAsAdmin(complaintId, admin, dto) {
        const complaint = await this.prisma.complaint.findUnique({
            where: { id: complaintId },
            include: {
                ...complaintInclude,
                booking: {
                    select: {
                        id: true,
                        userId: true,
                        partnerId: true,
                        status: true,
                        paymentStatus: true,
                        totalPrice: true,
                        commissionBps: true,
                        customerName: true,
                        service: { select: { name: true, slug: true } },
                        requirements: {
                            orderBy: { sortOrder: 'asc' },
                            select: {
                                id: true,
                                content: true,
                                partnerDone: true,
                                customerConfirmed: true,
                            },
                        },
                    },
                },
            },
        });
        if (!complaint)
            throw new common_1.NotFoundException('Không tìm thấy khiếu nại');
        if (complaint.status === client_1.ComplaintStatus.VERIFIED ||
            complaint.status === client_1.ComplaintStatus.REJECTED) {
            throw new common_1.BadRequestException('Khiếu nại đã được xử lý');
        }
        if (dto.status === client_1.ComplaintStatus.UNDER_REVIEW) {
            const updated = await this.prisma.complaint.update({
                where: { id: complaintId },
                data: {
                    status: client_1.ComplaintStatus.UNDER_REVIEW,
                    adminNote: dto.adminNote?.trim() || null,
                    resolvedByUserId: admin.id,
                },
                include: complaintInclude,
            });
            return this.shapeComplaint(updated);
        }
        const action = dto.resolutionAction ??
            (dto.status === client_1.ComplaintStatus.REJECTED
                ? client_1.ComplaintResolutionAction.RELEASE
                : client_1.ComplaintResolutionAction.REFUND);
        const publicNote = dto.adminNote?.trim() ||
            (action === client_1.ComplaintResolutionAction.REFUND
                ? 'Ban kiểm duyệt chấp nhận khiếu nại phía khách — hoàn cọc.'
                : action === client_1.ComplaintResolutionAction.RELEASE
                    ? 'Ban kiểm duyệt quyết giải ngân / hoàn thành đơn.'
                    : action === client_1.ComplaintResolutionAction.RETRY_IN_PROGRESS
                        ? 'Ban kiểm duyệt yêu cầu làm lại — đơn quay lại đang làm.'
                        : action === client_1.ComplaintResolutionAction.RETRY_AWAITING
                            ? 'Ban kiểm duyệt yêu cầu xác nhận lại — đơn quay chờ xác nhận.'
                            : 'Ban kiểm duyệt đã ghi nhận.');
        await this.prisma.$transaction(async (tx) => {
            await tx.complaint.update({
                where: { id: complaintId },
                data: {
                    status: dto.status,
                    deductionPoints: dto.status === client_1.ComplaintStatus.VERIFIED &&
                        action === client_1.ComplaintResolutionAction.REFUND
                        ? (dto.deductionPoints ?? partner_reputation_1.REPUTATION_DEDUCTION_PRESETS.MODERATE)
                        : null,
                    adminNote: dto.adminNote?.trim() || null,
                    resolutionAction: action,
                    resolvedAt: new Date(),
                    resolvedByUserId: admin.id,
                },
            });
            const booking = complaint.booking;
            if (booking.paymentStatus !== client_1.PaymentStatus.HELD) {
                return;
            }
            if (action === client_1.ComplaintResolutionAction.REFUND) {
                await this.finance.refundBookingInTransaction(tx, booking.id, {
                    status: client_1.BookingStatus.CANCELLED,
                    disputeResultNote: publicNote,
                });
                await this.refundHeldApplyDepositsInTransaction(tx, booking.id);
            }
            else if (action === client_1.ComplaintResolutionAction.RELEASE) {
                await this.finance.releaseBookingInTransaction(tx, booking.id, {
                    status: client_1.BookingStatus.COMPLETED,
                    disputeResultNote: publicNote,
                });
                await this.refundHeldApplyDepositsInTransaction(tx, booking.id);
            }
            else if (action === client_1.ComplaintResolutionAction.RETRY_IN_PROGRESS) {
                await tx.booking.update({
                    where: { id: booking.id },
                    data: {
                        status: client_1.BookingStatus.IN_PROGRESS,
                        confirmDeadlineAt: null,
                        disputeResultNote: publicNote,
                    },
                });
            }
            else if (action === client_1.ComplaintResolutionAction.RETRY_AWAITING) {
                await tx.booking.update({
                    where: { id: booking.id },
                    data: {
                        status: client_1.BookingStatus.AWAITING_CONFIRM,
                        confirmDeadlineAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
                        disputeResultNote: publicNote,
                    },
                });
            }
            else {
                await tx.booking.update({
                    where: { id: booking.id },
                    data: { disputeResultNote: publicNote },
                });
            }
        });
        if (dto.status === client_1.ComplaintStatus.VERIFIED &&
            action === client_1.ComplaintResolutionAction.REFUND) {
            const deduction = dto.deductionPoints ?? partner_reputation_1.REPUTATION_DEDUCTION_PRESETS.MODERATE;
            await this.reputation.applyDeduction(complaint.partnerUserId, deduction, `Khiếu nại đơn ${complaint.bookingId}: ${complaint.category}`, complaintId);
        }
        if (action === client_1.ComplaintResolutionAction.RELEASE && complaint.booking.partnerId) {
            await (0, recalculate_partner_level_1.recalculatePartnerLevel)(this.prisma, complaint.booking.partnerId);
        }
        const updated = await this.prisma.complaint.findUniqueOrThrow({
            where: { id: complaintId },
            include: complaintInclude,
        });
        return this.shapeComplaint(updated);
    }
    async countPendingForAdmin() {
        return this.prisma.complaint.count({
            where: {
                status: { in: [client_1.ComplaintStatus.SUBMITTED, client_1.ComplaintStatus.UNDER_REVIEW] },
            },
        });
    }
    async refundHeldApplyDepositsInTransaction(tx, bookingId) {
        const apps = await tx.bookingApplication.findMany({
            where: {
                bookingId,
                depositStatus: client_1.PaymentStatus.HELD,
            },
        });
        for (const app of apps) {
            await this.finance.refundApplyDepositInTransaction(tx, bookingId, app.partnerId, app.id, app.depositAmount);
            await tx.bookingApplication.update({
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
};
exports.ComplaintsService = ComplaintsService;
exports.ComplaintsService = ComplaintsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        reputation_service_1.ReputationService,
        finance_service_1.FinanceService])
], ComplaintsService);
//# sourceMappingURL=complaints.service.js.map