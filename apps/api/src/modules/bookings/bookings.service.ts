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
import {
  computeEscrowSplit,
  DEFAULT_COMMISSION_BPS,
} from '../../common/escrow';
import { recalculatePartnerLevel } from '../../common/recalculate-partner-level';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateBookingMessageDto } from './dto/create-booking-message.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { PartnerRealtimeService } from './partner-realtime.service';

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
} as const;

type Viewer = { id: string; role: string };

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: PartnerRealtimeService,
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

    const shaped = this.shape(booking, { id: user.id, role: user.role });
    if (partnerId) {
      this.realtime.emitPartnerBooking(partnerId, 'booking:assigned', shaped);
    }
    this.realtime.emitCustomerBooking(user.id, shaped);
    return shaped;
  }

  async findOne(id: string, viewer?: Viewer) {
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
    const rows = await this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: bookingInclude,
    });
    return rows.map((b) => this.shape(b, { id: userId, role: Role.CUSTOMER }));
  }

  async listMineAsPartner(partnerId: string) {
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

    const shaped = this.shape(updated, { id: partnerId, role: Role.PARTNER });
    this.realtime.emitOpenRemoved(id);
    this.realtime.emitPartnerBooking(partnerId, 'booking:assigned', shaped);
    this.realtime.emitCustomerBooking(
      updated.userId,
      this.shape(updated, { id: updated.userId, role: Role.CUSTOMER }),
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
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Đơn đã hủy');
    }
    if (booking.paymentStatus !== PaymentStatus.UNPAID) {
      throw new BadRequestException('Đơn đã đặt cọc hoặc đã xử lý');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        paymentStatus: PaymentStatus.HELD,
        paidAt: new Date(),
      },
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

  async updateStatus(id: string, status: BookingStatus, viewer: Viewer) {
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
        BookingStatus.COMPLETED,
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
      paymentStatus?: PaymentStatus;
      commissionAmount?: number;
      partnerPayout?: number;
      releasedAt?: Date;
      refundedAt?: Date;
    } = { status };

    if (status === BookingStatus.COMPLETED) {
      if (raw.paymentStatus === PaymentStatus.HELD) {
        const split = computeEscrowSplit(
          raw.totalPrice,
          raw.commissionBps || DEFAULT_COMMISSION_BPS,
        );
        data.paymentStatus = PaymentStatus.RELEASED;
        data.commissionAmount = split.commissionAmount;
        data.partnerPayout = split.partnerPayout;
        data.releasedAt = new Date();
      } else if (raw.paymentStatus === PaymentStatus.UNPAID) {
        throw new BadRequestException(
          'Không hoàn thành khi chưa thanh toán escrow',
        );
      }
    }

    if (
      status === BookingStatus.CANCELLED &&
      raw.paymentStatus === PaymentStatus.HELD
    ) {
      data.paymentStatus = PaymentStatus.REFUNDED;
      data.refundedAt = new Date();
    }

    const updated = await this.prisma.booking.update({
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
