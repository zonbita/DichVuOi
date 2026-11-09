import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, PaymentStatus, Prisma } from '@prisma/client';
import {
  computeEscrowSplit,
  DEFAULT_COMMISSION_BPS,
} from '../../common/escrow';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AdminBookingQueryDto, AdminUpdateBookingDto } from './dto';
import { paginated, resolvePage } from './admin-pagination';

/** Bookings and dispute investigation. */
@Injectable()
export class AdminBookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listBookings(query: AdminBookingQueryDto) {
    const page = resolvePage(query);
    const q = query.q?.trim();

    const createdAt: Prisma.DateTimeFilter = {};
    if (query.from) createdAt.gte = new Date(query.from);
    if (query.to) createdAt.lte = new Date(query.to);

    const where: Prisma.BookingWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
      ...(query.from || query.to ? { createdAt } : {}),
      ...(q
        ? {
            OR: [
              { customerName: { contains: q } },
              { service: { name: { contains: q } } },
              { user: { fullName: { contains: q } } },
              { user: { email: { contains: q } } },
              { partner: { fullName: { contains: q } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: {
          service: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, fullName: true, email: true } },
          partner: { select: { id: true, fullName: true, email: true } },
          _count: { select: { messages: true, reviews: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return paginated(items, total, page);
  }

  /** Chi tiết một đơn cho trang điều tra / xử lý tranh chấp. */
  async getBooking(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            unit: true,
          },
        },
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        partner: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, fullName: true, email: true } },
          },
        },
        reviews: {
          orderBy: { createdAt: 'asc' },
          include: {
            fromUser: { select: { id: true, fullName: true } },
            toUser: { select: { id: true, fullName: true } },
          },
        },
        requirements: {
          orderBy: { sortOrder: 'asc' },
        },
        complaints: {
          orderBy: { createdAt: 'desc' },
          include: {
            reporter: { select: { id: true, fullName: true } },
            against: { select: { id: true, fullName: true } },
            resolvedBy: { select: { id: true, fullName: true } },
          },
        },
      },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');
    return booking;
  }

  async updateBooking(id: string, dto: AdminUpdateBookingDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');

    const data: Prisma.BookingUpdateInput = {};
    if (dto.note !== undefined) data.note = dto.note;
    if (dto.status) data.status = dto.status;

    if (dto.paymentStatus) {
      data.paymentStatus = dto.paymentStatus;
      if (dto.paymentStatus === PaymentStatus.HELD && !booking.paidAt) {
        data.paidAt = new Date();
      }
      if (dto.paymentStatus === PaymentStatus.RELEASED) {
        const split = computeEscrowSplit(
          booking.totalPrice,
          booking.commissionBps || DEFAULT_COMMISSION_BPS,
        );
        data.commissionAmount = split.commissionAmount;
        data.partnerPayout = split.partnerPayout;
        data.releasedAt = new Date();
      }
      if (dto.paymentStatus === PaymentStatus.REFUNDED) {
        data.refundedAt = new Date();
      }
    }

    // Admin force COMPLETED + auto-release if HELD
    if (
      dto.status === BookingStatus.COMPLETED &&
      (dto.paymentStatus === PaymentStatus.RELEASED ||
        booking.paymentStatus === PaymentStatus.HELD)
    ) {
      if (!dto.paymentStatus && booking.paymentStatus === PaymentStatus.HELD) {
        const split = computeEscrowSplit(
          booking.totalPrice,
          booking.commissionBps || DEFAULT_COMMISSION_BPS,
        );
        data.paymentStatus = PaymentStatus.RELEASED;
        data.commissionAmount = split.commissionAmount;
        data.partnerPayout = split.partnerPayout;
        data.releasedAt = new Date();
      }
    }

    if (
      dto.status === BookingStatus.CANCELLED &&
      booking.paymentStatus === PaymentStatus.HELD &&
      !dto.paymentStatus
    ) {
      data.paymentStatus = PaymentStatus.REFUNDED;
      data.refundedAt = new Date();
    }

    return this.prisma.booking.update({
      where: { id },
      data,
      include: {
        service: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, fullName: true, email: true } },
        partner: { select: { id: true, fullName: true, email: true } },
        _count: { select: { messages: true, reviews: true } },
      },
    });
  }
}
