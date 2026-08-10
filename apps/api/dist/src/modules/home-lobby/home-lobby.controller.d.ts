import { JwtService } from '@nestjs/jwt';
import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateHomeReactionDto } from './dto/create-home-reaction.dto';
import { CreateHomeShoutDto } from './dto/create-home-shout.dto';
import { HomeLobbyService } from './home-lobby.service';
import { LobbyPresenceService } from './lobby-presence.service';
export declare class HomeLobbyController {
    private readonly homeLobby;
    private readonly jwt;
    private readonly prisma;
    private readonly lobbyPresence;
    constructor(homeLobby: HomeLobbyService, jwt: JwtService, prisma: PrismaService, lobbyPresence: LobbyPresenceService);
    list(limit?: string): Promise<{
        items: {
            id: string;
            kind: import("@prisma/client").$Enums.HomeShoutKind;
            kindLabel: string;
            message: string;
            createdAt: string;
            user: {
                id: string;
                fullName: string;
                avatarUrl: string | null;
                level: number;
                acceptingJobs: boolean;
            };
            servicePost: {
                id: string;
                title: string;
                serviceName: string;
                serviceSlug: string;
                groupSlug: string | null;
                href: string;
                profileHref: string;
            };
        }[];
        kinds: {
            kind: import("@prisma/client").$Enums.HomeShoutKind;
            label: string;
        }[];
        smiles: ("❤️" | "🔥" | "👏" | "😂" | "😍" | "🎉" | "💯" | "🫶")[];
    }>;
    presence(): {
        onlineCount: number;
        viewers: import("./lobby-presence.service").LobbyViewerPublic[];
    };
    create(user: AuthUser, dto: CreateHomeShoutDto): Promise<{
        id: string;
        kind: import("@prisma/client").$Enums.HomeShoutKind;
        kindLabel: string;
        message: string;
        createdAt: string;
        user: {
            id: string;
            fullName: string;
            avatarUrl: string | null;
            level: number;
            acceptingJobs: boolean;
        };
        servicePost: {
            id: string;
            title: string;
            serviceName: string;
            serviceSlug: string;
            groupSlug: string | null;
            href: string;
            profileHref: string;
        };
    }>;
    react(dto: CreateHomeReactionDto, authorization?: string): Promise<{
        id: string;
        emoji: string;
        at: string;
        fromName: string | null;
        userId: string | null;
    }>;
}
