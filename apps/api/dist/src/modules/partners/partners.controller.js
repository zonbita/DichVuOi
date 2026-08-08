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
exports.PartnersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const auth_service_1 = require("../auth/auth.service");
const partner_service_post_dto_1 = require("./dto/partner-service-post.dto");
const update_partner_profile_dto_1 = require("./dto/update-partner-profile.dto");
const partner_verify_dto_1 = require("./dto/partner-verify.dto");
const partners_service_1 = require("./partners.service");
let PartnersController = class PartnersController {
    partnersService;
    authService;
    constructor(partnersService, authService) {
        this.partnersService = partnersService;
        this.authService = authService;
    }
    searchPublic(q = '', limit) {
        const parsed = limit ? Number(limit) : 24;
        return this.partnersService.searchPublic(q, Number.isFinite(parsed) ? parsed : 24);
    }
    getPublicPost(userId, postId) {
        return this.partnersService.getPublicServicePost(userId, postId);
    }
    listApprovedPosts(page, pageSize) {
        const p = page ? Number(page) : 1;
        const ps = pageSize ? Number(pageSize) : 12;
        return this.partnersService.listApprovedServicePosts(Number.isFinite(p) ? p : 1, Number.isFinite(ps) ? ps : 12);
    }
    getPublic(userId) {
        return this.partnersService.getPublicProfile(userId);
    }
    listFavoriteIds(user) {
        return this.partnersService.listFavoriteIds(user.id);
    }
    listFavorites(user) {
        return this.partnersService.listFavorites(user.id);
    }
    addFavorite(user, partnerUserId) {
        return this.partnersService.addFavorite(user.id, partnerUserId);
    }
    removeFavorite(user, partnerUserId) {
        return this.partnersService.removeFavorite(user.id, partnerUserId);
    }
    async enable(user, dto) {
        await this.partnersService.enableOffering(user.id, dto);
        return this.authService.sessionFor(user.id);
    }
    getMine(user) {
        return this.partnersService.getMine(user.id);
    }
    getLevel(user) {
        return this.partnersService.getLevelBreakdown(user.id);
    }
    updateMine(user, dto) {
        return this.partnersService.updateMine(user.id, dto);
    }
    syncOfferings(user, dto) {
        return this.partnersService.syncOfferings(user.id, dto);
    }
    listMyPosts(user, serviceId) {
        return this.partnersService.listMyServicePosts(user.id, serviceId);
    }
    createMyPost(user, dto) {
        return this.partnersService.createServicePost(user.id, dto);
    }
    updateMyPost(user, id, dto) {
        return this.partnersService.updateServicePost(user.id, id, dto);
    }
    deleteMyPost(user, id) {
        return this.partnersService.deleteServicePost(user.id, id);
    }
    requestPhoneOtp(user, dto) {
        return this.partnersService.requestPhoneOtp(user.id, dto);
    }
    confirmPhoneOtp(user, dto) {
        return this.partnersService.confirmPhoneOtp(user.id, dto);
    }
    linkBank(user, dto) {
        return this.partnersService.linkBankAccount(user.id, dto);
    }
    confirmBank(user, dto) {
        return this.partnersService.confirmBankVerify(user.id, dto);
    }
};
exports.PartnersController = PartnersController;
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, example: 'gia su toan' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 24 }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "searchPublic", null);
__decorate([
    (0, common_1.Get)('public/:userId/posts/:postId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "getPublicPost", null);
__decorate([
    (0, common_1.Get)('posts'),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'pageSize', required: false, example: 12 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "listApprovedPosts", null);
__decorate([
    (0, common_1.Get)('public/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "getPublic", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('favorites/ids'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "listFavoriteIds", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('favorites'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "listFavorites", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('favorites/:partnerUserId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('partnerUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "addFavorite", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('favorites/:partnerUserId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('partnerUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "removeFavorite", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('enable'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_partner_profile_dto_1.EnablePartnerDto]),
    __metadata("design:returntype", Promise)
], PartnersController.prototype, "enable", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PARTNER, client_1.Role.ADMIN, client_1.Role.CUSTOMER),
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "getMine", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PARTNER, client_1.Role.ADMIN, client_1.Role.CUSTOMER),
    (0, common_1.Get)('me/level'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "getLevel", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PARTNER, client_1.Role.ADMIN, client_1.Role.CUSTOMER),
    (0, common_1.Patch)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_partner_profile_dto_1.UpdatePartnerProfileDto]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "updateMine", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PARTNER, client_1.Role.ADMIN, client_1.Role.CUSTOMER),
    (0, common_1.Put)('me/offerings'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_partner_profile_dto_1.SyncPartnerOfferingsDto]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "syncOfferings", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PARTNER, client_1.Role.ADMIN, client_1.Role.CUSTOMER),
    (0, common_1.Get)('me/posts'),
    (0, swagger_1.ApiQuery)({ name: 'serviceId', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('serviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "listMyPosts", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PARTNER, client_1.Role.ADMIN, client_1.Role.CUSTOMER),
    (0, common_1.Post)('me/posts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, partner_service_post_dto_1.CreatePartnerServicePostDto]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "createMyPost", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PARTNER, client_1.Role.ADMIN, client_1.Role.CUSTOMER),
    (0, common_1.Patch)('me/posts/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, partner_service_post_dto_1.UpdatePartnerServicePostDto]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "updateMyPost", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PARTNER, client_1.Role.ADMIN, client_1.Role.CUSTOMER),
    (0, common_1.Delete)('me/posts/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "deleteMyPost", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PARTNER, client_1.Role.ADMIN, client_1.Role.CUSTOMER),
    (0, common_1.Post)('me/verify-phone/request'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, partner_verify_dto_1.RequestPhoneOtpDto]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "requestPhoneOtp", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PARTNER, client_1.Role.ADMIN, client_1.Role.CUSTOMER),
    (0, common_1.Post)('me/verify-phone/confirm'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, partner_verify_dto_1.ConfirmPhoneOtpDto]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "confirmPhoneOtp", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PARTNER, client_1.Role.ADMIN, client_1.Role.CUSTOMER),
    (0, common_1.Post)('me/verify-bank/link'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, partner_verify_dto_1.LinkBankAccountDto]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "linkBank", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PARTNER, client_1.Role.ADMIN, client_1.Role.CUSTOMER),
    (0, common_1.Post)('me/verify-bank/mock-confirm'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, partner_verify_dto_1.ConfirmBankVerifyDto]),
    __metadata("design:returntype", void 0)
], PartnersController.prototype, "confirmBank", null);
exports.PartnersController = PartnersController = __decorate([
    (0, swagger_1.ApiTags)('partners'),
    (0, common_1.Controller)('partners'),
    __metadata("design:paramtypes", [partners_service_1.PartnersService,
        auth_service_1.AuthService])
], PartnersController);
//# sourceMappingURL=partners.controller.js.map