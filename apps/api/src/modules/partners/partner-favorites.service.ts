import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class PartnerFavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Danh sách partnerUserId đã lưu — dùng toggle UI nhanh. */
  async listFavoriteIds(userId: string) {
    const rows = await this.prisma.partnerFavorite.findMany({
      where: { userId },
      select: { partnerUserId: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => r.partnerUserId);
  }

  /** Người làm quen — card gọn cho trang chủ / đơn của tôi. */
  async listFavorites(userId: string) {
    const rows = await this.prisma.partnerFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        partnerUser: {
          select: {
            id: true,
            fullName: true,
            partnerProfile: {
              select: {
                headline: true,
                avatarUrl: true,
                ratingAvg: true,
                ratingCount: true,
                level: true,
                isVerified: true,
                phoneVerified: true,
                bankVerified: true,
                acceptingJobs: true,
                offerings: {
                  where: { isActive: true },
                  orderBy: { updatedAt: 'desc' },
                  take: 1,
                  select: {
                    price: true,
                    service: {
                      select: {
                        slug: true,
                        name: true,
                        unit: true,
                        basePrice: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return rows
      .filter((r) => r.partnerUser.partnerProfile)
      .map((r) => {
        const profile = r.partnerUser.partnerProfile!;
        const top = profile.offerings[0];
        return {
          partnerUserId: r.partnerUser.id,
          fullName: r.partnerUser.fullName,
          headline: profile.headline,
          avatarUrl: profile.avatarUrl,
          ratingAvg: profile.ratingAvg,
          ratingCount: profile.ratingCount,
          level: profile.level,
          isVerified: profile.isVerified,
          phoneVerified: profile.phoneVerified,
          bankVerified: profile.bankVerified,
          acceptingJobs: profile.acceptingJobs,
          favoritedAt: r.createdAt,
          topOffering: top
            ? {
                serviceSlug: top.service.slug,
                serviceName: top.service.name,
                price: top.price ?? top.service.basePrice,
                unit: top.service.unit,
              }
            : null,
        };
      });
  }

  async addFavorite(userId: string, partnerUserId: string) {
    if (userId === partnerUserId) {
      throw new BadRequestException('Không thể lưu chính mình');
    }
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId: partnerUserId },
      select: { id: true },
    });
    if (!partner) {
      throw new NotFoundException('Không tìm thấy hồ sơ người làm');
    }
    await this.prisma.partnerFavorite.upsert({
      where: {
        userId_partnerUserId: { userId, partnerUserId },
      },
      create: { userId, partnerUserId },
      update: {},
    });
    return { partnerUserId, saved: true };
  }

  async removeFavorite(userId: string, partnerUserId: string) {
    await this.prisma.partnerFavorite.deleteMany({
      where: { userId, partnerUserId },
    });
    return { partnerUserId, saved: false };
  }
}
