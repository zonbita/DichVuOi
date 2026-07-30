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
var PartnerPresenceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerPresenceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const recalculate_partner_level_1 = require("../../common/recalculate-partner-level");
const DISCONNECT_GRACE_MS = 30_000;
const HEARTBEAT_FLUSH_MIN_MS = 60_000;
let PartnerPresenceService = PartnerPresenceService_1 = class PartnerPresenceService {
    prisma;
    logger = new common_1.Logger(PartnerPresenceService_1.name);
    sessions = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onConnect(userId, socketId) {
        const hasProfile = await this.prisma.partnerProfile.findUnique({
            where: { userId },
            select: { userId: true },
        });
        if (!hasProfile)
            return;
        let session = this.sessions.get(userId);
        if (session?.disconnectTimer) {
            clearTimeout(session.disconnectTimer);
            session.disconnectTimer = undefined;
        }
        if (!session) {
            session = {
                socketIds: new Set([socketId]),
                creditedFromMs: Date.now(),
            };
            this.sessions.set(userId, session);
        }
        else {
            session.socketIds.add(socketId);
        }
        await this.prisma.partnerProfile.update({
            where: { userId },
            data: { lastOnlineAt: new Date() },
        });
    }
    onDisconnect(userId, socketId) {
        const session = this.sessions.get(userId);
        if (!session)
            return;
        session.socketIds.delete(socketId);
        if (session.socketIds.size > 0)
            return;
        if (session.disconnectTimer)
            clearTimeout(session.disconnectTimer);
        session.disconnectTimer = setTimeout(() => {
            void this.flushAndEnd(userId).catch((err) => this.logger.warn(`Presence flush failed: ${err.message}`));
        }, DISCONNECT_GRACE_MS);
    }
    async onHeartbeat(userId) {
        const session = this.sessions.get(userId);
        if (!session || session.socketIds.size === 0) {
            return;
        }
        if (session.disconnectTimer) {
            clearTimeout(session.disconnectTimer);
            session.disconnectTimer = undefined;
        }
        const elapsed = Date.now() - session.creditedFromMs;
        if (elapsed >= HEARTBEAT_FLUSH_MIN_MS) {
            await this.creditElapsed(userId, session, false);
        }
        else {
            await this.prisma.partnerProfile.update({
                where: { userId },
                data: { lastOnlineAt: new Date() },
            });
        }
    }
    async flushAndEnd(userId) {
        const session = this.sessions.get(userId);
        if (!session)
            return;
        if (session.socketIds.size > 0)
            return;
        await this.creditElapsed(userId, session, true);
        this.sessions.delete(userId);
    }
    async creditElapsed(userId, session, endSession) {
        const now = Date.now();
        const addSeconds = Math.max(0, Math.floor((now - session.creditedFromMs) / 1000));
        session.creditedFromMs = now;
        if (addSeconds <= 0 && !endSession) {
            await this.prisma.partnerProfile.update({
                where: { userId },
                data: { lastOnlineAt: new Date(now) },
            });
            return;
        }
        if (addSeconds > 0) {
            await this.prisma.partnerProfile.update({
                where: { userId },
                data: {
                    onlineSeconds: { increment: addSeconds },
                    lastOnlineAt: new Date(now),
                },
            });
            await (0, recalculate_partner_level_1.recalculatePartnerLevel)(this.prisma, userId);
        }
        else {
            await this.prisma.partnerProfile.update({
                where: { userId },
                data: { lastOnlineAt: new Date(now) },
            });
        }
    }
};
exports.PartnerPresenceService = PartnerPresenceService;
exports.PartnerPresenceService = PartnerPresenceService = PartnerPresenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PartnerPresenceService);
//# sourceMappingURL=partner-presence.service.js.map