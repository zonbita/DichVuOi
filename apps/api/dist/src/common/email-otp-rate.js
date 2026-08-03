"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMAIL_OTP_WINDOW_MS = exports.EMAIL_OTP_MAX_PER_HOUR = void 0;
exports.takeEmailOtpSlot = takeEmailOtpSlot;
const common_1 = require("@nestjs/common");
exports.EMAIL_OTP_MAX_PER_HOUR = 5;
exports.EMAIL_OTP_WINDOW_MS = 60 * 60 * 1000;
function takeEmailOtpSlot(user) {
    const now = Date.now();
    const windowStart = user.emailOtpWindowStartedAt?.getTime() ?? 0;
    const inWindow = windowStart > 0 && now - windowStart < exports.EMAIL_OTP_WINDOW_MS;
    if (inWindow && user.emailOtpSendCount >= exports.EMAIL_OTP_MAX_PER_HOUR) {
        const retryAfterSec = Math.ceil((windowStart + exports.EMAIL_OTP_WINDOW_MS - now) / 1000);
        const mins = Math.max(1, Math.ceil(retryAfterSec / 60));
        throw new common_1.HttpException(`Bạn đã gửi quá ${exports.EMAIL_OTP_MAX_PER_HOUR} mã OTP email trong 1 giờ. Thử lại sau khoảng ${mins} phút.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
    }
    if (!inWindow) {
        return {
            emailOtpSendCount: 1,
            emailOtpWindowStartedAt: new Date(now),
        };
    }
    return {
        emailOtpSendCount: user.emailOtpSendCount + 1,
        emailOtpWindowStartedAt: user.emailOtpWindowStartedAt,
    };
}
//# sourceMappingURL=email-otp-rate.js.map