import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  HomeShoutKind,
  PartnerServicePostStatus,
} from '@prisma/client';
import { assertUserNotBlocked } from '../../common/assert-not-blocked';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PartnerRealtimeService } from '../bookings/partner-realtime.service';
import { CreateHomeShoutDto } from './dto/create-home-shout.dto';
import { CreateHomeReactionDto } from './dto/create-home-reaction.dto';

const SHOUT_COOLDOWN_MS = 90_000;
const FEED_MAX = 40;
const REACTION_COOLDOWN_MS = 280;
const REACTION_BURST_WINDOW_MS = 10_000;
const REACTION_BURST_MAX = 24;

/** Smile Facebook dạng chữ — bấm chat `:))` lên sảnh. */
export const LOBBY_SMILES = [
  ':)',
  ':))',
  ':)))',
  ':D',
  '=))',
  ';)',
  ':P',
  ':*',
  '<3',
  ':(',
  ':((',
  ":'(",
  ':o',
  ':/',
  ':|',
  'B)',
  ':v',
  ':3',
  '3:)',
  'O:)',
  '@@',
  '-_-',
  '^_^',
  'T_T',
  ':x',
] as const;

function normalizeSmile(raw: string) {
  return raw
    .trim()
    .replace(/\uFE0F/g, '') // bỏ variation selector
    .normalize('NFC');
}

const LOBBY_SMILE_SET = new Set(
  LOBBY_SMILES.map((emoji) => normalizeSmile(emoji)),
);

const KIND_LABEL: Record<HomeShoutKind, string> = {
  GREETING: 'Chào dịch vụ',
  AVAILABLE: 'Đang nhận việc',
  PROMO: 'Ưu đãi',
  LOOKING: 'Còn slot',
  THANKS: 'Cảm ơn khách',
};

function buildMessage(kind: HomeShoutKind, serviceName: string, title: string) {
  const label = title.trim() || serviceName;
  switch (kind) {
    case HomeShoutKind.GREETING:
      return `Xin chào — mình nhận việc «${label}»`;
    case HomeShoutKind.AVAILABLE:
      return `Đang online, sẵn sàng nhận «${label}»`;
    case HomeShoutKind.PROMO:
      return `Ưu đãi hôm nay cho «${label}»`;
    case HomeShoutKind.LOOKING:
      return `Còn slot gần đây · «${label}»`;
    case HomeShoutKind.THANKS:
      return `Cảm ơn khách vừa hoàn thành · «${label}»`;
    default:
      return `Quảng cáo «${label}»`;
  }
}

@Injectable()
export class HomeLobbyService {
  /** rate-limit smile theo user/guest (ephemeral). */
  private readonly reactionHits = new Map<
    string,
    { lastAt: number; windowStart: number; count: number }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: PartnerRealtimeService,
  ) {}

  private shape(row: {
    id: string;
    kind: HomeShoutKind;
    createdAt: Date;
    user: {
      id: string;
      fullName: string;
      partnerProfile: {
        avatarUrl: string | null;
        level: number;
        acceptingJobs: boolean;
      } | null;
    };
    servicePost: {
      id: string;
      title: string;
      service: {
        id: string;
        slug: string;
        name: string;
        category: {
          group: { slug: string };
        } | null;
      };
    };
  }) {
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
        groupSlug: row.servicePost.service.category?.group.slug ?? null,
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
            service: {
              select: {
                id: true,
                slug: true,
                name: true,
                category: { select: { group: { select: { slug: true } } } },
              },
            },
          },
        },
      },
    });
    return {
      items: rows.map((row) => this.shape(row)),
      kinds: (Object.keys(KIND_LABEL) as HomeShoutKind[]).map((kind) => ({
        kind,
        label: KIND_LABEL[kind],
      })),
      smiles: [...LOBBY_SMILES],
    };
  }

  /**
   * Smile livestream — ai cũng bấm được (login hoặc guestId).
   * Không lưu DB; phát realtime rồi hết.
   */
  async react(
    dto: CreateHomeReactionDto,
    opts?: { userId?: string; displayName?: string },
  ) {
    const emojiRaw = (dto.emoji ?? '').trim();
    const emojiKey = normalizeSmile(emojiRaw);
    if (!LOBBY_SMILE_SET.has(emojiKey)) {
      throw new BadRequestException('Emoji không thuộc bộ smile cho phép');
    }
    const emoji =
      LOBBY_SMILES.find((item) => normalizeSmile(item) === emojiKey) ?? emojiRaw;

    const actorKey =
      opts?.userId ||
      (dto.guestId?.trim() ? `guest:${dto.guestId.trim().slice(0, 64)}` : null);
    if (!actorKey) {
      throw new BadRequestException('Thiếu guestId khi chưa đăng nhập');
    }

    const now = Date.now();
    const hit = this.reactionHits.get(actorKey) ?? {
      lastAt: 0,
      windowStart: now,
      count: 0,
    };
    if (now - hit.lastAt < REACTION_COOLDOWN_MS) {
      throw new BadRequestException('Bấm chậm lại một chút');
    }
    if (now - hit.windowStart > REACTION_BURST_WINDOW_MS) {
      hit.windowStart = now;
      hit.count = 0;
    }
    if (hit.count >= REACTION_BURST_MAX) {
      throw new BadRequestException('Quá nhiều smile — thử lại sau vài giây');
    }
    hit.lastAt = now;
    hit.count += 1;
    this.reactionHits.set(actorKey, hit);

    if (opts?.userId) {
      await assertUserNotBlocked(this.prisma, opts.userId);
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

  async create(userId: string, dto: CreateHomeShoutDto) {
    await assertUserNotBlocked(this.prisma, userId);

    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      select: { id: true, acceptingJobs: true },
    });
    if (!profile) {
      throw new ForbiddenException(
        'Cần mở hồ sơ người làm và có bài dịch vụ đã duyệt để hô trên sảnh',
      );
    }

    const post = await this.prisma.partnerServicePost.findFirst({
      where: {
        id: dto.servicePostId,
        partnerProfileId: profile.id,
        status: PartnerServicePostStatus.APPROVED,
      },
      select: {
        id: true,
        title: true,
        service: { select: { id: true, slug: true, name: true } },
      },
    });
    if (!post) {
      throw new NotFoundException(
        'Chỉ quảng cáo được bài dịch vụ đã duyệt của chính bạn',
      );
    }

    const latest = await this.prisma.homeShout.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (latest) {
      const waitMs =
        SHOUT_COOLDOWN_MS - (Date.now() - latest.createdAt.getTime());
      if (waitMs > 0) {
        throw new BadRequestException(
          `Chờ thêm ${Math.ceil(waitMs / 1000)} giây trước khi hô tiếp`,
        );
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
            service: {
              select: {
                id: true,
                slug: true,
                name: true,
                category: { select: { group: { select: { slug: true } } } },
              },
            },
          },
        },
      },
    });

    const shaped = this.shape(created);
    this.realtime.emitHomeShout(shaped);
    return shaped;
  }
}
