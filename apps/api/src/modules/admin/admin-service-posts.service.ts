import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PartnerServicePostStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  AdminPageQueryDto,
  AdminReviewServicePostDto,
  AdminServicePostQueryDto,
} from './dto';
import { paginated, resolvePage } from './admin-pagination';

/** Partner service-post moderation queue. */
@Injectable()
export class AdminServicePostsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Người làm đang có ≥1 bài chờ duyệt — hàng chờ admin. */
  async listServicePostQueue(query: AdminPageQueryDto) {
    const page = resolvePage(query);
    const q = query.q?.trim();

    const pendingWhere: Prisma.PartnerServicePostWhereInput = {
      status: PartnerServicePostStatus.PENDING,
      ...(q
        ? {
            OR: [
              {
                partnerProfile: {
                  user: {
                    OR: [
                      { fullName: { contains: q } },
                      { email: { contains: q } },
                    ],
                  },
                },
              },
              { title: { contains: q } },
              { service: { name: { contains: q } } },
            ],
          }
        : {}),
    };

    const grouped = await this.prisma.partnerServicePost.groupBy({
      by: ['partnerProfileId'],
      where: pendingWhere,
      _count: { _all: true },
      _min: { createdAt: true },
      orderBy: { _min: { createdAt: 'asc' } },
      skip: page.skip,
      take: page.take,
    });

    const totalGroups = await this.prisma.partnerServicePost.groupBy({
      by: ['partnerProfileId'],
      where: pendingWhere,
    });

    const profileIds = grouped.map((g) => g.partnerProfileId);
    const profiles = await this.prisma.partnerProfile.findMany({
      where: { id: { in: profileIds } },
      select: {
        id: true,
        userId: true,
        avatarUrl: true,
        level: true,
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
    const profileById = new Map(profiles.map((p) => [p.id, p]));

    const pendingPosts = await this.prisma.partnerServicePost.findMany({
      where: {
        partnerProfileId: { in: profileIds },
        status: PartnerServicePostStatus.PENDING,
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        partnerProfileId: true,
        service: { select: { name: true } },
      },
    });

    const postsByProfile = new Map<string, typeof pendingPosts>();
    for (const post of pendingPosts) {
      const list = postsByProfile.get(post.partnerProfileId) ?? [];
      list.push(post);
      postsByProfile.set(post.partnerProfileId, list);
    }

    const items = grouped.map((g) => {
      const profile = profileById.get(g.partnerProfileId);
      const posts = postsByProfile.get(g.partnerProfileId) ?? [];
      return {
        partnerProfileId: g.partnerProfileId,
        userId: profile?.userId ?? '',
        fullName: profile?.user.fullName ?? '—',
        email: profile?.user.email ?? '',
        avatarUrl: profile?.avatarUrl ?? null,
        level: profile?.level ?? 1,
        pendingCount: g._count._all,
        oldestPendingAt: g._min.createdAt,
        /** Bài chờ cũ nhất — dùng làm đích khi bấm vào người. */
        firstPostId: posts[0]?.id ?? null,
        posts: posts.map((p) => ({
          id: p.id,
          title: p.title,
          serviceName: p.service.name,
          createdAt: p.createdAt,
        })),
      };
    });

    return paginated(items, totalGroups.length, page);
  }

  /** Chi tiết bài cho admin duyệt (mọi status). */
  async getServicePostDetail(id: string) {
    const item = await this.prisma.partnerServicePost.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            slug: true,
            name: true,
            unit: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                group: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
        partnerProfile: {
          select: {
            id: true,
            userId: true,
            headline: true,
            city: true,
            responseMinutes: true,
            ratingAvg: true,
            ratingCount: true,
            level: true,
            isVerified: true,
            phoneVerified: true,
            bankVerified: true,
            avatarUrl: true,
            acceptingJobs: true,
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });
    if (!item) throw new NotFoundException('Không tìm thấy bài đăng');

    let images: string[] = [];
    if (item.imagesJson) {
      try {
        const parsed = JSON.parse(item.imagesJson) as unknown;
        if (Array.isArray(parsed)) {
          images = parsed.filter((u): u is string => typeof u === 'string');
        }
      } catch {
        /* ignore */
      }
    }
    if (!images.length && item.coverUrl) images = [item.coverUrl];

    const offering = await this.prisma.partnerService.findFirst({
      where: {
        partnerProfileId: item.partnerProfileId,
        serviceId: item.serviceId,
        isActive: true,
      },
      select: {
        id: true,
        price: true,
        headline: true,
        experienceYears: true,
        includes: true,
        excludes: true,
        coverageNote: true,
      },
    });

    const siblingPending = await this.prisma.partnerServicePost.findMany({
      where: {
        partnerProfileId: item.partnerProfileId,
        status: PartnerServicePostStatus.PENDING,
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        service: { select: { name: true } },
      },
    });

    return {
      post: {
        id: item.id,
        title: item.title,
        body: item.body,
        coverUrl: images[0] ?? item.coverUrl,
        images,
        serviceId: item.serviceId,
        status: item.status,
        rejectReason: item.rejectReason,
        reviewedAt: item.reviewedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        service: item.service,
      },
      seller: {
        userId: item.partnerProfile.userId,
        fullName: item.partnerProfile.user.fullName,
        email: item.partnerProfile.user.email,
        headline: item.partnerProfile.headline,
        city: item.partnerProfile.city,
        avatarUrl: item.partnerProfile.avatarUrl,
        level: item.partnerProfile.level,
        isVerified: item.partnerProfile.isVerified,
        phoneVerified: item.partnerProfile.phoneVerified,
        bankVerified: item.partnerProfile.bankVerified,
        ratingAvg: item.partnerProfile.ratingAvg,
        ratingCount: item.partnerProfile.ratingCount,
        responseMinutes: item.partnerProfile.responseMinutes,
        acceptingJobs: item.partnerProfile.acceptingJobs,
      },
      offering: offering
        ? {
            id: offering.id,
            price: offering.price,
            headline: offering.headline,
            experienceYears: offering.experienceYears,
            includes: offering.includes,
            excludes: offering.excludes,
            coverageNote: offering.coverageNote,
            unit: item.service.unit,
          }
        : null,
      siblingPending: siblingPending.map((p) => ({
        id: p.id,
        title: p.title,
        serviceName: p.service.name,
      })),
    };
  }

  async listServicePosts(query: AdminServicePostQueryDto) {
    const page = resolvePage(query);
    const q = query.q?.trim();
    const status = query.status;

    const where: Prisma.PartnerServicePostWhereInput = {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { body: { contains: q } },
              {
                partnerProfile: {
                  user: {
                    OR: [
                      { fullName: { contains: q } },
                      { email: { contains: q } },
                    ],
                  },
                },
              },
              { service: { name: { contains: q } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.partnerServicePost.findMany({
        where,
        skip: page.skip,
        take: page.take,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: {
          service: {
            select: {
              id: true,
              slug: true,
              name: true,
              category: {
                select: {
                  name: true,
                  group: { select: { name: true, slug: true } },
                },
              },
            },
          },
          partnerProfile: {
            select: {
              userId: true,
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
      }),
      this.prisma.partnerServicePost.count({ where }),
    ]);

    return paginated(
      items.map((item) => {
        let images: string[] = [];
        if (item.imagesJson) {
          try {
            const parsed = JSON.parse(item.imagesJson) as unknown;
            if (Array.isArray(parsed)) {
              images = parsed.filter((u): u is string => typeof u === 'string');
            }
          } catch {
            /* ignore */
          }
        }
        if (!images.length && item.coverUrl) images = [item.coverUrl];
        return {
          id: item.id,
          title: item.title,
          body: item.body,
          coverUrl: images[0] ?? item.coverUrl,
          images,
          status: item.status,
          rejectReason: item.rejectReason,
          reviewedAt: item.reviewedAt,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          service: item.service,
          partner: {
            userId: item.partnerProfile.userId,
            fullName: item.partnerProfile.user.fullName,
            email: item.partnerProfile.user.email,
          },
        };
      }),
      total,
      page,
    );
  }

  async reviewServicePost(
    id: string,
    adminUserId: string,
    dto: AdminReviewServicePostDto,
  ) {
    const post = await this.prisma.partnerServicePost.findUnique({
      where: { id },
    });
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng');

    if (
      dto.status !== PartnerServicePostStatus.APPROVED &&
      dto.status !== PartnerServicePostStatus.REJECTED
    ) {
      throw new BadRequestException('Chỉ duyệt hoặc từ chối bài đăng.');
    }

    if (
      dto.status === PartnerServicePostStatus.REJECTED &&
      !dto.rejectReason?.trim()
    ) {
      throw new BadRequestException('Cần ghi lý do từ chối.');
    }

    const updated = await this.prisma.partnerServicePost.update({
      where: { id },
      data: {
        status: dto.status,
        rejectReason:
          dto.status === PartnerServicePostStatus.REJECTED
            ? dto.rejectReason!.trim()
            : null,
        reviewedAt: new Date(),
        reviewedById: adminUserId,
      },
      include: {
        service: { select: { id: true, slug: true, name: true } },
        partnerProfile: {
          select: {
            userId: true,
            user: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      status: updated.status,
      rejectReason: updated.rejectReason,
      reviewedAt: updated.reviewedAt,
      service: updated.service,
      partner: {
        userId: updated.partnerProfile.userId,
        fullName: updated.partnerProfile.user.fullName,
      },
    };
  }
}
