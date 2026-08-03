export declare const EMAIL_OTP_MAX_PER_HOUR = 5;
export declare const EMAIL_OTP_WINDOW_MS: number;
export type EmailOtpRateState = {
    emailOtpSendCount: number;
    emailOtpWindowStartedAt: Date | null;
};
export declare function takeEmailOtpSlot(user: EmailOtpRateState): {
    emailOtpSendCount: number;
    emailOtpWindowStartedAt: Date;
};
