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
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../database/prisma/client");
const crypto_1 = require("crypto");
const escrow_1 = require("../../common/escrow");
const prisma_service_1 = require("../../database/prisma/prisma.service");
let FinanceService = class FinanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    vietQrBankId = process.env.VIETQR_BANK_ID ?? '970422';
    vietQrAccountNo = process.env.VIETQR_ACCOUNT_NO ?? '19002888';
    vietQrAccountName = process.env.VIETQR_ACCOUNT_NAME ?? 'DICH VU OI';
    vietQrIntentSecret = process.env.VIETQR_INTENT_SECRET ?? 'dichvuoi-dev-vietqr-secret';
    vietQrIntentTtlMs = 15 * 60_000;
    async getWallet(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                walletBalance: true,
                walletTransactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 100,
                    include: {
                        booking: {
                            select: {
                                id: true,
                                service: { select: { name: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('Không tìm thấy tài khoản');
        return {
            currency: 'VND',
            balance: user.walletBalance,
            transactions: user.walletTransactions,
        };
    }
    async topUp(userId, amount) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id: userId },
                data: { walletBalance: { increment: amount } },
                select: { walletBalance: true },
            });
            await tx.walletTransaction.create({
                data: {
                    userId,
                    type: client_1.WalletTransactionType.TOP_UP,
                    amount,
                    balanceAfter: user.walletBalance,
                    description: 'Nạp VNĐ vào ví (mô phỏng)',
                    reference: `topup:${userId}:${(0, crypto_1.randomUUID)()}`,
                },
            });
            return {
                currency: 'VND',
                balance: user.walletBalance,
            };
        });
    }
    createVietQrIntent(userId, amount) {
        const expiresAt = new Date(Date.now() + this.vietQrIntentTtlMs);
        const intentId = this.signVietQrIntent({
            u: userId,
            a: amount,
            e: expiresAt.getTime(),
            n: (0, crypto_1.randomUUID)().slice(0, 8),
        });
        const transferNote = `DVO ${intentId.slice(0, 18)}`;
        return {
            intentId,
            amount,
            currency: 'VND',
            bankId: this.vietQrBankId,
            accountNo: this.vietQrAccountNo,
            accountName: this.vietQrAccountName,
            transferNote,
            qrImageUrl: this.vietQrImageUrl(amount, transferNote),
            expiresAt: expiresAt.toISOString(),
        };
    }
    async getVietQrIntentStatus(userId, intentId) {
        const payload = this.verifyVietQrIntent(intentId);
        if (payload.u !== userId) {
            throw new common_1.ForbiddenException('Lệnh nạp không thuộc tài khoản hiện tại');
        }
        const reference = `vietqr:paid:${intentId}`;
        const paidTx = await this.prisma.walletTransaction.findUnique({
            where: { reference },
            select: { id: true, createdAt: true, amount: true },
        });
        return {
            intentId,
            amount: payload.a,
            status: paidTx ? 'PAID' : 'PENDING',
            paidAt: paidTx?.createdAt.toISOString() ?? null,
            expiresAt: new Date(payload.e).toISOString(),
        };
    }
    async confirmVietQrIntentMock(userId, intentId) {
        const payload = this.verifyVietQrIntent(intentId);
        if (payload.u !== userId) {
            throw new common_1.ForbiddenException('Lệnh nạp không thuộc tài khoản hiện tại');
        }
        if (payload.e < Date.now()) {
            throw new common_1.BadRequestException('Mã VietQR đã hết hạn');
        }
        return this.prisma.$transaction(async (tx) => {
            const reference = `vietqr:paid:${intentId}`;
            const existing = await tx.walletTransaction.findUnique({
                where: { reference },
            });
            if (existing) {
                const current = await tx.user.findUniqueOrThrow({
                    where: { id: userId },
                    select: { walletBalance: true },
                });
                return { currency: 'VND', balance: current.walletBalance, amount: 0 };
            }
            const user = await tx.user.update({
                where: { id: userId },
                data: { walletBalance: { increment: payload.a } },
                select: { walletBalance: true },
            });
            await tx.walletTransaction.create({
                data: {
                    userId,
                    type: client_1.WalletTransactionType.TOP_UP,
                    amount: payload.a,
                    balanceAfter: user.walletBalance,
                    description: 'Nạp VNĐ qua VietQR (mock xác nhận)',
                    reference,
                },
            });
            return { currency: 'VND', balance: user.walletBalance, amount: payload.a };
        });
    }
    async listInvoices(userId) {
        return this.prisma.invoice.findMany({
            where: {
                OR: [{ customerId: userId }, { partnerId: userId }],
            },
            orderBy: { issuedAt: 'desc' },
            include: {
                booking: {
                    select: {
                        id: true,
                        status: true,
                        paymentStatus: true,
                    },
                },
                customer: { select: { id: true, fullName: true } },
                partner: { select: { id: true, fullName: true } },
            },
        });
    }
    async getInvoice(invoiceId, userId, isAdmin = false) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                booking: {
                    select: {
                        id: true,
                        status: true,
                        paymentStatus: true,
                        scheduledAt: true,
                    },
                },
                customer: {
                    select: { id: true, fullName: true, email: true, phone: true },
                },
                partner: {
                    select: { id: true, fullName: true, email: true, phone: true },
                },
            },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Không tìm thấy hóa đơn');
        if (!isAdmin &&
            invoice.customerId !== userId &&
            invoice.partnerId !== userId) {
            throw new common_1.ForbiddenException('Không xem được hóa đơn này');
        }
        return invoice;
    }
    async holdBooking(bookingId, payerId) {
        return this.prisma.$transaction(async (tx) => {
            const booking = await tx.booking.findUnique({
                where: { id: bookingId },
                include: {
                    service: { select: { name: true } },
                    user: { select: { walletBalance: true } },
                },
            });
            if (!booking)
                throw new common_1.NotFoundException('Không tìm thấy đơn');
            if (booking.userId !== payerId) {
                throw new common_1.ForbiddenException('Chỉ khách thuê thanh toán đơn này');
            }
            if (booking.status === client_1.BookingStatus.CANCELLED) {
                throw new common_1.BadRequestException('Đơn đã hủy');
            }
            if (booking.paymentStatus !== client_1.PaymentStatus.UNPAID) {
                throw new common_1.BadRequestException('Đơn đã đặt cọc hoặc đã xử lý');
            }
            if (booking.user.walletBalance < booking.totalPrice) {
                throw new common_1.BadRequestException(`Số dư ví không đủ. Cần thêm ${booking.totalPrice - booking.user.walletBalance} VNĐ`);
            }
            const debited = await tx.user.updateMany({
                where: {
                    id: booking.userId,
                    walletBalance: { gte: booking.totalPrice },
                },
                data: { walletBalance: { decrement: booking.totalPrice } },
            });
            if (debited.count !== 1) {
                throw new common_1.BadRequestException('Số dư ví không đủ');
            }
            const updatedUser = await tx.user.findUniqueOrThrow({
                where: { id: booking.userId },
                select: { walletBalance: true },
            });
            const held = await tx.booking.updateMany({
                where: {
                    id: bookingId,
                    paymentStatus: client_1.PaymentStatus.UNPAID,
                },
                data: {
                    paymentStatus: client_1.PaymentStatus.HELD,
                    paidAt: new Date(),
                },
            });
            if (held.count !== 1) {
                throw new common_1.BadRequestException('Đơn vừa được thanh toán bởi yêu cầu khác');
            }
            await tx.walletTransaction.create({
                data: {
                    userId: booking.userId,
                    bookingId,
                    type: client_1.WalletTransactionType.ESCROW_HOLD,
                    amount: -booking.totalPrice,
                    balanceAfter: updatedUser.walletBalance,
                    description: `Đặt cọc đơn ${booking.service.name}`,
                    reference: `hold:${bookingId}`,
                },
            });
            await tx.invoice.create({
                data: {
                    invoiceNumber: this.invoiceNumber(bookingId),
                    bookingId,
                    customerId: booking.userId,
                    partnerId: booking.partnerId,
                    customerName: booking.customerName,
                    serviceName: booking.service.name,
                    subtotal: booking.totalPrice,
                    currency: 'VND',
                    status: client_1.InvoiceStatus.PAID,
                },
            });
        });
    }
    async releaseBooking(bookingId, options = {}) {
        return this.prisma.$transaction((tx) => this.releaseBookingInTransaction(tx, bookingId, options));
    }
    async releaseBookingInTransaction(tx, bookingId, options = {}) {
        const booking = await tx.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn');
        if (booking.paymentStatus === client_1.PaymentStatus.RELEASED)
            return false;
        if (booking.paymentStatus !== client_1.PaymentStatus.HELD) {
            throw new common_1.BadRequestException('Escrow không ở trạng thái đang giữ');
        }
        if (!booking.partnerId) {
            throw new common_1.BadRequestException('Đơn chưa có người làm để giải ngân');
        }
        const split = (0, escrow_1.computeEscrowSplit)(booking.totalPrice, booking.commissionBps || escrow_1.DEFAULT_COMMISSION_BPS);
        const settledAt = new Date();
        const updated = await tx.booking.updateMany({
            where: {
                id: bookingId,
                paymentStatus: client_1.PaymentStatus.HELD,
                ...(options.expectedStatus
                    ? { status: options.expectedStatus }
                    : {}),
            },
            data: {
                paymentStatus: client_1.PaymentStatus.RELEASED,
                status: options.status,
                commissionAmount: split.commissionAmount,
                partnerPayout: split.partnerPayout,
                releasedAt: settledAt,
                confirmDeadlineAt: null,
                disputeResultNote: options.disputeResultNote,
            },
        });
        if (updated.count !== 1)
            return false;
        const partner = await tx.user.update({
            where: { id: booking.partnerId },
            data: { walletBalance: { increment: split.partnerPayout } },
            select: { walletBalance: true },
        });
        await tx.walletTransaction.create({
            data: {
                userId: booking.partnerId,
                bookingId,
                type: client_1.WalletTransactionType.PARTNER_PAYOUT,
                amount: split.partnerPayout,
                balanceAfter: partner.walletBalance,
                description: `Giải ngân đơn ${bookingId}`,
                reference: `payout:${bookingId}`,
            },
        });
        await tx.invoice.update({
            where: { bookingId },
            data: {
                partnerId: booking.partnerId,
                commissionAmount: split.commissionAmount,
                partnerPayout: split.partnerPayout,
                status: client_1.InvoiceStatus.SETTLED,
                settledAt,
            },
        });
        return true;
    }
    async refundBooking(bookingId, options = {}) {
        return this.prisma.$transaction((tx) => this.refundBookingInTransaction(tx, bookingId, options));
    }
    async refundBookingInTransaction(tx, bookingId, options = {}) {
        const booking = await tx.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking)
            throw new common_1.NotFoundException('Không tìm thấy đơn');
        if (booking.paymentStatus === client_1.PaymentStatus.REFUNDED)
            return false;
        if (booking.paymentStatus !== client_1.PaymentStatus.HELD) {
            throw new common_1.BadRequestException('Escrow không ở trạng thái đang giữ');
        }
        const refundedAt = new Date();
        const updated = await tx.booking.updateMany({
            where: {
                id: bookingId,
                paymentStatus: client_1.PaymentStatus.HELD,
            },
            data: {
                paymentStatus: client_1.PaymentStatus.REFUNDED,
                status: options.status,
                refundedAt,
                confirmDeadlineAt: null,
                disputeResultNote: options.disputeResultNote,
            },
        });
        if (updated.count !== 1)
            return false;
        const customer = await tx.user.update({
            where: { id: booking.userId },
            data: { walletBalance: { increment: booking.totalPrice } },
            select: { walletBalance: true },
        });
        await tx.walletTransaction.create({
            data: {
                userId: booking.userId,
                bookingId,
                type: client_1.WalletTransactionType.ESCROW_REFUND,
                amount: booking.totalPrice,
                balanceAfter: customer.walletBalance,
                description: `Hoàn cọc đơn ${bookingId}`,
                reference: `refund:${bookingId}`,
            },
        });
        await tx.invoice.update({
            where: { bookingId },
            data: {
                status: client_1.InvoiceStatus.REFUNDED,
                refundedAt,
            },
        });
        return true;
    }
    async releaseBookingByPercent(bookingId, percent, options = {}) {
        return this.prisma.$transaction(async (tx) => {
            const booking = await tx.booking.findUnique({
                where: { id: bookingId },
            });
            if (!booking)
                throw new common_1.NotFoundException('Không tìm thấy đơn');
            if (booking.paymentStatus === client_1.PaymentStatus.RELEASED)
                return false;
            if (booking.paymentStatus !== client_1.PaymentStatus.HELD) {
                throw new common_1.BadRequestException('Escrow không ở trạng thái đang giữ');
            }
            if (!booking.partnerId) {
                throw new common_1.BadRequestException('Đơn chưa có người làm để giải ngân');
            }
            if (options.expectedStatus &&
                booking.status !== options.expectedStatus) {
                throw new common_1.BadRequestException('Đơn không ở trạng thái hợp lệ để quyết toán');
            }
            if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
                throw new common_1.BadRequestException('Phần trăm nghiệm thu phải trong khoảng 1..100');
            }
            const grossRelease = Math.round((booking.totalPrice * percent) / 100);
            const customerRefund = Math.max(0, booking.totalPrice - grossRelease);
            const split = (0, escrow_1.computeEscrowSplit)(grossRelease, booking.commissionBps || escrow_1.DEFAULT_COMMISSION_BPS);
            const settledAt = new Date();
            const updated = await tx.booking.updateMany({
                where: {
                    id: bookingId,
                    paymentStatus: client_1.PaymentStatus.HELD,
                    ...(options.expectedStatus ? { status: options.expectedStatus } : {}),
                },
                data: {
                    paymentStatus: client_1.PaymentStatus.RELEASED,
                    status: client_1.BookingStatus.COMPLETED,
                    commissionAmount: split.commissionAmount,
                    partnerPayout: split.partnerPayout,
                    releasedAt: settledAt,
                    refundedAt: customerRefund > 0 ? settledAt : null,
                    confirmDeadlineAt: null,
                    disputeResultNote: options.disputeResultNote,
                },
            });
            if (updated.count !== 1)
                return false;
            const partner = await tx.user.update({
                where: { id: booking.partnerId },
                data: { walletBalance: { increment: split.partnerPayout } },
                select: { walletBalance: true },
            });
            await tx.walletTransaction.create({
                data: {
                    userId: booking.partnerId,
                    bookingId,
                    type: client_1.WalletTransactionType.PARTNER_PAYOUT,
                    amount: split.partnerPayout,
                    balanceAfter: partner.walletBalance,
                    description: `Giải ngân ${percent}% đơn ${bookingId}`,
                    reference: `payout:${bookingId}`,
                },
            });
            if (customerRefund > 0) {
                const customer = await tx.user.update({
                    where: { id: booking.userId },
                    data: { walletBalance: { increment: customerRefund } },
                    select: { walletBalance: true },
                });
                await tx.walletTransaction.create({
                    data: {
                        userId: booking.userId,
                        bookingId,
                        type: client_1.WalletTransactionType.ESCROW_REFUND,
                        amount: customerRefund,
                        balanceAfter: customer.walletBalance,
                        description: `Hoàn phần chưa nghiệm thu ${100 - percent}% đơn ${bookingId}`,
                        reference: `partial-refund:${bookingId}`,
                    },
                });
            }
            await tx.invoice.update({
                where: { bookingId },
                data: {
                    partnerId: booking.partnerId,
                    commissionAmount: split.commissionAmount,
                    partnerPayout: split.partnerPayout,
                    status: client_1.InvoiceStatus.SETTLED,
                    settledAt,
                    refundedAt: customerRefund > 0 ? settledAt : null,
                },
            });
            return true;
        });
    }
    async holdApplyDeposit(bookingId, partnerId, applicationId, options = {}) {
        return this.prisma.$transaction(async (tx) => {
            const booking = await tx.booking.findUnique({
                where: { id: bookingId },
                include: { service: { select: { name: true } } },
            });
            if (!booking)
                throw new common_1.NotFoundException('Không tìm thấy đơn');
            const amount = options.amount ?? (0, escrow_1.computeApplyDeposit)(booking.totalPrice);
            if (amount <= 0) {
                throw new common_1.BadRequestException('Số tiền cọc ứng tuyển không hợp lệ');
            }
            const reference = `apply-hold:${applicationId}`;
            const existing = await tx.walletTransaction.findUnique({
                where: { reference },
            });
            if (existing) {
                return { amount: Math.abs(existing.amount) };
            }
            const debited = await tx.user.updateMany({
                where: {
                    id: partnerId,
                    walletBalance: { gte: amount },
                },
                data: { walletBalance: { decrement: amount } },
            });
            if (debited.count !== 1) {
                throw new common_1.BadRequestException(`Số dư ví không đủ để đặt cọc ứng tuyển (${amount.toLocaleString('vi-VN')} VNĐ)`);
            }
            const updatedUser = await tx.user.findUniqueOrThrow({
                where: { id: partnerId },
                select: { walletBalance: true },
            });
            await tx.walletTransaction.create({
                data: {
                    userId: partnerId,
                    bookingId,
                    type: client_1.WalletTransactionType.APPLY_DEPOSIT,
                    amount: -amount,
                    balanceAfter: updatedUser.walletBalance,
                    description: `Cọc ứng tuyển đơn ${booking.service.name}`,
                    reference,
                },
            });
            return { amount };
        });
    }
    async refundApplyDeposit(bookingId, partnerId, applicationId, amount) {
        return this.prisma.$transaction(async (tx) => this.refundApplyDepositInTransaction(tx, bookingId, partnerId, applicationId, amount));
    }
    async refundApplyDepositInTransaction(tx, bookingId, partnerId, applicationId, amount) {
        const reference = `apply-refund:${applicationId}`;
        const existing = await tx.walletTransaction.findUnique({
            where: { reference },
        });
        if (existing)
            return false;
        if (amount <= 0)
            return false;
        const partner = await tx.user.update({
            where: { id: partnerId },
            data: { walletBalance: { increment: amount } },
            select: { walletBalance: true },
        });
        await tx.walletTransaction.create({
            data: {
                userId: partnerId,
                bookingId,
                type: client_1.WalletTransactionType.APPLY_REFUND,
                amount,
                balanceAfter: partner.walletBalance,
                description: `Hoàn cọc ứng tuyển đơn ${bookingId}`,
                reference,
            },
        });
        return true;
    }
    async forfeitApplyDeposit(bookingId, partnerId, applicationId, amount, reason) {
        const reference = `apply-forfeit:${applicationId}`;
        const existing = await this.prisma.walletTransaction.findUnique({
            where: { reference },
        });
        if (existing)
            return false;
        const partner = await this.prisma.user.findUnique({
            where: { id: partnerId },
            select: { walletBalance: true },
        });
        if (!partner)
            throw new common_1.NotFoundException('Không tìm thấy người làm');
        await this.prisma.walletTransaction.create({
            data: {
                userId: partnerId,
                bookingId,
                type: client_1.WalletTransactionType.APPLY_FORFEIT,
                amount: 0,
                balanceAfter: partner.walletBalance,
                description: `Tịch thu cọc ứng tuyển ${amount.toLocaleString('vi-VN')} VNĐ — ${reason}`,
                reference,
            },
        });
        return true;
    }
    invoiceNumber(bookingId) {
        const date = new Date();
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `DVO-${y}${m}${d}-${bookingId.slice(-8).toUpperCase()}`;
    }
    vietQrImageUrl(amount, transferNote) {
        const params = new URLSearchParams({
            amount: String(amount),
            addInfo: transferNote,
            accountName: this.vietQrAccountName,
        });
        return `https://img.vietqr.io/image/${this.vietQrBankId}-${this.vietQrAccountNo}-compact2.png?${params.toString()}`;
    }
    signVietQrIntent(payload) {
        const json = JSON.stringify(payload);
        const data = Buffer.from(json, 'utf8').toString('base64url');
        const sig = (0, crypto_1.createHmac)('sha256', this.vietQrIntentSecret)
            .update(data)
            .digest('base64url');
        return `${data}.${sig}`;
    }
    verifyVietQrIntent(intentId) {
        const [data, sig] = intentId.split('.');
        if (!data || !sig) {
            throw new common_1.BadRequestException('Mã VietQR không hợp lệ');
        }
        const expect = (0, crypto_1.createHmac)('sha256', this.vietQrIntentSecret)
            .update(data)
            .digest('base64url');
        if (sig !== expect) {
            throw new common_1.BadRequestException('Mã VietQR sai chữ ký');
        }
        const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
        if (!payload?.u || !payload?.a || !payload?.e) {
            throw new common_1.BadRequestException('Mã VietQR không hợp lệ');
        }
        return payload;
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map