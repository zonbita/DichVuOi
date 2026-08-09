import { PrismaService } from '../../database/prisma/prisma.service';
export type LobbyViewerPublic = {
    key: string;
    fullName: string;
    avatarUrl: string | null;
    userId: string | null;
    isGuest: boolean;
};
export declare class LobbyPresenceService {
    private readonly prisma;
    private readonly seats;
    constructor(prisma: PrismaService);
    joinUser(userId: string, socketId: string): Promise<void>;
    joinGuest(guestId: string | undefined, socketId: string): void;
    leave(key: string | undefined, socketId: string): void;
    seatKeyForClient(data: {
        userId?: string;
        guest?: boolean;
        guestId?: string;
    }): string | undefined;
    snapshot(): {
        onlineCount: number;
        viewers: LobbyViewerPublic[];
    };
}
