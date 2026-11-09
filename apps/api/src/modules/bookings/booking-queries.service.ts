import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  BookingStatus,
  PaymentStatus,
  Role,
} from '../../database/prisma/client';
import { MATCHING_WINDOW_DAYS } from '../../common/escrow';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PartnerRealtimeService } from './partner-realtime.service';
import { bookingInclude, type Viewer, shapeBooking } from './booking.shared';
import { BookingSupportService } from './booking-support.service';
import { BookingSettlementService } from './booking-settlement.service';

@Injectable()
export class BookingQueriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: PartnerRealtimeService,
    private readonly support: BookingSupportService,
    private readonly settlement: BookingSettlementService,
  ) {}
  async findOne(id: string, viewer?: Viewer) {
    await this.publishDueScheduledBookings();
    await this.settlement.settleExpiredMatching(id);
    await this.settlement.settleExpiredResponseSla(id);
    await this.settlement.settleExpiredConfirmations(id);
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy đơn đặt lịch');
    }

    const now = new Date();
    const isOpenBoard =
      booking.status === BookingStatus.PENDING &&
      !booking.partnerId &&
      booking.paymentStatus === PaymentStatus.HELD &&
      (booking.matchingDeadlineAt == null || booking.matchingDeadlineAt > now);

    if (viewer && viewer.role !== Role.ADMIN) {
      const isCustomer = booking.userId === viewer.id;
      const isAssignedPartner = booking.partnerId === viewer.id;
      const isApplicant =
        !isCustomer &&
        !isAssignedPartner &&
        (await this.prisma.bookingApplication.findFirst({
          where: {
            bookingId: id,
            partnerId: viewer.id,
            status: {
              in: [ApplicationStatus.APPLIED, ApplicationStatus.SELECTED],
            },
          },
          select: { id: true },
        }));

      if (!isCustomer && !isAssignedPartner && !isApplicant && !isOpenBoard) {
        throw new ForbiddenException('Không xem được đơn này');
      }
    }

    // Đơn cũ / seed thiếu checklist — bổ sung khi partner đã nhận hoặc có ghi chú.
    if (
      (booking.partnerId || booking.note) &&
      (booking.requirements?.length ?? 0) === 0
    ) {
      await this.support.seedRequirementsIfEmpty(id);
      const refreshed = await this.prisma.booking.findUniqueOrThrow({
        where: { id },
        include: bookingInclude,
      });
      const useOpenQueue =
        Boolean(viewer) &&
        viewer!.role !== Role.ADMIN &&
        refreshed.userId !== viewer!.id &&
        refreshed.partnerId !== viewer!.id;
      return shapeBooking(
        refreshed,
        viewer,
        useOpenQueue ? 'open_queue' : undefined,
      );
    }

    const useOpenQueue =
      Boolean(viewer) &&
      viewer!.role !== Role.ADMIN &&
      booking.userId !== viewer!.id &&
      booking.partnerId !== viewer!.id;

    return shapeBooking(
      booking,
      viewer,
      useOpenQueue ? 'open_queue' : undefined,
    );
  }

  async listMineAsCustomer(userId: string) {
    await this.publishDueScheduledBookings();
    await this.settlement.settleExpiredMatching();
    await this.settlement.settleExpiredResponseSla();
    await this.settlement.settleExpiredConfirmations();
    const rows = await this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: bookingInclude,
    });
    return rows.map((b) =>
      shapeBooking(b, { id: userId, role: Role.CUSTOMER }),
    );
  }

  /**
   * Đơn SCHEDULED tới giờ publishAt → PENDING + mở hàng chờ + realtime.
   */
  async publishDueScheduledBookings() {
    const now = new Date();
    const due = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.SCHEDULED,
        partnerId: null,
        publishAt: { lte: now },
      },
      include: bookingInclude,
    });

    for (const booking of due) {
      const matchingDeadlineAt = new Date(
        now.getTime() + MATCHING_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      );
      const updated = await this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.PENDING,
          matchingDeadlineAt,
        },
        include: bookingInclude,
      });
      this.realtime.emitOpenCreated(
        shapeBooking(updated, undefined, 'open_queue'),
      );
      this.realtime.emitCustomerBooking(
        updated.userId,
        shapeBooking(updated, { id: updated.userId, role: Role.CUSTOMER }),
      );
    }
  }

  /**
   * Lịch tháng khách thuê: các slot hẹn đăng đơn (theo publishAt).
   */
  async listCustomerPublishSchedule(
    userId: string,
    year: number,
    month: number,
  ) {
    await this.publishDueScheduledBookings();
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 1, 0, 0, 0, 0);
    const daysInMonth = new Date(year, month, 0).getDate();

    const rows = await this.prisma.booking.findMany({
      where: {
        userId,
        publishAt: { gte: start, lt: end },
        status: { not: BookingStatus.CANCELLED },
      },
      orderBy: { publishAt: 'asc' },
      include: bookingInclude,
    });

    /** Khối hiển thị trên lưới giờ — sự kiện đăng, không phải giờ làm. */
    const PUBLISH_SLOT_MIN = 30;

    const items = rows.map((b) => {
      const shaped = shapeBooking(b, { id: userId, role: Role.CUSTOMER });
      const startAt = new Date(b.publishAt!);
      const endAt = new Date(startAt.getTime() + PUBLISH_SLOT_MIN * 60_000);
      const startHour =
        startAt.getHours() +
        startAt.getMinutes() / 60 +
        startAt.getSeconds() / 3600;
      const endHourRaw =
        endAt.getHours() + endAt.getMinutes() / 60 + endAt.getSeconds() / 3600;
      const crossesDay = endAt.getDate() !== startAt.getDate();
      const endHour = crossesDay ? 24 : Math.max(startHour + 0.25, endHourRaw);

      return {
        ...shaped,
        day: startAt.getDate(),
        startHour,
        endHour,
        durationMin: PUBLISH_SLOT_MIN,
        durationHours: Math.round((PUBLISH_SLOT_MIN / 60) * 100) / 100,
      };
    });

    return { year, month, daysInMonth, items };
  }

  /** Gợi ý thuê lại — gom đơn COMPLETED theo partner + dịch vụ. */
  async getRebookHints(userId: string) {
    const rows = await this.prisma.booking.findMany({
      where: {
        userId,
        status: BookingStatus.COMPLETED,
        partnerId: { not: null },
      },
      orderBy: { scheduledAt: 'desc' },
      select: {
        partnerId: true,
        totalPrice: true,
        scheduledAt: true,
        partner: {
          select: {
            id: true,
            fullName: true,
            partnerProfile: { select: { avatarUrl: true } },
          },
        },
        service: {
          select: {
            slug: true,
            name: true,
            category: { select: { group: { select: { slug: true } } } },
          },
        },
      },
    });

    const byKey = new Map<
      string,
      {
        partnerUserId: string;
        partnerName: string;
        partnerAvatarUrl: string | null;
        serviceSlug: string;
        serviceName: string;
        groupSlug: string;
        lastBookedAt: Date;
        lastPrice: number;
        bookingCount: number;
      }
    >();

    for (const row of rows) {
      if (!row.partnerId || !row.partner) continue;
      const key = `${row.partnerId}:${row.service.slug}`;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, {
          partnerUserId: row.partnerId,
          partnerName: row.partner.fullName,
          partnerAvatarUrl: row.partner.partnerProfile?.avatarUrl ?? null,
          serviceSlug: row.service.slug,
          serviceName: row.service.name,
          groupSlug: row.service.category.group.slug,
          lastBookedAt: row.scheduledAt,
          lastPrice: row.totalPrice,
          bookingCount: 1,
        });
      } else {
        existing.bookingCount += 1;
      }
    }

    return [...byKey.values()]
      .sort((a, b) => b.lastBookedAt.getTime() - a.lastBookedAt.getTime())
      .slice(0, 12)
      .map((item) => ({
        ...item,
        lastBookedAt: item.lastBookedAt.toISOString(),
      }));
  }

  async listMineAsPartner(partnerId: string) {
    await this.settlement.settleExpiredResponseSla();
    await this.settlement.settleExpiredConfirmations();
    const rows = await this.prisma.booking.findMany({
      where: {
        OR: [
          { partnerId },
          {
            applications: {
              some: {
                partnerId,
                status: {
                  in: [ApplicationStatus.APPLIED, ApplicationStatus.SELECTED],
                },
              },
            },
          },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      include: bookingInclude,
    });

    for (const row of rows) {
      if (
        (row.requirements?.length ?? 0) === 0 &&
        (row.partnerId === partnerId || row.note)
      ) {
        await this.support.seedRequirementsIfEmpty(row.id);
      }
    }

    const fresh = await this.prisma.booking.findMany({
      where: {
        OR: [
          { partnerId },
          {
            applications: {
              some: {
                partnerId,
                status: {
                  in: [ApplicationStatus.APPLIED, ApplicationStatus.SELECTED],
                },
              },
            },
          },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      include: bookingInclude,
    });

    return fresh.map((b) => {
      const assigned = b.partnerId === partnerId;
      return shapeBooking(
        b,
        { id: partnerId, role: Role.PARTNER },
        assigned ? undefined : 'open_queue',
      );
    });
  }

  /**
   * Lịch tháng của partner: các slot thuê theo ngày × giờ (dựa trên scheduledAt + durationMin).
   */
  async listPartnerSchedule(partnerId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 1, 0, 0, 0, 0);
    const daysInMonth = new Date(year, month, 0).getDate();

    const rows = await this.prisma.booking.findMany({
      where: {
        partnerId,
        scheduledAt: { gte: start, lt: end },
        status: { not: BookingStatus.CANCELLED },
      },
      orderBy: { scheduledAt: 'asc' },
      include: bookingInclude,
    });

    const items = rows.map((b) => {
      const shaped = shapeBooking(b, { id: partnerId, role: Role.PARTNER });
      const startAt = new Date(b.scheduledAt);
      const durationMin = b.service.durationMin || 60;
      const endAt = new Date(startAt.getTime() + durationMin * 60_000);
      const startHour =
        startAt.getHours() +
        startAt.getMinutes() / 60 +
        startAt.getSeconds() / 3600;
      const endHourRaw =
        endAt.getHours() + endAt.getMinutes() / 60 + endAt.getSeconds() / 3600;
      // Nếu kéo sang ngày sau (cùng lịch tháng), kẹp hiển thị trong ngày bắt đầu.
      const crossesDay = endAt.getDate() !== startAt.getDate();
      const endHour = crossesDay ? 24 : Math.max(startHour + 0.25, endHourRaw);

      return {
        ...shaped,
        day: startAt.getDate(),
        startHour,
        endHour,
        durationMin,
        durationHours: Math.round((durationMin / 60) * 100) / 100,
      };
    });

    return { year, month, daysInMonth, items };
  }
}
