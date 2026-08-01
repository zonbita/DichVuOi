import { Server } from 'socket.io';
export declare class PartnerRealtimeService {
    private server;
    attach(server: Server): void;
    emitOpenCreated(payload: unknown): void;
    emitOpenRemoved(bookingId: string): void;
    emitPartnerBooking(partnerId: string, event: 'booking:assigned' | 'booking:updated', payload: unknown): void;
    emitCustomerBooking(customerId: string, payload: unknown): void;
    emitBookingMessage(parties: {
        customerId: string;
        partnerId?: string | null;
    }, payload: unknown): void;
    emitSupportMessage(customerId: string, payload: unknown): void;
}
