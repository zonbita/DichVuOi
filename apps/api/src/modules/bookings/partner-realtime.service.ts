import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

/** Phát sự kiện realtime tới partner (schedule + hàng chờ). */
@Injectable()
export class PartnerRealtimeService {
  private server: Server | null = null;

  attach(server: Server) {
    this.server = server;
  }

  /** Đơn mở (đã cọc) — mọi partner đang xem hàng chờ. */
  emitOpenCreated(payload: unknown) {
    this.server?.to('partners:open').emit('booking:open', payload);
  }

  /** Đơn mở bị nhận / hủy — gỡ khỏi hàng chờ. */
  emitOpenRemoved(bookingId: string) {
    this.server?.to('partners:open').emit('booking:open_removed', { id: bookingId });
  }

  /** Đơn gắn / cập nhật lịch của một partner. */
  emitPartnerBooking(partnerId: string, event: 'booking:assigned' | 'booking:updated', payload: unknown) {
    this.server?.to(`partner:${partnerId}`).emit(event, payload);
  }

  /** Cập nhật đơn cho khách thuê (dashboard Đơn thuê). */
  emitCustomerBooking(customerId: string, payload: unknown) {
    this.server?.to(`customer:${customerId}`).emit('booking:customer_updated', payload);
  }

  /** Tin nhắn chat đơn — gửi tới cả khách và partner của đơn. */
  emitBookingMessage(
    parties: { customerId: string; partnerId?: string | null },
    payload: unknown,
  ) {
    this.server?.to(`customer:${parties.customerId}`).emit('booking:message', payload);
    if (parties.partnerId) {
      this.server?.to(`partner:${parties.partnerId}`).emit('booking:message', payload);
    }
  }

  /** Tin hỗ trợ kỹ thuật — khách + inbox staff. */
  emitSupportMessage(customerId: string, payload: unknown) {
    this.server?.to(`customer:${customerId}`).emit('support:message', payload);
    this.server?.to('staff:support').emit('support:message', payload);
  }
}
