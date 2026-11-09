import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import { hoursWorkedByServiceIds } from '../../common/partner-work-hours';
import { recalculatePartnerLevel } from '../../common/recalculate-partner-level';
import { allowMockPayments } from '../../common/security-env';
import { portraitAvatarUrl } from '../../common/portrait-avatar';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
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
import {
  BANK_VERIFY_TTL_MS,
  DEFAULT_VIETQR_BIN,
  userPrivateSelect,
  offeringInclude,
} from './partners.shared';

@Injectable()
export class PartnerProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

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
      phoneVerified: Boolean(
        (profile.user as { phoneVerified?: boolean }).phoneVerified ??
        profile.phoneVerified,
      ),
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
      dto.phone !== undefined
        ? dto.phone.trim().slice(0, 20) || null
        : undefined;

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

  private async syncOfferingsForProfile(
    partnerProfileId: string,
    serviceIds: string[],
  ) {
    const uniqueIds = [
      ...new Set(serviceIds.map((id) => id.trim()).filter(Boolean)),
    ];

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

  /** OTP key một lần — ủy quyền AuthService (eSMS hoặc mock). */
  async requestPhoneOtp(userId: string, dto: RequestPhoneOtpDto) {
    await this.requireOrCreateProfile(userId);
    const result = await this.authService.requestPhoneOtp(userId, dto);
    return {
      ...result,
      /** Alias tương thích UI cũ (chỉ có khi mock). */
      debugCode: 'key' in result ? result.key : undefined,
    };
  }

  async confirmPhoneOtp(userId: string, dto: ConfirmPhoneOtpDto) {
    await this.requireOrCreateProfile(userId);
    await this.authService.confirmPhoneOtp(userId, { key: dto.code });
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
      mockConfirmEnabled: allowMockPayments(),
      message: allowMockPayments()
        ? 'Quét VietQR (mock) hoặc bấm xác nhận đã chuyển để hoàn tất xác minh NH.'
        : 'Đã tạo yêu cầu xác minh. Production cần webhook/micro-deposit — mock confirm đã tắt.',
    };
  }

  async confirmBankVerify(userId: string, dto: ConfirmBankVerifyDto) {
    if (!allowMockPayments()) {
      throw new ForbiddenException(
        'Xác minh ngân hàng mô phỏng đã tắt. Production cần webhook/micro-deposit thật.',
      );
    }
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
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        bankVerified: true,
        bankName: profile.bankName,
        bankAccountNo: profile.bankAccountNo,
        bankAccountName: profile.bankAccountName,
      },
    });
    return this.getMine(userId);
  }
}
