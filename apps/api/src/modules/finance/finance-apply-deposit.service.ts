import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WalletTransactionType } from '../../database/prisma/client';
import { computeApplyDeposit } from '../../common/escrow';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { ApplyDepositOptions } from './finance.shared';

/** Cọc ứng tuyển của người làm: giữ / hoàn / tịch thu. */
@Injectable()
export class FinanceApplyDepositService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.$transaction((tx) =>
      this.forfeitApplyDepositInTransaction(
        tx,
        bookingId,
        partnerId,
        applicationId,
        amount,
        reason,
      ),
    );
  }

  async forfeitApplyDepositInTransaction(
    tx: Prisma.TransactionClient,
    bookingId: string,
    partnerId: string,
    applicationId: string,
    amount: number,
    reason: string,
  ): Promise<boolean> {
    const reference = `apply-forfeit:${applicationId}`;
    const existing = await tx.walletTransaction.findUnique({
      where: { reference },
    });
    if (existing) return false;

    const partner = await tx.user.findUnique({
      where: { id: partnerId },
      select: { walletBalance: true },
    });
    if (!partner) throw new NotFoundException('Không tìm thấy người làm');

    await tx.walletTransaction.create({
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
}
