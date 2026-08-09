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
exports.HomeLobbyService = exports.LOBBY_SMILES = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const assert_not_blocked_1 = require("../../common/assert-not-blocked");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const partner_realtime_service_1 = require("../bookings/partner-realtime.service");
const SHOUT_COOLDOWN_MS = 90_000;
const FEED_MAX = 40;
const REACTION_COOLDOWN_MS = 280;
const REACTION_BURST_WINDOW_MS = 10_000;
const REACTION_BURST_MAX = 24;
exports.LOBBY_SMILES = ['❤️', '🔥', '👏', '😂', '😍', '🎉', '💯', '🫶'];
function normalizeSmile(raw) {
    return raw
        .trim()
        .replace(/\uFE0F/g, '')
        .normalize('NFC');
}
const LOBBY_SMILE_SET = new Set(exports.LOBBY_SMILES.map((emoji) => normalizeSmile(emoji)));
const KIND_LABEL = {
    GREETING: 'Chào dịch vụ',
    AVAILABLE: 'Đang nhận việc',
    PROMO: 'Ưu đãi',
    LOOKING: 'Còn slot',
    THANKS: 'Cảm ơn khách',
};
function buildMessage(kind, serviceName, title) {
    const label = title.trim() || serviceName;
    switch (kind) {
        case client_1.HomeShoutKind.GREETING:
            return `Xin chào — mình nhận việc «${label}»`;
        case client_1.HomeShoutKind.AVAILABLE:
            return `Đang online, sẵn sàng nhận «${label}»`;
        case client_1.HomeShoutKind.PROMO:
            return `Ưu đãi hôm nay cho «${label}»`;
        case client_1.HomeShoutKind.LOOKING:
            return `Còn slot gần đây · «${label}»`;
        case client_1.HomeShoutKind.THANKS:
            return `Cảm ơn khách vừa hoàn thành · «${label}»`;
        default:
            return `Quảng cáo «${label}»`;
    }
}
let HomeLobbyService = class HomeLobbyService {
    prisma;
    realtime;
    reactionHits = new Map();
    constructor(prisma, realtime) {
        this.prisma = prisma;
        this.realtime = realtime;
    }
    shape(row) {
        const serviceName = row.servicePost.service.name;
        const title = row.servicePost.title;
        return {
            id: row.id,
            kind: row.kind,
            kindLabel: KIND_LABEL[row.kind],
            message: buildMessage(row.kind, serviceName, title),
            createdAt: row.createdAt.toISOString(),
            user: {
                id: row.user.id,
                fullName: row.user.fullName,
                avatarUrl: row.user.partnerProfile?.avatarUrl ?? null,
                level: row.user.partnerProfile?.level ?? 1,
                acceptingJobs: row.user.partnerProfile?.acceptingJobs ?? false,
            },
            servicePost: {
                id: row.servicePost.id,
                title,
                serviceName,
                serviceSlug: row.servicePost.service.slug,
                href: `/user/${row.user.id}/dich-vu/${row.servicePost.id}`,
                profileHref: `/user/${row.user.id}`,
            },
        };
    }
    async listFeed(limit = 24) {
        const take = Math.min(Math.max(Math.floor(limit) || 24, 1), FEED_MAX);
        const rows = await this.prisma.homeShout.findMany({
            orderBy: { createdAt: 'desc' },
            take,
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        partnerProfile: {
                            select: {
                                avatarUrl: true,
                                level: true,
                                acceptingJobs: true,
                            },
                        },
                    },
                },
                servicePost: {
                    select: {
                        id: true,
                        title: true,
                        service: { select: { id: true, slug: true, name: true } },
                    },
                },
            },
        });
        return {
            items: rows.map((row) => this.shape(row)),
            kinds: Object.keys(KIND_LABEL).map((kind) => ({
                kind,
                label: KIND_LABEL[kind],
            })),
            smiles: [...exports.LOBBY_SMILES],
        };
    }
    async react(dto, opts) {
        const emojiRaw = (dto.emoji ?? '').trim();
        const emojiKey = normalizeSmile(emojiRaw);
        if (!LOBBY_SMILE_SET.has(emojiKey)) {
            throw new common_1.BadRequestException('Emoji không thuộc bộ smile cho phép');
        }
        const emoji = exports.LOBBY_SMILES.find((item) => normalizeSmile(item) === emojiKey) ?? emojiRaw;
        const actorKey = opts?.userId ||
            (dto.guestId?.trim() ? `guest:${dto.guestId.trim().slice(0, 64)}` : null);
        if (!actorKey) {
            throw new common_1.BadRequestException('Thiếu guestId khi chưa đăng nhập');
        }
        const now = Date.now();
        const hit = this.reactionHits.get(actorKey) ?? {
            lastAt: 0,
            windowStart: now,
            count: 0,
        };
        if (now - hit.lastAt < REACTION_COOLDOWN_MS) {
            throw new common_1.BadRequestException('Bấm chậm lại một chút');
        }
        if (now - hit.windowStart > REACTION_BURST_WINDOW_MS) {
            hit.windowStart = now;
            hit.count = 0;
        }
        if (hit.count >= REACTION_BURST_MAX) {
            throw new common_1.BadRequestException('Quá nhiều smile — thử lại sau vài giây');
        }
        hit.lastAt = now;
        hit.count += 1;
        this.reactionHits.set(actorKey, hit);
        if (opts?.userId) {
            await (0, assert_not_blocked_1.assertUserNotBlocked)(this.prisma, opts.userId);
        }
        const payload = {
            id: `rx-${now}-${Math.random().toString(36).slice(2, 8)}`,
            emoji,
            at: new Date(now).toISOString(),
            fromName: opts?.displayName?.trim() || null,
            userId: opts?.userId ?? null,
        };
        this.realtime.emitHomeReaction(payload);
        return payload;
    }
    async create(userId, dto) {
        await (0, assert_not_blocked_1.assertUserNotBlocked)(this.prisma, userId);
        const profile = await this.prisma.partnerProfile.findUnique({
            where: { userId },
            select: { id: true, acceptingJobs: true },
        });
        if (!profile) {
            throw new common_1.ForbiddenException('Cần mở hồ sơ người làm và có bài dịch vụ đã duyệt để hô trên sảnh');
        }
        const post = await this.prisma.partnerServicePost.findFirst({
            where: {
                id: dto.servicePostId,
                partnerProfileId: profile.id,
                status: client_1.PartnerServicePostStatus.APPROVED,
            },
            select: {
                id: true,
                title: true,
                service: { select: { id: true, slug: true, name: true } },
            },
        });
        if (!post) {
            throw new common_1.NotFoundException('Chỉ quảng cáo được bài dịch vụ đã duyệt của chính bạn');
        }
        const latest = await this.prisma.homeShout.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
        });
        if (latest) {
            const waitMs = SHOUT_COOLDOWN_MS - (Date.now() - latest.createdAt.getTime());
            if (waitMs > 0) {
                throw new common_1.BadRequestException(`Chờ thêm ${Math.ceil(waitMs / 1000)} giây trước khi hô tiếp`);
            }
        }
        const created = await this.prisma.homeShout.create({
            data: {
                userId,
                servicePostId: post.id,
                kind: dto.kind,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        partnerProfile: {
                            select: {
                                avatarUrl: true,
                                level: true,
                                acceptingJobs: true,
                            },
                        },
                    },
                },
                servicePost: {
                    select: {
                        id: true,
                        title: true,
                        service: { select: { id: true, slug: true, name: true } },
                    },
                },
            },
        });
        const shaped = this.shape(created);
        this.realtime.emitHomeShout(shaped);
        return shaped;
    }
};
exports.HomeLobbyService = HomeLobbyService;
exports.HomeLobbyService = HomeLobbyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        partner_realtime_service_1.PartnerRealtimeService])
], HomeLobbyService);
//# sourceMappingURL=home-lobby.service.js.map