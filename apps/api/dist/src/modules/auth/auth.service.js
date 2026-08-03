"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
exports.otpNameSlug = otpNameSlug;
exports.buildOneTimePhoneKey = buildOneTimePhoneKey;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const crypto_1 = require("crypto");
const google_auth_library_1 = require("google-auth-library");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const portrait_avatar_1 = require("../../common/portrait-avatar");
const mail_service_1 = require("../mail/mail.service");
const sms_service_1 = require("../sms/sms.service");
const email_otp_rate_1 = require("../../common/email-otp-rate");
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const EMAIL_OTP_TTL_MS = 10 * 60 * 1000;
const otpFailCounts = new Map();
function otpNameSlug(fullName) {
    const slug = fullName
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/đ/gi, (ch) => (ch === 'Đ' ? 'D' : 'd'))
        .replace(/[^a-zA-Z0-9]+/g, '')
        .slice(0, 24);
    return slug || 'User';
}
function buildOneTimePhoneKey(fullName, code) {
    return `${otpNameSlug(fullName)}-${code}`;
}
function buildOtpSmsContent(key) {
    const template = process.env.ESMS_OTP_TEMPLATE?.trim() ||
        'DichVuOi: Ma xac minh {key}. Het han 5 phut.';
    return template.replace(/\{key\}/gi, key).replace(/\{code\}/gi, key);
}
let AuthService = class AuthService {
    prisma;
    jwt;
    sms;
    mail;
    constructor(prisma, jwt, sms, mail) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.sms = sms;
        this.mail = mail;
    }
    sanitize(user) {
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
    sign(user) {
        return this.jwt.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
    }
    async register(dto) {
        const email = dto.email.toLowerCase().trim();
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new common_1.ConflictException('Email đã được sử dụng');
        }
        const enableOffering = Boolean(dto.enableOffering);
        const role = enableOffering ? client_1.Role.PARTNER : client_1.Role.CUSTOMER;
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
                                avatarUrl: (0, portrait_avatar_1.portraitAvatarUrl)(email),
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
    async login(dto) {
        const email = dto.email.toLowerCase().trim();
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { partnerProfile: true },
        });
        if (!user?.passwordHash ||
            !(await bcrypt.compare(dto.password, user.passwordHash))) {
            throw new common_1.UnauthorizedException(user && !user.passwordHash
                ? 'Tài khoản dùng Google — hãy đăng nhập bằng Google'
                : 'Email hoặc mật khẩu không đúng');
        }
        return {
            accessToken: this.sign(user),
            user: this.sanitize(user),
        };
    }
    async loginWithGoogle(dto) {
        const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
        if (!clientId) {
            throw new common_1.BadRequestException('Chưa cấu hình Google OAuth (GOOGLE_CLIENT_ID).');
        }
        const client = new google_auth_library_1.OAuth2Client(clientId);
        let payload;
        try {
            const ticket = await client.verifyIdToken({
                idToken: dto.idToken,
                audience: clientId,
            });
            payload = ticket.getPayload() ?? {};
        }
        catch {
            throw new common_1.UnauthorizedException('Token Google không hợp lệ hoặc đã hết hạn');
        }
        const googleId = payload.sub?.trim();
        const email = payload.email?.toLowerCase().trim();
        if (!googleId || !email) {
            throw new common_1.UnauthorizedException('Tài khoản Google thiếu email');
        }
        if (payload.email_verified === false || payload.email_verified === 'false') {
            throw new common_1.UnauthorizedException('Email Google chưa được xác minh');
        }
        const fullName = (payload.name?.trim() ||
            email.split('@')[0] ||
            'User').slice(0, 120);
        const byGoogle = await this.prisma.user.findUnique({
            where: { googleId },
            include: { partnerProfile: true },
        });
        if (byGoogle) {
            const refreshed = byGoogle.emailVerified
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
                throw new common_1.ConflictException('Email đã liên kết tài khoản Google khác');
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
                role: client_1.Role.CUSTOMER,
                emailVerified: true,
            },
            include: { partnerProfile: true },
        });
        return {
            accessToken: this.sign(created),
            user: this.sanitize(created),
        };
    }
    async me(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { partnerProfile: true },
        });
        if (!user)
            throw new common_1.UnauthorizedException();
        return this.sanitize(user);
    }
    async sessionFor(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { partnerProfile: true },
        });
        if (!user)
            throw new common_1.UnauthorizedException();
        return {
            accessToken: this.sign(user),
            user: this.sanitize(user),
        };
    }
    async requestPhoneOtp(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        const phone = (0, sms_service_1.normalizeVnPhone)(dto.phone);
        if (phone.length < 9) {
            throw new common_1.BadRequestException('Số điện thoại không hợp lệ');
        }
        const code = String((0, crypto_1.randomInt)(100000, 1000000));
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
        await this.sms.sendOtpSms(phone, buildOtpSmsContent(key));
        return {
            ok: true,
            phone,
            key,
            expiresAt: expiresAt.toISOString(),
            oneTime: true,
            channel: 'web_key_mock',
            message: 'Dev mock: chưa cấu hình eSMS — key hiện trên web. Production: đặt SMS_PROVIDER=esms + ESMS_*.',
        };
    }
    async confirmPhoneOtp(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        if (!user.phoneOtpKey || !user.phoneOtpExpiresAt) {
            throw new common_1.BadRequestException('Chưa có key OTP. Bấm tạo key trước (key chỉ dùng một lần).');
        }
        if (user.phoneOtpExpiresAt.getTime() < Date.now()) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { phoneOtpKey: null, phoneOtpExpiresAt: null },
            });
            throw new common_1.BadRequestException('Key đã hết hạn. Tạo key mới.');
        }
        const fails = otpFailCounts.get(userId) ?? 0;
        if (fails >= OTP_MAX_ATTEMPTS) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { phoneOtpKey: null, phoneOtpExpiresAt: null },
            });
            otpFailCounts.delete(userId);
            throw new common_1.BadRequestException('Quá nhiều lần nhập sai. Tạo key OTP mới.');
        }
        const input = dto.key.trim().replace(/\s+/g, '');
        const stored = user.phoneOtpKey;
        const codePart = stored.includes('-') ? stored.split('-').pop() : stored;
        const match = input.toLowerCase() === stored.toLowerCase() ||
            input === codePart ||
            input.toLowerCase() === stored.toLowerCase().replace(/-/g, '');
        if (!match) {
            otpFailCounts.set(userId, fails + 1);
            throw new common_1.BadRequestException('Key không đúng hoặc đã dùng rồi.');
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
    async requestEmailOtp(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
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
            throw new common_1.BadRequestException('Email không hợp lệ');
        }
        const taken = await this.prisma.user.findUnique({
            where: { email: typed },
            select: { id: true },
        });
        if (taken && taken.id !== userId) {
            throw new common_1.ConflictException('Email này đã được tài khoản khác sử dụng');
        }
        const rate = (0, email_otp_rate_1.takeEmailOtpSlot)(user);
        const code = String((0, crypto_1.randomInt)(100000, 999999));
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
                channel: 'gmail',
                expiresAt: expiresAt.toISOString(),
                message: `Đã gửi mã xác minh tới ${typed}`,
            };
        }
        if (mailReady) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    emailOtpCode: null,
                    emailOtpExpiresAt: null,
                    emailPending: typed,
                },
            });
            throw new common_1.BadRequestException(sent.mockReason ||
                'Không gửi được email. Kiểm tra Gmail App Password hoặc thử lại sau.');
        }
        return {
            ok: true,
            alreadyVerified: false,
            channel: 'mock',
            expiresAt: expiresAt.toISOString(),
            code,
            message: sent.mockReason ||
                'Chưa cấu hình Gmail — dùng mã hiện trên màn hình (dev).',
        };
    }
    async confirmEmailOtp(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        if (user.emailVerified)
            return this.me(userId);
        const code = dto.code.trim();
        if (!user.emailOtpCode ||
            !user.emailOtpExpiresAt ||
            user.emailOtpExpiresAt.getTime() < Date.now()) {
            throw new common_1.BadRequestException('Mã đã hết hạn. Gửi lại mã mới.');
        }
        if (user.emailOtpCode !== code) {
            throw new common_1.BadRequestException('Mã xác minh không đúng.');
        }
        const nextEmail = (user.emailPending ?? user.email).toLowerCase().trim();
        if (nextEmail !== user.email.toLowerCase()) {
            const taken = await this.prisma.user.findUnique({
                where: { email: nextEmail },
                select: { id: true },
            });
            if (taken && taken.id !== userId) {
                throw new common_1.ConflictException('Email này đã được tài khoản khác sử dụng');
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        sms_service_1.SmsService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map