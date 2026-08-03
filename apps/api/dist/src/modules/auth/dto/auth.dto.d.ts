export declare class RegisterDto {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    enableOffering?: boolean;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class GoogleLoginDto {
    idToken: string;
}
export declare class RequestPhoneOtpDto {
    phone: string;
}
export declare class ConfirmPhoneOtpDto {
    key: string;
}
export declare class RequestEmailOtpDto {
    email: string;
}
export declare class ConfirmEmailOtpDto {
    code: string;
}
