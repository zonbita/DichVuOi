import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { recalculatePartnerLevel } from '../../common/recalculate-partner-level';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AdminPartnerQueryDto, AdminUpdatePartnerDto } from './dto';
import { paginated, resolvePage } from './admin-pagination';

/** Partner approval / verification / blocking. */
@Injectable()
export class AdminPartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async listPartners(query: AdminPartnerQueryDto) {
    const page = resolvePage(query);
    const q = query.q?.trim();

    const where: Prisma.PartnerProfileWhereInput = {
      ...(query.verified !== undefined ? { isVerified: query.verified } : {}),
      ...(query.acceptingJobs !== undefined
        ? { acceptingJobs: query.acceptingJobs }
        : {}),
      ...(query.blocked !== undefined
        ? { user: { isBlocked: query.blocked } }
        : {}),
      ...(query.city ? { city: query.city } : {}),
      ...(q
        ? {
            OR: [
              { headline: { contains: q } },
              { city: { contains: q } },
              { user: { fullName: { contains: q } } },
              { user: { email: { contains: q } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.partnerProfile.findMany({
        where,
        skip: page.skip,
        take: page.take,
        // Hồ sơ chờ duyệt lên đầu để admin xử lý hàng đợi verify.
        orderBy: [{ isVerified: 'asc' }, { createdAt: 'desc' }],
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
              role: true,
              isBlocked: true,
            },
          },
          _count: { select: { offerings: true } },
        },
      }),
      this.prisma.partnerProfile.count({ where }),
    ]);

    return paginated(items, total, page);
  }

  async updatePartner(userId: string, dto: AdminUpdatePartnerDto) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Không tìm thấy hồ sơ partner');

    if (dto.isBlocked !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isBlocked: dto.isBlocked },
      });
      // Chặn → tạm dừng nhận việc mới (uy tín / sàn).
      if (dto.isBlocked) {
        await this.prisma.partnerProfile.update({
          where: { userId },
          data: { acceptingJobs: false },
        });
      }
    }

    const updated = await this.prisma.partnerProfile.update({
      where: { userId },
      data: {
        ...(dto.isVerified !== undefined ? { isVerified: dto.isVerified } : {}),
        ...(dto.acceptingJobs !== undefined && dto.isBlocked !== true
          ? { acceptingJobs: dto.acceptingJobs }
          : {}),
        ...(dto.phoneVerified !== undefined
          ? {
              phoneVerified: dto.phoneVerified,
              ...(dto.phoneVerified
                ? { phoneOtpCode: null, phoneOtpExpiresAt: null }
                : {}),
            }
          : {}),
        ...(dto.bankVerified !== undefined
          ? {
              bankVerified: dto.bankVerified,
              ...(dto.bankVerified
                ? { bankVerifyIntentId: null, bankVerifyExpiresAt: null }
                : {}),
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
            isBlocked: true,
          },
        },
        _count: { select: { offerings: true } },
      },
    });

    if (dto.isVerified !== undefined) {
      await recalculatePartnerLevel(this.prisma, userId);
      const refreshed = await this.prisma.partnerProfile.findUnique({
        where: { userId },
        select: { level: true },
      });
      return { ...updated, level: refreshed?.level ?? updated.level };
    }

    return updated;
  }
}
