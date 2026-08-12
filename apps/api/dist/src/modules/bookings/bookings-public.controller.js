"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsPublicController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bookings_service_1 = require("./bookings.service");
let BookingsPublicController = class BookingsPublicController {
    bookingsService;
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    listOpenBoard(page, pageSize) {
        const parsedPage = page ? Number(page) : 1;
        const parsedSize = pageSize ? Number(pageSize) : 10;
        return this.bookingsService.listOpenBoard(Number.isFinite(parsedPage) ? parsedPage : 1, Number.isFinite(parsedSize) ? parsedSize : 10);
    }
    getPublicOpen(id) {
        return this.bookingsService.getPublicOpenBooking(id);
    }
    listPublicActivity(limit) {
        const parsed = limit ? Number(limit) : 12;
        return this.bookingsService.listPublicActivity(Number.isFinite(parsed) ? parsed : 12);
    }
    listRecentCompleted(limit) {
        const parsed = limit ? Number(limit) : 8;
        return this.bookingsService.listRecentCompletedPublic(Number.isFinite(parsed) ? parsed : 8);
    }
};
exports.BookingsPublicController = BookingsPublicController;
__decorate([
    (0, common_1.Get)('open/board'),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'pageSize', required: false, example: 10 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BookingsPublicController.prototype, "listOpenBoard", null);
__decorate([
    (0, common_1.Get)('public/open/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BookingsPublicController.prototype, "getPublicOpen", null);
__decorate([
    (0, common_1.Get)('public/activity'),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 12 }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BookingsPublicController.prototype, "listPublicActivity", null);
__decorate([
    (0, common_1.Get)('public/recent-completed'),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 8 }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BookingsPublicController.prototype, "listRecentCompleted", null);
exports.BookingsPublicController = BookingsPublicController = __decorate([
    (0, swagger_1.ApiTags)('bookings'),
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsPublicController);
//# sourceMappingURL=bookings-public.controller.js.map