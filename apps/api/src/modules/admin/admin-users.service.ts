import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  AdminPageQueryDto,
  AdminUpdateUserDto,
  AdminUserQueryDto,
} from './dto';
import { paginated, resolvePage } from './admin-pagination';

/** Users, moderation (reviews, flagged chat) and audit log. */
@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(query: AdminUserQueryDto) {
    const page = resolvePage(query);
    const q = query.q?.trim();

    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          createdAt: true,
          partnerProfile: {
            select: {
              id: true,
              isVerified: true,
              ratingAvg: true,
              ratingCount: true,
              acceptingJobs: true,
              level: true,
            },
          },
          _count: {
            select: {
              customerBookings: true,
              partnerBookings: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginated(items, total, page);
  }

  async updateUser(id: string, dto: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy user');
    if (dto.role === undefined && dto.chatBanned === undefined) {
      throw new BadRequestException('Thiếu trường cập nhật');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.chatBanned !== undefined ? { chatBanned: dto.chatBanned } : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isBlocked: true,
        chatBanned: true,
        createdAt: true,
      },
    });

    return updated;
  }

  async writeAudit(input: {
    actorId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    meta?: Record<string, unknown>;
  }) {
    return this.prisma.adminAuditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metaJson: input.meta ? JSON.stringify(input.meta) : null,
      },
    });
  }

  async listAuditLogs(query: AdminPageQueryDto) {
    const page = resolvePage(query);
    const q = query.q?.trim();
    const where: Prisma.AdminAuditLogWhereInput = q
      ? {
          OR: [
            { action: { contains: q } },
            { targetType: { contains: q } },
            { targetId: { contains: q } },
            { actor: { fullName: { contains: q } } },
            { actor: { email: { contains: q } } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        where,
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, fullName: true, email: true } },
        },
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return paginated(
      items.map((row) => ({
        id: row.id,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId,
        meta: row.metaJson
          ? (JSON.parse(row.metaJson) as Record<string, unknown>)
          : null,
        createdAt: row.createdAt,
        actor: row.actor,
      })),
      total,
      page,
    );
  }

  async listReviews(query: AdminPageQueryDto) {
    const page = resolvePage(query);
    const q = query.q?.trim();

    const where: Prisma.ReviewWhereInput = q
      ? {
          OR: [
            { comment: { contains: q } },
            { fromUser: { fullName: { contains: q } } },
            { toUser: { fullName: { contains: q } } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: {
          fromUser: { select: { id: true, fullName: true, email: true } },
          toUser: { select: { id: true, fullName: true, email: true } },
          booking: {
            select: {
              id: true,
              status: true,
              service: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return paginated(items, total, page);
  }

  async listFlaggedMessages(query: AdminPageQueryDto) {
    const page = resolvePage(query);
    const q = query.q?.trim();

    const where: Prisma.BookingMessageWhereInput = {
      redacted: true,
      ...(q
        ? {
            OR: [
              { body: { contains: q } },
              { sender: { fullName: { contains: q } } },
              { sender: { email: { contains: q } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.bookingMessage.findMany({
        where,
        skip: page.skip,
        take: page.take,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              email: true,
              chatBanned: true,
            },
          },
          booking: {
            select: {
              id: true,
              status: true,
              service: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.bookingMessage.count({ where }),
    ]);

    return paginated(items, total, page);
  }
}
