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
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("../../database/prisma/client");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const bookings_service_1 = require("./bookings.service");
const apply_booking_dto_1 = require("./dto/apply-booking.dto");
const create_booking_dto_1 = require("./dto/create-booking.dto");
const create_booking_message_dto_1 = require("./dto/create-booking-message.dto");
const create_review_dto_1 = require("./dto/create-review.dto");
const partner_schedule_query_dto_1 = require("./dto/partner-schedule-query.dto");
const settlement_dto_1 = require("./dto/settlement.dto");
const update_booking_status_dto_1 = require("./dto/update-booking-status.dto");
const update_requirement_dto_1 = require("./dto/update-requirement.dto");
let BookingsController = class BookingsController {
    bookingsService;
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    create(user, dto) {
        return this.bookingsService.create(dto, user.id);
    }
    listMine(user) {
        return this.bookingsService.listMineAsCustomer(user.id);
    }
    customerPublishSchedule(user, query) {
        return this.bookingsService.listCustomerPublishSchedule(user.id, query.year, query.month);
    }
    rebookHints(user) {
        return this.bookingsService.getRebookHints(user.id);
    }
    listPartnerMine(user) {
        return this.bookingsService.listMineAsPartner(user.id);
    }
    partnerSchedule(user, query) {
        return this.bookingsService.listPartnerSchedule(user.id, query.year, query.month);
    }
    listOpen(user) {
        return this.bookingsService.listOpen(user.id);
    }
    listMessages(user, id) {
        return this.bookingsService.listMessages(id, user);
    }
    postMessage(user, id, dto) {
        return this.bookingsService.postMessage(id, user, dto);
    }
    listReviews(user, id) {
        return this.bookingsService.listReviews(id, user);
    }
    createReview(user, id, dto) {
        return this.bookingsService.createReview(id, user, dto);
    }
    payEscrow(user, id) {
        return this.bookingsService.payEscrow(id, user);
    }
    apply(user, id, dto) {
        return this.bookingsService.apply(id, user.id, dto);
    }
    listApplications(user, id) {
        return this.bookingsService.listApplications(id, user);
    }
    selectApplicant(user, id, applicationId) {
        return this.bookingsService.selectApplicant(id, applicationId, user);
    }
    confirmCompletion(user, id, dto) {
        return this.bookingsService.confirmCompletion(id, user, dto);
    }
    proposeSettlement(user, id, dto) {
        return this.bookingsService.proposeSettlement(id, user, dto.percent);
    }
    approveSettlement(user, id) {
        return this.bookingsService.approveSettlement(id, user);
    }
    addRequirement(user, id, dto) {
        return this.bookingsService.addRequirement(id, user, dto);
    }
    updateRequirement(user, id, requirementId, dto) {
        return this.bookingsService.updateRequirement(id, requirementId, user, dto);
    }
    findOne(user, id) {
        return this.bookingsService.findOne(id, user);
    }
    accept(user, id) {
        return this.bookingsService.apply(id, user.id, {});
    }
    updateStatus(user, id, dto) {
        return this.bookingsService.updateStatus(id, dto.status, user);
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_booking_dto_1.CreateBookingDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('mine'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "listMine", null);
__decorate([
    (0, common_1.Get)('mine/publish-schedule'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, partner_schedule_query_dto_1.PartnerScheduleQueryDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "customerPublishSchedule", null);
__decorate([
    (0, common_1.Get)('rebook-hints'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "rebookHints", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PARTNER, client_1.Role.ADMIN),
    (0, common_1.Get)('partner/mine'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "listPartnerMine", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PARTNER, client_1.Role.ADMIN),
    (0, common_1.Get)('partner/schedule'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, partner_schedule_query_dto_1.PartnerScheduleQueryDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "partnerSchedule", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PARTNER, client_1.Role.ADMIN),
    (0, common_1.Get)('open'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "listOpen", null);
__decorate([
    (0, common_1.Get)(':id/messages'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "listMessages", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_booking_message_dto_1.CreateBookingMessageDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "postMessage", null);
__decorate([
    (0, common_1.Get)(':id/reviews'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "listReviews", null);
__decorate([
    (0, common_1.Post)(':id/reviews'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_review_dto_1.CreateReviewDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "createReview", null);
__decorate([
    (0, common_1.Post)(':id/pay'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "payEscrow", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PARTNER, client_1.Role.ADMIN),
    (0, common_1.Post)(':id/apply'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, apply_booking_dto_1.ApplyBookingDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "apply", null);
__decorate([
    (0, common_1.Get)(':id/applications'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "listApplications", null);
__decorate([
    (0, common_1.Post)(':id/applications/:applicationId/select'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('applicationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "selectApplicant", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_requirement_dto_1.ConfirmBookingDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "confirmCompletion", null);
__decorate([
    (0, common_1.Post)(':id/settlement/propose'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, settlement_dto_1.ProposeSettlementDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "proposeSettlement", null);
__decorate([
    (0, common_1.Post)(':id/settlement/approve'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "approveSettlement", null);
__decorate([
    (0, common_1.Post)(':id/requirements'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_requirement_dto_1.CreateRequirementDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "addRequirement", null);
__decorate([
    (0, common_1.Patch)(':id/requirements/:requirementId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('requirementId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_requirement_dto_1.UpdateRequirementDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "updateRequirement", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PARTNER, client_1.Role.ADMIN),
    (0, common_1.Post)(':id/accept'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "accept", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_booking_status_dto_1.UpdateBookingStatusDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "updateStatus", null);
exports.BookingsController = BookingsController = __decorate([
    (0, swagger_1.ApiTags)('bookings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map