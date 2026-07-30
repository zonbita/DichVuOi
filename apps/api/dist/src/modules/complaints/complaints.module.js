"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintsModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const finance_module_1 = require("../finance/finance.module");
const reputation_service_1 = require("../../common/reputation.service");
const complaints_controller_1 = require("./complaints.controller");
const complaints_service_1 = require("./complaints.service");
let ComplaintsModule = class ComplaintsModule {
};
exports.ComplaintsModule = ComplaintsModule;
exports.ComplaintsModule = ComplaintsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, finance_module_1.FinanceModule],
        controllers: [complaints_controller_1.ComplaintsController],
        providers: [complaints_service_1.ComplaintsService, reputation_service_1.ReputationService],
        exports: [complaints_service_1.ComplaintsService, reputation_service_1.ReputationService],
    })
], ComplaintsModule);
//# sourceMappingURL=complaints.module.js.map