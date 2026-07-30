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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const admin_service_1 = require("./admin.service");
const admin_dto_1 = require("./dto/admin.dto");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    stats() {
        return this.adminService.stats();
    }
    listUsers(query) {
        return this.adminService.listUsers(query);
    }
    updateUser(id, dto) {
        return this.adminService.updateUser(id, dto);
    }
    listPartners(query) {
        return this.adminService.listPartners(query);
    }
    updatePartner(userId, dto) {
        return this.adminService.updatePartner(userId, dto);
    }
    listBookings(query) {
        return this.adminService.listBookings(query);
    }
    getBooking(id) {
        return this.adminService.getBooking(id);
    }
    updateBooking(id, dto) {
        return this.adminService.updateBooking(id, dto);
    }
    listReviews(query) {
        return this.adminService.listReviews(query);
    }
    listFlagged(query) {
        return this.adminService.listFlaggedMessages(query);
    }
    catalog() {
        return this.adminService.listCatalogSummary();
    }
    categories() {
        return this.adminService.listCategoryOptions();
    }
    listServices(query) {
        return this.adminService.listServices(query);
    }
    createService(dto) {
        return this.adminService.createService(dto);
    }
    updateService(id, dto) {
        return this.adminService.updateService(id, dto);
    }
    updateGroup(id, dto) {
        return this.adminService.updateGroup(id, dto);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.AdminUserQueryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Patch)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.AdminUpdateUserDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Get)('partners'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.AdminPartnerQueryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listPartners", null);
__decorate([
    (0, common_1.Patch)('partners/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.AdminUpdatePartnerDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updatePartner", null);
__decorate([
    (0, common_1.Get)('bookings'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.AdminBookingQueryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listBookings", null);
__decorate([
    (0, common_1.Get)('bookings/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getBooking", null);
__decorate([
    (0, common_1.Patch)('bookings/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.AdminUpdateBookingDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateBooking", null);
__decorate([
    (0, common_1.Get)('reviews'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.AdminPageQueryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listReviews", null);
__decorate([
    (0, common_1.Get)('messages/flagged'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.AdminPageQueryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listFlagged", null);
__decorate([
    (0, common_1.Get)('catalog'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "catalog", null);
__decorate([
    (0, common_1.Get)('categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "categories", null);
__decorate([
    (0, common_1.Get)('services'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.AdminServiceQueryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listServices", null);
__decorate([
    (0, common_1.Post)('services'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.AdminCreateServiceDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createService", null);
__decorate([
    (0, common_1.Patch)('services/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.AdminUpdateServiceDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateService", null);
__decorate([
    (0, common_1.Patch)('groups/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.AdminUpdateGroupDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateGroup", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map