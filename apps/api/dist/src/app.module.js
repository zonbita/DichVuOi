"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./database/prisma/prisma.module");
const admin_module_1 = require("./modules/admin/admin.module");
const auth_module_1 = require("./modules/auth/auth.module");
const bookings_module_1 = require("./modules/bookings/bookings.module");
const catalog_module_1 = require("./modules/catalog/catalog.module");
const health_module_1 = require("./modules/health/health.module");
const partners_module_1 = require("./modules/partners/partners.module");
const complaints_module_1 = require("./modules/complaints/complaints.module");
const chatbot_module_1 = require("./modules/chatbot/chatbot.module");
const finance_module_1 = require("./modules/finance/finance.module");
const uploads_module_1 = require("./modules/uploads/uploads.module");
const support_module_1 = require("./modules/support/support.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            health_module_1.HealthModule,
            catalog_module_1.CatalogModule,
            bookings_module_1.BookingsModule,
            partners_module_1.PartnersModule,
            admin_module_1.AdminModule,
            complaints_module_1.ComplaintsModule,
            finance_module_1.FinanceModule,
            chatbot_module_1.ChatbotModule,
            uploads_module_1.UploadsModule,
            support_module_1.SupportModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map