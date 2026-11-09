import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ApplicationStatus,
  BookingStatus,
  PaymentStatus,
  Role,
} from '../../database/prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { bookingInclude, shapeBooking } from './booking.shared';
import { BookingSettlementService } from './booking-settlement.service';
import { BookingQueriesService } from './booking-queries.service';

@Injectable()
export class BookingBoardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settlement: BookingSettlementService,
    private readonly queries: BookingQueriesService,
  ) {}

  async listOpen(viewerId?: string, limit?: number) {
    await this.queries.publishDueScheduledBookings();
    await this.settlement.settleExpiredMatching();
    await this.settlement.settleExpiredResponseSla();
    // Chỉ đơn đã đặt cọc mới vào hàng chờ — tránh nhận việc rồi bỏ sàn.
    const take =
      limit != null && Number.isFinite(limit)
        ? Math.min(Math.max(Math.floor(limit), 1), 48)
        : undefined;
    const rows = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        partnerId: null,
        paymentStatus: PaymentStatus.HELD,
        OR: [
          { matchingDeadlineAt: null },
          { matchingDeadlineAt: { gt: new Date() } },
        ],
      },
      // Mới nhất lên đầu — khớp prepend realtime `booking:open`.
      orderBy: { createdAt: 'desc' },
      ...(take ? { take } : {}),
      include: bookingInclude,
    });
    const viewer = viewerId ? { id: viewerId, role: Role.PARTNER } : undefined;
    return rows.map((b) => shapeBooking(b, viewer, 'open_queue'));
  }

  /** Bảng tin đơn mở công khai (trang chủ) — che SĐT/địa chỉ qua open_queue. */
  async listOpenBoard(page = 1, pageSize = 10) {
    await this.queries.publishDueScheduledBookings();
    await this.settlement.settleExpiredMatching();
    await this.settlement.settleExpiredResponseSla();

    const safePage = Math.max(1, Math.floor(page) || 1);
    const safeSize = Math.min(Math.max(Math.floor(pageSize) || 10, 1), 48);
    const where = {
      status: BookingStatus.PENDING,
      partnerId: null,
      paymentStatus: PaymentStatus.HELD,
      OR: [
        { matchingDeadlineAt: null },
        { matchingDeadlineAt: { gt: new Date() } },
      ],
    };

    const [total, rows] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeSize,
        take: safeSize,
        include: bookingInclude,
      }),
    ]);

    const pageCount = Math.max(1, Math.ceil(total / safeSize));
    return {
      items: rows.map((b) => shapeBooking(b, undefined, 'open_queue')),
      total,
      page: safePage,
      pageSize: safeSize,
      pageCount,
    };
  }

  /** Chi tiết đơn mở công khai — chỉ khi còn trên bảng tin. */
  async getPublicOpenBooking(id: string) {
    await this.queries.publishDueScheduledBookings();
    await this.settlement.settleExpiredMatching(id);
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
    if (!booking) {
      throw new NotFoundException('Không tìm thấy đơn');
    }
    const now = new Date();
    const isOpen =
      booking.status === BookingStatus.PENDING &&
      !booking.partnerId &&
      booking.paymentStatus === PaymentStatus.HELD &&
      (booking.matchingDeadlineAt == null || booking.matchingDeadlineAt > now);
    if (!isOpen) {
      throw new NotFoundException('Đơn không còn mở trên bảng tin');
    }
    return shapeBooking(booking, undefined, 'open_queue');
  }

  /**
   * Ticker trang chủ — sự kiện gần đây, không PII (không tên/SĐT/địa chỉ).
   */
  async listPublicActivity(limit = 12) {
    const take = Math.min(Math.max(Math.floor(limit) || 12, 1), 24);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [opens, apps, dones] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          status: BookingStatus.PENDING,
          partnerId: null,
          paymentStatus: PaymentStatus.HELD,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          createdAt: true,
          jobTitle: true,
          service: {
            select: {
              name: true,
              category: { select: { group: { select: { slug: true } } } },
            },
          },
        },
      }),
      this.prisma.bookingApplication.findMany({
        where: { createdAt: { gte: since }, status: ApplicationStatus.APPLIED },
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          createdAt: true,
          booking: {
            select: {
              jobTitle: true,
              service: {
                select: {
                  name: true,
                  category: { select: { group: { select: { slug: true } } } },
                },
              },
            },
          },
        },
      }),
      this.prisma.booking.findMany({
        where: {
          status: BookingStatus.COMPLETED,
          OR: [{ releasedAt: { gte: since } }, { updatedAt: { gte: since } }],
        },
        orderBy: [{ releasedAt: 'desc' }, { updatedAt: 'desc' }],
        take,
        select: {
          id: true,
          releasedAt: true,
          updatedAt: true,
          jobTitle: true,
          service: {
            select: {
              name: true,
              category: { select: { group: { select: { slug: true } } } },
            },
          },
        },
      }),
    ]);

    type Item = {
      id: string;
      kind: 'open' | 'apply' | 'completed';
      /** Tiêu đề đơn (jobTitle hoặc tên nghề). */
      title: string;
      serviceName: string;
      groupSlug: string | null;
      at: string;
    };

    const titleOf = (
      jobTitle: string | null | undefined,
      serviceName: string,
    ) => jobTitle?.trim() || serviceName;

    const items: Item[] = [
      ...opens.map((b) => ({
        id: `open-${b.id}`,
        kind: 'open' as const,
        title: titleOf(b.jobTitle, b.service.name),
        serviceName: b.service.name,
        groupSlug: b.service.category?.group?.slug ?? null,
        at: b.createdAt.toISOString(),
      })),
      ...apps.map((a) => ({
        id: `apply-${a.id}`,
        kind: 'apply' as const,
        title: titleOf(a.booking.jobTitle, a.booking.service.name),
        serviceName: a.booking.service.name,
        groupSlug: a.booking.service.category?.group?.slug ?? null,
        at: a.createdAt.toISOString(),
      })),
      ...dones.map((b) => ({
        id: `done-${b.id}`,
        kind: 'completed' as const,
        title: titleOf(b.jobTitle, b.service.name),
        serviceName: b.service.name,
        groupSlug: b.service.category?.group?.slug ?? null,
        at: (b.releasedAt ?? b.updatedAt).toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, take);

    return { items };
  }

  /** Đơn vừa xong — dịch vụ + người làm (link hồ sơ), không PII khách. */
  async listRecentCompletedPublic(limit = 8) {
    const take = Math.min(Math.max(Math.floor(limit) || 8, 1), 24);
    const rows = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        partnerId: { not: null },
        partner: { partnerProfile: { isNot: null } },
      },
      orderBy: [{ releasedAt: 'desc' }, { updatedAt: 'desc' }],
      take: take * 3,
      select: {
        id: true,
        partnerId: true,
        releasedAt: true,
        updatedAt: true,
        service: { select: { name: true, slug: true } },
        partner: {
          select: {
            id: true,
            fullName: true,
            partnerProfile: { select: { avatarUrl: true } },
          },
        },
      },
    });

    // Ưu tiên mỗi người làm 1 lần gần nhất — feed đa dạng hơn.
    const seenPartners = new Set<string>();
    const items: Array<{
      id: string;
      serviceName: string;
      serviceSlug: string;
      completedAt: string;
      partnerUserId: string;
      partnerName: string;
      partnerAvatarUrl: string | null;
    }> = [];

    for (const b of rows) {
      if (!b.partnerId || !b.partner) continue;
      if (seenPartners.has(b.partnerId)) continue;
      seenPartners.add(b.partnerId);
      items.push({
        id: b.id,
        serviceName: b.service.name,
        serviceSlug: b.service.slug,
        completedAt: (b.releasedAt ?? b.updatedAt).toISOString(),
        partnerUserId: b.partnerId,
        partnerName: b.partner.fullName,
        partnerAvatarUrl: b.partner.partnerProfile?.avatarUrl ?? null,
      });
      if (items.length >= take) break;
    }

    return { items };
  }
}
