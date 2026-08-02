import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  InvoiceStatus,
  PaymentStatus,
  Prisma,
  WalletTransactionType,
} from '../../database/prisma/client';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import {
  computeEscrowSplit,
  DEFAULT_COMMISSION_BPS,
  computeApplyDeposit,
} from '../../common/escrow';
import {
  allowMockPayments,
  resolveVietQrIntentSecret,
} from '../../common/security-env';
import { PrismaService } from '../../database/prisma/prisma.service';

type SettlementOptions = {
  status?: BookingStatus;
  expectedStatus?: BookingStatus;
  disputeResultNote?: string | null;
};

type PercentSettlementOptions = {
  expectedStatus?: BookingStatus;
  disputeResultNote?: string | null;
};

type ApplyDepositOptions = {
  /** Override amount; default 10% of booking.totalPrice. */
  amount?: number;
};

type VietQrIntentPayload = {
  u: string;
  a: number;
  e: number;
  n: string;
};

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly vietQrBankId = process.env.VIETQR_BANK_ID ?? '970422';
  private readonly vietQrAccountNo =
    process.env.VIETQR_ACCOUNT_NO ?? '19002888';
  private readonly vietQrAccountName =
    process.env.VIETQR_ACCOUNT_NAME ?? 'DICH VU OI';
  private readonly vietQrIntentSecret = resolveVietQrIntentSecret();
  private readonly vietQrIntentTtlMs = 15 * 60_000;
  private vietQrBanksCache: {
    at: number;
    banks: Array<{
      id: number;
      name: string;
      code: string;
      bin: string;
      shortName: string;
      logo: string;
      transferSupported: number;
    }>;
  } | null = null;

  async getWallet(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletBalance: true,
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
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    return {
      currency: 'VND',
      balance: user.walletBalance,
      mockPaymentsEnabled: allowMockPayments(),
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

  private assertMockPaymentsAllowed() {
    if (!allowMockPayments()) {
      throw new ForbiddenException(
        'Thanh toán mô phỏng đã tắt. Bật ALLOW_MOCK_PAYMENTS=1 chỉ khi cần demo.',
      );
    }
  }

  /** Danh sách ngân hàng VietQR (cache 24h). */
  async listVietQrBanks() {
    const ttlMs = 24 * 60 * 60_000;
    if (
      this.vietQrBanksCache &&
      Date.now() - this.vietQrBanksCache.at < ttlMs
    ) {
      return this.vietQrBanksCache.banks;
    }

    try {
      const res = await fetch('https://api.vietqr.io/v2/banks');
      const json = (await res.json()) as {
        code?: string;
        data?: Array<{
          id: number;
          name: string;
          code: string;
          bin: string;
          shortName: string;
          logo: string;
          transferSupported?: number;
        }>;
      };
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
    } catch (err) {
      if (this.vietQrBanksCache?.banks.length) {
        return this.vietQrBanksCache.banks;
      }
      throw new BadRequestException(
        `Không tải được danh sách ngân hàng VietQR: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Rút ví về STK user (mock trừ ví ngay — production nối payout gateway sau).
   */
  async withdraw(
    userId: string,
    dto: {
      amount: number;
      bankBin: string;
      bankCode?: string;
      bankName: string;
      accountNo: string;
      accountName: string;
    },
  ) {
    const accountNo = dto.accountNo.replace(/\s|-/g, '').trim();
    const accountName = dto.accountName.trim().toUpperCase();
    const bankBin = dto.bankBin.trim();
    const bankName = dto.bankName.trim();
    const bankCode = (dto.bankCode ?? '').trim() || null;

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
        if (!current) throw new NotFoundException('Không tìm thấy tài khoản');
        throw new BadRequestException(
          `Số dư không đủ. Khả dụng ${current.walletBalance.toLocaleString('vi-VN')} VNĐ`,
        );
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

      const reference = `withdraw:${userId}:${randomUUID()}`;
      await tx.walletTransaction.create({
        data: {
          userId,
          type: WalletTransactionType.WITHDRAW,
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
        message:
          'Đã trừ ví (mock). Production sẽ chuyển khoản thật qua cổng payout.',
      };
    });
  }

  async topUp(userId: string, amount: number) {
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
          type: WalletTransactionType.TOP_UP,
          amount,
          balanceAfter: user.walletBalance,
          description: 'Nạp VNĐ vào ví (mô phỏng)',
          reference: `topup:${userId}:${randomUUID()}`,
        },
      });
      return {
        currency: 'VND',
        balance: user.walletBalance,
      };
    });
  }

  /** Admin cộng/trừ ví (ADMIN_ADJUSTMENT). amount âm = trừ. */
  async adminAdjustBalance(
    userId: string,
    amount: number,
    reason: string,
  ) {
    if (!Number.isInteger(amount) || amount === 0) {
      throw new BadRequestException('Số tiền điều chỉnh phải là số nguyên khác 0');
    }
    const note = reason.trim();
    if (note.length < 3) {
      throw new BadRequestException('Ghi chú điều chỉnh tối thiểu 3 ký tự');
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
          if (!exists) throw new NotFoundException('Không tìm thấy tài khoản');
          throw new BadRequestException(
            `Số dư không đủ để trừ ${(-amount).toLocaleString('vi-VN')} VNĐ`,
          );
        }
      } else {
        const exists = await tx.user.updateMany({
          where: { id: userId },
          data: { walletBalance: { increment: amount } },
        });
        if (exists.count === 0) {
          throw new NotFoundException('Không tìm thấy tài khoản');
        }
      }

      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { walletBalance: true, fullName: true, email: true },
      });
      await tx.walletTransaction.create({
        data: {
          userId,
          type: WalletTransactionType.ADMIN_ADJUSTMENT,
          amount,
          balanceAfter: user.walletBalance,
          description: `Admin điều chỉnh: ${note}`,
          reference: `admin-adj:${userId}:${randomUUID()}`,
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

  createVietQrIntent(userId: string, amount: number) {
    const expiresAt = new Date(Date.now() + this.vietQrIntentTtlMs);
    const intentId = this.signVietQrIntent({
      u: userId,
      a: amount,
      e: expiresAt.getTime(),
      n: randomUUID().slice(0, 8),
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

  async getVietQrIntentStatus(userId: string, intentId: string) {
    const payload = this.verifyVietQrIntent(intentId);
    if (payload.u !== userId) {
      throw new ForbiddenException('Lệnh nạp không thuộc tài khoản hiện tại');
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

  /** Local/dev mock: xác nhận đã chuyển khoản VietQR rồi cộng ví (idempotent). */
  async confirmVietQrIntentMock(userId: string, intentId: string) {
    this.assertMockPaymentsAllowed();
    const payload = this.verifyVietQrIntent(intentId);
    if (payload.u !== userId) {
      throw new ForbiddenException('Lệnh nạp không thuộc tài khoản hiện tại');
    }
    if (payload.e < Date.now()) {
      throw new BadRequestException('Mã VietQR đã hết hạn');
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
          type: WalletTransactionType.TOP_UP,
          amount: payload.a,
          balanceAfter: user.walletBalance,
          description: 'Nạp VNĐ qua VietQR (mock xác nhận)',
          reference,
        },
      });
      return { currency: 'VND', balance: user.walletBalance, amount: payload.a };
    });
  }

  async listInvoices(userId: string) {
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

  async getInvoice(invoiceId: string, userId: string, isAdmin = false) {
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
    if (!invoice) throw new NotFoundException('Không tìm thấy hóa đơn');
    if (
      !isAdmin &&
      invoice.customerId !== userId &&
      invoice.partnerId !== userId
    ) {
      throw new ForbiddenException('Không xem được hóa đơn này');
    }
    return invoice;
  }

  async holdBooking(bookingId: string, payerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          service: { select: { name: true } },
          user: { select: { walletBalance: true } },
        },
      });
      if (!booking) throw new NotFoundException('Không tìm thấy đơn');
      if (booking.userId !== payerId) {
        throw new ForbiddenException('Chỉ khách thuê thanh toán đơn này');
      }
      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('Đơn đã hủy');
      }
      if (booking.paymentStatus !== PaymentStatus.UNPAID) {
        throw new BadRequestException('Đơn đã đặt cọc hoặc đã xử lý');
      }
      if (booking.user.walletBalance < booking.totalPrice) {
        throw new BadRequestException(
          `Số dư ví không đủ. Cần thêm ${booking.totalPrice - booking.user.walletBalance} VNĐ`,
        );
      }

      const debited = await tx.user.updateMany({
        where: {
          id: booking.userId,
          walletBalance: { gte: booking.totalPrice },
        },
        data: { walletBalance: { decrement: booking.totalPrice } },
      });
      if (debited.count !== 1) {
        throw new BadRequestException('Số dư ví không đủ');
      }

      const updatedUser = await tx.user.findUniqueOrThrow({
        where: { id: booking.userId },
        select: { walletBalance: true },
      });
      const held = await tx.booking.updateMany({
        where: {
          id: bookingId,
          paymentStatus: PaymentStatus.UNPAID,
        },
        data: {
          paymentStatus: PaymentStatus.HELD,
          paidAt: new Date(),
        },
      });
      if (held.count !== 1) {
        throw new BadRequestException('Đơn vừa được thanh toán bởi yêu cầu khác');
      }

      await tx.walletTransaction.create({
        data: {
          userId: booking.userId,
          bookingId,
          type: WalletTransactionType.ESCROW_HOLD,
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
          status: InvoiceStatus.PAID,
        },
      });
    });
  }

  async releaseBooking(
    bookingId: string,
    options: SettlementOptions = {},
  ): Promise<boolean> {
    return this.prisma.$transaction((tx) =>
      this.releaseBookingInTransaction(tx, bookingId, options),
    );
  }

  async releaseBookingInTransaction(
    tx: Prisma.TransactionClient,
    bookingId: string,
    options: SettlementOptions = {},
  ): Promise<boolean> {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });
      if (!booking) throw new NotFoundException('Không tìm thấy đơn');
      if (booking.paymentStatus === PaymentStatus.RELEASED) return false;
      if (booking.paymentStatus !== PaymentStatus.HELD) {
        throw new BadRequestException('Escrow không ở trạng thái đang giữ');
      }
      if (!booking.partnerId) {
        throw new BadRequestException('Đơn chưa có người làm để giải ngân');
      }

      const split = computeEscrowSplit(
        booking.totalPrice,
        booking.commissionBps || DEFAULT_COMMISSION_BPS,
      );
      const settledAt = new Date();
      const updated = await tx.booking.updateMany({
        where: {
          id: bookingId,
          paymentStatus: PaymentStatus.HELD,
          ...(options.expectedStatus
            ? { status: options.expectedStatus }
            : {}),
        },
        data: {
          paymentStatus: PaymentStatus.RELEASED,
          status: options.status,
          commissionAmount: split.commissionAmount,
          partnerPayout: split.partnerPayout,
          releasedAt: settledAt,
          confirmDeadlineAt: null,
          disputeResultNote: options.disputeResultNote,
        },
      });
      if (updated.count !== 1) return false;

      const partner = await tx.user.update({
        where: { id: booking.partnerId },
        data: { walletBalance: { increment: split.partnerPayout } },
        select: { walletBalance: true },
      });
      await tx.walletTransaction.create({
        data: {
          userId: booking.partnerId,
          bookingId,
          type: WalletTransactionType.PARTNER_PAYOUT,
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
          status: InvoiceStatus.SETTLED,
          settledAt,
        },
      });
      return true;
  }

  async refundBooking(
    bookingId: string,
    options: SettlementOptions = {},
  ): Promise<boolean> {
    return this.prisma.$transaction((tx) =>
      this.refundBookingInTransaction(tx, bookingId, options),
    );
  }

  async refundBookingInTransaction(
    tx: Prisma.TransactionClient,
    bookingId: string,
    options: SettlementOptions = {},
  ): Promise<boolean> {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });
      if (!booking) throw new NotFoundException('Không tìm thấy đơn');
      if (booking.paymentStatus === PaymentStatus.REFUNDED) return false;
      if (booking.paymentStatus !== PaymentStatus.HELD) {
        throw new BadRequestException('Escrow không ở trạng thái đang giữ');
      }

      const refundedAt = new Date();
      const updated = await tx.booking.updateMany({
        where: {
          id: bookingId,
          paymentStatus: PaymentStatus.HELD,
        },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          status: options.status,
          refundedAt,
          confirmDeadlineAt: null,
          disputeResultNote: options.disputeResultNote,
        },
      });
      if (updated.count !== 1) return false;

      const customer = await tx.user.update({
        where: { id: booking.userId },
        data: { walletBalance: { increment: booking.totalPrice } },
        select: { walletBalance: true },
      });
      await tx.walletTransaction.create({
        data: {
          userId: booking.userId,
          bookingId,
          type: WalletTransactionType.ESCROW_REFUND,
          amount: booking.totalPrice,
          balanceAfter: customer.walletBalance,
          description: `Hoàn cọc đơn ${bookingId}`,
          reference: `refund:${bookingId}`,
        },
      });
      await tx.invoice.update({
        where: { bookingId },
        data: {
          status: InvoiceStatus.REFUNDED,
          refundedAt,
        },
      });
      return true;
  }

  /**
   * Giải ngân theo % nghiệm thu đã chốt:
   * - Trả partner theo grossRelease trừ commission
   * - Hoàn phần còn lại về ví khách
   * - paymentStatus vẫn chuyển RELEASED (escrow đã quyết toán xong)
   */
  async releaseBookingByPercent(
    bookingId: string,
    percent: number,
    options: PercentSettlementOptions = {},
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });
      if (!booking) throw new NotFoundException('Không tìm thấy đơn');
      if (booking.paymentStatus === PaymentStatus.RELEASED) return false;
      if (booking.paymentStatus !== PaymentStatus.HELD) {
        throw new BadRequestException('Escrow không ở trạng thái đang giữ');
      }
      if (!booking.partnerId) {
        throw new BadRequestException('Đơn chưa có người làm để giải ngân');
      }
      if (
        options.expectedStatus &&
        booking.status !== options.expectedStatus
      ) {
        throw new BadRequestException('Đơn không ở trạng thái hợp lệ để quyết toán');
      }
      if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
        throw new BadRequestException('Phần trăm nghiệm thu phải trong khoảng 1..100');
      }

      const grossRelease = Math.round((booking.totalPrice * percent) / 100);
      const customerRefund = Math.max(0, booking.totalPrice - grossRelease);
      const split = computeEscrowSplit(
        grossRelease,
        booking.commissionBps || DEFAULT_COMMISSION_BPS,
      );
      const settledAt = new Date();

      const updated = await tx.booking.updateMany({
        where: {
          id: bookingId,
          paymentStatus: PaymentStatus.HELD,
          ...(options.expectedStatus ? { status: options.expectedStatus } : {}),
        },
        data: {
          paymentStatus: PaymentStatus.RELEASED,
          status: BookingStatus.COMPLETED,
          commissionAmount: split.commissionAmount,
          partnerPayout: split.partnerPayout,
          releasedAt: settledAt,
          refundedAt: customerRefund > 0 ? settledAt : null,
          confirmDeadlineAt: null,
          disputeResultNote: options.disputeResultNote,
        },
      });
      if (updated.count !== 1) return false;

      const partner = await tx.user.update({
        where: { id: booking.partnerId },
        data: { walletBalance: { increment: split.partnerPayout } },
        select: { walletBalance: true },
      });
      await tx.walletTransaction.create({
        data: {
          userId: booking.partnerId,
          bookingId,
          type: WalletTransactionType.PARTNER_PAYOUT,
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
            type: WalletTransactionType.ESCROW_REFUND,
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
          status: InvoiceStatus.SETTLED,
          settledAt,
          refundedAt: customerRefund > 0 ? settledAt : null,
        },
      });

      return true;
    });
  }

  /** Người làm đặt cọc ứng tuyển (theo applyDepositBps của đơn) — debit ví. */
  async holdApplyDeposit(
    bookingId: string,
    partnerId: string,
    applicationId: string,
    options: ApplyDepositOptions = {},
  ) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { service: { select: { name: true } } },
      });
      if (!booking) throw new NotFoundException('Không tìm thấy đơn');

      const amount =
        options.amount ??
        computeApplyDeposit(booking.totalPrice, booking.applyDepositBps);
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
        throw new BadRequestException(
          `Số dư ví không đủ để đặt cọc ứng tuyển (${amount.toLocaleString('vi-VN')} VNĐ)`,
        );
      }

      const updatedUser = await tx.user.findUniqueOrThrow({
        where: { id: partnerId },
        select: { walletBalance: true },
      });

      await tx.walletTransaction.create({
        data: {
          userId: partnerId,
          bookingId,
          type: WalletTransactionType.APPLY_DEPOSIT,
          amount: -amount,
          balanceAfter: updatedUser.walletBalance,
          description: `Cọc ứng tuyển đơn ${booking.service.name}`,
          reference,
        },
      });

      return { amount };
    });
  }

  /** Hoàn cọc ứng tuyển cho một hồ sơ (idempotent theo applicationId). */
  async refundApplyDeposit(
    bookingId: string,
    partnerId: string,
    applicationId: string,
    amount: number,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) =>
      this.refundApplyDepositInTransaction(
        tx,
        bookingId,
        partnerId,
        applicationId,
        amount,
      ),
    );
  }

  async refundApplyDepositInTransaction(
    tx: Prisma.TransactionClient,
    bookingId: string,
    partnerId: string,
    applicationId: string,
    amount: number,
  ): Promise<boolean> {
    const reference = `apply-refund:${applicationId}`;
    const existing = await tx.walletTransaction.findUnique({
      where: { reference },
    });
    if (existing) return false;
    if (amount <= 0) return false;

    const partner = await tx.user.update({
      where: { id: partnerId },
      data: { walletBalance: { increment: amount } },
      select: { walletBalance: true },
    });
    await tx.walletTransaction.create({
      data: {
        userId: partnerId,
        bookingId,
        type: WalletTransactionType.APPLY_REFUND,
        amount,
        balanceAfter: partner.walletBalance,
        description: `Hoàn cọc ứng tuyển đơn ${bookingId}`,
        reference,
      },
    });
    return true;
  }

  /**
   * Tịch thu cọc ứng tuyển — không hoàn ví (tiền đã debit lúc hold).
   * Ghi sổ APPLY_FORFEIT amount=0 để audit; depositStatus → RELEASED.
   */
  async forfeitApplyDeposit(
    bookingId: string,
    partnerId: string,
    applicationId: string,
    amount: number,
    reason: string,
  ): Promise<boolean> {
    const reference = `apply-forfeit:${applicationId}`;
    const existing = await this.prisma.walletTransaction.findUnique({
      where: { reference },
    });
    if (existing) return false;

    const partner = await this.prisma.user.findUnique({
      where: { id: partnerId },
      select: { walletBalance: true },
    });
    if (!partner) throw new NotFoundException('Không tìm thấy người làm');

    await this.prisma.walletTransaction.create({
      data: {
        userId: partnerId,
        bookingId,
        type: WalletTransactionType.APPLY_FORFEIT,
        amount: 0,
        balanceAfter: partner.walletBalance,
        description: `Tịch thu cọc ứng tuyển ${amount.toLocaleString('vi-VN')} VNĐ — ${reason}`,
        reference,
      },
    });
    return true;
  }

  private invoiceNumber(bookingId: string) {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `DVO-${y}${m}${d}-${bookingId.slice(-8).toUpperCase()}`;
  }

  private vietQrImageUrl(amount: number, transferNote: string) {
    const params = new URLSearchParams({
      amount: String(amount),
      addInfo: transferNote,
      accountName: this.vietQrAccountName,
    });
    return `https://img.vietqr.io/image/${this.vietQrBankId}-${this.vietQrAccountNo}-compact2.png?${params.toString()}`;
  }

  private signVietQrIntent(payload: VietQrIntentPayload) {
    const json = JSON.stringify(payload);
    const data = Buffer.from(json, 'utf8').toString('base64url');
    const sig = createHmac('sha256', this.vietQrIntentSecret)
      .update(data)
      .digest('base64url');
    return `${data}.${sig}`;
  }

  private verifyVietQrIntent(intentId: string): VietQrIntentPayload {
    const [data, sig] = intentId.split('.');
    if (!data || !sig) {
      throw new BadRequestException('Mã VietQR không hợp lệ');
    }
    const expect = createHmac('sha256', this.vietQrIntentSecret)
      .update(data)
      .digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectBuf = Buffer.from(expect);
    if (
      sigBuf.length !== expectBuf.length ||
      !timingSafeEqual(sigBuf, expectBuf)
    ) {
      throw new BadRequestException('Mã VietQR sai chữ ký');
    }
    const payload = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf8'),
    ) as VietQrIntentPayload;
    if (!payload?.u || !payload?.a || !payload?.e) {
      throw new BadRequestException('Mã VietQR không hợp lệ');
    }
    return payload;
  }
}
