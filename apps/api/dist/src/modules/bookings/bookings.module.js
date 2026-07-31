"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const finance_module_1 = require("../finance/finance.module");
const bookings_public_controller_1 = require("./bookings-public.controller");
const bookings_controller_1 = require("./bookings.controller");
const bookings_gateway_1 = require("./bookings.gateway");
const bookings_service_1 = require("./bookings.service");
const partner_presence_service_1 = require("./partner-presence.service");
const partner_realtime_service_1 = require("./partner-realtime.service");
let BookingsModule = class BookingsModule {
};
exports.BookingsModule = BookingsModule;
exports.BookingsModule = BookingsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, finance_module_1.FinanceModule],
        controllers: [bookings_public_controller_1.BookingsPublicController, bookings_controller_1.BookingsController],
        providers: [
            bookings_service_1.BookingsService,
            partner_realtime_service_1.PartnerRealtimeService,
            partner_presence_service_1.PartnerPresenceService,
            bookings_gateway_1.BookingsGateway,
        ],
        exports: [bookings_service_1.BookingsService, partner_realtime_service_1.PartnerRealtimeService],
    })
], BookingsModule);
//# sourceMappingURL=bookings.module.js.map