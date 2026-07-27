import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, PaymentStatus, Role } from '@prisma/client';
import {
  isDepositHeld,
  redactContactLeak,
  shapeBookingForViewer,
  type ContactViewerRole,
} from '../../common/contact-privacy';
import { buildRequirementSeeds } from '../../common/booking-requirements';
import { computeEscrowSplit } from '../../common/escrow';
import { recalculatePartnerLevel } from '../../common/recalculate-partner-level';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateBookingMessageDto } from './dto/create-booking-message.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { ConfirmBookingDto } from './dto/update-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { PartnerRealtimeService } from './partner-realtime.service';

/** Cửa sổ chờ xác nhận mặc định (giờ) sau khi người làm báo xong. */
const CONFIRM_WINDOW_HOURS = 48;

const bookingInclude = {
  service: {
    include: {
      category: {
        include: { group: true },
      },
    },
  },
  partner: {
    select: { id: true, fullName: true, phone: true, email: true },
  },
  user: {
    select: { id: true, fullName: true, phone: true, email: true },
  },
  reviews: {
    select: {
      id: true,
      fromUserId: true,
      toUserId: true,
      rating: true,
      comment: true,
      createdAt: true,
    },
  },
  requirements: {
    orderBy: { sortOrder: 'asc' as const },
  },
} as const;

type Viewer = { id: string; role: string };

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: PartnerRealtimeService,
    private readonly finance: FinanceService,
  ) {}

  private viewerRole(
    booking: { userId: string; partnerId: string | null },
    viewer: Viewer | undefined,
    mode?: 'open_queue',
  ): ContactViewerRole {
    if (mode === 'open_queue') return 'open_queue';
    if (!viewer) return 'customer';
    if (viewer.role === Role.ADMIN) return 'admin';
    if (booking.partnerId && booking.partnerId === viewer.id) return 'partner';
    if (booking.userId === viewer.id) return 'customer';
    return 'customer';
  }

  private shape<T extends Parameters<typeof shapeBookingForViewer>[0]>(
    booking: T,
    viewer: Viewer | undefined,
    mode?: 'open_queue',
  ) {
    return shapeBookingForViewer(
      booking,
      this.viewerRole(booking, viewer, mode),
    );
  }

  private async emitBookingUpdate(
    booking: Parameters<typeof shapeBookingForViewer>[0] & {
      userId: string;
      partnerId: string | null;
    },
    viewer?: Viewer,
  ) {
    if (booking.partnerId) {
      this.realtime.emitPartnerBooking(
        booking.partnerId,
        'booking:updated',
        this.shape(booking, {
          id: booking.partnerId,
          role: Role.PARTNER,
        }),
      );
    }
    this.realtime.emitCustomerBooking(
      booking.userId,
      this.shape(booking, { id: booking.userId, role: Role.CUSTOMER }),
    );
    return viewer ? this.shape(booking, viewer) : this.shape(booking, undefined);
  }

  /** Seed checklist từ includes gói + ghi chú khách (một lần khi đã có partner). */
  private async seedRequirementsIfEmpty(bookingId: string) {
    const existing = await this.prisma.bookingRequirement.count({
      where: { bookingId },
    });
    if (existing > 0) return;

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        note: true,
        serviceId: true,
        partnerId: true,
      },
    });
    if (!booking?.partnerId) return;

    const offering = await this.prisma.partnerService.findFirst({
      where: {
        serviceId: booking.serviceId,
        isActive: true,
        partnerProfile: { userId: booking.partnerId },
      },
      select: { includes: true },
    });

    const seeds = buildRequirementSeeds({
      includes: offering?.includes,
      customerNote: booking.note,
    });
    if (seeds.length === 0) return;

    await this.prisma.bookingRequirement.createMany({
      data: seeds.map((item) => ({
        bookingId,
        content: item.content,
        source: item.source,
        sortOrder: item.sortOrder,
      })),
    });
  }

  /**
   * Tự hoàn thành các đơn hết cửa sổ xác nhận khi được truy cập.
   * Điều kiện update bảo đảm không giải ngân nếu đơn vừa chuyển DISPUTED.
   */
  private async settleExpiredConfirmations(bookingId?: string) {
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
      const released = await this.finance.releaseBooking(booking.id, {
        expectedStatus: BookingStatus.AWAITING_CONFIRM,
        status: BookingStatus.COMPLETED,
      });
      if (released && booking.partnerId) {
        await recalculatePartnerLevel(this.prisma, booking.partnerId);
      }
    }
  }

  async create(dto: CreateBookingDto, customerId?: string) {
    const service = await this.prisma.service.findUnique({
      where: { slug: dto.serviceSlug },
    });

    if (!service || !service.isActive) {
      throw new NotFoundException('Không tìm thấy dịch vụ');
    }

    const userId = customerId;
    if (!userId) {
      throw new BadRequestException('Cần đăng nhập để thuê dịch vụ');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');

    let partnerId: string | undefined;
    let totalPrice = service.basePrice;
    let status: BookingStatus = BookingStatus.PENDING;

    if (dto.partnerId) {
      const offering = await this.prisma.partnerService.findFirst({
        where: {
          serviceId: service.id,
          isActive: true,
          partnerProfile: { userId: dto.partnerId },
        },
      });

      if (!offering) {
        throw new BadRequestException('Người làm không cung cấp dịch vụ này');
      }

      partnerId = dto.partnerId;
      totalPrice = offering.price ?? service.basePrice;
      status = BookingStatus.CONFIRMED;
    }

    const noteResult = dto.note
      ? redactContactLeak(dto.note)
      : { text: undefined as string | undefined, redacted: false };

    let budgetMin: number | undefined;
    let budgetMax: number | undefined;
    if (dto.budgetMin != null || dto.budgetMax != null) {
      const lo = dto.budgetMin ?? dto.budgetMax ?? 0;
      const hi = dto.budgetMax ?? dto.budgetMin ?? lo;
      budgetMin = Math.min(lo, hi);
      budgetMax = Math.max(lo, hi);
    }

    const split = computeEscrowSplit(totalPrice);

    const booking = await this.prisma.booking.create({
      data: {
        userId: user.id,
        serviceId: service.id,
        partnerId,
        status,
        address: dto.address,
        scheduledAt: new Date(dto.scheduledAt),
        note: noteResult.text,
        budgetMin,
        budgetMax,
        totalPrice,
        customerName: dto.customerName || user.fullName,
        customerPhone: dto.customerPhone || user.phone || '',
        paymentStatus: PaymentStatus.UNPAID,
        commissionBps: split.commissionBps,
        commissionAmount: 0,
        partnerPayout: 0,
      },
      include: bookingInclude,
    });

    if (partnerId) {
      await this.seedRequirementsIfEmpty(booking.id);
    }

    const fresh = partnerId
      ? await this.prisma.booking.findUniqueOrThrow({
          where: { id: booking.id },
          include: bookingInclude,
        })
      : booking;

    const shaped = this.shape(fresh, { id: user.id, role: user.role });
    if (partnerId) {
      this.realtime.emitPartnerBooking(partnerId, 'booking:assigned', shaped);
    }
    this.realtime.emitCustomerBooking(user.id, shaped);
    return shaped;
  }

  async findOne(id: string, viewer?: Viewer) {
    await this.settleExpiredConfirmations(id);
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy đơn đặt lịch');
    }

    if (
      viewer &&
      viewer.role !== Role.ADMIN &&
      booking.userId !== viewer.id &&
      booking.partnerId !== viewer.id
    ) {
      throw new ForbiddenException('Không xem được đơn này');
    }

    return this.shape(booking, viewer);
  }

  async listMineAsCustomer(userId: string) {
    await this.settleExpiredConfirmations();
    const rows = await this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: bookingInclude,
    });
    return rows.map((b) => this.shape(b, { id: userId, role: Role.CUSTOMER }));
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
          select: { slug: true, name: true, category: { select: { group: { select: { slug: true } } } } },
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
    await this.settleExpiredConfirmations();
    const rows = await this.prisma.booking.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
      include: bookingInclude,
    });
    return rows.map((b) =>
      this.shape(b, { id: partnerId, role: Role.PARTNER }),
    );
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
      const shaped = this.shape(b, { id: partnerId, role: Role.PARTNER });
      const startAt = new Date(b.scheduledAt);
      const durationMin = b.service.durationMin || 60;
      const endAt = new Date(startAt.getTime() + durationMin * 60_000);
      const startHour =
        startAt.getHours() + startAt.getMinutes() / 60 + startAt.getSeconds() / 3600;
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

  async listOpen() {
    // Chỉ đơn đã đặt cọc mới vào hàng chờ — tránh nhận việc rồi bỏ sàn.
    const rows = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        partnerId: null,
        paymentStatus: PaymentStatus.HELD,
      },
      orderBy: { scheduledAt: 'asc' },
      include: bookingInclude,
    });
    return rows.map((b) => this.shape(b, undefined, 'open_queue'));
  }

  async accept(id: string, partnerId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');
    if (booking.status !== BookingStatus.PENDING || booking.partnerId) {
      throw new BadRequestException('Đơn không còn mở để nhận');
    }
    if (!isDepositHeld(booking.paymentStatus)) {
      throw new BadRequestException(
        'Khách chưa đặt cọc giữ chỗ — không thể nhận việc',
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        partnerId,
        status: BookingStatus.CONFIRMED,
      },
      include: bookingInclude,
    });

    await this.seedRequirementsIfEmpty(id);
    const withReqs = await this.prisma.booking.findUniqueOrThrow({
      where: { id },
      include: bookingInclude,
    });

    const shaped = this.shape(withReqs, { id: partnerId, role: Role.PARTNER });
    this.realtime.emitOpenRemoved(id);
    this.realtime.emitPartnerBooking(partnerId, 'booking:assigned', shaped);
    this.realtime.emitCustomerBooking(
      withReqs.userId,
      this.shape(withReqs, { id: withReqs.userId, role: Role.CUSTOMER }),
    );
    return shaped;
  }

  /** Mock đặt cọc — giữ tiền escrow trên sàn (bắt buộc trước khi vào hàng chờ / chat). */
  async payEscrow(id: string, viewer: Viewer) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');

    if (viewer.role !== Role.ADMIN && booking.userId !== viewer.id) {
      throw new ForbiddenException('Chỉ khách thuê đặt cọc đơn này');
    }
    await this.finance.holdBooking(id, booking.userId);
    const updated = await this.prisma.booking.findUniqueOrThrow({
      where: { id },
      include: bookingInclude,
    });

    const shaped = this.shape(updated, viewer);
    // Đơn mở vào hàng chờ → realtime cho mọi partner.
    if (updated.status === BookingStatus.PENDING && !updated.partnerId) {
      this.realtime.emitOpenCreated(
        this.shape(updated, undefined, 'open_queue'),
      );
    }
    // Thuê thẳng đã có partner → cập nhật lịch partner.
    if (updated.partnerId) {
      this.realtime.emitPartnerBooking(
        updated.partnerId,
        'booking:updated',
        this.shape(updated, { id: updated.partnerId, role: Role.PARTNER }),
      );
    }
    this.realtime.emitCustomerBooking(
      updated.userId,
      this.shape(updated, { id: updated.userId, role: Role.CUSTOMER }),
    );
    return shaped;
  }

  async updateStatus(
    id: string,
    status: BookingStatus,
    viewer: Viewer,
    acceptIncomplete = false,
  ) {
    const raw = await this.prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
    if (!raw) throw new NotFoundException('Không tìm thấy đơn đặt lịch');

    if (
      viewer.role !== Role.ADMIN &&
      raw.userId !== viewer.id &&
      raw.partnerId !== viewer.id
    ) {
      throw new ForbiddenException('Không xem được đơn này');
    }

    const allowed: Record<string, BookingStatus[]> = {
      [BookingStatus.PENDING]: [BookingStatus.CANCELLED],
      [BookingStatus.CONFIRMED]: [
        BookingStatus.IN_PROGRESS,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.IN_PROGRESS]: [
        BookingStatus.AWAITING_CONFIRM,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.AWAITING_CONFIRM]: [
        BookingStatus.COMPLETED,
        BookingStatus.DISPUTED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.DISPUTED]: [
        BookingStatus.COMPLETED,
        BookingStatus.IN_PROGRESS,
        BookingStatus.AWAITING_CONFIRM,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED]: [],
    };

    if (!allowed[raw.status]?.includes(status)) {
      throw new BadRequestException(
        `Không chuyển từ ${raw.status} sang ${status}`,
      );
    }

    if (status === BookingStatus.CANCELLED) {
      if (
        viewer.role !== Role.ADMIN &&
        raw.userId !== viewer.id &&
        raw.partnerId !== viewer.id
      ) {
        throw new ForbiddenException();
      }
      // Sau khi đang làm / chờ xác nhận / tranh chấp — chỉ admin hủy (escrow phức tạp).
      if (
        viewer.role !== Role.ADMIN &&
        (raw.status === BookingStatus.IN_PROGRESS ||
          raw.status === BookingStatus.AWAITING_CONFIRM ||
          raw.status === BookingStatus.DISPUTED)
      ) {
        throw new ForbiddenException(
          'Không tự hủy ở giai đoạn này — dùng khiếu nại hoặc liên hệ ban kiểm duyệt',
        );
      }
    } else if (status === BookingStatus.AWAITING_CONFIRM) {
      // Người làm báo «đã xong việc»
      if (viewer.role !== Role.ADMIN && raw.partnerId !== viewer.id) {
        throw new ForbiddenException('Chỉ người nhận việc báo đã xong việc');
      }
    } else if (status === BookingStatus.COMPLETED) {
      if (viewer.role === Role.ADMIN) {
        // admin ok
      } else if (
        raw.userId === viewer.id &&
        raw.status === BookingStatus.AWAITING_CONFIRM
      ) {
        // khách đồng ý hoàn thành
      } else if (raw.partnerId === viewer.id) {
        throw new ForbiddenException(
          'Người làm báo xong → chờ xác nhận. Khách hoặc ban kiểm duyệt mới hoàn thành.',
        );
      } else {
        throw new ForbiddenException('Chỉ khách thuê xác nhận hoàn thành');
      }
      if (
        viewer.role !== Role.ADMIN &&
        raw.requirements.some((requirement) => !requirement.customerConfirmed) &&
        !acceptIncomplete
      ) {
        throw new BadRequestException(
          'Còn mục checklist chưa được khách xác nhận. Dùng thao tác đồng ý hoàn thành nếu chấp nhận thiếu.',
        );
      }
    } else if (status === BookingStatus.DISPUTED) {
      if (viewer.role !== Role.ADMIN) {
        throw new ForbiddenException(
          'Trạng thái tranh chấp chỉ qua gửi khiếu nại hoặc admin',
        );
      }
    } else if (viewer.role !== Role.ADMIN && raw.partnerId !== viewer.id) {
      throw new ForbiddenException('Chỉ người nhận việc cập nhật tiến độ');
    }

    if (status === BookingStatus.IN_PROGRESS) {
      if (raw.paymentStatus !== PaymentStatus.HELD) {
        throw new BadRequestException(
          'Khách chưa đặt cọc giữ chỗ (escrow). Không thể bắt đầu làm.',
        );
      }
    }

    const data: {
      status: BookingStatus;
      confirmDeadlineAt?: Date | null;
      disputeResultNote?: string | null;
    } = { status };
    let settledByFinance = false;

    if (status === BookingStatus.AWAITING_CONFIRM) {
      data.confirmDeadlineAt = new Date(
        Date.now() + CONFIRM_WINDOW_HOURS * 60 * 60 * 1000,
      );
    }

    if (status === BookingStatus.COMPLETED) {
      if (raw.paymentStatus === PaymentStatus.HELD) {
        await this.finance.releaseBooking(id, {
          status: BookingStatus.COMPLETED,
        });
        settledByFinance = true;
      } else if (raw.paymentStatus === PaymentStatus.UNPAID) {
        throw new BadRequestException(
          'Không hoàn thành khi chưa thanh toán escrow',
        );
      } else if (raw.paymentStatus !== PaymentStatus.RELEASED) {
        throw new BadRequestException('Escrow đã hoàn — không thể hoàn thành');
      }
      data.confirmDeadlineAt = null;
    }

    if (
      status === BookingStatus.CANCELLED &&
      raw.paymentStatus === PaymentStatus.HELD
    ) {
      await this.finance.refundBooking(id, {
        status: BookingStatus.CANCELLED,
      });
      settledByFinance = true;
    }

    const updated = settledByFinance
      ? await this.prisma.booking.findUniqueOrThrow({
          where: { id },
          include: bookingInclude,
        })
      : await this.prisma.booking.update({
          where: { id },
          data,
          include: bookingInclude,
        });

    if (status === BookingStatus.COMPLETED && updated.partnerId) {
      await recalculatePartnerLevel(this.prisma, updated.partnerId);
    }

    const shaped = this.shape(updated, viewer);

    if (
      status === BookingStatus.CANCELLED &&
      raw.status === BookingStatus.PENDING &&
      !raw.partnerId
    ) {
      this.realtime.emitOpenRemoved(id);
    }

    if (updated.partnerId) {
      this.realtime.emitPartnerBooking(
        updated.partnerId,
        'booking:updated',
        this.shape(updated, {
          id: updated.partnerId,
          role: Role.PARTNER,
        }),
      );
    }

    this.realtime.emitCustomerBooking(
      updated.userId,
      this.shape(updated, { id: updated.userId, role: Role.CUSTOMER }),
    );

    return shaped;
  }

  /** Khách đồng ý hoàn thành từ AWAITING_CONFIRM (cảnh báo nếu checklist chưa đủ). */
  async confirmCompletion(
    id: string,
    viewer: Viewer,
    dto: ConfirmBookingDto = {},
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');

    if (viewer.role !== Role.ADMIN && booking.userId !== viewer.id) {
      throw new ForbiddenException('Chỉ khách thuê xác nhận hoàn thành');
    }
    if (booking.status !== BookingStatus.AWAITING_CONFIRM) {
      throw new BadRequestException('Đơn không ở trạng thái chờ xác nhận');
    }

    const incomplete = booking.requirements.filter((r) => !r.customerConfirmed);
    if (incomplete.length > 0 && !dto.acceptIncomplete) {
      throw new BadRequestException(
        `Còn ${incomplete.length} mục chưa tích xác nhận. Tích hết hoặc gửi acceptIncomplete=true nếu chấp nhận thiếu.`,
      );
    }

    return this.updateStatus(
      id,
      BookingStatus.COMPLETED,
      viewer,
      dto.acceptIncomplete === true,
    );
  }

  async updateRequirement(
    bookingId: string,
    requirementId: string,
    viewer: Viewer,
    dto: UpdateRequirementDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        partnerId: true,
        status: true,
      },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');
    this.assertBookingParty(booking, viewer);

    const req = await this.prisma.bookingRequirement.findFirst({
      where: { id: requirementId, bookingId },
    });
    if (!req) throw new NotFoundException('Không tìm thấy mục yêu cầu');

    const tickable =
      booking.status === BookingStatus.IN_PROGRESS ||
      booking.status === BookingStatus.AWAITING_CONFIRM ||
      booking.status === BookingStatus.DISPUTED ||
      booking.status === BookingStatus.CONFIRMED;

    if (!tickable && viewer.role !== Role.ADMIN) {
      throw new BadRequestException(
        'Không cập nhật checklist khi đơn đã đóng',
      );
    }

    const data: {
      partnerDone?: boolean;
      partnerDoneAt?: Date | null;
      customerConfirmed?: boolean;
      customerConfirmedAt?: Date | null;
      evidenceUrl?: string | null;
    } = {};

    if (dto.partnerDone !== undefined) {
      if (
        viewer.role !== Role.ADMIN &&
        booking.partnerId !== viewer.id
      ) {
        throw new ForbiddenException(
          'Chỉ người làm đánh dấu «đã làm»',
        );
      }
      data.partnerDone = dto.partnerDone;
      data.partnerDoneAt = dto.partnerDone ? new Date() : null;
    }

    if (dto.customerConfirmed !== undefined) {
      if (viewer.role !== Role.ADMIN && booking.userId !== viewer.id) {
        throw new ForbiddenException(
          'Chỉ khách thuê tích xác nhận bàn giao',
        );
      }
      data.customerConfirmed = dto.customerConfirmed;
      data.customerConfirmedAt = dto.customerConfirmed ? new Date() : null;
    }

    if (dto.evidenceUrl !== undefined) {
      data.evidenceUrl = dto.evidenceUrl.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Không có trường nào để cập nhật');
    }

    await this.prisma.bookingRequirement.update({
      where: { id: requirementId },
      data,
    });

    const updated = await this.prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: bookingInclude,
    });
    return this.emitBookingUpdate(updated, viewer);
  }

  private assertBookingParty(
    booking: {
      userId: string;
      partnerId: string | null;
      status: BookingStatus;
    },
    viewer: Viewer,
  ) {
    if (viewer.role === Role.ADMIN) return;
    if (booking.userId === viewer.id) return;
    if (booking.partnerId && booking.partnerId === viewer.id) return;
    throw new ForbiddenException(
      'Chỉ khách hoặc người nhận việc được chat đơn này',
    );
  }

  private assertDepositForChat(booking: {
    paymentStatus: PaymentStatus;
    partnerId: string | null;
  }) {
    if (!isDepositHeld(booking.paymentStatus)) {
      throw new BadRequestException(
        'Chat mở sau khi khách đặt cọc giữ chỗ trên sàn.',
      );
    }
    if (!booking.partnerId) {
      throw new BadRequestException(
        'Chat mở sau khi có người nhận việc. Không trao đổi SĐT ngoài sàn.',
      );
    }
  }

  async listMessages(bookingId: string, viewer: Viewer) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');
    this.assertBookingParty(booking, viewer);

    if (viewer.role !== Role.ADMIN) {
      this.assertDepositForChat(booking);
    }

    return this.prisma.bookingMessage.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, fullName: true } },
      },
    });
  }

  async postMessage(
    bookingId: string,
    viewer: Viewer,
    dto: CreateBookingMessageDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');
    this.assertBookingParty(booking, viewer);

    if (viewer.role !== Role.ADMIN) {
      this.assertDepositForChat(booking);
    } else if (!booking.partnerId) {
      throw new BadRequestException(
        'Chat mở sau khi có người nhận việc. Không trao đổi SĐT ngoài sàn.',
      );
    }

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED
    ) {
      throw new BadRequestException('Đơn đã đóng — không gửi thêm tin');
    }

    const { text, redacted } = redactContactLeak(dto.body.trim());
    if (!text) {
      throw new BadRequestException('Nội dung tin nhắn trống');
    }

    const message = await this.prisma.bookingMessage.create({
      data: {
        bookingId,
        senderId: viewer.id,
        body: text,
        redacted,
      },
      include: {
        sender: { select: { id: true, fullName: true } },
      },
    });

    this.realtime.emitBookingMessage(
      { customerId: booking.userId, partnerId: booking.partnerId },
      message,
    );

    return message;
  }

  async createReview(bookingId: string, viewer: Viewer, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { reviews: true },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Chỉ đánh giá sau khi đơn hoàn thành');
    }
    if (!booking.partnerId) {
      throw new BadRequestException('Đơn chưa có người nhận việc');
    }

    const isCustomer = booking.userId === viewer.id;
    const isPartner = booking.partnerId === viewer.id;
    if (!isCustomer && !isPartner && viewer.role !== Role.ADMIN) {
      throw new ForbiddenException('Không đánh giá đơn này');
    }

    const fromUserId = viewer.id;
    const toUserId = isCustomer
      ? booking.partnerId
      : isPartner
        ? booking.userId
        : dto.toUserId || booking.partnerId;

    if (fromUserId === toUserId) {
      throw new BadRequestException('Không tự đánh giá chính mình');
    }

    const existing = booking.reviews.find((r) => r.fromUserId === fromUserId);
    if (existing) {
      throw new BadRequestException('Bạn đã đánh giá đơn này rồi');
    }

    const review = await this.prisma.review.create({
      data: {
        bookingId,
        fromUserId,
        toUserId,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      },
    });

    // Cập nhật ratingAvg trên PartnerProfile khi khách đánh giá partner
    if (toUserId === booking.partnerId) {
      const agg = await this.prisma.review.aggregate({
        where: { toUserId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await this.prisma.partnerProfile.updateMany({
        where: { userId: toUserId },
        data: {
          ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10,
          ratingCount: agg._count.rating,
        },
      });
      await recalculatePartnerLevel(this.prisma, toUserId);
    }

    return review;
  }

  async listReviews(bookingId: string, viewer: Viewer) {
    await this.findOne(bookingId, viewer);
    return this.prisma.review.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
      include: {
        fromUser: { select: { id: true, fullName: true } },
        toUser: { select: { id: true, fullName: true } },
      },
    });
  }
}
