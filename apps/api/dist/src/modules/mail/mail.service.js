"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer_1 = __importDefault(require("nodemailer"));
let MailService = MailService_1 = class MailService {
    logger = new common_1.Logger(MailService_1.name);
    isConfigured() {
        return this.gmailConfigured();
    }
    gmailConfigured() {
        return Boolean(process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim());
    }
    async send(opts) {
        const to = opts.to.trim().toLowerCase();
        const html = opts.html ?? `<p>${opts.text.replace(/\n/g, '<br/>')}</p>`;
        if (!this.gmailConfigured()) {
            return this.mock(to, opts.subject, opts.text, 'Thiếu GMAIL_USER + GMAIL_APP_PASSWORD trong apps/api/.env');
        }
        return this.sendViaGmail(to, opts.subject, opts.text, html);
    }
    mock(to, subject, text, mockReason) {
        this.logger.warn(`[mock mail] ${mockReason}`);
        this.logger.log(`[mock mail] → ${to}: ${subject}\n${text}`);
        return { ok: true, provider: 'mock', mockReason };
    }
    async sendViaGmail(to, subject, text, html) {
        const user = process.env.GMAIL_USER.trim();
        const pass = process.env.GMAIL_APP_PASSWORD.trim().replace(/\s+/g, '');
        const fromName = process.env.EMAIL_FROM?.match(/^(.+?)\s*</)?.[1]?.trim() || 'DichVuOi';
        try {
            const transporter = nodemailer_1.default.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: { user, pass },
            });
            const info = await transporter.sendMail({
                from: `"${fromName}" <${user}>`,
                to,
                subject,
                text,
                html,
            });
            return { ok: true, provider: 'gmail', id: info.messageId };
        }
        catch (err) {
            const detail = err.message;
            this.logger.error(`Gmail SMTP: ${detail}`);
            return {
                ok: true,
                provider: 'mock',
                mockReason: /Invalid login|Username and Password not accepted|EAUTH/i.test(detail)
                    ? 'Gmail App Password sai / chưa bật 2FA. Tạo lại tại https://myaccount.google.com/apppasswords'
                    : `Gmail từ chối: ${detail}`,
            };
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)()
], MailService);
//# sourceMappingURL=mail.service.js.map