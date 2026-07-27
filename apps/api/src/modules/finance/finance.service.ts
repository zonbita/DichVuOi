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
} from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  computeEscrowSplit,
  DEFAULT_COMMISSION_BPS,
} from '../../common/escrow';
import { PrismaService } from '../../database/prisma/prisma.service';

type SettlementOptions = {
  status?: BookingStatus;
  expectedStatus?: BookingStatus;
  disputeResultNote?: string | null;
};

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

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

  private invoiceNumber(bookingId: string) {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `DVO-${y}${m}${d}-${bookingId.slice(-8).toUpperCase()}`;
  }
}
