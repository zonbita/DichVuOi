import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Role } from '../../database/prisma/client';
import { redactContactLeak } from '../../common/contact-privacy';
import { recalculatePartnerLevel } from '../../common/recalculate-partner-level';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateBookingMessageDto } from './dto/create-booking-message.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { PartnerRealtimeService } from './partner-realtime.service';
import { type Viewer } from './booking.shared';
import { BookingSupportService } from './booking-support.service';
import { BookingQueriesService } from './booking-queries.service';

@Injectable()
export class BookingMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: PartnerRealtimeService,
    private readonly support: BookingSupportService,
    private readonly queries: BookingQueriesService,
  ) {}

  async listMessages(bookingId: string, viewer: Viewer) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy đơn');
    this.support.assertBookingParty(booking, viewer);

    if (viewer.role !== Role.ADMIN) {
      this.support.assertDepositForChat(booking);
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
    this.support.assertBookingParty(booking, viewer);

    if (viewer.role !== Role.ADMIN) {
      this.support.assertDepositForChat(booking);
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
    await this.queries.findOne(bookingId, viewer);
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
