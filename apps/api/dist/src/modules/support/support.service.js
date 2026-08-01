"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const contact_privacy_1 = require("../../common/contact-privacy");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const partner_realtime_service_1 = require("../bookings/partner-realtime.service");
const staffRoles = [client_1.Role.ADMIN, client_1.Role.MODERATOR];
function isStaff(role) {
    return staffRoles.includes(role);
}
const senderSelect = {
    id: true,
    fullName: true,
    role: true,
};
let SupportService = class SupportService {
    prisma;
    realtime;
    constructor(prisma, realtime) {
        this.prisma = prisma;
        this.realtime = realtime;
    }
    shapeMessage(row) {
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
    shapeThread(row) {
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
    async getOrCreateMyThread(user) {
        if (isStaff(user.role)) {
            throw new common_1.ForbiddenException('Tài khoản hỗ trợ dùng inbox admin, không tạo thread khách.');
        }
        const existing = await this.prisma.supportThread.findFirst({
            where: { customerId: user.id, status: client_1.SupportThreadStatus.OPEN },
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
        if (existing)
            return this.shapeThread(existing);
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
    async listMyMessages(user) {
        const thread = await this.getOrCreateMyThread(user);
        const rows = await this.prisma.supportMessage.findMany({
            where: { threadId: thread.id },
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: senderSelect } },
        });
        return { thread, messages: rows.map((r) => this.shapeMessage(r)) };
    }
    async postMyMessage(user, dto) {
        if (isStaff(user.role)) {
            throw new common_1.ForbiddenException('Staff gửi tin qua inbox admin.');
        }
        const thread = await this.prisma.supportThread.findFirst({
            where: { customerId: user.id, status: client_1.SupportThreadStatus.OPEN },
        });
        const threadId = thread?.id ??
            (await this.prisma.supportThread.create({
                data: { customerId: user.id },
            })).id;
        return this.createMessage(threadId, user.id, dto.body, user.id);
    }
    async listThreads(status) {
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
    async listThreadMessages(threadId) {
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
        if (!thread)
            throw new common_1.NotFoundException('Không tìm thấy hội thoại');
        const rows = await this.prisma.supportMessage.findMany({
            where: { threadId },
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: senderSelect } },
        });
        return { thread: this.shapeThread(thread), messages: rows.map((r) => this.shapeMessage(r)) };
    }
    async postStaffMessage(threadId, user, dto) {
        if (!isStaff(user.role)) {
            throw new common_1.ForbiddenException('Chỉ admin/moderator được trả lời.');
        }
        const thread = await this.prisma.supportThread.findUnique({
            where: { id: threadId },
        });
        if (!thread)
            throw new common_1.NotFoundException('Không tìm thấy hội thoại');
        if (thread.status === client_1.SupportThreadStatus.CLOSED) {
            throw new common_1.ForbiddenException('Hội thoại đã đóng.');
        }
        if (!thread.assigneeId) {
            await this.prisma.supportThread.update({
                where: { id: threadId },
                data: { assigneeId: user.id },
            });
        }
        return this.createMessage(threadId, user.id, dto.body, thread.customerId);
    }
    async updateThread(threadId, user, dto) {
        if (!isStaff(user.role)) {
            throw new common_1.ForbiddenException('Chỉ admin/moderator được cập nhật.');
        }
        const thread = await this.prisma.supportThread.findUnique({
            where: { id: threadId },
        });
        if (!thread)
            throw new common_1.NotFoundException('Không tìm thấy hội thoại');
        const updated = await this.prisma.supportThread.update({
            where: { id: threadId },
            data: {
                status: dto.status,
                assigneeId: dto.assigneeId === undefined
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
    async createMessage(threadId, senderId, rawBody, customerId) {
        const { text, redacted } = (0, contact_privacy_1.redactContactLeak)(rawBody.trim());
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
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        partner_realtime_service_1.PartnerRealtimeService])
], SupportService);
//# sourceMappingURL=support.service.js.map