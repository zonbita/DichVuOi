import { Injectable } from '@nestjs/common';
import {
  ApplicationStatus,
  BookingStatus,
  PaymentStatus,
  Prisma,
  Role,
} from '../../database/prisma/client';
import { MATCHING_WINDOW_DAYS, RESPONSE_SLA_HOURS } from '../../common/escrow';
import { recalculatePartnerLevel } from '../../common/recalculate-partner-level';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import { PartnerRealtimeService } from './partner-realtime.service';
import { bookingInclude, shapeBooking } from './booking.shared';

@Injectable()
export class BookingSettlementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: PartnerRealtimeService,
    private readonly finance: FinanceService,
  ) {}

  /**
   * Tự hoàn thành các đơn hết cửa sổ xác nhận khi được truy cập.
   * Điều kiện update bảo đảm không giải ngân nếu đơn vừa chuyển DISPUTED.
   */
  async settleExpiredConfirmations(bookingId?: string) {
    const expired = await this.prisma.booking.findMany({
      where: {
        ...(bookingId ? { id: bookingId } : {}),
        status: BookingStatus.AWAITING_CONFIRM,
        paymentStatus: PaymentStatus.HELD,
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
      // Giải ngân + hoàn cọc ứng tuyển trong cùng một transaction:
      // lỗi giữa chừng sẽ rollback cả hai, không để lệch sổ.
      const released = await this.prisma.$transaction(async (tx) => {
        const ok = await this.finance.releaseBookingInTransaction(
          tx,
          booking.id,
          {
            expectedStatus: BookingStatus.AWAITING_CONFIRM,
            status: BookingStatus.COMPLETED,
          },
        );
        if (ok && booking.partnerId) {
          await this.refundSelectedApplyDeposit(
            tx,
            booking.id,
            booking.partnerId,
          );
        }
        return ok;
      });
      if (released && booking.partnerId) {
        await recalculatePartnerLevel(this.prisma, booking.partnerId);
      }
    }
  }

  /** Hủy đơn PENDING hết hạn ghép + hoàn cọc khách + hoàn cọc ứng tuyển. */
  async settleExpiredMatching(bookingId?: string) {
    const expired = await this.prisma.booking.findMany({
      where: {
        ...(bookingId ? { id: bookingId } : {}),
        status: BookingStatus.PENDING,
        partnerId: null,
        matchingDeadlineAt: { lte: new Date() },
      },
      select: { id: true, paymentStatus: true, userId: true },
    });

    for (const booking of expired) {
      await this.prisma.$transaction(async (tx) => {
        await this.refundOpenApplications(tx, booking.id);
        if (booking.paymentStatus === PaymentStatus.HELD) {
          await this.finance.refundBookingInTransaction(tx, booking.id, {
            status: BookingStatus.CANCELLED,
            disputeResultNote: `Hết hạn ghép người làm (${MATCHING_WINDOW_DAYS} ngày) — hoàn cọc.`,
          });
        } else {
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.CANCELLED,
              disputeResultNote: `Hết hạn ghép người làm (${MATCHING_WINDOW_DAYS} ngày).`,
            },
          });
        }
      });
      this.realtime.emitOpenRemoved(booking.id);
      const fresh = await this.prisma.booking.findUnique({
        where: { id: booking.id },
        include: bookingInclude,
      });
      if (fresh) {
        this.realtime.emitCustomerBooking(
          fresh.userId,
          shapeBooking(fresh, { id: fresh.userId, role: Role.CUSTOMER }),
        );
      }
    }
  }

  /**
   * Các helper cọc ứng tuyển bắt buộc chạy trong transaction của caller,
   * để ví + sổ cái + trạng thái hồ sơ cùng commit hoặc cùng rollback.
   * Hồ sơ được "claim" bằng updateMany có điều kiện depositStatus=HELD
   * để hai request song song không xử lý cùng một khoản cọc hai lần.
   */
  async refundOpenApplications(
    tx: Prisma.TransactionClient,
    bookingId: string,
  ) {
    const apps = await tx.bookingApplication.findMany({
      where: {
        bookingId,
        depositStatus: PaymentStatus.HELD,
      },
    });
    for (const app of apps) {
      const claimed = await tx.bookingApplication.updateMany({
        where: { id: app.id, depositStatus: PaymentStatus.HELD },
        data: {
          depositStatus: PaymentStatus.REFUNDED,
          status:
            app.status === ApplicationStatus.SELECTED ||
            app.status === ApplicationStatus.APPLIED
              ? ApplicationStatus.REFUNDED
              : ApplicationStatus.REJECTED,
        },
      });
      if (claimed.count !== 1) continue;
      await this.finance.refundApplyDepositInTransaction(
        tx,
        bookingId,
        app.partnerId,
        app.id,
        app.depositAmount,
      );
    }
  }

  async refundSelectedApplyDeposit(
    tx: Prisma.TransactionClient,
    bookingId: string,
    partnerId: string,
  ) {
    const app = await tx.bookingApplication.findUnique({
      where: {
        bookingId_partnerId: { bookingId, partnerId },
      },
    });
    if (!app || app.depositStatus !== PaymentStatus.HELD) return;
    const claimed = await tx.bookingApplication.updateMany({
      where: { id: app.id, depositStatus: PaymentStatus.HELD },
      data: {
        depositStatus: PaymentStatus.REFUNDED,
        status: ApplicationStatus.REFUNDED,
      },
    });
    if (claimed.count !== 1) return;
    await this.finance.refundApplyDepositInTransaction(
      tx,
      bookingId,
      partnerId,
      app.id,
      app.depositAmount,
    );
  }

  async forfeitSelectedApplyDeposit(
    tx: Prisma.TransactionClient,
    bookingId: string,
    partnerId: string,
    reason: string,
  ) {
    const app = await tx.bookingApplication.findUnique({
      where: {
        bookingId_partnerId: { bookingId, partnerId },
      },
    });
    if (!app || app.depositStatus !== PaymentStatus.HELD) return;
    const claimed = await tx.bookingApplication.updateMany({
      where: { id: app.id, depositStatus: PaymentStatus.HELD },
      data: {
        depositStatus: PaymentStatus.RELEASED,
        status: ApplicationStatus.REJECTED,
      },
    });
    if (claimed.count !== 1) return;
    await this.finance.forfeitApplyDepositInTransaction(
      tx,
      bookingId,
      partnerId,
      app.id,
      app.depositAmount,
      reason,
    );
  }

  /**
   * SLA phản hồi: CONFIRMED quá responseDeadlineAt mà chưa IN_PROGRESS
   * → tịch thu cọc ứng tuyển + gỡ partner + mở lại PENDING (nếu còn hạn ghép).
   */
  async settleExpiredResponseSla(bookingId?: string) {
    const expired = await this.prisma.booking.findMany({
      where: {
        ...(bookingId ? { id: bookingId } : {}),
        status: BookingStatus.CONFIRMED,
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
      if (!booking.partnerId) continue;
      const partnerId = booking.partnerId;
      const reason = `Không vào làm trong ${RESPONSE_SLA_HOURS} giờ sau khi được chọn`;

      const matchingStillOpen =
        !booking.matchingDeadlineAt ||
        booking.matchingDeadlineAt.getTime() > Date.now();
      const reopen =
        matchingStillOpen && booking.paymentStatus === PaymentStatus.HELD;

      await this.prisma.$transaction(async (tx) => {
        await this.forfeitSelectedApplyDeposit(
          tx,
          booking.id,
          partnerId,
          reason,
        );
        if (reopen) {
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              partnerId: null,
              status: BookingStatus.PENDING,
              responseDeadlineAt: null,
              disputeResultNote: `${reason} — đã tịch thu cọc ứng tuyển, đơn mở lại hàng chờ.`,
            },
          });
        } else if (booking.paymentStatus === PaymentStatus.HELD) {
          await this.finance.refundBookingInTransaction(tx, booking.id, {
            status: BookingStatus.CANCELLED,
            disputeResultNote: `${reason} — hết hạn ghép, hoàn cọc khách.`,
          });
        } else {
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.CANCELLED,
              partnerId: null,
              responseDeadlineAt: null,
              disputeResultNote: reason,
            },
          });
        }
      });

      if (reopen) {
        const fresh = await this.prisma.booking.findUniqueOrThrow({
          where: { id: booking.id },
          include: bookingInclude,
        });
        this.realtime.emitOpenCreated(
          shapeBooking(fresh, undefined, 'open_queue'),
        );
        this.realtime.emitPartnerBooking(
          partnerId,
          'booking:updated',
          shapeBooking(fresh, { id: partnerId, role: Role.PARTNER }),
        );
        this.realtime.emitCustomerBooking(
          fresh.userId,
          shapeBooking(fresh, { id: fresh.userId, role: Role.CUSTOMER }),
        );
      } else {
        this.realtime.emitOpenRemoved(booking.id);
        const fresh = await this.prisma.booking.findUnique({
          where: { id: booking.id },
          include: bookingInclude,
        });
        if (fresh) {
          this.realtime.emitPartnerBooking(
            partnerId,
            'booking:updated',
            shapeBooking(fresh, { id: partnerId, role: Role.PARTNER }),
          );
          this.realtime.emitCustomerBooking(
            fresh.userId,
            shapeBooking(fresh, { id: fresh.userId, role: Role.CUSTOMER }),
          );
        }
      }
    }
  }
}
