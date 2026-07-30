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
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const finance_service_1 = require("./finance.service");
const create_vietqr_intent_dto_1 = require("./dto/create-vietqr-intent.dto");
const top_up_dto_1 = require("./dto/top-up.dto");
let FinanceController = class FinanceController {
    finance;
    constructor(finance) {
        this.finance = finance;
    }
    getWallet(user) {
        return this.finance.getWallet(user.id);
    }
    topUp(user, dto) {
        return this.finance.topUp(user.id, dto.amount);
    }
    createVietQrIntent(user, dto) {
        return this.finance.createVietQrIntent(user.id, dto.amount);
    }
    getVietQrIntentStatus(user, intentId) {
        return this.finance.getVietQrIntentStatus(user.id, intentId);
    }
    confirmVietQrIntentMock(user, intentId) {
        return this.finance.confirmVietQrIntentMock(user.id, intentId);
    }
    listInvoices(user) {
        return this.finance.listInvoices(user.id);
    }
    getInvoice(user, id) {
        return this.finance.getInvoice(id, user.id, user.role === 'ADMIN');
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Get)('wallet'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getWallet", null);
__decorate([
    (0, common_1.Post)('wallet/top-up'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, top_up_dto_1.TopUpDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "topUp", null);
__decorate([
    (0, common_1.Post)('wallet/top-up/vietqr/intent'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_vietqr_intent_dto_1.CreateVietQrIntentDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "createVietQrIntent", null);
__decorate([
    (0, common_1.Get)('wallet/top-up/vietqr/:intentId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('intentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getVietQrIntentStatus", null);
__decorate([
    (0, common_1.Post)('wallet/top-up/vietqr/:intentId/mock-confirm'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('intentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "confirmVietQrIntentMock", null);
__decorate([
    (0, common_1.Get)('invoices'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "listInvoices", null);
__decorate([
    (0, common_1.Get)('invoices/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getInvoice", null);
exports.FinanceController = FinanceController = __decorate([
    (0, swagger_1.ApiTags)('wallet'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map