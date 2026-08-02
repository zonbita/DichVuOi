"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
exports.normalizeVnPhone = normalizeVnPhone;
const common_1 = require("@nestjs/common");
const ESMS_OTP_URL = 'https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/';
function normalizeVnPhone(raw) {
    let phone = raw.replace(/\s|-/g, '').trim();
    if (phone.startsWith('+84'))
        phone = `84${phone.slice(3)}`;
    if (phone.startsWith('84') && phone.length >= 11)
        return phone;
    if (phone.startsWith('0') && phone.length >= 9)
        return phone;
    if (/^[1-9]\d{8,9}$/.test(phone))
        return `0${phone}`;
    return phone;
}
let SmsService = SmsService_1 = class SmsService {
    logger = new common_1.Logger(SmsService_1.name);
    isLive() {
        const provider = (process.env.SMS_PROVIDER ?? 'mock').toLowerCase();
        if (provider !== 'esms')
            return false;
        return Boolean(process.env.ESMS_API_KEY?.trim() &&
            process.env.ESMS_SECRET_KEY?.trim() &&
            process.env.ESMS_BRANDNAME?.trim());
    }
    providerName() {
        return this.isLive() ? 'esms' : 'mock';
    }
    async sendOtpSms(phone, content) {
        const to = normalizeVnPhone(phone);
        if (!this.isLive()) {
            this.logger.log(`[mock SMS] → ${to}: ${content}`);
            return { ok: true, provider: 'mock' };
        }
        const sandbox = process.env.ESMS_SANDBOX === '1' || process.env.ESMS_SANDBOX === 'true';
        const body = {
            ApiKey: process.env.ESMS_API_KEY.trim(),
            SecretKey: process.env.ESMS_SECRET_KEY.trim(),
            Brandname: process.env.ESMS_BRANDNAME.trim(),
            Phone: to,
            Content: content,
            SmsType: '2',
            IsUnicode: process.env.ESMS_UNICODE === '1' ? '1' : '0',
            Sandbox: sandbox ? '1' : '0',
            RequestId: `dvo_${Date.now().toString(36)}_${to.slice(-4)}`,
        };
        let json;
        try {
            const res = await fetch(ESMS_OTP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            json = (await res.json());
        }
        catch (err) {
            this.logger.error(`eSMS network error: ${err.message}`);
            throw new common_1.BadRequestException('Không gửi được SMS (lỗi mạng tới eSMS). Thử lại sau.');
        }
        const code = String(json.CodeResult ?? '');
        if (code !== '100') {
            this.logger.warn(`eSMS reject CodeResult=${code} ${json.ErrorMessage ?? ''}`.trim());
            throw new common_1.BadRequestException(mapEsmsError(code, json.ErrorMessage) ??
                `Gửi SMS thất bại (eSMS ${code || 'unknown'}).`);
        }
        return {
            ok: true,
            provider: 'esms',
            messageId: json.SMSID,
            sandbox,
        };
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)()
], SmsService);
function mapEsmsError(code, detail) {
    const known = {
        '101': 'eSMS: ApiKey/SecretKey không hợp lệ.',
        '103': 'eSMS: Tài khoản hết tiền.',
        '104': 'eSMS: Brandname chưa đăng ký hoặc không khớp.',
        '108': 'eSMS: Số điện thoại không hợp lệ.',
        '140': 'eSMS: IP chưa whitelist trên portal.',
        '146': 'eSMS: Nội dung chưa khớp template CSKH đã đăng ký. Cập nhật ESMS_OTP_TEMPLATE.',
    };
    if (known[code])
        return known[code];
    if (detail?.trim())
        return `eSMS: ${detail.trim()}`;
    return null;
}
//# sourceMappingURL=sms.service.js.map