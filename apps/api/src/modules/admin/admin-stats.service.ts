import { Injectable } from '@nestjs/common';
import {
  BookingStatus,
  ComplaintStatus,
  PartnerServicePostStatus,
  PaymentStatus,
  SupportThreadStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';

/** Dashboard stats + GMV chart. */
@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [
      users,
      partners,
      partnersPendingVerify,
      bookings,
      held,
      released,
      completed,
      cancelled,
      reviews,
      redactedMessages,
      openJobs,
      complaintsPending,
      servicePostsPending,
      supportOpen,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.partnerProfile.count(),
      this.prisma.partnerProfile.count({ where: { isVerified: false } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({
        where: { paymentStatus: PaymentStatus.HELD },
      }),
      this.prisma.booking.count({
        where: { paymentStatus: PaymentStatus.RELEASED },
      }),
      this.prisma.booking.count({
        where: { status: BookingStatus.COMPLETED },
      }),
      this.prisma.booking.count({
        where: { status: BookingStatus.CANCELLED },
      }),
      this.prisma.review.count(),
      this.prisma.bookingMessage.count({ where: { redacted: true } }),
      this.prisma.booking.count({
        where: { status: BookingStatus.PENDING, partnerId: null },
      }),
      this.prisma.complaint.count({
        where: {
          status: {
            in: [ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW],
          },
        },
      }),
      this.prisma.partnerServicePost.count({
        where: { status: PartnerServicePostStatus.PENDING },
      }),
      this.prisma.supportThread.count({
        where: { status: SupportThreadStatus.OPEN },
      }),
    ]);

    const escrowAgg = await this.prisma.booking.aggregate({
      where: { paymentStatus: PaymentStatus.HELD },
      _sum: { totalPrice: true },
    });
    const commissionAgg = await this.prisma.booking.aggregate({
      where: { paymentStatus: PaymentStatus.RELEASED },
      _sum: { commissionAmount: true },
    });
    const gmvAgg = await this.prisma.booking.aggregate({
      where: { status: BookingStatus.COMPLETED },
      _sum: { totalPrice: true },
    });

    return {
      users,
      partners,
      partnersPendingVerify,
      bookings,
      openJobs,
      completed,
      cancelled,
      escrowHeldCount: held,
      escrowHeldAmount: escrowAgg._sum.totalPrice ?? 0,
      escrowReleasedCount: released,
      commissionEarned: commissionAgg._sum.commissionAmount ?? 0,
      gmvCompleted: gmvAgg._sum.totalPrice ?? 0,
      reviews,
      redactedMessages,
      complaintsPending,
      servicePostsPending,
      /** Chat hỗ trợ còn mở — chưa đóng. */
      supportOpen,
    };
  }

  /** GMV theo ngày (đơn COMPLETED) — biểu đồ Tổng quan. */
  async gmvSeries(days = 30) {
    const safeDays = Math.min(90, Math.max(7, days));
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (safeDays - 1));

    const rows = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        OR: [
          { releasedAt: { gte: since } },
          { releasedAt: null, updatedAt: { gte: since } },
        ],
      },
      select: { releasedAt: true, updatedAt: true, totalPrice: true },
    });

    const byDay = new Map<string, number>();
    for (let i = 0; i < safeDays; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, 0);
    }
    for (const row of rows) {
      const at = row.releasedAt ?? row.updatedAt;
      const key = at.toISOString().slice(0, 10);
      if (byDay.has(key)) {
        byDay.set(key, (byDay.get(key) ?? 0) + (row.totalPrice ?? 0));
      }
    }

    return {
      days: safeDays,
      points: [...byDay.entries()].map(([date, gmv]) => ({ date, gmv })),
      total: [...byDay.values()].reduce((a, b) => a + b, 0),
    };
  }
}
