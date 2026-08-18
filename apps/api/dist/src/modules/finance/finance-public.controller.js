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
exports.FinancePublicController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const finance_service_1 = require("./finance.service");
let FinancePublicController = class FinancePublicController {
    finance;
    constructor(finance) {
        this.finance = finance;
    }
    async handlePayosWebhook(body) {
        const result = await this.finance.handlePayosWebhook(body ?? {});
        if (!result.ok) {
            throw new common_1.UnauthorizedException('Chữ ký payOS không hợp lệ');
        }
        return result;
    }
};
exports.FinancePublicController = FinancePublicController;
__decorate([
    (0, common_1.Post)('webhooks/payos'),
    (0, common_1.HttpCode)(200),
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({
        whitelist: false,
        forbidNonWhitelisted: false,
        transform: false,
    })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FinancePublicController.prototype, "handlePayosWebhook", null);
exports.FinancePublicController = FinancePublicController = __decorate([
    (0, swagger_1.ApiTags)('webhooks'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], FinancePublicController);
//# sourceMappingURL=finance-public.controller.js.map