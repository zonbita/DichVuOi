import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Role } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { buildCorsOrigin } from '../../common/cors-origin';
import { LobbyPresenceService } from '../home-lobby/lobby-presence.service';
import { PartnerPresenceService } from './partner-presence.service';
import { PartnerRealtimeService } from './partner-realtime.service';

@WebSocketGateway({
  namespace: '/partner-realtime',
  cors: {
    origin: buildCorsOrigin(),
    credentials: true,
  },
})
export class BookingsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(BookingsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly realtime: PartnerRealtimeService,
    private readonly presence: PartnerPresenceService,
    private readonly lobbyPresence: LobbyPresenceService,
  ) {}

  afterInit(server: Server) {
    this.realtime.attach(server);
    this.logger.log('Partner realtime gateway ready');
  }

  private broadcastLobbyPresence() {
    this.realtime.emitHomePresence(this.lobbyPresence.snapshot());
  }

  private async enterLobbyAsGuest(client: Socket) {
    client.join('home:lobby');
    client.data.guest = true;
    client.data.inLobby = true;
    const rawGuest = client.handshake.auth?.guestId as string | undefined;
    const guestId =
      (rawGuest ?? '').trim().slice(0, 64) || `anon-${client.id.slice(-8)}`;
    client.data.guestId = guestId;
    client.data.lobbyKey = `guest:${guestId}`;
    this.lobbyPresence.joinGuest(guestId, client.id);
    client.emit('realtime:ready', { guest: true });
    this.broadcastLobbyPresence();
  }

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      const wantLobby = client.handshake.auth?.lobby === true;

      // Guest chỉ dùng cho sảnh trang chủ.
      if (!token) {
        void this.enterLobbyAsGuest(client);
        return;
      }

      const payload = this.jwt.verify<{
        sub: string;
        email: string;
        role: string;
      }>(token);

      client.data.userId = payload.sub;
      client.data.role = payload.role;
      client.join(`partner:${payload.sub}`);
      client.join(`customer:${payload.sub}`);

      if (payload.role === Role.PARTNER || payload.role === Role.ADMIN) {
        client.join('partners:open');
      }

      if (payload.role === Role.ADMIN || payload.role === Role.MODERATOR) {
        client.join('staff:support');
      }

      void this.presence.onConnect(payload.sub, client.id).catch((err) =>
        this.logger.warn(`Presence connect: ${(err as Error).message}`),
      );

      // Chỉ đếm online sảnh khi client trang chủ (auth.lobby=true).
      if (wantLobby) {
        client.data.inLobby = true;
        client.data.lobbyKey = `user:${payload.sub}`;
        client.join('home:lobby');
        void this.lobbyPresence
          .joinUser(payload.sub, client.id)
          .then(() => this.broadcastLobbyPresence())
          .catch((err) =>
            this.logger.warn(`Lobby presence: ${(err as Error).message}`),
          );
      }

      client.emit('realtime:ready', { userId: payload.sub });
    } catch (err) {
      this.logger.warn(`WS auth failed (lobby guest): ${(err as Error).message}`);
      void this.enterLobbyAsGuest(client);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId as string | undefined;
    if (userId) {
      this.presence.onDisconnect(userId, client.id);
      this.logger.debug(`Partner WS disconnect ${userId}`);
    }

    if (client.data?.inLobby) {
      const lobbyKey =
        (client.data?.lobbyKey as string | undefined) ||
        this.lobbyPresence.seatKeyForClient({
          userId,
          guest: Boolean(client.data?.guest),
          guestId: client.data?.guestId as string | undefined,
        });
      this.lobbyPresence.leave(lobbyKey, client.id);
      this.broadcastLobbyPresence();
    }
  }

  @SubscribeMessage('presence:ping')
  async handlePresencePing(
    @ConnectedSocket() client: Socket,
    @MessageBody() _body?: unknown,
  ) {
    const userId = client.data?.userId as string | undefined;
    if (!userId) return { ok: false };
    await this.presence.onHeartbeat(userId);
    return { ok: true, at: Date.now() };
  }

  @SubscribeMessage('lobby:sync')
  handleLobbySync(@ConnectedSocket() client: Socket) {
    if (!client.rooms.has('home:lobby')) {
      client.join('home:lobby');
    }
    return this.lobbyPresence.snapshot();
  }
}
