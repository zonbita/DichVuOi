import { PrismaService } from '../../database/prisma/prisma.service';
export declare class PartnerPresenceService {
    private readonly prisma;
    private readonly logger;
    private readonly sessions;
    constructor(prisma: PrismaService);
    onConnect(userId: string, socketId: string): Promise<void>;
    onDisconnect(userId: string, socketId: string): void;
    onHeartbeat(userId: string): Promise<void>;
    private flushAndEnd;
    private creditElapsed;
}
