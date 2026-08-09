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
var BookingsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsGateway = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
const client_1 = require("@prisma/client");
const socket_io_1 = require("socket.io");
const cors_origin_1 = require("../../common/cors-origin");
const lobby_presence_service_1 = require("../home-lobby/lobby-presence.service");
const partner_presence_service_1 = require("./partner-presence.service");
const partner_realtime_service_1 = require("./partner-realtime.service");
let BookingsGateway = BookingsGateway_1 = class BookingsGateway {
    jwt;
    realtime;
    presence;
    lobbyPresence;
    logger = new common_1.Logger(BookingsGateway_1.name);
    server;
    constructor(jwt, realtime, presence, lobbyPresence) {
        this.jwt = jwt;
        this.realtime = realtime;
        this.presence = presence;
        this.lobbyPresence = lobbyPresence;
    }
    afterInit(server) {
        this.realtime.attach(server);
        this.logger.log('Partner realtime gateway ready');
    }
    broadcastLobbyPresence() {
        this.realtime.emitHomePresence(this.lobbyPresence.snapshot());
    }
    async enterLobbyAsGuest(client) {
        client.join('home:lobby');
        client.data.guest = true;
        client.data.inLobby = true;
        const rawGuest = client.handshake.auth?.guestId;
        const guestId = (rawGuest ?? '').trim().slice(0, 64) || `anon-${client.id.slice(-8)}`;
        client.data.guestId = guestId;
        client.data.lobbyKey = `guest:${guestId}`;
        this.lobbyPresence.joinGuest(guestId, client.id);
        client.emit('realtime:ready', { guest: true });
        this.broadcastLobbyPresence();
    }
    handleConnection(client) {
        try {
            const token = client.handshake.auth?.token;
            const wantLobby = client.handshake.auth?.lobby === true;
            if (!token) {
                void this.enterLobbyAsGuest(client);
                return;
            }
            const payload = this.jwt.verify(token);
            client.data.userId = payload.sub;
            client.data.role = payload.role;
            client.join(`partner:${payload.sub}`);
            client.join(`customer:${payload.sub}`);
            if (payload.role === client_1.Role.PARTNER || payload.role === client_1.Role.ADMIN) {
                client.join('partners:open');
            }
            if (payload.role === client_1.Role.ADMIN || payload.role === client_1.Role.MODERATOR) {
                client.join('staff:support');
            }
            void this.presence.onConnect(payload.sub, client.id).catch((err) => this.logger.warn(`Presence connect: ${err.message}`));
            if (wantLobby) {
                client.data.inLobby = true;
                client.data.lobbyKey = `user:${payload.sub}`;
                client.join('home:lobby');
                void this.lobbyPresence
                    .joinUser(payload.sub, client.id)
                    .then(() => this.broadcastLobbyPresence())
                    .catch((err) => this.logger.warn(`Lobby presence: ${err.message}`));
            }
            client.emit('realtime:ready', { userId: payload.sub });
        }
        catch (err) {
            this.logger.warn(`WS auth failed (lobby guest): ${err.message}`);
            void this.enterLobbyAsGuest(client);
        }
    }
    handleDisconnect(client) {
        const userId = client.data?.userId;
        if (userId) {
            this.presence.onDisconnect(userId, client.id);
            this.logger.debug(`Partner WS disconnect ${userId}`);
        }
        if (client.data?.inLobby) {
            const lobbyKey = client.data?.lobbyKey ||
                this.lobbyPresence.seatKeyForClient({
                    userId,
                    guest: Boolean(client.data?.guest),
                    guestId: client.data?.guestId,
                });
            this.lobbyPresence.leave(lobbyKey, client.id);
            this.broadcastLobbyPresence();
        }
    }
    async handlePresencePing(client, _body) {
        const userId = client.data?.userId;
        if (!userId)
            return { ok: false };
        await this.presence.onHeartbeat(userId);
        return { ok: true, at: Date.now() };
    }
    handleLobbySync(client) {
        if (!client.rooms.has('home:lobby')) {
            client.join('home:lobby');
        }
        return this.lobbyPresence.snapshot();
    }
};
exports.BookingsGateway = BookingsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], BookingsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('presence:ping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], BookingsGateway.prototype, "handlePresencePing", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('lobby:sync'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], BookingsGateway.prototype, "handleLobbySync", null);
exports.BookingsGateway = BookingsGateway = BookingsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/partner-realtime',
        cors: {
            origin: (0, cors_origin_1.buildCorsOrigin)(),
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        partner_realtime_service_1.PartnerRealtimeService,
        partner_presence_service_1.PartnerPresenceService,
        lobby_presence_service_1.LobbyPresenceService])
], BookingsGateway);
//# sourceMappingURL=bookings.gateway.js.map