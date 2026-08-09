"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerRealtimeService = void 0;
const common_1 = require("@nestjs/common");
let PartnerRealtimeService = class PartnerRealtimeService {
    server = null;
    attach(server) {
        this.server = server;
    }
    emitOpenCreated(payload) {
        this.server?.to('partners:open').emit('booking:open', payload);
    }
    emitOpenRemoved(bookingId) {
        this.server?.to('partners:open').emit('booking:open_removed', { id: bookingId });
    }
    emitPartnerBooking(partnerId, event, payload) {
        this.server?.to(`partner:${partnerId}`).emit(event, payload);
    }
    emitCustomerBooking(customerId, payload) {
        this.server?.to(`customer:${customerId}`).emit('booking:customer_updated', payload);
    }
    emitBookingMessage(parties, payload) {
        this.server?.to(`customer:${parties.customerId}`).emit('booking:message', payload);
        if (parties.partnerId) {
            this.server?.to(`partner:${parties.partnerId}`).emit('booking:message', payload);
        }
    }
    emitSupportMessage(customerId, payload) {
        this.server?.to(`customer:${customerId}`).emit('support:message', payload);
        this.server?.to('staff:support').emit('support:message', payload);
    }
    emitHomeShout(payload) {
        this.server?.to('home:lobby').emit('home:shout', payload);
    }
    emitHomeReaction(payload) {
        this.server?.to('home:lobby').emit('home:reaction', payload);
    }
    emitHomePresence(payload) {
        this.server?.to('home:lobby').emit('home:presence', payload);
    }
};
exports.PartnerRealtimeService = PartnerRealtimeService;
exports.PartnerRealtimeService = PartnerRealtimeService = __decorate([
    (0, common_1.Injectable)()
], PartnerRealtimeService);
//# sourceMappingURL=partner-realtime.service.js.map