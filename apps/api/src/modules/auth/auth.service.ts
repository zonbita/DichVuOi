import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../../database/prisma/prisma.service';
import { portraitAvatarUrl } from '../../common/portrait-avatar';
import { MailService } from '../mail/mail.service';
import { SmsService, normalizeVnPhone } from '../sms/sms.service';
import { takeEmailOtpSlot } from '../../common/email-otp-rate';
import {
  ConfirmEmailOtpDto,
  ConfirmPhoneOtpDto,
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  RequestEmailOtpDto,
  RequestPhoneOtpDto,
} from './dto/auth.dto';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;

/** In-memory OTP fail counters (per user) — reset on success / new request. */
const otpFailCounts = new Map<string, number>();

/** Tên hiển thị → slug ASCII cho key OTP (TenUser-123456). */
export function otpNameSlug(fullName: string) {
  const slug = fullName
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/gi, (ch) => (ch === 'Đ' ? 'D' : 'd'))
    .replace(/[^a-zA-Z0-9]+/g, '')
    .slice(0, 24);
  return slug || 'User';
}

export function buildOneTimePhoneKey(fullName: string, code: string) {
  return `${otpNameSlug(fullName)}-${code}`;
}

function buildOtpSmsContent(key: string) {
  const template =
    process.env.ESMS_OTP_TEMPLATE?.trim() ||
    'DichVuOi: Ma xac minh {key}. Het han 5 phut.';
  return template.replace(/\{key\}/gi, key).replace(/\{code\}/gi, key);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly sms: SmsService,
    private readonly mail: MailService,
  ) {}

  private sanitize(user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    phoneVerified?: boolean;
    emailVerified?: boolean;
    bankVerified?: boolean;
    role: Role;
    walletBalance?: number;
    partnerProfile?: unknown;
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      phoneVerified: Boolean(user.phoneVerified),
      emailVerified: Boolean(user.emailVerified),
      bankVerified: Boolean(user.bankVerified),
      role: user.role,
      walletBalance: user.walletBalance ?? 0,
      partnerProfile: user.partnerProfile ?? null,
    };
  }

  private sign(user: { id: string; email: string; role: Role }) {
    return this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const enableOffering = Boolean(dto.enableOffering);
    const role = enableOffering ? Role.PARTNER : Role.CUSTOMER;

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        fullName: dto.fullName.trim(),
        phone: dto.phone?.trim(),
        role,
        ...(enableOffering
          ? {
              partnerProfile: {
                create: {
                  headline: 'Freelancer mới trên Dịch Vụ Ơi',
                  bio: '',
                  city: 'Hồ Chí Minh',
                  level: 1,
                  avatarUrl: portraitAvatarUrl(email),
                },
              },
            }
          : {}),
      },
      include: { partnerProfile: true },
    });

    return {
      accessToken: this.sign(user),
      user: this.sanitize(user),
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { partnerProfile: true },
    });

    if (
      !user?.passwordHash ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException(
        user && !user.passwordHash
          ? 'Tài khoản dùng Google — hãy đăng nhập bằng Google'
          : 'Email hoặc mật khẩu không đúng',
      );
    }

    return {
      accessToken: this.sign(user),
      user: this.sanitize(user),
    };
  }

  /**
   * Đăng nhập / đăng ký bằng Google Identity Services ID token.
   * - Có googleId → đăng nhập
   * - Có email chưa gắn Google → gắn googleId rồi đăng nhập
   * - Chưa có user → tạo CUSTOMER (passwordHash null)
   */
  async loginWithGoogle(dto: GoogleLoginDto) {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      throw new BadRequestException(
        'Chưa cấu hình Google OAuth (GOOGLE_CLIENT_ID).',
      );
    }

    const client = new OAuth2Client(clientId);
    let payload: {
      sub?: string;
      email?: string;
      email_verified?: boolean | string;
      name?: string;
    };
    try {
      const ticket = await client.verifyIdToken({
        idToken: dto.idToken,
        audience: clientId,
      });
      payload = ticket.getPayload() ?? {};
    } catch {
      throw new UnauthorizedException('Token Google không hợp lệ hoặc đã hết hạn');
    }

    const googleId = payload.sub?.trim();
    const email = payload.email?.toLowerCase().trim();
    if (!googleId || !email) {
      throw new UnauthorizedException('Tài khoản Google thiếu email');
    }
    if (payload.email_verified === false || payload.email_verified === 'false') {
      throw new UnauthorizedException('Email Google chưa được xác minh');
    }

    const fullName = (
      payload.name?.trim() ||
      email.split('@')[0] ||
      'User'
    ).slice(0, 120);

    const byGoogle = await this.prisma.user.findUnique({
      where: { googleId },
      include: { partnerProfile: true },
    });
    if (byGoogle) {
      const refreshed =
        byGoogle.emailVerified
          ? byGoogle
          : await this.prisma.user.update({
              where: { id: byGoogle.id },
              data: { emailVerified: true },
              include: { partnerProfile: true },
            });
      return {
        accessToken: this.sign(refreshed),
        user: this.sanitize(refreshed),
      };
    }

    const byEmail = await this.prisma.user.findUnique({
      where: { email },
      include: { partnerProfile: true },
    });
    if (byEmail) {
      if (byEmail.googleId && byEmail.googleId !== googleId) {
        throw new ConflictException('Email đã liên kết tài khoản Google khác');
      }
      const linked = await this.prisma.user.update({
        where: { id: byEmail.id },
        data: { googleId, emailVerified: true },
        include: { partnerProfile: true },
      });
      return {
        accessToken: this.sign(linked),
        user: this.sanitize(linked),
      };
    }

    const created = await this.prisma.user.create({
      data: {
        email,
        googleId,
        fullName,
        passwordHash: null,
        role: Role.CUSTOMER,
        emailVerified: true,
      },
      include: { partnerProfile: true },
    });

    return {
      accessToken: this.sign(created),
      user: this.sanitize(created),
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { partnerProfile: true },
    });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  /** Cấp lại JWT sau khi đổi role (vd. bật nhận việc). */
  async sessionFor(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { partnerProfile: true },
    });
    if (!user) throw new UnauthorizedException();
    return {
      accessToken: this.sign(user),
      user: this.sanitize(user),
    };
  }

  /**
   * Tạo key OTP một lần: TenUser-XXXXXX.
   * - SMS_PROVIDER=esms + đủ key → gửi SMS Brandname, không trả key về client.
   * - Còn lại → mock: trả key trong response (dev).
   */
  async requestPhoneOtp(userId: string, dto: RequestPhoneOtpDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const phone = normalizeVnPhone(dto.phone);
    if (phone.length < 9) {
      throw new BadRequestException('Số điện thoại không hợp lệ');
    }

    const code = String(randomInt(100000, 1000000));
    const key = buildOneTimePhoneKey(user.fullName, code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    const liveSms = this.sms.isLive();
    otpFailCounts.delete(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        phone,
        phoneVerified: false,
        phoneOtpKey: key,
        phoneOtpExpiresAt: expiresAt,
      },
    });

    await this.prisma.partnerProfile.updateMany({
      where: { userId },
      data: {
        phoneVerified: false,
        phoneOtpCode: null,
        phoneOtpExpiresAt: null,
      },
    });

    if (liveSms) {
      const sent = await this.sms.sendOtpSms(phone, buildOtpSmsContent(key));
      return {
        ok: true,
        phone,
        expiresAt: expiresAt.toISOString(),
        oneTime: true,
        channel: sent.sandbox ? 'esms_sandbox' : 'esms',
        message: sent.sandbox
          ? 'Đã gọi eSMS sandbox (không trừ tiền / có thể không về máy). Nhập key nhận được hoặc theo template đã đăng ký.'
          : 'Đã gửi SMS xác minh. Nhập key trong tin nhắn (dạng TenUser-XXXXXX) — chỉ dùng một lần.',
      };
    }

    // Mock: hiển thị key trên web khi chưa cấu hình eSMS.
    await this.sms.sendOtpSms(phone, buildOtpSmsContent(key));
    return {
      ok: true,
      phone,
      key,
      expiresAt: expiresAt.toISOString(),
      oneTime: true,
      channel: 'web_key_mock',
      message:
        'Dev mock: chưa cấu hình eSMS — key hiện trên web. Production: đặt SMS_PROVIDER=esms + ESMS_*.',
    };
  }

  /** Xác minh key một lần — thành công thì huỷ key ngay. */
  async confirmPhoneOtp(userId: string, dto: ConfirmPhoneOtpDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    if (!user.phoneOtpKey || !user.phoneOtpExpiresAt) {
      throw new BadRequestException(
        'Chưa có key OTP. Bấm tạo key trước (key chỉ dùng một lần).',
      );
    }
    if (user.phoneOtpExpiresAt.getTime() < Date.now()) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { phoneOtpKey: null, phoneOtpExpiresAt: null },
      });
      throw new BadRequestException('Key đã hết hạn. Tạo key mới.');
    }

    const fails = otpFailCounts.get(userId) ?? 0;
    if (fails >= OTP_MAX_ATTEMPTS) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { phoneOtpKey: null, phoneOtpExpiresAt: null },
      });
      otpFailCounts.delete(userId);
      throw new BadRequestException(
        'Quá nhiều lần nhập sai. Tạo key OTP mới.',
      );
    }

    const input = dto.key.trim().replace(/\s+/g, '');
    const stored = user.phoneOtpKey;
    const codePart = stored.includes('-') ? stored.split('-').pop()! : stored;
    const match =
      input.toLowerCase() === stored.toLowerCase() ||
      input === codePart ||
      input.toLowerCase() === stored.toLowerCase().replace(/-/g, '');

    if (!match) {
      otpFailCounts.set(userId, fails + 1);
      throw new BadRequestException('Key không đúng hoặc đã dùng rồi.');
    }

    otpFailCounts.delete(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        phoneVerified: true,
        phoneOtpKey: null,
        phoneOtpExpiresAt: null,
      },
    });
    await this.prisma.partnerProfile.updateMany({
      where: { userId },
      data: {
        phoneVerified: true,
        phoneOtpCode: null,
        phoneOtpExpiresAt: null,
      },
    });

    return this.me(userId);
  }

  /** OTP email (Gmail) — user nhập email (có thể gắn mới) → OTP → set email + verified. */
  async requestEmailOtp(userId: string, dto: RequestEmailOtpDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.emailVerified) {
      return {
        ok: true,
        alreadyVerified: true,
        channel: this.mail.isConfigured() ? 'mail' : 'mock',
        message: 'Email đã được xác minh.',
      };
    }

    const typed = dto.email.toLowerCase().trim();
    if (!typed.includes('@')) {
      throw new BadRequestException('Email không hợp lệ');
    }

    const taken = await this.prisma.user.findUnique({
      where: { email: typed },
      select: { id: true },
    });
    if (taken && taken.id !== userId) {
      throw new ConflictException('Email này đã được tài khoản khác sử dụng');
    }

    const rate = takeEmailOtpSlot(user);
    const code = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + EMAIL_OTP_TTL_MS);
    const mailReady = this.mail.isConfigured();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailPending: typed,
        emailOtpCode: code,
        emailOtpExpiresAt: expiresAt,
        emailOtpSendCount: rate.emailOtpSendCount,
        emailOtpWindowStartedAt: rate.emailOtpWindowStartedAt,
      },
    });

    const sent = await this.mail.send({
      to: typed,
      subject: 'Mã xác minh email — DichVuOi',
      text: `Ma xac minh DichVuOi: ${code}. Het han 10 phut. Khong chia se ma nay.`,
      html: `<p>Mã xác minh DichVuOi: <strong>${code}</strong></p><p>Hết hạn trong 10 phút. Không chia sẻ mã này.</p>`,
    });

    if (sent.provider === 'gmail') {
      return {
        ok: true,
        alreadyVerified: false,
        channel: 'gmail' as const,
        expiresAt: expiresAt.toISOString(),
        message: `Đã gửi mã xác minh tới ${typed}`,
      };
    }

    // Gmail đã cấu hình nhưng gửi fail → không lộ OTP trên API/UI (chống bot).
    if (mailReady) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          emailOtpCode: null,
          emailOtpExpiresAt: null,
          emailPending: typed,
        },
      });
      throw new BadRequestException(
        sent.mockReason ||
          'Không gửi được email. Kiểm tra Gmail App Password hoặc thử lại sau.',
      );
    }

    // Dev: chưa cấu hình Gmail — cho hiện mã mock trên web.
    return {
      ok: true,
      alreadyVerified: false,
      channel: 'mock' as const,
      expiresAt: expiresAt.toISOString(),
      code,
      message:
        sent.mockReason ||
        'Chưa cấu hình Gmail — dùng mã hiện trên màn hình (dev).',
    };
  }

  async confirmEmailOtp(userId: string, dto: ConfirmEmailOtpDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.emailVerified) return this.me(userId);

    const code = dto.code.trim();
    if (
      !user.emailOtpCode ||
      !user.emailOtpExpiresAt ||
      user.emailOtpExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Mã đã hết hạn. Gửi lại mã mới.');
    }
    if (user.emailOtpCode !== code) {
      throw new BadRequestException('Mã xác minh không đúng.');
    }

    const nextEmail = (user.emailPending ?? user.email).toLowerCase().trim();
    if (nextEmail !== user.email.toLowerCase()) {
      const taken = await this.prisma.user.findUnique({
        where: { email: nextEmail },
        select: { id: true },
      });
      if (taken && taken.id !== userId) {
        throw new ConflictException('Email này đã được tài khoản khác sử dụng');
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: nextEmail,
        emailVerified: true,
        emailPending: null,
        emailOtpCode: null,
        emailOtpExpiresAt: null,
      },
    });
    return this.me(userId);
  }
}
