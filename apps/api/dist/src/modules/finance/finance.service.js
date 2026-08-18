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
const security_env_1 = require("../../common/security-env");
const email_otp_rate_1 = require("../../common/email-otp-rate");
const assert_not_blocked_1 = require("../../common/assert-not-blocked");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const payos_service_1 = require("./payos.service");
const BANK_VERIFY_OTP_TTL_MS = 10 * 60 * 1000;
let FinanceService = class FinanceService {
    prisma;
    mail;
    payos;
    constructor(prisma, mail, payos) {
        this.prisma = prisma;
        this.mail = mail;
        this.payos = payos;
    }
    vietQrBankId = process.env.VIETQR_BANK_ID ?? '970422';
    vietQrAccountNo = process.env.VIETQR_ACCOUNT_NO ?? '19002888';
    vietQrAccountName = process.env.VIETQR_ACCOUNT_NAME ?? 'DICH VU OI';
    vietQrIntentSecret = (0, security_env_1.resolveVietQrIntentSecret)();
    vietQrIntentTtlMs = 15 * 60_000;
    vietQrBanksCache = null;
    async getWallet(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                walletBalance: true,
                emailVerified: true,
                bankVerified: true,
                bankBin: true,
                bankCode: true,
                bankName: true,
                bankAccountNo: true,
                bankAccountName: true,
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
            mockPaymentsEnabled: (0, security_env_1.allowMockPayments)(),
            payosEnabled: this.payos.isConfigured(),
            emailVerified: user.emailVerified,
            bankVerified: user.bankVerified,
            canWithdraw: user.emailVerified,
            payout: {
                bankBin: user.bankBin,
                bankCode: user.bankCode,
                bankName: user.bankName,
                accountNo: user.bankAccountNo,
                accountName: user.bankAccountName,
            },
            transactions: user.walletTransactions,
        };
    }
    assertMockPaymentsAllowed() {
        if (!(0, security_env_1.allowMockPayments)()) {
            throw new common_1.ForbiddenException('Thanh toán mô phỏng đã tắt. Bật ALLOW_MOCK_PAYMENTS=1 chỉ khi cần demo.');
        }
    }
    async listVietQrBanks() {
        const ttlMs = 24 * 60 * 60_000;
        if (this.vietQrBanksCache &&
            Date.now() - this.vietQrBanksCache.at < ttlMs) {
            return this.vietQrBanksCache.banks;
        }
        try {
            const res = await fetch('https://api.vietqr.io/v2/banks');
            const json = (await res.json());
            if (json.code !== '00' || !Array.isArray(json.data)) {
                throw new Error(json.code ?? 'vietqr_banks_failed');
            }
            const banks = json.data.map((b) => ({
                id: b.id,
                name: b.name,
                code: b.code,
                bin: b.bin,
                shortName: b.shortName,
                logo: b.logo,
                transferSupported: b.transferSupported ?? 0,
            }));
            this.vietQrBanksCache = { at: Date.now(), banks };
            return banks;
        }
        catch (err) {
            if (this.vietQrBanksCache?.banks.length) {
                return this.vietQrBanksCache.banks;
            }
            throw new common_1.BadRequestException(`Không tải được danh sách ngân hàng VietQR: ${err.message}`);
        }
    }
    async withdraw(userId, dto) {
        await (0, assert_not_blocked_1.assertUserNotBlocked)(this.prisma, userId);
        const accountNo = dto.accountNo.replace(/\s|-/g, '').trim();
        const accountName = dto.accountName.trim().toUpperCase();
        const bankBin = dto.bankBin.trim();
        const bankName = dto.bankName.trim();
        const bankCode = (dto.bankCode ?? '').trim() || null;
        const identity = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                emailVerified: true,
                bankVerified: true,
                bankBin: true,
                bankAccountNo: true,
            },
        });
        if (!identity)
            throw new common_1.NotFoundException('Không tìm thấy tài khoản');
        if (!identity.emailVerified) {
            throw new common_1.ForbiddenException('Cần xác minh email trước khi rút tiền (phòng rút sai ngân hàng).');
        }
        if (identity.bankVerified) {
            const savedNo = (identity.bankAccountNo ?? '').replace(/\s|-/g, '');
            if (savedNo && savedNo !== accountNo) {
                throw new common_1.BadRequestException('STK khác tài khoản đã xác minh — xác minh lại NH hoặc dùng đúng STK đã liên kết.');
            }
            if (identity.bankBin && identity.bankBin !== bankBin) {
                throw new common_1.BadRequestException('Ngân hàng khác tài khoản đã xác minh — xác minh lại NH hoặc dùng đúng NH đã liên kết.');
            }
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.user.updateMany({
                where: { id: userId, walletBalance: { gte: dto.amount } },
                data: {
                    walletBalance: { decrement: dto.amount },
                    bankBin,
                    bankCode,
                    bankName,
                    bankAccountNo: accountNo,
                    bankAccountName: accountName,
                },
            });
            if (updated.count === 0) {
                const current = await tx.user.findUnique({
                    where: { id: userId },
                    select: { walletBalance: true },
                });
                if (!current)
                    throw new common_1.NotFoundException('Không tìm thấy tài khoản');
                throw new common_1.BadRequestException(`Số dư không đủ. Khả dụng ${current.walletBalance.toLocaleString('vi-VN')} VNĐ`);
            }
            const user = await tx.user.findUniqueOrThrow({
                where: { id: userId },
                select: {
                    walletBalance: true,
                    bankBin: true,
                    bankCode: true,
                    bankName: true,
                    bankAccountNo: true,
                    bankAccountName: true,
                },
            });
            const reference = `withdraw:${userId}:${(0, crypto_1.randomUUID)()}`;
            await tx.walletTransaction.create({
                data: {
                    userId,
                    type: client_1.WalletTransactionType.WITHDRAW,
                    amount: -dto.amount,
                    balanceAfter: user.walletBalance,
                    description: `Rút về ${bankName} · ${accountNo} · ${accountName} (mock)`,
                    reference,
                },
            });
            return {
                currency: 'VND',
                balance: user.walletBalance,
                amount: dto.amount,
                status: 'COMPLETED_MOCK',
                payout: {
                    bankBin: user.bankBin,
                    bankCode: user.bankCode,
                    bankName: user.bankName,
                    accountNo: user.bankAccountNo,
                    accountName: user.bankAccountName,
                },
                message: 'Đã trừ ví (mock). Production sẽ chuyển khoản thật qua cổng payout.',
            };
        });
    }
    async requestBankVerify(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Không tìm thấy tài khoản');
        const rate = (0, email_otp_rate_1.takeEmailOtpSlot)(user);
        const accountNo = dto.accountNo.replace(/\s|-/g, '').trim();
        const accountName = dto.accountName.trim().toUpperCase();
        const bankBin = dto.bankBin.trim();
        const bankName = dto.bankName.trim();
        const bankCode = (dto.bankCode ?? '').trim() || null;
        const code = String((0, crypto_1.randomInt)(100000, 999999));
        const expiresAt = new Date(Date.now() + BANK_VERIFY_OTP_TTL_MS);
        const mailReady = this.mail.isConfigured();
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                bankBin,
                bankCode,
                bankName,
                bankAccountNo: accountNo,
                bankAccountName: accountName,
                bankVerified: false,
                bankVerifyOtpCode: code,
                bankVerifyOtpExpiresAt: expiresAt,
                emailOtpSendCount: rate.emailOtpSendCount,
                emailOtpWindowStartedAt: rate.emailOtpWindowStartedAt,
            },
        });
        const sent = await this.mail.send({
            to: user.email,
            subject: 'Xác minh tài khoản ngân hàng — DichVuOi',
            text: `Ma xac minh lien ket STK ${accountNo} (${bankName}): ${code}. Het han 10 phut.`,
            html: `<p>Mã xác minh liên kết STK <strong>${accountNo}</strong> (${bankName}): <strong>${code}</strong></p><p>Hết hạn 10 phút.</p>`,
        });
        const payout = {
            bankBin,
            bankCode,
            bankName,
            accountNo,
            accountName,
        };
        if (sent.provider === 'gmail') {
            return {
                ok: true,
                channel: 'gmail',
                expiresAt: expiresAt.toISOString(),
                payout,
                message: `Đã gửi mã xác minh STK tới ${user.email}`,
            };
        }
        if (mailReady) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    bankVerifyOtpCode: null,
                    bankVerifyOtpExpiresAt: null,
                },
            });
            throw new common_1.BadRequestException(sent.mockReason ||
                'Không gửi được email. Kiểm tra Gmail App Password hoặc thử lại sau.');
        }
        return {
            ok: true,
            channel: 'mock',
            expiresAt: expiresAt.toISOString(),
            code,
            payout,
            message: sent.mockReason ||
                'Chưa cấu hình Gmail — dùng mã hiện trên web (dev).',
        };
    }
    async confirmBankVerify(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Không tìm thấy tài khoản');
        const code = dto.code.trim();
        if (!user.bankVerifyOtpCode ||
            !user.bankVerifyOtpExpiresAt ||
            user.bankVerifyOtpExpiresAt.getTime() < Date.now()) {
            throw new common_1.BadRequestException('Mã đã hết hạn. Gửi lại mã mới.');
        }
        if (user.bankVerifyOtpCode !== code) {
            throw new common_1.BadRequestException('Mã xác minh không đúng.');
        }
        if (!user.bankAccountNo || !user.bankBin) {
            throw new common_1.BadRequestException('Chưa có thông tin STK. Gửi lại yêu cầu.');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                bankVerified: true,
                bankVerifyOtpCode: null,
                bankVerifyOtpExpiresAt: null,
            },
        });
        await this.prisma.partnerProfile.updateMany({
            where: { userId },
            data: {
                bankVerified: true,
                bankName: user.bankName,
                bankAccountNo: user.bankAccountNo,
                bankAccountName: user.bankAccountName,
                bankVerifyIntentId: null,
                bankVerifyExpiresAt: null,
            },
        });
        return this.getWallet(userId);
    }
    async topUp(userId, amount) {
        this.assertMockPaymentsAllowed();
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
    async adminAdjustBalance(userId, amount, reason) {
        if (!Number.isInteger(amount) || amount === 0) {
            throw new common_1.BadRequestException('Số tiền điều chỉnh phải là số nguyên khác 0');
        }
        const note = reason.trim();
        if (note.length < 3) {
            throw new common_1.BadRequestException('Ghi chú điều chỉnh tối thiểu 3 ký tự');
        }
        return this.prisma.$transaction(async (tx) => {
            if (amount < 0) {
                const updated = await tx.user.updateMany({
                    where: { id: userId, walletBalance: { gte: -amount } },
                    data: { walletBalance: { increment: amount } },
                });
                if (updated.count === 0) {
                    const exists = await tx.user.findUnique({
                        where: { id: userId },
                        select: { walletBalance: true },
                    });
                    if (!exists)
                        throw new common_1.NotFoundException('Không tìm thấy tài khoản');
                    throw new common_1.BadRequestException(`Số dư không đủ để trừ ${(-amount).toLocaleString('vi-VN')} VNĐ`);
                }
            }
            else {
                const exists = await tx.user.updateMany({
                    where: { id: userId },
                    data: { walletBalance: { increment: amount } },
                });
                if (exists.count === 0) {
                    throw new common_1.NotFoundException('Không tìm thấy tài khoản');
                }
            }
            const user = await tx.user.findUniqueOrThrow({
                where: { id: userId },
                select: { walletBalance: true, fullName: true, email: true },
            });
            await tx.walletTransaction.create({
                data: {
                    userId,
                    type: client_1.WalletTransactionType.ADMIN_ADJUSTMENT,
                    amount,
                    balanceAfter: user.walletBalance,
                    description: `Admin điều chỉnh: ${note}`,
                    reference: `admin-adj:${userId}:${(0, crypto_1.randomUUID)()}`,
                },
            });
            return {
                currency: 'VND',
                balance: user.walletBalance,
                amount,
                user: { id: userId, fullName: user.fullName, email: user.email },
            };
        });
    }
    async createVietQrIntent(userId, amount) {
        const expiresAt = new Date(Date.now() + this.vietQrIntentTtlMs);
        const nonce = (0, crypto_1.randomUUID)().slice(0, 8);
        const payosReady = this.payos.isConfigured();
        const orderCode = payosReady ? (0, crypto_1.randomInt)(1_000_000, 2_000_000_000) : undefined;
        const intentId = this.signVietQrIntent({
            u: userId,
            a: amount,
            e: expiresAt.getTime(),
            n: nonce,
            ...(orderCode ? { o: orderCode } : {}),
        });
        const fallbackNote = `DVO ${intentId.slice(0, 18)}`;
        if (payosReady && orderCode) {
            try {
                const description = 'NAPVI';
                const link = await this.payos.createPaymentLink({
                    orderCode,
                    amount,
                    description,
                    expiredAt: expiresAt,
                });
                await this.prisma.walletTopUpIntent.create({
                    data: {
                        userId,
                        amount,
                        orderCode,
                        intentToken: intentId,
                        paymentLinkId: link.paymentLinkId,
                        provider: 'payos',
                        transferNote: link.description || description,
                        expiresAt,
                    },
                });
                return {
                    intentId,
                    amount,
                    currency: 'VND',
                    bankId: link.bin || this.vietQrBankId,
                    accountNo: link.accountNumber || this.vietQrAccountNo,
                    accountName: link.accountName || this.vietQrAccountName,
                    transferNote: link.description || description,
                    qrImageUrl: this.vietQrImageUrl(amount, link.description || description, link.bin || this.vietQrBankId, link.accountNumber || this.vietQrAccountNo, link.accountName || this.vietQrAccountName),
                    checkoutUrl: link.checkoutUrl || null,
                    provider: 'payos',
                    expiresAt: expiresAt.toISOString(),
                };
            }
            catch (err) {
                console.warn(`[payos] create payment failed, fallback VietQR: ${err.message}`);
            }
        }
        return {
            intentId,
            amount,
            currency: 'VND',
            bankId: this.vietQrBankId,
            accountNo: this.vietQrAccountNo,
            accountName: this.vietQrAccountName,
            transferNote: fallbackNote,
            qrImageUrl: this.vietQrImageUrl(amount, fallbackNote),
            checkoutUrl: null,
            provider: 'vietqr',
            expiresAt: expiresAt.toISOString(),
        };
    }
    async getVietQrIntentStatus(userId, intentId) {
        const payload = this.verifyVietQrIntent(intentId);
        if (payload.u !== userId) {
            throw new common_1.ForbiddenException('Lệnh nạp không thuộc tài khoản hiện tại');
        }
        const paidTx = await this.findPaidTopUp(intentId, payload.o);
        if (!paidTx && payload.o && this.payos.isConfigured()) {
            await this.syncPayosPayment(payload.o);
        }
        const latest = paidTx ?? (await this.findPaidTopUp(intentId, payload.o));
        return {
            intentId,
            amount: payload.a,
            status: latest ? 'PAID' : 'PENDING',
            paidAt: latest?.createdAt.toISOString() ?? null,
            expiresAt: new Date(payload.e).toISOString(),
            provider: payload.o ? 'payos' : 'vietqr',
        };
    }
    async handlePayosWebhook(payload) {
        const verified = this.payos.verifyWebhook(payload);
        if (!verified) {
            return { ok: false, reason: 'invalid_signature' };
        }
        const paidCode = verified.code ?? payload.code;
        if (paidCode && paidCode !== '00') {
            return { ok: true, ignored: true };
        }
        const credited = await this.syncPayosPayment(verified.orderCode, verified.amount);
        return { ok: true, credited };
    }
    async confirmVietQrIntentMock(userId, intentId) {
        this.assertMockPaymentsAllowed();
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
            await tx.walletTopUpIntent.updateMany({
                where: { intentToken: intentId, paidAt: null },
                data: { paidAt: new Date() },
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
            throw new common_1.BadRequestException('Cọc không ở trạng thái đang giữ');
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
            throw new common_1.BadRequestException('Cọc không ở trạng thái đang giữ');
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
                throw new common_1.BadRequestException('Cọc không ở trạng thái đang giữ');
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
            const amount = options.amount ??
                (0, escrow_1.computeApplyDeposit)(booking.totalPrice, booking.applyDepositBps);
            if (amount <= 0) {
                return { amount: 0 };
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
    vietQrImageUrl(amount, transferNote, bankId = this.vietQrBankId, accountNo = this.vietQrAccountNo, accountName = this.vietQrAccountName) {
        const params = new URLSearchParams({
            amount: String(amount),
            addInfo: transferNote,
            accountName,
        });
        return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?${params.toString()}`;
    }
    paidReferences(intentId, orderCode) {
        const refs = [`vietqr:paid:${intentId}`];
        if (orderCode)
            refs.push(`payos:paid:${orderCode}`);
        return refs;
    }
    async findPaidTopUp(intentId, orderCode) {
        return this.prisma.walletTransaction.findFirst({
            where: { reference: { in: this.paidReferences(intentId, orderCode) } },
            select: { id: true, createdAt: true, amount: true },
        });
    }
    async syncPayosPayment(orderCode, webhookAmount) {
        const intent = await this.prisma.walletTopUpIntent.findUnique({
            where: { orderCode },
        });
        if (!intent)
            return false;
        if (intent.expiresAt.getTime() < Date.now() && !intent.paidAt) {
            return false;
        }
        let amount = webhookAmount ?? intent.amount;
        if (webhookAmount == null && this.payos.isConfigured()) {
            const remote = await this.payos.getPaymentLink(intent.paymentLinkId || orderCode);
            if (!remote || remote.status !== 'PAID')
                return false;
            amount = remote.amount || intent.amount;
        }
        if (amount !== intent.amount) {
            return false;
        }
        const reference = `payos:paid:${orderCode}`;
        await this.prisma.$transaction(async (tx) => {
            const existing = await tx.walletTransaction.findFirst({
                where: {
                    reference: {
                        in: this.paidReferences(intent.intentToken, orderCode),
                    },
                },
            });
            if (existing) {
                if (!intent.paidAt) {
                    await tx.walletTopUpIntent.update({
                        where: { id: intent.id },
                        data: { paidAt: existing.createdAt },
                    });
                }
                return;
            }
            const user = await tx.user.update({
                where: { id: intent.userId },
                data: { walletBalance: { increment: amount } },
                select: { walletBalance: true },
            });
            await tx.walletTransaction.create({
                data: {
                    userId: intent.userId,
                    type: client_1.WalletTransactionType.TOP_UP,
                    amount,
                    balanceAfter: user.walletBalance,
                    description: 'Nạp VNĐ qua VietQR (payOS xác minh)',
                    reference,
                },
            });
            await tx.walletTopUpIntent.update({
                where: { id: intent.id },
                data: { paidAt: new Date() },
            });
        });
        return true;
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
        const sigBuf = Buffer.from(sig);
        const expectBuf = Buffer.from(expect);
        if (sigBuf.length !== expectBuf.length ||
            !(0, crypto_1.timingSafeEqual)(sigBuf, expectBuf)) {
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService,
        payos_service_1.PayosService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map