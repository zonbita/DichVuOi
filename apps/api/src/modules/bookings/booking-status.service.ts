import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  PaymentStatus,
  Role,
} from '../../database/prisma/client';
import { recalculatePartnerLevel } from '../../common/recalculate-partner-level';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import {
  ConfirmBookingDto,
  CreateRequirementDto,
  UpdateRequirementDto,
} from './dto/update-requirement.dto';
import { PartnerRealtimeService } from './partner-realtime.service';
import {
  CONFIRM_WINDOW_HOURS,
  bookingInclude,
  type Viewer,
  shapeBooking,
} from './booking.shared';
import { BookingSupportService } from './booking-support.service';
import { BookingSettlementService } from './booking-settlement.service';

@Injectable()
export class BookingStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: PartnerRealtimeService,
    private readonly finance: FinanceService,
    private readonly support: BookingSupportService,
    private readonly settlement: BookingSettlementService,
  ) {}

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
        raw.requirements.some(
          (requirement) => !requirement.customerConfirmed,
        ) &&
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
      settledByFinance = true;
    }

    if (status === BookingStatus.CANCELLED) {
      data.responseDeadlineAt = null;
    }

    // Toàn bộ thay đổi tiền + trạng thái đơn + cọc ứng tuyển trong một transaction.
    const updated = await this.prisma.$transaction(async (tx) => {
      if (settledByFinance && status === BookingStatus.COMPLETED) {
        await this.finance.releaseBookingInTransaction(tx, id, {
          status: BookingStatus.COMPLETED,
        });
      } else if (settledByFinance && status === BookingStatus.CANCELLED) {
        await this.finance.refundBookingInTransaction(tx, id, {
          status: BookingStatus.CANCELLED,
        });
      }

      if (status === BookingStatus.CANCELLED) {
        // Partner hủy khi CONFIRMED (chưa vào làm) → tịch thu cọc ứng tuyển.
        if (
          raw.status === BookingStatus.CONFIRMED &&
          raw.partnerId &&
          viewer.role !== Role.ADMIN &&
          viewer.id === raw.partnerId
        ) {
          await this.settlement.forfeitSelectedApplyDeposit(
            tx,
            id,
            raw.partnerId,
            'Người làm hủy sau khi được chọn (chưa vào làm)',
          );
        } else {
          await this.settlement.refundOpenApplications(tx, id);
        }
      }

      const row = settledByFinance
        ? await tx.booking.findUniqueOrThrow({
            where: { id },
            include: bookingInclude,
          })
        : await tx.booking.update({
            where: { id },
            data,
            include: bookingInclude,
          });

      if (status === BookingStatus.COMPLETED && row.partnerId) {
        await this.settlement.refundSelectedApplyDeposit(tx, id, row.partnerId);
      }
      return row;
    });

    if (status === BookingStatus.COMPLETED && updated.partnerId) {
      await recalculatePartnerLevel(this.prisma, updated.partnerId);
    }

    const shaped = shapeBooking(updated, viewer);

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
        shapeBooking(updated, {
          id: updated.partnerId,
          role: Role.PARTNER,
        }),
      );
    }

    this.realtime.emitCustomerBooking(
      updated.userId,
      shapeBooking(updated, { id: updated.userId, role: Role.CUSTOMER }),
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
    this.support.assertSettlementAllowed(booking);

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
    this.support.assertBookingParty(booking, viewer);
    this.support.assertSettlementAllowed(booking);

    if (viewer.role !== Role.ADMIN && booking.userId !== viewer.id) {
      throw new ForbiddenException('Chỉ khách thuê đề xuất % nghiệm thu');
    }
    if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
      throw new BadRequestException(
        'Phần trăm nghiệm thu phải trong khoảng 1..100',
      );
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
    return this.support.emitBookingUpdate(updated, viewer);
  }

  async approveSettlement(id: string, viewer: Viewer) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');
    this.support.assertBookingParty(booking, viewer);
    this.support.assertSettlementAllowed(booking);

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
      return this.support.emitBookingUpdate(afterApprove, viewer);
    }

    const settledPercent = afterApprove.settlementPercent;
    if (!settledPercent) {
      throw new BadRequestException('Đề xuất % nghiệm thu không hợp lệ');
    }
    const settled = await this.prisma.$transaction(async (tx) => {
      await this.finance.releaseBookingByPercentInTransaction(
        tx,
        id,
        settledPercent,
        { expectedStatus: BookingStatus.AWAITING_CONFIRM },
      );
      const row = await tx.booking.update({
        where: { id },
        data: { settlementResolvedAt: new Date() },
        include: bookingInclude,
      });
      if (row.partnerId) {
        await this.settlement.refundSelectedApplyDeposit(tx, id, row.partnerId);
      }
      return row;
    });
    if (settled.partnerId) {
      await recalculatePartnerLevel(this.prisma, settled.partnerId);
    }
    return this.support.emitBookingUpdate(settled, viewer);
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
    this.support.assertBookingParty(booking, viewer);

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
      throw new BadRequestException('Không cập nhật checklist khi đơn đã đóng');
    }

    const data: {
      partnerDone?: boolean;
      partnerDoneAt?: Date | null;
      customerConfirmed?: boolean;
      customerConfirmedAt?: Date | null;
      evidenceUrl?: string | null;
    } = {};

    if (dto.partnerDone !== undefined) {
      if (viewer.role !== Role.ADMIN && booking.partnerId !== viewer.id) {
        throw new ForbiddenException('Chỉ người làm đánh dấu «đã làm»');
      }
      data.partnerDone = dto.partnerDone;
      data.partnerDoneAt = dto.partnerDone ? new Date() : null;
    }

    if (dto.customerConfirmed !== undefined) {
      if (viewer.role !== Role.ADMIN && booking.userId !== viewer.id) {
        throw new ForbiddenException('Chỉ khách thuê tích xác nhận bàn giao');
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
    return this.support.emitBookingUpdate(updated, viewer);
  }
}
