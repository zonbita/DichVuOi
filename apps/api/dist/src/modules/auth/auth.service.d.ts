import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { ConfirmPhoneOtpDto, GoogleLoginDto, LoginDto, RegisterDto, RequestPhoneOtpDto } from './dto/auth.dto';
export declare function otpNameSlug(fullName: string): string;
export declare function buildOneTimePhoneKey(fullName: string, code: string): string;
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly sms;
    constructor(prisma: PrismaService, jwt: JwtService, sms: SmsService);
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
        role: import("@prisma/client").$Enums.Role;
        walletBalance: number;
        partnerProfile: {} | null;
    }>;
}
