import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  BookingStatus,
  PaymentStatus,
  RequirementSource,
  Role,
} from '../../database/prisma/client';
import {
  isDepositHeld,
  redactContactLeak,
  shapeBookingForViewer,
  type ContactViewerRole,
} from '../../common/contact-privacy';
import { assertUserNotBlocked } from '../../common/assert-not-blocked';
import { buildRequirementSeeds } from '../../common/booking-requirements';
import {
  APPLY_DEPOSIT_BUDGET_THRESHOLD,
  applyDepositPercentBounds,
  computeApplyDeposit,
  computeEscrowSplit,
  MATCHING_WINDOW_DAYS,
  RESPONSE_SLA_HOURS,
} from '../../common/escrow';
import { recalculatePartnerLevel } from '../../common/recalculate-partner-level';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import { ApplyBookingDto } from './dto/apply-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateBookingMessageDto } from './dto/create-booking-message.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  ConfirmBookingDto,
  CreateRequirementDto,
  UpdateRequirementDto,
} from './dto/update-requirement.dto';
import { PartnerRealtimeService } from './partner-realtime.service';

/** Cửa sổ chờ xác nhận mặc định (giờ) sau khi người làm báo xong. */
const CONFIRM_WINDOW_HOURS = 48;

const applicationInclude = {
  partner: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      partnerProfile: {
        select: {
          headline: true,
          ratingAvg: true,
          ratingCount: true,
          level: true,
          avatarUrl: true,
          city: true,
          isVerified: true,
          phoneVerified: true,
          bankVerified: true,
          onlineSeconds: true,
          offerings: {
            select: { serviceId: true, price: true },
          },
        },
      },
      reputationPeriods: {
        orderBy: { periodIndex: 'desc' as const },
        take: 1,
        select: { currentPoints: true },
      },
    },
  },
} as const;

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
  applications: {
    orderBy: { createdAt: 'asc' as const },
    include: applicationInclude,
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
    const shaped = shapeBookingForViewer(
      booking,
      this.viewerRole(booking, viewer, mode),
    ) as T & {
      applications?: Array<{ partnerId: string }>;
      applicationCount?: number;
    };

    const apps = Array.isArray(shaped.applications)
      ? shaped.applications
      : undefined;
    const viewerApplications =
      viewer &&
      viewer.role === Role.PARTNER &&
      booking.userId !== viewer.id &&
      apps
        ? apps.filter((a) => a.partnerId === viewer.id)
        : undefined;

    if (mode === 'open_queue') {
      const { applications: _drop, ...rest } = shaped as T & {
        applications?: unknown;
      };
      return {
        ...rest,
        applicationCount: apps?.length ?? 0,
        applications: viewerApplications,
        applyDepositAmount: computeApplyDeposit(
          Number((booking as { totalPrice?: number }).totalPrice ?? 0),
          Number(
            (booking as { applyDepositBps?: number }).applyDepositBps ??
              1000,
          ),
        ),
        applyDepositBps: Number(
          (booking as { applyDepositBps?: number }).applyDepositBps ?? 1000,
        ),
        applyDepositPercent: Math.round(
          Number(
            (booking as { applyDepositBps?: number }).applyDepositBps ??
              1000,
          ) / 100,
        ),
      };
    }

    if (viewerApplications) {
      return {
        ...shaped,
        applications: viewerApplications,
      };
    }

    return shaped;
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

  /**
   * Seed checklist khi tạo đơn / khi chọn người làm (nếu vẫn trống).
   * Ưu tiên includes gói + ghi chú khách; fallback tên dịch vụ.
   */
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
        service: { select: { name: true } },
      },
    });
    if (!booking) return;

    let includes: string | null | undefined;
    if (booking.partnerId) {
      includes = await this.partnerIncludes(
        booking.serviceId,
        booking.partnerId,
      );
    }
    let seeds = buildRequirementSeeds({
      includes,
      customerNote: booking.note,
    });
    if (seeds.length === 0 && booking.service?.name) {
      seeds = [
        {
          content: `Thực hiện dịch vụ: ${booking.service.name}`,
          source: RequirementSource.MANUAL,
          sortOrder: 0,
        },
      ];
    }
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

  private async partnerIncludes(serviceId: string, partnerUserId: string) {
    const offering = await this.prisma.partnerService.findFirst({
      where: {
        serviceId,
        isActive: true,
        partnerProfile: { userId: partnerUserId },
      },
      select: { includes: true },
    });
    return offering?.includes;
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
        await this.refundSelectedApplyDeposit(booking.id, booking.partnerId);
        await recalculatePartnerLevel(this.prisma, booking.partnerId);
      }
    }
  }

  /** Hủy đơn PENDING hết hạn ghép + hoàn cọc khách + hoàn cọc ứng tuyển. */
  private async settleExpiredMatching(bookingId?: string) {
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
      await this.refundOpenApplications(booking.id);
      if (booking.paymentStatus === PaymentStatus.HELD) {
        await this.finance.refundBooking(booking.id, {
          status: BookingStatus.CANCELLED,
          disputeResultNote: `Hết hạn ghép người làm (${MATCHING_WINDOW_DAYS} ngày) — hoàn cọc.`,
        });
      } else {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CANCELLED,
            disputeResultNote: `Hết hạn ghép người làm (${MATCHING_WINDOW_DAYS} ngày).`,
          },
        });
      }
      this.realtime.emitOpenRemoved(booking.id);
      const fresh = await this.prisma.booking.findUnique({
        where: { id: booking.id },
        include: bookingInclude,
      });
      if (fresh) {
        this.realtime.emitCustomerBooking(
          fresh.userId,
          this.shape(fresh, { id: fresh.userId, role: Role.CUSTOMER }),
        );
      }
    }
  }

  private async refundOpenApplications(bookingId: string) {
    const apps = await this.prisma.bookingApplication.findMany({
      where: {
        bookingId,
        depositStatus: PaymentStatus.HELD,
      },
    });
    for (const app of apps) {
      await this.finance.refundApplyDeposit(
        bookingId,
        app.partnerId,
        app.id,
        app.depositAmount,
      );
      await this.prisma.bookingApplication.update({
        where: { id: app.id },
        data: {
          depositStatus: PaymentStatus.REFUNDED,
          status:
            app.status === ApplicationStatus.SELECTED ||
            app.status === ApplicationStatus.APPLIED
              ? ApplicationStatus.REFUNDED
              : ApplicationStatus.REJECTED,
        },
      });
    }
  }

  private async refundSelectedApplyDeposit(
    bookingId: string,
    partnerId: string,
  ) {
    const app = await this.prisma.bookingApplication.findUnique({
      where: {
        bookingId_partnerId: { bookingId, partnerId },
      },
    });
    if (!app || app.depositStatus !== PaymentStatus.HELD) return;
    await this.finance.refundApplyDeposit(
      bookingId,
      partnerId,
      app.id,
      app.depositAmount,
    );
    await this.prisma.bookingApplication.update({
      where: { id: app.id },
      data: {
        depositStatus: PaymentStatus.REFUNDED,
        status: ApplicationStatus.REFUNDED,
      },
    });
  }

  private async forfeitSelectedApplyDeposit(
    bookingId: string,
    partnerId: string,
    reason: string,
  ) {
    const app = await this.prisma.bookingApplication.findUnique({
      where: {
        bookingId_partnerId: { bookingId, partnerId },
      },
    });
    if (!app || app.depositStatus !== PaymentStatus.HELD) return;
    await this.finance.forfeitApplyDeposit(
      bookingId,
      partnerId,
      app.id,
      app.depositAmount,
      reason,
    );
    await this.prisma.bookingApplication.update({
      where: { id: app.id },
      data: {
        depositStatus: PaymentStatus.RELEASED,
        status: ApplicationStatus.REJECTED,
      },
    });
  }

  /**
   * SLA phản hồi: CONFIRMED quá responseDeadlineAt mà chưa IN_PROGRESS
   * → tịch thu cọc ứng tuyển + gỡ partner + mở lại PENDING (nếu còn hạn ghép).
   */
  private async settleExpiredResponseSla(bookingId?: string) {
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

      await this.forfeitSelectedApplyDeposit(booking.id, partnerId, reason);

      const matchingStillOpen =
        !booking.matchingDeadlineAt ||
        booking.matchingDeadlineAt.getTime() > Date.now();

      if (matchingStillOpen && booking.paymentStatus === PaymentStatus.HELD) {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            partnerId: null,
            status: BookingStatus.PENDING,
            responseDeadlineAt: null,
            disputeResultNote: `${reason} — đã tịch thu cọc ứng tuyển, đơn mở lại hàng chờ.`,
          },
        });
        const fresh = await this.prisma.booking.findUniqueOrThrow({
          where: { id: booking.id },
          include: bookingInclude,
        });
        this.realtime.emitOpenCreated(
          this.shape(fresh, undefined, 'open_queue'),
        );
        this.realtime.emitPartnerBooking(
          partnerId,
          'booking:updated',
          this.shape(fresh, { id: partnerId, role: Role.PARTNER }),
        );
        this.realtime.emitCustomerBooking(
          fresh.userId,
          this.shape(fresh, { id: fresh.userId, role: Role.CUSTOMER }),
        );
      } else {
        if (booking.paymentStatus === PaymentStatus.HELD) {
          await this.finance.refundBooking(booking.id, {
            status: BookingStatus.CANCELLED,
            disputeResultNote: `${reason} — hết hạn ghép, hoàn cọc khách.`,
          });
        } else {
          await this.prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.CANCELLED,
              partnerId: null,
              responseDeadlineAt: null,
              disputeResultNote: reason,
            },
          });
        }
        this.realtime.emitOpenRemoved(booking.id);
        const fresh = await this.prisma.booking.findUnique({
          where: { id: booking.id },
          include: bookingInclude,
        });
        if (fresh) {
          this.realtime.emitPartnerBooking(
            partnerId,
            'booking:updated',
            this.shape(fresh, { id: partnerId, role: Role.PARTNER }),
          );
          this.realtime.emitCustomerBooking(
            fresh.userId,
            this.shape(fresh, { id: fresh.userId, role: Role.CUSTOMER }),
          );
        }
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
    if (user.isBlocked) {
      throw new ForbiddenException(
        'Tài khoản bị chặn. Bạn chỉ có thể khiếu nại hoặc chat hỗ trợ với admin.',
      );
    }

    let partnerId: string | undefined;
    let totalPrice = service.basePrice;
    let status: BookingStatus = BookingStatus.PENDING;
    let matchingDeadlineAt: Date | undefined;
    let publishAt: Date | undefined;

    if (dto.partnerId) {
      if (dto.publishAt) {
        throw new BadRequestException(
          'Không hẹn giờ đăng khi thuê trực tiếp người làm',
        );
      }
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
    } else if (dto.publishAt) {
      publishAt = new Date(dto.publishAt);
      if (Number.isNaN(publishAt.getTime())) {
        throw new BadRequestException('Thời gian đăng không hợp lệ');
      }
      if (publishAt.getTime() <= Date.now()) {
        throw new BadRequestException('Thời gian đăng phải ở tương lai');
      }
      const workAt = new Date(dto.scheduledAt);
      if (Number.isNaN(workAt.getTime())) {
        throw new BadRequestException('Thời gian mong muốn không hợp lệ');
      }
      if (publishAt.getTime() >= workAt.getTime()) {
        throw new BadRequestException(
          'Giờ đăng phải trước thời gian mong muốn làm việc',
        );
      }
      status = BookingStatus.SCHEDULED;
    } else {
      matchingDeadlineAt = new Date(
        Date.now() + MATCHING_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      );
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
      // Đơn mở: escrow theo ngân sách tối đa khách sẵn sàng trả.
      if (!partnerId && budgetMax > 0) {
        totalPrice = budgetMax;
      }
    }

    const split = computeEscrowSplit(totalPrice);
    const depositBounds = applyDepositPercentBounds(totalPrice);
    let applyDepositPercent = depositBounds.defaultPercent;
    if (dto.applyDepositPercent != null) {
      const rounded = Math.round(dto.applyDepositPercent);
      if (rounded < depositBounds.min || rounded > depositBounds.max) {
        throw new BadRequestException(
          totalPrice > APPLY_DEPOSIT_BUDGET_THRESHOLD
            ? `Ngân sách trên 5 triệu: cọc ứng tuyển từ ${depositBounds.min}% đến ${depositBounds.max}%`
            : `Ngân sách từ 5 triệu trở xuống: cọc ứng tuyển từ ${depositBounds.min}% đến ${depositBounds.max}%`,
        );
      }
      applyDepositPercent = rounded;
    }
    const applyDepositBps = applyDepositPercent * 100;

    const booking = await this.prisma.booking.create({
      data: {
        userId: user.id,
        serviceId: service.id,
        partnerId,
        status,
        address: dto.address,
        scheduledAt: new Date(dto.scheduledAt),
        publishAt,
        jobTitle: dto.jobTitle?.trim() || null,
        note: noteResult.text,
        budgetMin,
        budgetMax,
        applyDepositBps,
        totalPrice,
        customerName: dto.customerName || user.fullName,
        customerPhone: dto.customerPhone || user.phone || '',
        paymentStatus: PaymentStatus.UNPAID,
        commissionBps: split.commissionBps,
        commissionAmount: 0,
        partnerPayout: 0,
        matchingDeadlineAt,
      },
      include: bookingInclude,
    });

    // Bắt buộc giam cọc ngay khi tạo đơn theo totalPrice (đơn mở = budgetMax nếu có).
    // Nếu giữ cọc thất bại (vd: thiếu số dư), rollback bằng cách xóa đơn vừa tạo.
    try {
      await this.finance.holdBooking(booking.id, user.id);
    } catch (error) {
      await this.prisma.booking.delete({
        where: { id: booking.id },
      });
      throw error;
    }

    await this.seedRequirementsIfEmpty(booking.id);

    const fresh = await this.prisma.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: bookingInclude,
    });

    const shaped = this.shape(fresh, { id: user.id, role: user.role });
    if (fresh.status === BookingStatus.PENDING && !fresh.partnerId) {
      this.realtime.emitOpenCreated(this.shape(fresh, undefined, 'open_queue'));
    }
    if (partnerId) {
      this.realtime.emitPartnerBooking(partnerId, 'booking:assigned', shaped);
    }
    this.realtime.emitCustomerBooking(user.id, shaped);
    return shaped;
  }

  async findOne(id: string, viewer?: Viewer) {
    await this.publishDueScheduledBookings();
    await this.settleExpiredMatching(id);
    await this.settleExpiredResponseSla(id);
    await this.settleExpiredConfirmations(id);
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
      (booking.matchingDeadlineAt == null ||
        booking.matchingDeadlineAt > now);

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
      await this.seedRequirementsIfEmpty(id);
      const refreshed = await this.prisma.booking.findUniqueOrThrow({
        where: { id },
        include: bookingInclude,
      });
      const useOpenQueue =
        Boolean(viewer) &&
        viewer!.role !== Role.ADMIN &&
        refreshed.userId !== viewer!.id &&
        refreshed.partnerId !== viewer!.id;
      return this.shape(
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

    return this.shape(
      booking,
      viewer,
      useOpenQueue ? 'open_queue' : undefined,
    );
  }

  async listMineAsCustomer(userId: string) {
    await this.publishDueScheduledBookings();
    await this.settleExpiredMatching();
    await this.settleExpiredResponseSla();
    await this.settleExpiredConfirmations();
    const rows = await this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: bookingInclude,
    });
    return rows.map((b) => this.shape(b, { id: userId, role: Role.CUSTOMER }));
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
        this.shape(updated, undefined, 'open_queue'),
      );
      this.realtime.emitCustomerBooking(
        updated.userId,
        this.shape(updated, { id: updated.userId, role: Role.CUSTOMER }),
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
      const shaped = this.shape(b, { id: userId, role: Role.CUSTOMER });
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
    await this.settleExpiredResponseSla();
    await this.settleExpiredConfirmations();
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
        await this.seedRequirementsIfEmpty(row.id);
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
      return this.shape(
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

  async listOpen(viewerId?: string, limit?: number) {
    await this.publishDueScheduledBookings();
    await this.settleExpiredMatching();
    await this.settleExpiredResponseSla();
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
    return rows.map((b) => this.shape(b, viewer, 'open_queue'));
  }

  /** Bảng tin đơn mở công khai (trang chủ) — che SĐT/địa chỉ qua open_queue. */
  async listOpenBoard(page = 1, pageSize = 8) {
    await this.publishDueScheduledBookings();
    await this.settleExpiredMatching();
    await this.settleExpiredResponseSla();

    const safePage = Math.max(1, Math.floor(page) || 1);
    const safeSize = Math.min(Math.max(Math.floor(pageSize) || 8, 1), 48);
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
      items: rows.map((b) => this.shape(b, undefined, 'open_queue')),
      total,
      page: safePage,
      pageSize: safeSize,
      pageCount,
    };
  }

  /** Chi tiết đơn mở công khai — chỉ khi còn trên bảng tin. */
  async getPublicOpenBooking(id: string) {
    await this.publishDueScheduledBookings();
    await this.settleExpiredMatching(id);
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
      (booking.matchingDeadlineAt == null ||
        booking.matchingDeadlineAt > now);
    if (!isOpen) {
      throw new NotFoundException('Đơn không còn mở trên bảng tin');
    }
    return this.shape(booking, undefined, 'open_queue');
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
          OR: [
            { releasedAt: { gte: since } },
            { updatedAt: { gte: since } },
          ],
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

    const titleOf = (jobTitle: string | null | undefined, serviceName: string) =>
      jobTitle?.trim() || serviceName;

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

  async accept(id: string, partnerId: string) {
    // Legacy: chuyển sang ứng tuyển (cọc 10%) — chủ đơn mới chọn người.
    return this.apply(id, partnerId, {});
  }

  /** Partner ứng tuyển đơn mở — cọc 10% totalPrice từ ví. */
  async apply(id: string, partnerId: string, dto: ApplyBookingDto = {}) {
    await assertUserNotBlocked(this.prisma, partnerId);
    await this.settleExpiredMatching(id);
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');
    if (booking.status !== BookingStatus.PENDING || booking.partnerId) {
      throw new BadRequestException('Đơn không còn mở để ứng tuyển');
    }
    if (
      booking.matchingDeadlineAt &&
      booking.matchingDeadlineAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException('Đã hết hạn ghép người làm cho đơn này');
    }
    if (!isDepositHeld(booking.paymentStatus)) {
      throw new BadRequestException(
        'Khách chưa đặt cọc giữ chỗ — không thể ứng tuyển',
      );
    }

    const offering = await this.prisma.partnerService.findFirst({
      where: {
        serviceId: booking.serviceId,
        isActive: true,
        partnerProfile: { userId: partnerId, acceptingJobs: true },
      },
    });
    if (!offering) {
      throw new BadRequestException(
        'Hồ sơ bạn chưa có đăng ký nghề này',
      );
    }

    const existing = await this.prisma.bookingApplication.findUnique({
      where: {
        bookingId_partnerId: { bookingId: id, partnerId },
      },
    });
    if (
      existing &&
      (existing.status === ApplicationStatus.APPLIED ||
        existing.status === ApplicationStatus.SELECTED) &&
      existing.depositStatus === PaymentStatus.HELD
    ) {
      throw new BadRequestException('Bạn đã ứng tuyển đơn này');
    }

    const depositAmount = computeApplyDeposit(
      booking.totalPrice,
      booking.applyDepositBps,
    );
    const noteResult = dto.note
      ? redactContactLeak(dto.note)
      : { text: undefined as string | undefined };

    if (existing) {
      await this.prisma.bookingApplication.delete({
        where: { id: existing.id },
      });
    }

    const created = await this.prisma.bookingApplication.create({
      data: {
        bookingId: id,
        partnerId,
        depositAmount,
        depositStatus:
          depositAmount > 0 ? PaymentStatus.UNPAID : PaymentStatus.HELD,
        status: ApplicationStatus.APPLIED,
        note: noteResult.text,
      },
    });
    const applicationId = created.id;

    if (depositAmount > 0) {
      try {
        await this.finance.holdApplyDeposit(id, partnerId, applicationId, {
          amount: depositAmount,
        });
        await this.prisma.bookingApplication.update({
          where: { id: applicationId },
          data: { depositStatus: PaymentStatus.HELD },
        });
      } catch (err) {
        await this.prisma.bookingApplication.delete({
          where: { id: applicationId },
        });
        throw err;
      }
    }

    const fresh = await this.prisma.booking.findUniqueOrThrow({
      where: { id },
      include: bookingInclude,
    });
    const shapedCustomer = this.shape(fresh, {
      id: fresh.userId,
      role: Role.CUSTOMER,
    });
    this.realtime.emitCustomerBooking(fresh.userId, shapedCustomer);
    // Cập nhật số ứng viên trên bảng tin / hàng chờ realtime.
    if (!fresh.partnerId && fresh.status === BookingStatus.PENDING) {
      this.realtime.emitOpenCreated(this.shape(fresh, undefined, 'open_queue'));
    }
    return {
      booking: this.shape(fresh, { id: partnerId, role: Role.PARTNER }),
      application: fresh.applications.find((a) => a.partnerId === partnerId),
      depositAmount,
    };
  }

  /** Chủ đơn chọn 1 ứng viên → CONFIRMED, hoàn cọc các ứng viên khác. */
  async selectApplicant(
    bookingId: string,
    applicationId: string,
    viewer: Viewer,
  ) {
    await this.settleExpiredMatching(bookingId);
    await this.settleExpiredResponseSla(bookingId);
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { applications: true },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');
    if (viewer.role !== Role.ADMIN && booking.userId !== viewer.id) {
      throw new ForbiddenException('Chỉ chủ đơn chọn người làm');
    }
    if (booking.status !== BookingStatus.PENDING || booking.partnerId) {
      throw new BadRequestException('Đơn đã có người làm hoặc không còn mở');
    }
    if (!isDepositHeld(booking.paymentStatus)) {
      throw new BadRequestException('Chưa đặt cọc giữ chỗ');
    }

    const selected = booking.applications.find((a) => a.id === applicationId);
    if (!selected || selected.status !== ApplicationStatus.APPLIED) {
      throw new BadRequestException('Ứng viên không hợp lệ hoặc đã xử lý');
    }
    if (selected.depositStatus !== PaymentStatus.HELD) {
      throw new BadRequestException('Cọc ứng tuyển của người này không còn giữ');
    }

    for (const app of booking.applications) {
      if (app.id === selected.id) continue;
      if (app.depositStatus === PaymentStatus.HELD) {
        await this.finance.refundApplyDeposit(
          bookingId,
          app.partnerId,
          app.id,
          app.depositAmount,
        );
      }
      await this.prisma.bookingApplication.update({
        where: { id: app.id },
        data: {
          status: ApplicationStatus.REJECTED,
          depositStatus:
            app.depositStatus === PaymentStatus.HELD
              ? PaymentStatus.REFUNDED
              : app.depositStatus,
        },
      });
    }

    await this.prisma.bookingApplication.update({
      where: { id: selected.id },
      data: { status: ApplicationStatus.SELECTED },
    });

    const responseDeadlineAt = new Date(
      Date.now() + RESPONSE_SLA_HOURS * 60 * 60 * 1000,
    );

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        partnerId: selected.partnerId,
        status: BookingStatus.CONFIRMED,
        responseDeadlineAt,
        disputeResultNote: null,
      },
    });

    // Nếu lúc tạo đơn chưa có checklist (thiếu includes/ghi chú), seed lại sau khi chọn người.
    await this.seedRequirementsIfEmpty(bookingId);

    const withReqs = await this.prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: bookingInclude,
    });

    const shaped = this.shape(withReqs, viewer);
    this.realtime.emitOpenRemoved(bookingId);
    this.realtime.emitPartnerBooking(
      selected.partnerId,
      'booking:assigned',
      this.shape(withReqs, { id: selected.partnerId, role: Role.PARTNER }),
    );
    this.realtime.emitCustomerBooking(
      withReqs.userId,
      this.shape(withReqs, { id: withReqs.userId, role: Role.CUSTOMER }),
    );
    return shaped;
  }

  async listApplications(bookingId: string, viewer: Viewer) {
    await this.settleExpiredMatching(bookingId);
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { userId: true, partnerId: true },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');
    if (
      viewer.role !== Role.ADMIN &&
      booking.userId !== viewer.id &&
      booking.partnerId !== viewer.id
    ) {
      throw new ForbiddenException('Không xem được danh sách ứng tuyển');
    }

    return this.prisma.bookingApplication.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
      include: applicationInclude,
    });
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
      [BookingStatus.SCHEDULED]: [BookingStatus.CANCELLED],
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
      } else if (raw.partnerId === viewer.id) {
        throw new ForbiddenException(
          'Người làm báo xong → chờ xác nhận. Khách hoặc ban kiểm duyệt mới hoàn thành.',
        );
      } else {
        throw new ForbiddenException(
          'Hoàn thành thủ công chỉ cho admin. Khách dùng luồng nghiệm thu % (2 bên đồng ý).',
        );
      }
      if (viewer.role !== Role.ADMIN) {
        throw new BadRequestException(
          'Khách cần dùng đề xuất nghiệm thu % và hai bên cùng bấm đồng ý để hoàn thành đơn',
        );
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
          'Khách chưa đặt cọc giữ chỗ. Không thể bắt đầu làm.',
        );
      }
    }

    const data: {
      status: BookingStatus;
      confirmDeadlineAt?: Date | null;
      responseDeadlineAt?: Date | null;
      disputeResultNote?: string | null;
    } = { status };
    let settledByFinance = false;

    if (status === BookingStatus.IN_PROGRESS) {
      data.responseDeadlineAt = null;
    }

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
          'Không hoàn thành khi chưa đặt cọc giữ chỗ',
        );
      } else if (raw.paymentStatus !== PaymentStatus.RELEASED) {
        throw new BadRequestException('Cọc đã hoàn — không thể hoàn thành');
      }
      data.confirmDeadlineAt = null;
      data.responseDeadlineAt = null;
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

    if (status === BookingStatus.CANCELLED) {
      data.responseDeadlineAt = null;
      // Partner hủy khi CONFIRMED (chưa vào làm) → tịch thu cọc ứng tuyển.
      if (
        raw.status === BookingStatus.CONFIRMED &&
        raw.partnerId &&
        viewer.role !== Role.ADMIN &&
        viewer.id === raw.partnerId
      ) {
        await this.forfeitSelectedApplyDeposit(
          id,
          raw.partnerId,
          'Người làm hủy sau khi được chọn (chưa vào làm)',
        );
      } else {
        await this.refundOpenApplications(id);
      }
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
      await this.refundSelectedApplyDeposit(id, updated.partnerId);
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
    this.assertSettlementAllowed(booking);

    const incomplete = booking.requirements.filter((r) => !r.customerConfirmed);
    if (incomplete.length > 0 && !dto.acceptIncomplete) {
      throw new BadRequestException(
        `Còn ${incomplete.length} mục chưa tích xác nhận. Tích hết hoặc gửi acceptIncomplete=true nếu chấp nhận thiếu.`,
      );
    }

    // Legacy endpoint: giữ tương thích bằng cách đề xuất 100% và đồng ý phía khách.
    if (!booking.settlementPercent) {
      await this.proposeSettlement(id, viewer, 100);
    }
    return this.approveSettlement(id, viewer);
  }

  async proposeSettlement(id: string, viewer: Viewer, percent: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');
    this.assertBookingParty(booking, viewer);
    this.assertSettlementAllowed(booking);

    if (viewer.role !== Role.ADMIN && booking.userId !== viewer.id) {
      throw new ForbiddenException('Chỉ khách thuê đề xuất % nghiệm thu');
    }
    if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
      throw new BadRequestException('Phần trăm nghiệm thu phải trong khoảng 1..100');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        settlementPercent: Math.round(percent),
        settlementProposedBy:
          viewer.role === Role.ADMIN ? Role.ADMIN : Role.CUSTOMER,
        customerSettlementApprovedAt: null,
        partnerSettlementApprovedAt: null,
        settlementResolvedAt: null,
      },
      include: bookingInclude,
    });
    return this.emitBookingUpdate(updated, viewer);
  }

  async approveSettlement(id: string, viewer: Viewer) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');
    this.assertBookingParty(booking, viewer);
    this.assertSettlementAllowed(booking);

    if (!booking.settlementPercent || booking.settlementPercent < 1) {
      throw new BadRequestException('Chưa có đề xuất % nghiệm thu');
    }

    const now = new Date();
    const data: {
      customerSettlementApprovedAt?: Date;
      partnerSettlementApprovedAt?: Date;
    } = {};
    if (viewer.role === Role.ADMIN || booking.userId === viewer.id) {
      data.customerSettlementApprovedAt = now;
    }
    if (viewer.role === Role.ADMIN || booking.partnerId === viewer.id) {
      data.partnerSettlementApprovedAt = now;
    }
    if (Object.keys(data).length === 0) {
      throw new ForbiddenException('Bạn không thuộc hai bên của đơn');
    }
    await this.prisma.booking.update({
      where: { id },
      data,
    });

    const afterApprove = await this.prisma.booking.findUniqueOrThrow({
      where: { id },
      include: bookingInclude,
    });
    const bothApproved =
      Boolean(afterApprove.customerSettlementApprovedAt) &&
      Boolean(afterApprove.partnerSettlementApprovedAt);
    if (!bothApproved) {
      return this.emitBookingUpdate(afterApprove, viewer);
    }

    const settledPercent = afterApprove.settlementPercent;
    if (!settledPercent) {
      throw new BadRequestException('Đề xuất % nghiệm thu không hợp lệ');
    }
    await this.finance.releaseBookingByPercent(id, settledPercent, {
      expectedStatus: BookingStatus.AWAITING_CONFIRM,
    });

    const settled = await this.prisma.booking.update({
      where: { id },
      data: { settlementResolvedAt: new Date() },
      include: bookingInclude,
    });
    if (settled.partnerId) {
      await this.refundSelectedApplyDeposit(id, settled.partnerId);
      await recalculatePartnerLevel(this.prisma, settled.partnerId);
    }
    return this.emitBookingUpdate(settled, viewer);
  }

  async addRequirement(
    _bookingId: string,
    _viewer: Viewer,
    _dto: CreateRequirementDto,
  ) {
    throw new BadRequestException(
      'Chỉ thêm công việc khi tạo đơn thuê. Sau khi đăng, checklist đã khóa.',
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

  private assertSettlementAllowed(booking: {
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    partnerId: string | null;
  }) {
    if (booking.status !== BookingStatus.AWAITING_CONFIRM) {
      throw new BadRequestException(
        'Chỉ thương lượng nghiệm thu khi đơn đang chờ xác nhận',
      );
    }
    if (booking.paymentStatus !== PaymentStatus.HELD) {
      throw new BadRequestException('Cọc không còn đang giữ để thương lượng nghiệm thu');
    }
    if (!booking.partnerId) {
      throw new BadRequestException('Đơn chưa có người làm');
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
      const me = await this.prisma.user.findUnique({
        where: { id: viewer.id },
        select: { chatBanned: true },
      });
      if (me?.chatBanned) {
        throw new BadRequestException(
          'Tài khoản đã bị khóa chat đơn. Liên hệ hỗ trợ hoặc gửi khiếu nại.',
        );
      }
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
