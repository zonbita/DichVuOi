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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LobbyPresenceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const VIEWERS_CAP = 32;
let LobbyPresenceService = class LobbyPresenceService {
    prisma;
    seats = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async joinUser(userId, socketId) {
        const key = `user:${userId}`;
        const existing = this.seats.get(key);
        if (existing) {
            existing.socketIds.add(socketId);
            return;
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                partnerProfile: { select: { avatarUrl: true } },
            },
        });
        this.seats.set(key, {
            key,
            socketIds: new Set([socketId]),
            fullName: user?.fullName?.trim() || 'Thành viên',
            avatarUrl: user?.partnerProfile?.avatarUrl ?? null,
            userId,
            isGuest: false,
        });
    }
    joinGuest(guestId, socketId) {
        const safe = (guestId ?? '').trim().slice(0, 64) ||
            `anon-${socketId.slice(-8)}`;
        const key = `guest:${safe}`;
        const existing = this.seats.get(key);
        if (existing) {
            existing.socketIds.add(socketId);
            return;
        }
        const short = safe.replace(/^g_/, '').slice(-4).toUpperCase();
        this.seats.set(key, {
            key,
            socketIds: new Set([socketId]),
            fullName: `Khách · ${short || 'xem'}`,
            avatarUrl: null,
            userId: null,
            isGuest: true,
        });
    }
    leave(key, socketId) {
        if (!key)
            return;
        const seat = this.seats.get(key);
        if (!seat)
            return;
        seat.socketIds.delete(socketId);
        if (seat.socketIds.size === 0) {
            this.seats.delete(key);
        }
    }
    seatKeyForClient(data) {
        if (data.userId)
            return `user:${data.userId}`;
        if (data.guest) {
            const safe = (data.guestId ?? '').trim().slice(0, 64);
            if (safe)
                return `guest:${safe}`;
        }
        return undefined;
    }
    snapshot() {
        const all = [...this.seats.values()];
        const onlineCount = all.length;
        const sorted = all.sort((a, b) => {
            if (a.isGuest !== b.isGuest)
                return a.isGuest ? 1 : -1;
            return a.fullName.localeCompare(b.fullName, 'vi');
        });
        const viewers = sorted.slice(0, VIEWERS_CAP).map((s) => ({
            key: s.key,
            fullName: s.fullName,
            avatarUrl: s.avatarUrl,
            userId: s.userId,
            isGuest: s.isGuest,
        }));
        return { onlineCount, viewers };
    }
};
exports.LobbyPresenceService = LobbyPresenceService;
exports.LobbyPresenceService = LobbyPresenceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LobbyPresenceService);
//# sourceMappingURL=lobby-presence.service.js.map