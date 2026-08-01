import { SupportThreadStatus } from '@prisma/client';
import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PartnerRealtimeService } from '../bookings/partner-realtime.service';
import { CreateSupportMessageDto, UpdateSupportThreadDto } from './dto/support.dto';
export declare class SupportService {
    private readonly prisma;
    private readonly realtime;
    constructor(prisma: PrismaService, realtime: PartnerRealtimeService);
    private shapeMessage;
    private shapeThread;
    getOrCreateMyThread(user: AuthUser): Promise<{
        id: string;
        customerId: string;
        assigneeId: string | null;
        status: import("@prisma/client").$Enums.SupportThreadStatus;
        lastMessageAt: string;
        createdAt: string;
        updatedAt: string;
        customer: {
            id: string;
            fullName: string;
            email: string;
            phone: string | null;
        };
        assignee: {
            id: string;
            fullName: string;
            role: import("@prisma/client").$Enums.Role;
        } | null;
        lastPreview: {
            body: string;
            createdAt: string;
            senderName: string;
            senderRole: import("@prisma/client").$Enums.Role;
        } | null;
        messageCount: number | undefined;
    }>;
    listMyMessages(user: AuthUser): Promise<{
        thread: {
            id: string;
            customerId: string;
            assigneeId: string | null;
            status: import("@prisma/client").$Enums.SupportThreadStatus;
            lastMessageAt: string;
            createdAt: string;
            updatedAt: string;
            customer: {
                id: string;
                fullName: string;
                email: string;
                phone: string | null;
            };
            assignee: {
                id: string;
                fullName: string;
                role: import("@prisma/client").$Enums.Role;
            } | null;
            lastPreview: {
                body: string;
                createdAt: string;
                senderName: string;
                senderRole: import("@prisma/client").$Enums.Role;
            } | null;
            messageCount: number | undefined;
        };
        messages: {
            id: string;
            threadId: string;
            senderId: string;
            body: string;
            redacted: boolean;
            createdAt: string;
            sender: {
                id: string;
                fullName: string;
                role: import("@prisma/client").$Enums.Role;
            };
        }[];
    }>;
    postMyMessage(user: AuthUser, dto: CreateSupportMessageDto): Promise<{
        id: string;
        threadId: string;
        senderId: string;
        body: string;
        redacted: boolean;
        createdAt: string;
        sender: {
            id: string;
            fullName: string;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
    listThreads(status?: SupportThreadStatus): Promise<{
        id: string;
        customerId: string;
        assigneeId: string | null;
        status: import("@prisma/client").$Enums.SupportThreadStatus;
        lastMessageAt: string;
        createdAt: string;
        updatedAt: string;
        customer: {
            id: string;
            fullName: string;
            email: string;
            phone: string | null;
        };
        assignee: {
            id: string;
            fullName: string;
            role: import("@prisma/client").$Enums.Role;
        } | null;
        lastPreview: {
            body: string;
            createdAt: string;
            senderName: string;
            senderRole: import("@prisma/client").$Enums.Role;
        } | null;
        messageCount: number | undefined;
    }[]>;
    listThreadMessages(threadId: string): Promise<{
        thread: {
            id: string;
            customerId: string;
            assigneeId: string | null;
            status: import("@prisma/client").$Enums.SupportThreadStatus;
            lastMessageAt: string;
            createdAt: string;
            updatedAt: string;
            customer: {
                id: string;
                fullName: string;
                email: string;
                phone: string | null;
            };
            assignee: {
                id: string;
                fullName: string;
                role: import("@prisma/client").$Enums.Role;
            } | null;
            lastPreview: {
                body: string;
                createdAt: string;
                senderName: string;
                senderRole: import("@prisma/client").$Enums.Role;
            } | null;
            messageCount: number | undefined;
        };
        messages: {
            id: string;
            threadId: string;
            senderId: string;
            body: string;
            redacted: boolean;
            createdAt: string;
            sender: {
                id: string;
                fullName: string;
                role: import("@prisma/client").$Enums.Role;
            };
        }[];
    }>;
    postStaffMessage(threadId: string, user: AuthUser, dto: CreateSupportMessageDto): Promise<{
        id: string;
        threadId: string;
        senderId: string;
        body: string;
        redacted: boolean;
        createdAt: string;
        sender: {
            id: string;
            fullName: string;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
    updateThread(threadId: string, user: AuthUser, dto: UpdateSupportThreadDto): Promise<{
        id: string;
        customerId: string;
        assigneeId: string | null;
        status: import("@prisma/client").$Enums.SupportThreadStatus;
        lastMessageAt: string;
        createdAt: string;
        updatedAt: string;
        customer: {
            id: string;
            fullName: string;
            email: string;
            phone: string | null;
        };
        assignee: {
            id: string;
            fullName: string;
            role: import("@prisma/client").$Enums.Role;
        } | null;
        lastPreview: {
            body: string;
            createdAt: string;
            senderName: string;
            senderRole: import("@prisma/client").$Enums.Role;
        } | null;
        messageCount: number | undefined;
    }>;
    private createMessage;
}
