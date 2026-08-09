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
exports.HomeLobbyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_1 = require("@nestjs/jwt");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const create_home_reaction_dto_1 = require("./dto/create-home-reaction.dto");
const create_home_shout_dto_1 = require("./dto/create-home-shout.dto");
const home_lobby_service_1 = require("./home-lobby.service");
const lobby_presence_service_1 = require("./lobby-presence.service");
let HomeLobbyController = class HomeLobbyController {
    homeLobby;
    jwt;
    prisma;
    lobbyPresence;
    constructor(homeLobby, jwt, prisma, lobbyPresence) {
        this.homeLobby = homeLobby;
        this.jwt = jwt;
        this.prisma = prisma;
        this.lobbyPresence = lobbyPresence;
    }
    list(limit) {
        const parsed = limit ? Number(limit) : 24;
        return this.homeLobby.listFeed(Number.isFinite(parsed) ? parsed : 24);
    }
    presence() {
        return this.lobbyPresence.snapshot();
    }
    create(user, dto) {
        return this.homeLobby.create(user.id, dto);
    }
    async react(dto, authorization) {
        let userId;
        let displayName;
        if (authorization?.startsWith('Bearer ')) {
            try {
                const payload = this.jwt.verify(authorization.slice(7));
                userId = payload.sub;
                const user = await this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { fullName: true },
                });
                displayName = user?.fullName;
            }
            catch {
            }
        }
        return this.homeLobby.react(dto, { userId, displayName });
    }
};
exports.HomeLobbyController = HomeLobbyController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 24 }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HomeLobbyController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('presence'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HomeLobbyController.prototype, "presence", null);
__decorate([
    (0, common_1.Post)('shouts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_home_shout_dto_1.CreateHomeShoutDto]),
    __metadata("design:returntype", void 0)
], HomeLobbyController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('reactions'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_home_reaction_dto_1.CreateHomeReactionDto, String]),
    __metadata("design:returntype", Promise)
], HomeLobbyController.prototype, "react", null);
exports.HomeLobbyController = HomeLobbyController = __decorate([
    (0, swagger_1.ApiTags)('home-lobby'),
    (0, common_1.Controller)('home/lobby'),
    __metadata("design:paramtypes", [home_lobby_service_1.HomeLobbyService,
        jwt_1.JwtService,
        prisma_service_1.PrismaService,
        lobby_presence_service_1.LobbyPresenceService])
], HomeLobbyController);
//# sourceMappingURL=home-lobby.controller.js.map