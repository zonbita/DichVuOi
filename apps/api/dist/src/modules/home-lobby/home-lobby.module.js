"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeLobbyModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const bookings_module_1 = require("../bookings/bookings.module");
const home_lobby_controller_1 = require("./home-lobby.controller");
const home_lobby_service_1 = require("./home-lobby.service");
let HomeLobbyModule = class HomeLobbyModule {
};
exports.HomeLobbyModule = HomeLobbyModule;
exports.HomeLobbyModule = HomeLobbyModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, bookings_module_1.BookingsModule],
        controllers: [home_lobby_controller_1.HomeLobbyController],
        providers: [home_lobby_service_1.HomeLobbyService],
    })
], HomeLobbyModule);
//# sourceMappingURL=home-lobby.module.js.map