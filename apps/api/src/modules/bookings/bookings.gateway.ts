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
import { PartnerPresenceService } from './partner-presence.service';
import { PartnerRealtimeService } from './partner-realtime.service';

@WebSocketGateway({
  namespace: '/partner-realtime',
  cors: {
    origin: true,
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
  ) {}

  afterInit(server: Server) {
    this.realtime.attach(server);
    this.logger.log('Partner realtime gateway ready');
  }

  handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ||
        (typeof client.handshake.query?.token === 'string'
          ? client.handshake.query.token
          : undefined);

      if (!token) {
        client.disconnect(true);
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

      client.emit('realtime:ready', { userId: payload.sub });
    } catch (err) {
      this.logger.warn(`WS auth failed: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId as string | undefined;
    if (userId) {
      this.presence.onDisconnect(userId, client.id);
      this.logger.debug(`Partner WS disconnect ${userId}`);
    }
  }

  @SubscribeMessage('presence:ping')
  async handlePresencePing(@ConnectedSocket() client: Socket, @MessageBody() _body?: unknown) {
    const userId = client.data?.userId as string | undefined;
    if (!userId) return { ok: false };
    await this.presence.onHeartbeat(userId);
    return { ok: true, at: Date.now() };
  }
}
