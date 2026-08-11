import { PrismaService } from '../../database/prisma/prisma.service';
import { PartnerRealtimeService } from '../bookings/partner-realtime.service';
import { CreateHomeShoutDto } from './dto/create-home-shout.dto';
import { CreateHomeReactionDto } from './dto/create-home-reaction.dto';
export declare const LOBBY_SMILES: readonly [":)", ":))", ":)))", ":D", "=))", ";)", ":P", ":*", "<3", ":(", ":((", ":'(", ":o", ":/", ":|", "B)", ":v", ":3", "3:)", "O:)", "@@", "-_-", "^_^", "T_T", ":x"];
export declare class HomeLobbyService {
    private readonly prisma;
    private readonly realtime;
    private readonly reactionHits;
    constructor(prisma: PrismaService, realtime: PartnerRealtimeService);
    private shape;
    listFeed(limit?: number): Promise<{
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
        smiles: (":))" | ":)" | ":)))" | ":D" | "=))" | ";)" | ":P" | ":*" | "<3" | ":(" | ":((" | ":'(" | ":o" | ":/" | ":|" | "B)" | ":v" | ":3" | "3:)" | "O:)" | "@@" | "-_-" | "^_^" | "T_T" | ":x")[];
    }>;
    react(dto: CreateHomeReactionDto, opts?: {
        userId?: string;
        displayName?: string;
    }): Promise<{
        id: string;
        emoji: string;
        at: string;
        fromName: string | null;
        userId: string | null;
    }>;
    create(userId: string, dto: CreateHomeShoutDto): Promise<{
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
}
