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
import {
  computeEscrowSplit,
  DEFAULT_COMMISSION_BPS,
} from '../../common/escrow';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  invoiceNumber,
  type PercentSettlementOptions,
  type SettlementOptions,
} from './finance.shared';

/** Escrow đơn: giữ cọc, giải ngân, hoàn cọc, giải ngân theo %. */
@Injectable()
export class FinanceEscrowService {
  constructor(private readonly prisma: PrismaService) {}

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
        throw new BadRequestException(
          'Đơn vừa được thanh toán bởi yêu cầu khác',
        );
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
          invoiceNumber: invoiceNumber(bookingId),
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
      throw new BadRequestException('Cọc không ở trạng thái đang giữ');
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
        ...(options.expectedStatus ? { status: options.expectedStatus } : {}),
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
      throw new BadRequestException('Cọc không ở trạng thái đang giữ');
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
    return this.prisma.$transaction((tx) =>
      this.releaseBookingByPercentInTransaction(
        tx,
        bookingId,
        percent,
        options,
      ),
    );
  }

  async releaseBookingByPercentInTransaction(
    tx: Prisma.TransactionClient,
    bookingId: string,
    percent: number,
    options: PercentSettlementOptions = {},
  ): Promise<boolean> {
    {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });
      if (!booking) throw new NotFoundException('Không tìm thấy đơn');
      if (booking.paymentStatus === PaymentStatus.RELEASED) return false;
      if (booking.paymentStatus !== PaymentStatus.HELD) {
        throw new BadRequestException('Cọc không ở trạng thái đang giữ');
      }
      if (!booking.partnerId) {
        throw new BadRequestException('Đơn chưa có người làm để giải ngân');
      }
      if (options.expectedStatus && booking.status !== options.expectedStatus) {
        throw new BadRequestException(
          'Đơn không ở trạng thái hợp lệ để quyết toán',
        );
      }
      if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
        throw new BadRequestException(
          'Phần trăm nghiệm thu phải trong khoảng 1..100',
        );
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
    }
  }
}
