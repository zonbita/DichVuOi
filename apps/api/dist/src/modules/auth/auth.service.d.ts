import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';
import { ConfirmEmailOtpDto, ConfirmPhoneOtpDto, GoogleLoginDto, LoginDto, RegisterDto, RequestEmailOtpDto, RequestPhoneOtpDto } from './dto/auth.dto';
export declare function otpNameSlug(fullName: string): string;
export declare function buildOneTimePhoneKey(fullName: string, code: string): string;
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly sms;
    private readonly mail;
    constructor(prisma: PrismaService, jwt: JwtService, sms: SmsService, mail: MailService);
    private sanitize;
    private sign;
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            phoneVerified: boolean;
            emailVerified: boolean;
            bankVerified: boolean;
            role: import("@prisma/client").$Enums.Role;
            walletBalance: number;
            partnerProfile: {} | null;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            phoneVerified: boolean;
            emailVerified: boolean;
            bankVerified: boolean;
            role: import("@prisma/client").$Enums.Role;
            walletBalance: number;
            partnerProfile: {} | null;
        };
    }>;
    loginWithGoogle(dto: GoogleLoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            phoneVerified: boolean;
            emailVerified: boolean;
            bankVerified: boolean;
            role: import("@prisma/client").$Enums.Role;
            walletBalance: number;
            partnerProfile: {} | null;
        };
    }>;
    me(userId: string): Promise<{
        id: string;
        email: string;
        fullName: string;
        phone: string | null;
        phoneVerified: boolean;
        emailVerified: boolean;
        bankVerified: boolean;
        role: import("@prisma/client").$Enums.Role;
        walletBalance: number;
        partnerProfile: {} | null;
    }>;
    sessionFor(userId: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            phoneVerified: boolean;
            emailVerified: boolean;
            bankVerified: boolean;
            role: import("@prisma/client").$Enums.Role;
            walletBalance: number;
            partnerProfile: {} | null;
        };
    }>;
    requestPhoneOtp(userId: string, dto: RequestPhoneOtpDto): Promise<{
        ok: boolean;
        phone: string;
        expiresAt: string;
        oneTime: boolean;
        channel: string;
        message: string;
        key?: undefined;
    } | {
        ok: boolean;
        phone: string;
        key: string;
        expiresAt: string;
        oneTime: boolean;
        channel: string;
        message: string;
    }>;
    confirmPhoneOtp(userId: string, dto: ConfirmPhoneOtpDto): Promise<{
        id: string;
        email: string;
        fullName: string;
        phone: string | null;
        phoneVerified: boolean;
        emailVerified: boolean;
        bankVerified: boolean;
        role: import("@prisma/client").$Enums.Role;
        walletBalance: number;
        partnerProfile: {} | null;
    }>;
    requestEmailOtp(userId: string, dto: RequestEmailOtpDto): Promise<{
        ok: boolean;
        alreadyVerified: boolean;
        channel: string;
        message: string;
        expiresAt?: undefined;
        code?: undefined;
    } | {
        ok: boolean;
        alreadyVerified: boolean;
        channel: "gmail";
        expiresAt: string;
        message: string;
        code?: undefined;
    } | {
        ok: boolean;
        alreadyVerified: boolean;
        channel: "mock";
        expiresAt: string;
        code: string;
        message: string;
    }>;
    confirmEmailOtp(userId: string, dto: ConfirmEmailOtpDto): Promise<{
        id: string;
        email: string;
        fullName: string;
        phone: string | null;
        phoneVerified: boolean;
        emailVerified: boolean;
        bankVerified: boolean;
        role: import("@prisma/client").$Enums.Role;
        walletBalance: number;
        partnerProfile: {} | null;
    }>;
}
