import { SupportThreadStatus } from '@prisma/client';
import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { CreateSupportMessageDto, UpdateSupportThreadDto } from './dto/support.dto';
import { SupportService } from './support.service';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    listMine(user: AuthUser): Promise<{
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
    postMine(user: AuthUser, dto: CreateSupportMessageDto): Promise<{
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
    getThread(id: string): Promise<{
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
    postStaff(user: AuthUser, id: string, dto: CreateSupportMessageDto): Promise<{
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
    updateThread(user: AuthUser, id: string, dto: UpdateSupportThreadDto): Promise<{
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
}
