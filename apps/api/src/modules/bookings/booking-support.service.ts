import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  BookingStatus,
  PaymentStatus,
  RequirementSource,
  Role,
} from '../../database/prisma/client';
import {
  isDepositHeld,
  shapeBookingForViewer,
} from '../../common/contact-privacy';
import { buildRequirementSeeds } from '../../common/booking-requirements';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PartnerRealtimeService } from './partner-realtime.service';
import { type Viewer, shapeBooking } from './booking.shared';

@Injectable()
export class BookingSupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: PartnerRealtimeService,
  ) {}

  emitBookingUpdate(
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
        shapeBooking(booking, {
          id: booking.partnerId,
          role: Role.PARTNER,
        }),
      );
    }
    this.realtime.emitCustomerBooking(
      booking.userId,
      shapeBooking(booking, { id: booking.userId, role: Role.CUSTOMER }),
    );
    return viewer
      ? shapeBooking(booking, viewer)
      : shapeBooking(booking, undefined);
  }

  /**
   * Seed checklist khi tạo đơn / khi chọn người làm (nếu vẫn trống).
   * Ưu tiên includes gói + ghi chú khách; fallback tên dịch vụ.
   */
  async seedRequirementsIfEmpty(bookingId: string) {
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

  async partnerIncludes(serviceId: string, partnerUserId: string) {
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

  assertBookingParty(
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

  assertDepositForChat(booking: {
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

  assertSettlementAllowed(booking: {
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
      throw new BadRequestException(
        'Cọc không còn đang giữ để thương lượng nghiệm thu',
      );
    }
    if (!booking.partnerId) {
      throw new BadRequestException('Đơn chưa có người làm');
    }
  }
}
