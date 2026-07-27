import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ComplaintStatus, Role } from '@prisma/client';
import {
  REPUTATION_DEDUCTION_PRESETS,
} from '../../common/partner-reputation';
import { ReputationService } from '../../common/reputation.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { AdminResolveComplaintDto, CreateComplaintDto } from './dto/complaint.dto';

const complaintInclude = {
  booking: {
    select: {
      id: true,
      customerName: true,
      status: true,
      service: { select: { name: true, slug: true } },
    },
  },
  reporter: { select: { id: true, fullName: true } },
  partner: { select: { id: true, fullName: true } },
  resolvedBy: { select: { id: true, fullName: true } },
} as const;

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reputation: ReputationService,
  ) {}

  private shapeComplaint(row: {
    id: string;
    bookingId: string;
    category: string;
    description: string;
    status: ComplaintStatus;
    deductionPoints: number | null;
    adminNote: string | null;
    resolvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    booking: {
      id: string;
      customerName: string;
      status: string;
      service: { name: string; slug: string };
    };
    reporter: { id: string; fullName: string };
    partner: { id: string; fullName: string };
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
      resolvedAt: row.resolvedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      booking: row.booking,
      reporter: row.reporter,
      partner: row.partner,
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
      },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');
    if (booking.userId !== userId) {
      throw new ForbiddenException('Chỉ khách của đơn mới gửi khiếu nại');
    }
    if (!booking.partnerId) {
      throw new BadRequestException('Đơn chưa có người làm — không thể khiếu nại');
    }

    const existing = await this.prisma.complaint.findFirst({
      where: {
        bookingId,
        reporterUserId: userId,
        status: { in: [ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW] },
      },
    });
    if (existing) {
      throw new BadRequestException('Đã có khiếu nại đang xử lý cho đơn này');
    }

    const row = await this.prisma.complaint.create({
      data: {
        bookingId,
        reporterUserId: userId,
        partnerUserId: booking.partnerId,
        category: dto.category.trim(),
        description: dto.description.trim(),
      },
      include: complaintInclude,
    });

    return this.shapeComplaint(row);
  }

  async listMineAsCustomer(userId: string) {
    const rows = await this.prisma.complaint.findMany({
      where: { reporterUserId: userId },
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
      include: complaintInclude,
    });
    if (!complaint) throw new NotFoundException('Không tìm thấy khiếu nại');

    if (complaint.status === ComplaintStatus.VERIFIED || complaint.status === ComplaintStatus.REJECTED) {
      throw new BadRequestException('Khiếu nại đã được xử lý');
    }

    if (dto.status === ComplaintStatus.VERIFIED) {
      const deduction =
        dto.deductionPoints ?? REPUTATION_DEDUCTION_PRESETS.MODERATE;

      const updated = await this.prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status: ComplaintStatus.VERIFIED,
          deductionPoints: deduction,
          adminNote: dto.adminNote?.trim() || null,
          resolvedAt: new Date(),
          resolvedByUserId: admin.id,
        },
        include: complaintInclude,
      });

      await this.reputation.applyDeduction(
        complaint.partnerUserId,
        deduction,
        `Khiếu nại đơn ${complaint.bookingId}: ${complaint.category}`,
        complaintId,
      );

      return this.shapeComplaint(updated);
    }

    const updated = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: dto.status,
        adminNote: dto.adminNote?.trim() || null,
        resolvedAt: dto.status === ComplaintStatus.REJECTED ? new Date() : null,
        resolvedByUserId: admin.id,
      },
      include: complaintInclude,
    });

    return this.shapeComplaint(updated);
  }

  async countPendingForAdmin() {
    return this.prisma.complaint.count({
      where: { status: { in: [ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW] } },
    });
  }
}
