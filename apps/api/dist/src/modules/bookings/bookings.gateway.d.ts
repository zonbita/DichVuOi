import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PartnerPresenceService } from './partner-presence.service';
import { PartnerRealtimeService } from './partner-realtime.service';
export declare class BookingsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwt;
    private readonly realtime;
    private readonly presence;
    private readonly logger;
    server: Server;
    constructor(jwt: JwtService, realtime: PartnerRealtimeService, presence: PartnerPresenceService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handlePresencePing(client: Socket, _body?: unknown): Promise<{
        ok: boolean;
        at?: undefined;
    } | {
        ok: boolean;
        at: number;
    }>;
}
