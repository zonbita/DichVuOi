import { HttpException, HttpStatus } from '@nestjs/common';

/** Tối đa 5 OTP email / user / giờ (xác minh email + STK dùng chung). */
export const EMAIL_OTP_MAX_PER_HOUR = 5;
export const EMAIL_OTP_WINDOW_MS = 60 * 60 * 1000;

export type EmailOtpRateState = {
  emailOtpSendCount: number;
  emailOtpWindowStartedAt: Date | null;
};

/**
 * Kiểm tra hạn mức gửi OTP email. Trả về giá trị đếm để ghi DB sau khi gửi.
 * @throws HttpException 429 nếu vượt 5 lần / giờ
 */
export function takeEmailOtpSlot(user: EmailOtpRateState): {
  emailOtpSendCount: number;
  emailOtpWindowStartedAt: Date;
} {
  const now = Date.now();
  const windowStart = user.emailOtpWindowStartedAt?.getTime() ?? 0;
  const inWindow = windowStart > 0 && now - windowStart < EMAIL_OTP_WINDOW_MS;

  if (inWindow && user.emailOtpSendCount >= EMAIL_OTP_MAX_PER_HOUR) {
    const retryAfterSec = Math.ceil(
      (windowStart + EMAIL_OTP_WINDOW_MS - now) / 1000,
    );
    const mins = Math.max(1, Math.ceil(retryAfterSec / 60));
    throw new HttpException(
      `Bạn đã gửi quá ${EMAIL_OTP_MAX_PER_HOUR} mã OTP email trong 1 giờ. Thử lại sau khoảng ${mins} phút.`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  if (!inWindow) {
    return {
      emailOtpSendCount: 1,
      emailOtpWindowStartedAt: new Date(now),
    };
  }

  return {
    emailOtpSendCount: user.emailOtpSendCount + 1,
    emailOtpWindowStartedAt: user.emailOtpWindowStartedAt!,
  };
}
