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
  Role,
} from '../../database/prisma/client';
import { isDepositHeld, redactContactLeak } from '../../common/contact-privacy';
import { assertUserNotBlocked } from '../../common/assert-not-blocked';
import {
  APPLY_DEPOSIT_BUDGET_THRESHOLD,
  applyDepositPercentBounds,
  computeApplyDeposit,
  computeEscrowSplit,
  MATCHING_WINDOW_DAYS,
  RESPONSE_SLA_HOURS,
} from '../../common/escrow';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import { ApplyBookingDto } from './dto/apply-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PartnerRealtimeService } from './partner-realtime.service';
import {
  applicationInclude,
  bookingInclude,
  type Viewer,
  shapeBooking,
} from './booking.shared';
import { BookingSupportService } from './booking-support.service';
import { BookingSettlementService } from './booking-settlement.service';

@Injectable()
export class BookingApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: PartnerRealtimeService,
    private readonly finance: FinanceService,
    private readonly support: BookingSupportService,
    private readonly settlement: BookingSettlementService,
  ) {}

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

    await this.support.seedRequirementsIfEmpty(booking.id);

    const fresh = await this.prisma.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: bookingInclude,
    });

    const shaped = shapeBooking(fresh, { id: user.id, role: user.role });
    if (fresh.status === BookingStatus.PENDING && !fresh.partnerId) {
      this.realtime.emitOpenCreated(
        shapeBooking(fresh, undefined, 'open_queue'),
      );
    }
    if (partnerId) {
      this.realtime.emitPartnerBooking(partnerId, 'booking:assigned', shaped);
    }
    this.realtime.emitCustomerBooking(user.id, shaped);
    return shaped;
  }

  async accept(id: string, partnerId: string) {
    // Legacy: chuyển sang ứng tuyển (cọc 10%) — chủ đơn mới chọn người.
    return this.apply(id, partnerId, {});
  }

  /** Partner ứng tuyển đơn mở — cọc 10% totalPrice từ ví. */
  async apply(id: string, partnerId: string, dto: ApplyBookingDto = {}) {
    await assertUserNotBlocked(this.prisma, partnerId);
    await this.settlement.settleExpiredMatching(id);
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
      throw new BadRequestException('Hồ sơ bạn chưa có đăng ký nghề này');
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
    const shapedCustomer = shapeBooking(fresh, {
      id: fresh.userId,
      role: Role.CUSTOMER,
    });
    this.realtime.emitCustomerBooking(fresh.userId, shapedCustomer);
    // Cập nhật số ứng viên trên bảng tin / hàng chờ realtime.
    if (!fresh.partnerId && fresh.status === BookingStatus.PENDING) {
      this.realtime.emitOpenCreated(
        shapeBooking(fresh, undefined, 'open_queue'),
      );
    }
    return {
      booking: shapeBooking(fresh, { id: partnerId, role: Role.PARTNER }),
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
    await this.settlement.settleExpiredMatching(bookingId);
    await this.settlement.settleExpiredResponseSla(bookingId);
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
      throw new BadRequestException(
        'Cọc ứng tuyển của người này không còn giữ',
      );
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
    await this.support.seedRequirementsIfEmpty(bookingId);

    const withReqs = await this.prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: bookingInclude,
    });

    const shaped = shapeBooking(withReqs, viewer);
    this.realtime.emitOpenRemoved(bookingId);
    this.realtime.emitPartnerBooking(
      selected.partnerId,
      'booking:assigned',
      shapeBooking(withReqs, { id: selected.partnerId, role: Role.PARTNER }),
    );
    this.realtime.emitCustomerBooking(
      withReqs.userId,
      shapeBooking(withReqs, { id: withReqs.userId, role: Role.CUSTOMER }),
    );
    return shaped;
  }

  async listApplications(bookingId: string, viewer: Viewer) {
    await this.settlement.settleExpiredMatching(bookingId);
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

    const shaped = shapeBooking(updated, viewer);
    // Đơn mở vào hàng chờ → realtime cho mọi partner.
    if (updated.status === BookingStatus.PENDING && !updated.partnerId) {
      this.realtime.emitOpenCreated(
        shapeBooking(updated, undefined, 'open_queue'),
      );
    }
    // Thuê thẳng đã có partner → cập nhật lịch partner.
    if (updated.partnerId) {
      this.realtime.emitPartnerBooking(
        updated.partnerId,
        'booking:updated',
        shapeBooking(updated, { id: updated.partnerId, role: Role.PARTNER }),
      );
    }
    this.realtime.emitCustomerBooking(
      updated.userId,
      shapeBooking(updated, { id: updated.userId, role: Role.CUSTOMER }),
    );
    return shaped;
  }
}
