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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const support_dto_1 = require("./dto/support.dto");
const support_service_1 = require("./support.service");
let SupportController = class SupportController {
    supportService;
    constructor(supportService) {
        this.supportService = supportService;
    }
    listMine(user) {
        return this.supportService.listMyMessages(user);
    }
    postMine(user, dto) {
        return this.supportService.postMyMessage(user, dto);
    }
    listThreads(status) {
        return this.supportService.listThreads(status);
    }
    getThread(id) {
        return this.supportService.listThreadMessages(id);
    }
    postStaff(user, id, dto) {
        return this.supportService.postStaffMessage(id, user, dto);
    }
    updateThread(user, id, dto) {
        return this.supportService.updateThread(id, user, dto);
    }
};
exports.SupportController = SupportController;
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "listMine", null);
__decorate([
    (0, common_1.Post)('my/messages'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, support_dto_1.CreateSupportMessageDto]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "postMine", null);
__decorate([
    (0, common_1.Get)('threads'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.MODERATOR),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof client_1.SupportThreadStatus !== "undefined" && client_1.SupportThreadStatus) === "function" ? _a : Object]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "listThreads", null);
__decorate([
    (0, common_1.Get)('threads/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.MODERATOR),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "getThread", null);
__decorate([
    (0, common_1.Post)('threads/:id/messages'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.MODERATOR),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, support_dto_1.CreateSupportMessageDto]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "postStaff", null);
__decorate([
    (0, common_1.Patch)('threads/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.MODERATOR),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, support_dto_1.UpdateSupportThreadDto]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "updateThread", null);
exports.SupportController = SupportController = __decorate([
    (0, swagger_1.ApiTags)('support'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('support'),
    __metadata("design:paramtypes", [support_service_1.SupportService])
], SupportController);
//# sourceMappingURL=support.controller.js.map