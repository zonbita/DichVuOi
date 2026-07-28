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
import { createHmac, randomUUID } from 'crypto';
import {
  computeEscrowSplit,
  DEFAULT_COMMISSION_BPS,
  computeApplyDeposit,
} from '../../common/escrow';
import { PrismaService } from '../../database/prisma/prisma.service';

type SettlementOptions = {
  status?: BookingStatus;
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
  private readonly vietQrIntentSecret =
    process.env.VIETQR_INTENT_SECRET ?? 'dichvuoi-dev-vietqr-secret';
  private readonly vietQrIntentTtlMs = 15 * 60_000;

  async getWallet(userId: string) {
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
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    return {
      currency: 'VND',
      balance: user.walletBalance,
      transactions: user.walletTransactions,
    };
  }

  async topUp(userId: string, amount: number) {
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

  /** Người làm đặt cọc ứng tuyển (10% totalPrice) — debit ví. */
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
        options.amount ?? computeApplyDeposit(booking.totalPrice);
      if (amount <= 0) {
        throw new BadRequestException('Số tiền cọc ứng tuyển không hợp lệ');
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
    if (sig !== expect) {
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
