import type { AuthUser } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { ConfirmPhoneOtpDto, GoogleLoginDto, LoginDto, RegisterDto, RequestPhoneOtpDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    me(user: AuthUser): Promise<{
        id: string;
        email: string;
        fullName: string;
        phone: string | null;
        phoneVerified: boolean;
        role: import("@prisma/client").$Enums.Role;
        walletBalance: number;
        partnerProfile: {} | null;
    }>;
    requestPhoneOtp(user: AuthUser, dto: RequestPhoneOtpDto): Promise<{
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
    confirmPhoneOtp(user: AuthUser, dto: ConfirmPhoneOtpDto): Promise<{
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
