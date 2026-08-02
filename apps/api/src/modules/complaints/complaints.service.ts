import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  BookingStatus,
  ComplaintResolutionAction,
  ComplaintStatus,
  PaymentStatus,
  Prisma,
} from '../../database/prisma/client';
import {
  REPUTATION_DEDUCTION_PRESETS,
} from '../../common/partner-reputation';
import { recalculatePartnerLevel } from '../../common/recalculate-partner-level';
import { ReputationService } from '../../common/reputation.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { FinanceService } from '../finance/finance.service';
import { AdminResolveComplaintDto, CreateComplaintDto } from './dto/complaint.dto';

const complaintInclude = {
  booking: {
    select: {
      id: true,
      customerName: true,
      status: true,
      paymentStatus: true,
      partnerId: true,
      service: { select: { name: true, slug: true } },
      requirements: {
        orderBy: { sortOrder: 'asc' as const },
        select: {
          id: true,
          content: true,
          partnerDone: true,
          customerConfirmed: true,
        },
      },
    },
  },
  reporter: { select: { id: true, fullName: true } },
  partner: { select: { id: true, fullName: true } },
  against: { select: { id: true, fullName: true } },
  resolvedBy: { select: { id: true, fullName: true } },
} as const;

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reputation: ReputationService,
    private readonly finance: FinanceService,
  ) {}

  private parseRequirementIds(json: string | null): string[] {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((x): x is string => typeof x === 'string')
        : [];
    } catch {
      return [];
    }
  }

  private shapeComplaint(row: {
    id: string;
    bookingId: string;
    category: string;
    description: string;
    status: ComplaintStatus;
    deductionPoints: number | null;
    adminNote: string | null;
    resolutionAction: ComplaintResolutionAction | null;
    requirementIdsJson: string | null;
    evidenceNote: string | null;
    resolvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    booking: {
      id: string;
      customerName: string;
      status: string;
      paymentStatus?: string;
      service: { name: string; slug: string };
      requirements?: Array<{
        id: string;
        content: string;
        partnerDone: boolean;
        customerConfirmed: boolean;
      }>;
    };
    reporter: { id: string; fullName: string };
    partner: { id: string; fullName: string };
    against: { id: string; fullName: string } | null;
    resolvedBy: { id: string; fullName: string } | null;
  }) {
    return {
      id: row.id,
      bookingId: row.bookingId,
      category: row.category,
      description: row.description,
      status: row.status,
      deductionPoints: row.deductionPoints,
      adminNote: row.adminNote,
      resolutionAction: row.resolutionAction,
      requirementIds: this.parseRequirementIds(row.requirementIdsJson),
      evidenceNote: row.evidenceNote,
      resolvedAt: row.resolvedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      booking: row.booking,
      reporter: row.reporter,
      partner: row.partner,
      against: row.against,
      resolvedBy: row.resolvedBy,
    };
  }

  async createForBooking(bookingId: string, userId: string, dto: CreateComplaintDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        partnerId: true,
        status: true,
        paymentStatus: true,
      },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');
    if (!booking.partnerId) {
      throw new BadRequestException('Đơn chưa có người làm — không thể khiếu nại');
    }

    const isCustomer = booking.userId === userId;
    const isPartner = booking.partnerId === userId;
    if (!isCustomer && !isPartner) {
      throw new ForbiddenException('Chỉ khách thuê hoặc người làm của đơn mới gửi khiếu nại');
    }

    const openWindow =
      booking.status === BookingStatus.AWAITING_CONFIRM ||
      booking.status === BookingStatus.DISPUTED;
    if (!openWindow) {
      throw new BadRequestException(
        'Chỉ khiếu nại khi đơn đang chờ xác nhận hoặc đang tranh chấp',
      );
    }

    if (booking.paymentStatus !== PaymentStatus.HELD) {
      throw new BadRequestException('Cọc không còn đang giữ — không mở khiếu nại');
    }

    const existing = await this.prisma.complaint.findFirst({
      where: {
        bookingId,
        reporterUserId: userId,
        status: { in: [ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW] },
      },
    });
    if (existing) {
      throw new BadRequestException('Đã có khiếu nại đang xử lý của bạn cho đơn này');
    }

    const againstUserId = isCustomer ? booking.partnerId : booking.userId;
    const requirementIds = [...new Set((dto.requirementIds ?? []).filter(Boolean))];
    if (requirementIds.length > 0) {
      const validCount = await this.prisma.bookingRequirement.count({
        where: {
          bookingId,
          id: { in: requirementIds },
        },
      });
      if (validCount !== requirementIds.length) {
        throw new BadRequestException(
          'Có mục checklist không thuộc đơn này',
        );
      }
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const complaint = await tx.complaint.create({
        data: {
          bookingId,
          reporterUserId: userId,
          partnerUserId: booking.partnerId!,
          againstUserId,
          category: dto.category.trim(),
          description: dto.description.trim(),
          evidenceNote: dto.evidenceNote.trim(),
          requirementIdsJson:
            requirementIds.length > 0 ? JSON.stringify(requirementIds) : null,
        },
        include: complaintInclude,
      });

      if (booking.status === BookingStatus.AWAITING_CONFIRM) {
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.DISPUTED,
            disputeResultNote: null,
          },
        });
      }

      return complaint;
    });

    return this.shapeComplaint(row);
  }

  async listMineAsCustomer(userId: string) {
    const rows = await this.prisma.complaint.findMany({
      where: {
        OR: [{ reporterUserId: userId }, { againstUserId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: complaintInclude,
    });
    return rows.map((row) => this.shapeComplaint(row));
  }

  async listForAdmin(status?: ComplaintStatus) {
    const rows = await this.prisma.complaint.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: complaintInclude,
    });
    return rows.map((row) => this.shapeComplaint(row));
  }

  async resolveAsAdmin(complaintId: string, admin: AuthUser, dto: AdminResolveComplaintDto) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        ...complaintInclude,
        booking: {
          select: {
            id: true,
            userId: true,
            partnerId: true,
            status: true,
            paymentStatus: true,
            totalPrice: true,
            commissionBps: true,
            customerName: true,
            service: { select: { name: true, slug: true } },
            requirements: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                content: true,
                partnerDone: true,
                customerConfirmed: true,
              },
            },
          },
        },
      },
    });
    if (!complaint) throw new NotFoundException('Không tìm thấy khiếu nại');

    if (
      complaint.status === ComplaintStatus.VERIFIED ||
      complaint.status === ComplaintStatus.REJECTED
    ) {
      throw new BadRequestException('Khiếu nại đã được xử lý');
    }

    if (dto.status === ComplaintStatus.UNDER_REVIEW) {
      const updated = await this.prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status: ComplaintStatus.UNDER_REVIEW,
          adminNote: dto.adminNote?.trim() || null,
          resolvedByUserId: admin.id,
        },
        include: complaintInclude,
      });
      return this.shapeComplaint(updated);
    }

    const action =
      dto.resolutionAction ??
      (dto.status === ComplaintStatus.REJECTED
        ? ComplaintResolutionAction.RELEASE
        : ComplaintResolutionAction.REFUND);

    const publicNote =
      dto.adminNote?.trim() ||
      (action === ComplaintResolutionAction.REFUND
        ? 'Ban kiểm duyệt chấp nhận khiếu nại phía khách — hoàn cọc.'
        : action === ComplaintResolutionAction.RELEASE
          ? 'Ban kiểm duyệt quyết giải ngân / hoàn thành đơn.'
          : action === ComplaintResolutionAction.RETRY_IN_PROGRESS
            ? 'Ban kiểm duyệt yêu cầu làm lại — đơn quay lại đang làm.'
            : action === ComplaintResolutionAction.RETRY_AWAITING
              ? 'Ban kiểm duyệt yêu cầu xác nhận lại — đơn quay chờ xác nhận.'
              : 'Ban kiểm duyệt đã ghi nhận.');

    await this.prisma.$transaction(async (tx) => {
      await tx.complaint.update({
        where: { id: complaintId },
        data: {
          status: dto.status,
          deductionPoints:
            dto.status === ComplaintStatus.VERIFIED &&
            action === ComplaintResolutionAction.REFUND
              ? (dto.deductionPoints ?? REPUTATION_DEDUCTION_PRESETS.MODERATE)
              : null,
          adminNote: dto.adminNote?.trim() || null,
          resolutionAction: action,
          resolvedAt: new Date(),
          resolvedByUserId: admin.id,
        },
      });

      const booking = complaint.booking;
      if (booking.paymentStatus !== PaymentStatus.HELD) {
        return;
      }

      if (action === ComplaintResolutionAction.REFUND) {
        await this.finance.refundBookingInTransaction(tx, booking.id, {
          status: BookingStatus.CANCELLED,
          disputeResultNote: publicNote,
        });
        // Hoàn cọc ứng tuyển (không tịch thu khi khách thắng khiếu nại).
        await this.refundHeldApplyDepositsInTransaction(tx, booking.id);
      } else if (action === ComplaintResolutionAction.RELEASE) {
        await this.finance.releaseBookingInTransaction(tx, booking.id, {
          status: BookingStatus.COMPLETED,
          disputeResultNote: publicNote,
        });
        // Giống hoàn thành thường: trả lại cọc 10% sau khi giải ngân.
        await this.refundHeldApplyDepositsInTransaction(tx, booking.id);
      } else if (action === ComplaintResolutionAction.RETRY_IN_PROGRESS) {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.IN_PROGRESS,
            confirmDeadlineAt: null,
            disputeResultNote: publicNote,
          },
        });
      } else if (action === ComplaintResolutionAction.RETRY_AWAITING) {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.AWAITING_CONFIRM,
            confirmDeadlineAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
            disputeResultNote: publicNote,
          },
        });
      } else {
        await tx.booking.update({
          where: { id: booking.id },
          data: { disputeResultNote: publicNote },
        });
      }
    });

    if (
      dto.status === ComplaintStatus.VERIFIED &&
      action === ComplaintResolutionAction.REFUND
    ) {
      const deduction =
        dto.deductionPoints ?? REPUTATION_DEDUCTION_PRESETS.MODERATE;
      await this.reputation.applyDeduction(
        complaint.partnerUserId,
        deduction,
        `Khiếu nại đơn ${complaint.bookingId}: ${complaint.category}`,
        complaintId,
      );
    }

    if (action === ComplaintResolutionAction.RELEASE && complaint.booking.partnerId) {
      await recalculatePartnerLevel(this.prisma, complaint.booking.partnerId);
    }

    const updated = await this.prisma.complaint.findUniqueOrThrow({
      where: { id: complaintId },
      include: complaintInclude,
    });
    return this.shapeComplaint(updated);
  }

  async countPendingForAdmin() {
    return this.prisma.complaint.count({
      where: {
        status: { in: [ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW] },
      },
    });
  }

  /** Hoàn mọi cọc ứng tuyển đang HELD trên đơn (idempotent qua FinanceService). */
  private async refundHeldApplyDepositsInTransaction(
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
      await this.finance.refundApplyDepositInTransaction(
        tx,
        bookingId,
        app.partnerId,
        app.id,
        app.depositAmount,
      );
      await tx.bookingApplication.update({
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
}
