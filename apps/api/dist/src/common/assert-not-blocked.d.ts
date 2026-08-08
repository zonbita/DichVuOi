import { PrismaService } from '../database/prisma/prisma.service';
export declare function assertUserNotBlocked(prisma: PrismaService, userId: string): Promise<void>;
