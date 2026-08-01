import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  parseDistricts,
  parseGallery,
  parseSkills,
  parseWorkModes,
  serializeDistricts,
  serializeGallery,
  serializeSkills,
  serializeWorkModes,
} from '../../common/partner-profile-fields';
import { phraseMatch } from '../../common/text-match';
import { hoursWorkedByServiceIds } from '../../common/partner-work-hours';
import {
  computePartnerLevel,
  PARTNER_LEVEL_FORMULA,
} from '../../common/partner-level';
import { recalculatePartnerLevel } from '../../common/recalculate-partner-level';
import { ReputationService } from '../../common/reputation.service';
import { portraitAvatarUrl } from '../../common/portrait-avatar';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  ConfirmBankVerifyDto,
  ConfirmPhoneOtpDto,
  LinkBankAccountDto,
  RequestPhoneOtpDto,
} from './dto/partner-verify.dto';
import {
  EnablePartnerDto,
  SyncPartnerOfferingsDto,
  UpdatePartnerProfileDto,
} from './dto/update-partner-profile.dto';

const OTP_TTL_MS = 5 * 60 * 1000;
const BANK_VERIFY_TTL_MS = 15 * 60 * 1000;
const DEFAULT_VIETQR_BIN = process.env.VIETQR_BANK_ID ?? '970436';

const userPublicSelect = {
  id: true,
  fullName: true,
  role: true,
} as const;

const userPrivateSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
} as const;

const offeringInclude = {
  service: {
    select: {
      id: true,
      slug: true,
      name: true,
      unit: true,
      basePrice: true,
      isActive: true,
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
} as const;

@Injectable()
export class PartnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reputation: ReputationService,
  ) {}

  private shapePublic(
    profile: {
      id: string;
      userId: string;
      headline: string | null;
      bio: string | null;
      city: string | null;
      districts: string | null;
      ratingAvg: number;
      ratingCount: number;
      level: number;
      isVerified: boolean;
      phoneVerified: boolean;
      bankVerified: boolean;
      avatarUrl: string | null;
      galleryJson?: string | null;
      skillsJson: string | null;
      acceptingJobs: boolean;
      workModes: string | null;
      responseMinutes: number;
      user: { id: string; fullName: string };
      offerings?: Array<{
        id: string;
        price: number | null;
        headline: string | null;
        experienceYears: number;
        includes: string | null;
        excludes: string | null;
        coverageNote: string | null;
        service: {
          id: string;
          slug: string;
          name: string;
          unit: string;
          basePrice: number;
          category?: {
            id: string;
            name: string;
            slug: string;
            group: { id: string; name: string; slug: string };
          };
        };
      }>;
    },
    completedJobs: number,
    reviews: Array<{
      id: string;
      rating: number;
      comment: string | null;
      createdAt: Date;
      fromUser: { id: string; fullName: string };
      booking: {
        service: {
          name: string;
          slug: string;
          category?: {
            id: string;
            name: string;
            slug: string;
            group: { id: string; name: string; slug: string };
          } | null;
        };
      };
    }> = [],
    hoursByServiceId: Map<string, number> = new Map(),
  ) {
    const reviewedBySlug = new Map<
      string,
      { ratings: number[]; service: (typeof reviews)[0]['booking']['service'] }
    >();
    for (const r of reviews) {
      const slug = r.booking.service.slug;
      const entry = reviewedBySlug.get(slug) ?? {
        ratings: [],
        service: r.booking.service,
      };
      entry.ratings.push(r.rating);
      reviewedBySlug.set(slug, entry);
    }

    /** Tất cả dịch vụ đang nhận; ưu tiên nghề đã có đánh giá. */
    const offerings = (profile.offerings ?? [])
      .map((o) => {
        const stats = reviewedBySlug.get(o.service.slug);
        const ratingCount = stats?.ratings.length ?? 0;
        const ratingAvg =
          ratingCount > 0
            ? Math.round(
                (stats!.ratings.reduce((s, n) => s + n, 0) / ratingCount) * 10,
              ) / 10
            : 0;
        return {
          id: o.id,
          price: o.price ?? o.service.basePrice,
          headline: o.headline,
          experienceYears: o.experienceYears,
          hoursWorked: hoursByServiceId.get(o.service.id) ?? 0,
          includes: o.includes,
          excludes: o.excludes,
          coverageNote: o.coverageNote,
          ratingAvg,
          ratingCount,
          service: {
            id: o.service.id,
            slug: o.service.slug,
            name: o.service.name,
            unit: o.service.unit,
            basePrice: o.service.basePrice,
            category: o.service.category
              ? {
                  id: o.service.category.id,
                  name: o.service.category.name,
                  slug: o.service.category.slug,
                  group: o.service.category.group,
                }
              : null,
          },
        };
      })
      .sort((a, b) => b.ratingCount - a.ratingCount || b.ratingAvg - a.ratingAvg);

    return {
      id: profile.id,
      userId: profile.userId,
      fullName: profile.user.fullName,
      headline: profile.headline,
      bio: profile.bio,
      city: profile.city,
      districts: parseDistricts(profile.districts),
      skills: parseSkills(profile.skillsJson),
      acceptingJobs: profile.acceptingJobs,
      workModes: parseWorkModes(profile.workModes),
      responseMinutes: profile.responseMinutes,
      ratingAvg: profile.ratingAvg,
      ratingCount: profile.ratingCount,
      level: profile.level,
      isVerified: profile.isVerified,
      phoneVerified: profile.phoneVerified,
      bankVerified: profile.bankVerified,
      avatarUrl: profile.avatarUrl,
      gallery: parseGallery(profile.galleryJson),
      completedJobs,
      offerings,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        fromName: r.fromUser.fullName,
        serviceName: r.booking.service.name,
        serviceSlug: r.booking.service.slug,
        groupSlug: r.booking.service.category?.group.slug ?? null,
        groupName: r.booking.service.category?.group.name ?? null,
      })),
    };
  }

  /**
   * Tìm người làm công khai theo tên hoặc nghề (cụm từ, không dấu).
   * Không trả SĐT/email.
   */
  async searchPublic(q: string, limit = 24) {
    const keyword = q.trim();
    if (!keyword) return [];

    const take = Math.min(Math.max(limit, 1), 48);
    const profiles = await this.prisma.partnerProfile.findMany({
      where: { acceptingJobs: true },
      select: {
        userId: true,
        headline: true,
        bio: true,
        skillsJson: true,
        ratingAvg: true,
        level: true,
        isVerified: true,
        phoneVerified: true,
        bankVerified: true,
        avatarUrl: true,
        user: { select: { id: true, fullName: true } },
        offerings: {
          where: { isActive: true },
          select: {
            price: true,
            headline: true,
            service: {
              select: {
                slug: true,
                name: true,
                unit: true,
                basePrice: true,
              },
            },
          },
          take: 40,
        },
      },
      orderBy: [{ ratingAvg: 'desc' }, { level: 'desc' }],
      take: 300,
    });

    const hits: Array<{
      userId: string;
      fullName: string;
      avatarUrl: string | null;
      headline: string | null;
      ratingAvg: number;
      level: number;
      isVerified: boolean;
      phoneVerified: boolean;
      bankVerified: boolean;
      serviceSlug: string | null;
      serviceName: string | null;
      price: number | null;
      unit: string | null;
      matchReason: 'name' | 'profession';
    }> = [];

    for (const profile of profiles) {
      if (hits.length >= take) break;

      const nameHit = phraseMatch(profile.user.fullName, keyword);
      const professionHay = [
        profile.headline ?? '',
        profile.bio ?? '',
        profile.skillsJson ?? '',
        ...profile.offerings.map(
          (o) => `${o.service.name} ${o.headline ?? ''}`,
        ),
      ].join(' ');
      const professionHit = phraseMatch(professionHay, keyword);
      if (!nameHit && !professionHit) continue;

      const matchedOffering =
        profile.offerings.find((o) =>
          phraseMatch(`${o.service.name} ${o.headline ?? ''}`, keyword),
        ) ?? profile.offerings[0] ?? null;

      hits.push({
        userId: profile.userId,
        fullName: profile.user.fullName,
        avatarUrl: profile.avatarUrl,
        headline: profile.headline,
        ratingAvg: profile.ratingAvg,
        level: profile.level,
        isVerified: profile.isVerified,
        phoneVerified: profile.phoneVerified,
        bankVerified: profile.bankVerified,
        serviceSlug: matchedOffering?.service.slug ?? null,
        serviceName: matchedOffering?.service.name ?? null,
        price: matchedOffering
          ? matchedOffering.price ?? matchedOffering.service.basePrice
          : null,
        unit: matchedOffering?.service.unit ?? null,
        matchReason: nameHit ? 'name' : 'profession',
      });
    }

    return hits;
  }

  async getPublicProfile(userId: string) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: userPublicSelect },
        offerings: {
          where: { isActive: true },
          include: {
            service: {
              select: {
                id: true,
                slug: true,
                name: true,
                unit: true,
                basePrice: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    group: {
                      select: { id: true, name: true, slug: true },
                    },
                  },
                },
              },
            },
          },
          take: 40,
        },
      },
    });
    if (!profile) throw new NotFoundException('Không tìm thấy hồ sơ người làm');

    const [completedJobs, reviews, hoursByServiceId] = await Promise.all([
      this.prisma.booking.count({
        where: { partnerId: userId, status: 'COMPLETED' },
      }),
      this.prisma.review.findMany({
        where: { toUserId: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          fromUser: { select: { id: true, fullName: true } },
          booking: {
            select: {
              service: {
                select: {
                  name: true,
                  slug: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      group: {
                        select: { id: true, name: true, slug: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      hoursWorkedByServiceIds(
        this.prisma,
        userId,
        profile.offerings.map((o) => o.serviceId),
      ),
    ]);

    const shaped = this.shapePublic(profile, completedJobs, reviews, hoursByServiceId);
    const reputation = await this.reputation.getSnapshot(userId);
    return { ...shaped, reputation };
  }

  async getMine(userId: string) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: userPrivateSelect },
        offerings: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          include: offeringInclude,
        },
      },
    });
    if (!profile) throw new NotFoundException('Chưa có hồ sơ đối tác');

    const hoursByServiceId = await hoursWorkedByServiceIds(
      this.prisma,
      userId,
      profile.offerings.map((o) => o.serviceId),
    );

    const {
      phoneOtpCode: _otp,
      phoneOtpExpiresAt: _otpExp,
      bankVerifyIntentId: _bIntent,
      bankVerifyExpiresAt: _bExp,
      ...safeProfile
    } = profile;

    return {
      ...safeProfile,
      skills: parseSkills(profile.skillsJson),
      gallery: parseGallery(profile.galleryJson),
      districtsList: parseDistricts(profile.districts),
      workModesList: parseWorkModes(profile.workModes),
      serviceIds: profile.offerings.map((o) => o.serviceId),
      offerings: profile.offerings.map((o) => ({
        ...o,
        hoursWorked: hoursByServiceId.get(o.serviceId) ?? 0,
      })),
      bankVerifyPending: Boolean(
        profile.bankVerifyIntentId &&
          profile.bankVerifyExpiresAt &&
          profile.bankVerifyExpiresAt.getTime() > Date.now() &&
          !profile.bankVerified,
      ),
    };
  }

  /** Dual-role: user đang thuê bật thêm vai người làm trên cùng account. */
  async enableOffering(userId: string, dto: EnablePartnerDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { partnerProfile: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    if (user.partnerProfile) {
      throw new ConflictException('Bạn đã bật nhận việc rồi');
    }

    const role = user.role === Role.ADMIN ? Role.ADMIN : Role.PARTNER;

    const phone =
      dto.phone !== undefined ? dto.phone.trim().slice(0, 20) || null : undefined;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        role,
        ...(phone !== undefined ? { phone } : {}),
      },
    });

    const profile = await this.prisma.partnerProfile.create({
      data: {
        userId,
        headline: dto.headline?.trim() || 'Freelancer trên Dịch Vụ Ơi',
        bio: dto.bio?.trim() || '',
        city: dto.city?.trim() || 'Hồ Chí Minh',
        districts: serializeDistricts(dto.districts),
        skillsJson: serializeSkills(dto.skills),
        workModes: serializeWorkModes(dto.workModes),
        acceptingJobs: dto.acceptingJobs ?? true,
        responseMinutes: dto.responseMinutes ?? 30,
        level: 1,
        avatarUrl: portraitAvatarUrl(userId),
      },
      include: { user: { select: userPrivateSelect } },
    });

    if (dto.serviceIds?.length) {
      await this.syncOfferingsForProfile(profile.id, dto.serviceIds);
    }

    return this.getMine(userId);
  }

  /**
   * Heal orphan PARTNER/ADMIN (có role nhưng mất PartnerProfile) — dùng trước PATCH avatar / lưu hồ sơ.
   */
  private async requireOrCreateProfile(userId: string) {
    const existing = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });
    if (existing) return existing;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');

    if (user.role === Role.CUSTOMER) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: Role.PARTNER },
      });
    }

    return this.prisma.partnerProfile.create({
      data: {
        userId,
        headline: 'Freelancer trên Dịch Vụ Ơi',
        bio: '',
        city: 'Hồ Chí Minh',
        level: 1,
        avatarUrl: portraitAvatarUrl(userId),
        acceptingJobs: true,
        responseMinutes: 30,
      },
    });
  }

  async updateMine(userId: string, dto: UpdatePartnerProfileDto) {
    await this.requireOrCreateProfile(userId);
    if (dto.phone !== undefined) {
      const nextPhone = dto.phone.trim().slice(0, 20) || null;
      const current = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true },
      });
      await this.prisma.user.update({
        where: { id: userId },
        data: { phone: nextPhone },
      });
      if (current?.phone !== nextPhone) {
        await this.prisma.partnerProfile.update({
          where: { userId },
          data: {
            phoneVerified: false,
            phoneOtpCode: null,
            phoneOtpExpiresAt: null,
          },
        });
      }
    }
    await this.prisma.partnerProfile.update({
      where: { userId },
      data: {
        headline: dto.headline,
        bio: dto.bio,
        city: dto.city,
        ...(dto.districts !== undefined
          ? { districts: serializeDistricts(dto.districts) }
          : {}),
        ...(dto.skills !== undefined
          ? { skillsJson: serializeSkills(dto.skills) }
          : {}),
        ...(dto.workModes !== undefined
          ? { workModes: serializeWorkModes(dto.workModes) }
          : {}),
        ...(dto.acceptingJobs !== undefined
          ? { acceptingJobs: dto.acceptingJobs }
          : {}),
        ...(dto.responseMinutes !== undefined
          ? { responseMinutes: dto.responseMinutes }
          : {}),
        ...(dto.avatarUrl !== undefined
          ? {
              avatarUrl: dto.avatarUrl.trim()
                ? dto.avatarUrl.trim().slice(0, 500)
                : null,
            }
          : {}),
        ...(dto.gallery !== undefined
          ? { galleryJson: serializeGallery(dto.gallery) }
          : {}),
      },
    });
    return this.getMine(userId);
  }

  /** Gắn / gỡ nhiều nghề (Service) trên hồ sơ — UX kiểu tags. */
  async syncOfferings(userId: string, dto: SyncPartnerOfferingsDto) {
    const profile = await this.requireOrCreateProfile(userId);
    await this.syncOfferingsForProfile(profile.id, dto.serviceIds ?? []);
    await recalculatePartnerLevel(this.prisma, userId);
    return this.getMine(userId);
  }

  /** Công thức + điểm chi tiết cấp hiện tại (cho dashboard đối tác). */
  async getLevelBreakdown(userId: string) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        level: true,
        ratingAvg: true,
        ratingCount: true,
        isVerified: true,
        onlineSeconds: true,
        lastOnlineAt: true,
        offerings: {
          where: { isActive: true },
          select: {
            serviceId: true,
            service: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
    if (!profile) throw new NotFoundException('Chưa có hồ sơ đối tác');

    const completedJobs = await this.prisma.booking.count({
      where: { partnerId: userId, status: 'COMPLETED' },
    });

    const breakdown = computePartnerLevel({
      onlineHours: profile.onlineSeconds / 3600,
      completedJobs,
      ratingAvg: profile.ratingAvg,
      ratingCount: profile.ratingCount,
      isVerified: profile.isVerified,
      activeOfferings: profile.offerings.length,
    });

    return {
      storedLevel: profile.level,
      formula: PARTNER_LEVEL_FORMULA,
      ...breakdown,
      inputs: {
        completedJobs,
        ratingAvg: profile.ratingAvg,
        ratingCount: profile.ratingCount,
        isVerified: profile.isVerified,
        activeOfferings: profile.offerings.length,
        onlineSeconds: profile.onlineSeconds,
        onlineHours: breakdown.onlineHours,
        lastOnlineAt: profile.lastOnlineAt,
      },
    };
  }

  private async syncOfferingsForProfile(
    partnerProfileId: string,
    serviceIds: string[],
  ) {
    const uniqueIds = [...new Set(serviceIds.map((id) => id.trim()).filter(Boolean))];

    if (uniqueIds.length > 40) {
      throw new BadRequestException('Tối đa 40 nghề trên một hồ sơ');
    }

    const services = uniqueIds.length
      ? await this.prisma.service.findMany({
          where: { id: { in: uniqueIds }, isActive: true },
          select: { id: true, name: true, basePrice: true },
        })
      : [];

    if (services.length !== uniqueIds.length) {
      throw new BadRequestException('Có nghề không hợp lệ hoặc đã tắt');
    }

    const existing = await this.prisma.partnerService.findMany({
      where: { partnerProfileId },
    });
    const byServiceId = new Map(existing.map((row) => [row.serviceId, row]));

    // Gỡ tag → tắt offering (giữ giá/headline nếu gắn lại sau).
    if (uniqueIds.length === 0) {
      await this.prisma.partnerService.updateMany({
        where: { partnerProfileId, isActive: true },
        data: { isActive: false },
      });
    } else {
      await this.prisma.partnerService.updateMany({
        where: {
          partnerProfileId,
          serviceId: { notIn: uniqueIds },
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    for (const service of services) {
      const row = byServiceId.get(service.id);
      if (row) {
        if (!row.isActive) {
          await this.prisma.partnerService.update({
            where: { id: row.id },
            data: { isActive: true },
          });
        }
      } else {
        await this.prisma.partnerService.create({
          data: {
            partnerProfileId,
            serviceId: service.id,
            price: service.basePrice,
            headline: service.name,
            experienceYears: 0,
            isActive: true,
          },
        });
      }
    }
  }

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

  /** Gửi OTP SMS mock — trả debugCode để test (không tích hợp nhà mạng). */
  async requestPhoneOtp(userId: string, dto: RequestPhoneOtpDto) {
    await this.requireOrCreateProfile(userId);
    const phone = dto.phone.replace(/\s|-/g, '').trim();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { phone },
    });
    await this.prisma.partnerProfile.update({
      where: { userId },
      data: {
        phoneVerified: false,
        phoneOtpCode: code,
        phoneOtpExpiresAt: expiresAt,
      },
    });

    return {
      ok: true,
      phone,
      expiresAt: expiresAt.toISOString(),
      /** Dev/mock only — production sẽ gửi SMS, không trả mã. */
      debugCode: code,
      channel: 'sms_mock',
      message: `Đã gửi OTP mock tới ${phone}. Dùng mã debugCode để xác minh.`,
    };
  }

  async confirmPhoneOtp(userId: string, dto: ConfirmPhoneOtpDto) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Chưa có hồ sơ đối tác');
    if (!profile.phoneOtpCode || !profile.phoneOtpExpiresAt) {
      throw new BadRequestException('Chưa yêu cầu OTP. Bấm gửi mã trước.');
    }
    if (profile.phoneOtpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('OTP đã hết hạn. Gửi lại mã mới.');
    }
    if (dto.code.trim() !== profile.phoneOtpCode) {
      throw new BadRequestException('Mã OTP không đúng.');
    }

    await this.prisma.partnerProfile.update({
      where: { userId },
      data: {
        phoneVerified: true,
        phoneOtpCode: null,
        phoneOtpExpiresAt: null,
      },
    });
    return this.getMine(userId);
  }

  /**
   * Liên kết NH + tạo VietQR mock (eKYC payout nhẹ).
   * Partner “chuyển 1.000đ” rồi mock-confirm → bankVerified.
   */
  async linkBankAccount(userId: string, dto: LinkBankAccountDto) {
    await this.requireOrCreateProfile(userId);
    const intentId = `bv_${Date.now().toString(36)}_${userId.slice(-6)}`;
    const expiresAt = new Date(Date.now() + BANK_VERIFY_TTL_MS);
    const bin = (dto.bankBin ?? DEFAULT_VIETQR_BIN).trim();
    const amount = 1000;
    const addInfo = encodeURIComponent(`DVO verify ${intentId.slice(-8)}`);
    const qrImageUrl = `https://img.vietqr.io/image/${bin}-${dto.accountNo}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${encodeURIComponent(dto.accountName)}`;

    await this.prisma.partnerProfile.update({
      where: { userId },
      data: {
        bankName: dto.bankName.trim(),
        bankAccountNo: dto.accountNo.trim(),
        bankAccountName: dto.accountName.trim().toUpperCase(),
        bankVerified: false,
        bankVerifyIntentId: intentId,
        bankVerifyExpiresAt: expiresAt,
      },
    });

    return {
      ok: true,
      intentId,
      amount,
      expiresAt: expiresAt.toISOString(),
      qrImageUrl,
      bankName: dto.bankName.trim(),
      accountNo: dto.accountNo.trim(),
      accountName: dto.accountName.trim().toUpperCase(),
      message:
        'Quét VietQR (mock) hoặc bấm xác nhận đã chuyển để hoàn tất xác minh NH.',
    };
  }

  async confirmBankVerify(userId: string, dto: ConfirmBankVerifyDto) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Chưa có hồ sơ đối tác');
    if (!profile.bankVerifyIntentId || !profile.bankVerifyExpiresAt) {
      throw new BadRequestException('Chưa tạo yêu cầu xác minh ngân hàng.');
    }
    if (profile.bankVerifyIntentId !== dto.intentId.trim()) {
      throw new BadRequestException('Mã xác minh không khớp.');
    }
    if (profile.bankVerifyExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Yêu cầu xác minh đã hết hạn. Tạo lại QR.');
    }
    if (!profile.bankAccountNo) {
      throw new BadRequestException('Thiếu số tài khoản.');
    }

    await this.prisma.partnerProfile.update({
      where: { userId },
      data: {
        bankVerified: true,
        bankVerifyIntentId: null,
        bankVerifyExpiresAt: null,
      },
    });
    return this.getMine(userId);
  }
}
