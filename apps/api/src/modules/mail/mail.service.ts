import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

export type MailSendResult = {
  ok: true;
  /** gmail = gửi thật; mock = OTP hiện trên web */
  provider: 'gmail' | 'mock';
  id?: string;
  mockReason?: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  isConfigured(): boolean {
    return this.gmailConfigured();
  }

  private gmailConfigured() {
    return Boolean(
      process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim(),
    );
  }

  /**
   * Gmail App Password → mock nếu thiếu/lỗi.
   */
  async send(opts: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<MailSendResult> {
    const to = opts.to.trim().toLowerCase();
    const html =
      opts.html ?? `<p>${opts.text.replace(/\n/g, '<br/>')}</p>`;

    if (!this.gmailConfigured()) {
      return this.mock(
        to,
        opts.subject,
        opts.text,
        'Thiếu GMAIL_USER + GMAIL_APP_PASSWORD trong apps/api/.env',
      );
    }

    return this.sendViaGmail(to, opts.subject, opts.text, html);
  }

  private mock(
    to: string,
    subject: string,
    text: string,
    mockReason: string,
  ): MailSendResult {
    this.logger.warn(`[mock mail] ${mockReason}`);
    this.logger.log(`[mock mail] → ${to}: ${subject}\n${text}`);
    return { ok: true, provider: 'mock', mockReason };
  }

  /** Gmail SMTP + App Password — free ~100–500 mail/ngày. */
  private async sendViaGmail(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<MailSendResult> {
    const user = process.env.GMAIL_USER!.trim();
    const pass = process.env.GMAIL_APP_PASSWORD!.trim().replace(/\s+/g, '');
    const fromName =
      process.env.EMAIL_FROM?.match(/^(.+?)\s*</)?.[1]?.trim() || 'DichVuOi';

    try {
      const transporter = nodemailer.createTransport({
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
    } catch (err) {
      const detail = (err as Error).message;
      this.logger.error(`Gmail SMTP: ${detail}`);
      return {
        ok: true,
        provider: 'mock',
        mockReason: /Invalid login|Username and Password not accepted|EAUTH/i.test(
          detail,
        )
          ? 'Gmail App Password sai / chưa bật 2FA. Tạo lại tại https://myaccount.google.com/apppasswords'
          : `Gmail từ chối: ${detail}`,
      };
    }
  }
}
