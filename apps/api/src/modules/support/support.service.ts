import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, SupportThreadStatus } from '@prisma/client';
import { redactContactLeak } from '../../common/contact-privacy';
import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PartnerRealtimeService } from '../bookings/partner-realtime.service';
import {
  CreateSupportMessageDto,
  UpdateSupportThreadDto,
} from './dto/support.dto';

const staffRoles: Role[] = [Role.ADMIN, Role.MODERATOR];

function isStaff(role: string) {
  return staffRoles.includes(role as Role);
}

const senderSelect = {
  id: true,
  fullName: true,
  role: true,
} as const;

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: PartnerRealtimeService,
  ) {}

  private shapeMessage(row: {
    id: string;
    threadId: string;
    senderId: string;
    body: string;
    redacted: boolean;
    createdAt: Date;
    sender: { id: string; fullName: string; role: Role };
  }) {
    return {
      id: row.id,
      threadId: row.threadId,
      senderId: row.senderId,
      body: row.body,
      redacted: row.redacted,
      createdAt: row.createdAt.toISOString(),
      sender: {
        id: row.sender.id,
        fullName: row.sender.fullName,
        role: row.sender.role,
      },
    };
  }

  private shapeThread(
    row: {
      id: string;
      customerId: string;
      assigneeId: string | null;
      status: SupportThreadStatus;
      lastMessageAt: Date;
      createdAt: Date;
      updatedAt: Date;
      customer: { id: string; fullName: string; email: string; phone: string | null };
      assignee: { id: string; fullName: string; role: Role } | null;
      messages?: Array<{ body: string; createdAt: Date; sender: { fullName: string; role: Role } }>;
      _count?: { messages: number };
    },
  ) {
    const preview = row.messages?.[0];
    return {
      id: row.id,
      customerId: row.customerId,
      assigneeId: row.assigneeId,
      status: row.status,
      lastMessageAt: row.lastMessageAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      customer: row.customer,
      assignee: row.assignee
        ? {
            id: row.assignee.id,
            fullName: row.assignee.fullName,
            role: row.assignee.role,
          }
        : null,
      lastPreview: preview
        ? {
            body: preview.body,
            createdAt: preview.createdAt.toISOString(),
            senderName: preview.sender.fullName,
            senderRole: preview.sender.role,
          }
        : null,
      messageCount: row._count?.messages ?? undefined,
    };
  }

  /** Khách (hoặc partner dùng tư cách user) — lấy / tạo thread OPEN. */
  async getOrCreateMyThread(user: AuthUser) {
    if (isStaff(user.role)) {
      throw new ForbiddenException(
        'Tài khoản hỗ trợ dùng inbox admin, không tạo thread khách.',
      );
    }

    const existing = await this.prisma.supportThread.findFirst({
      where: { customerId: user.id, status: SupportThreadStatus.OPEN },
      include: {
        customer: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        assignee: { select: { id: true, fullName: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { fullName: true, role: true } } },
        },
        _count: { select: { messages: true } },
      },
    });
    if (existing) return this.shapeThread(existing);

    const created = await this.prisma.supportThread.create({
      data: { customerId: user.id },
      include: {
        customer: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        assignee: { select: { id: true, fullName: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { fullName: true, role: true } } },
        },
        _count: { select: { messages: true } },
      },
    });
    return this.shapeThread(created);
  }

  async listMyMessages(user: AuthUser) {
    const thread = await this.getOrCreateMyThread(user);
    const rows = await this.prisma.supportMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: senderSelect } },
    });
    return { thread, messages: rows.map((r) => this.shapeMessage(r)) };
  }

  async postMyMessage(user: AuthUser, dto: CreateSupportMessageDto) {
    if (isStaff(user.role)) {
      throw new ForbiddenException('Staff gửi tin qua inbox admin.');
    }
    const thread = await this.prisma.supportThread.findFirst({
      where: { customerId: user.id, status: SupportThreadStatus.OPEN },
    });
    const threadId =
      thread?.id ??
      (
        await this.prisma.supportThread.create({
          data: { customerId: user.id },
        })
      ).id;

    return this.createMessage(threadId, user.id, dto.body, user.id);
  }

  async listThreads(status?: SupportThreadStatus) {
    const rows = await this.prisma.supportThread.findMany({
      where: status ? { status } : undefined,
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
      include: {
        customer: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        assignee: { select: { id: true, fullName: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { fullName: true, role: true } } },
        },
        _count: { select: { messages: true } },
      },
    });
    return rows.map((r) => this.shapeThread(r));
  }

  async listThreadMessages(threadId: string) {
    const thread = await this.prisma.supportThread.findUnique({
      where: { id: threadId },
      include: {
        customer: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        assignee: { select: { id: true, fullName: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { fullName: true, role: true } } },
        },
        _count: { select: { messages: true } },
      },
    });
    if (!thread) throw new NotFoundException('Không tìm thấy hội thoại');

    const rows = await this.prisma.supportMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: senderSelect } },
    });
    return { thread: this.shapeThread(thread), messages: rows.map((r) => this.shapeMessage(r)) };
  }

  async postStaffMessage(
    threadId: string,
    user: AuthUser,
    dto: CreateSupportMessageDto,
  ) {
    if (!isStaff(user.role)) {
      throw new ForbiddenException('Chỉ admin/moderator được trả lời.');
    }
    const thread = await this.prisma.supportThread.findUnique({
      where: { id: threadId },
    });
    if (!thread) throw new NotFoundException('Không tìm thấy hội thoại');
    if (thread.status === SupportThreadStatus.CLOSED) {
      throw new ForbiddenException('Hội thoại đã đóng.');
    }

    if (!thread.assigneeId) {
      await this.prisma.supportThread.update({
        where: { id: threadId },
        data: { assigneeId: user.id },
      });
    }

    return this.createMessage(threadId, user.id, dto.body, thread.customerId);
  }

  async updateThread(
    threadId: string,
    user: AuthUser,
    dto: UpdateSupportThreadDto,
  ) {
    if (!isStaff(user.role)) {
      throw new ForbiddenException('Chỉ admin/moderator được cập nhật.');
    }
    const thread = await this.prisma.supportThread.findUnique({
      where: { id: threadId },
    });
    if (!thread) throw new NotFoundException('Không tìm thấy hội thoại');

    const updated = await this.prisma.supportThread.update({
      where: { id: threadId },
      data: {
        status: dto.status as SupportThreadStatus | undefined,
        assigneeId:
          dto.assigneeId === undefined
            ? undefined
            : dto.assigneeId || null,
      },
      include: {
        customer: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        assignee: { select: { id: true, fullName: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { fullName: true, role: true } } },
        },
        _count: { select: { messages: true } },
      },
    });
    return this.shapeThread(updated);
  }

  private async createMessage(
    threadId: string,
    senderId: string,
    rawBody: string,
    customerId: string,
  ) {
    const { text, redacted } = redactContactLeak(rawBody.trim());
    const [message] = await this.prisma.$transaction([
      this.prisma.supportMessage.create({
        data: {
          threadId,
          senderId,
          body: text,
          redacted,
        },
        include: { sender: { select: senderSelect } },
      }),
      this.prisma.supportThread.update({
        where: { id: threadId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    const shaped = this.shapeMessage(message);
    this.realtime.emitSupportMessage(customerId, shaped);
    return shaped;
  }
}
