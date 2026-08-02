import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { SmsSendResult } from './sms.types';

const ESMS_OTP_URL =
  'https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/';

type EsmsResponse = {
  CodeResult?: string;
  SMSID?: string;
  ErrorMessage?: string;
};

/** Chuẩn hoá SĐT VN cho eSMS (0xxxxxxxxx hoặc 84xxxxxxxxx). */
export function normalizeVnPhone(raw: string): string {
  let phone = raw.replace(/\s|-/g, '').trim();
  if (phone.startsWith('+84')) phone = `84${phone.slice(3)}`;
  if (phone.startsWith('84') && phone.length >= 11) return phone;
  if (phone.startsWith('0') && phone.length >= 9) return phone;
  if (/^[1-9]\d{8,9}$/.test(phone)) return `0${phone}`;
  return phone;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  /** Đủ ApiKey + Secret + Brandname → gửi qua eSMS; không thì mock. */
  isLive(): boolean {
    const provider = (process.env.SMS_PROVIDER ?? 'mock').toLowerCase();
    if (provider !== 'esms') return false;
    return Boolean(
      process.env.ESMS_API_KEY?.trim() &&
        process.env.ESMS_SECRET_KEY?.trim() &&
        process.env.ESMS_BRANDNAME?.trim(),
    );
  }

  providerName(): 'esms' | 'mock' {
    return this.isLive() ? 'esms' : 'mock';
  }

  /**
   * Gửi SMS Brandname CSKH (SmsType=2).
   * Nội dung nên khớp template đã đăng ký trên eSMS (tránh lỗi 146).
   */
  async sendOtpSms(phone: string, content: string): Promise<SmsSendResult> {
    const to = normalizeVnPhone(phone);
    if (!this.isLive()) {
      this.logger.log(`[mock SMS] → ${to}: ${content}`);
      return { ok: true, provider: 'mock' };
    }

    const sandbox = process.env.ESMS_SANDBOX === '1' || process.env.ESMS_SANDBOX === 'true';
    const body = {
      ApiKey: process.env.ESMS_API_KEY!.trim(),
      SecretKey: process.env.ESMS_SECRET_KEY!.trim(),
      Brandname: process.env.ESMS_BRANDNAME!.trim(),
      Phone: to,
      Content: content,
      SmsType: '2',
      IsUnicode: process.env.ESMS_UNICODE === '1' ? '1' : '0',
      Sandbox: sandbox ? '1' : '0',
      RequestId: `dvo_${Date.now().toString(36)}_${to.slice(-4)}`,
    };

    let json: EsmsResponse;
    try {
      const res = await fetch(ESMS_OTP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      json = (await res.json()) as EsmsResponse;
    } catch (err) {
      this.logger.error(`eSMS network error: ${(err as Error).message}`);
      throw new BadRequestException(
        'Không gửi được SMS (lỗi mạng tới eSMS). Thử lại sau.',
      );
    }

    const code = String(json.CodeResult ?? '');
    if (code !== '100') {
      this.logger.warn(
        `eSMS reject CodeResult=${code} ${json.ErrorMessage ?? ''}`.trim(),
      );
      throw new BadRequestException(
        mapEsmsError(code, json.ErrorMessage) ??
          `Gửi SMS thất bại (eSMS ${code || 'unknown'}).`,
      );
    }

    return {
      ok: true,
      provider: 'esms',
      messageId: json.SMSID,
      sandbox,
    };
  }
}

function mapEsmsError(code: string, detail?: string): string | null {
  const known: Record<string, string> = {
    '101': 'eSMS: ApiKey/SecretKey không hợp lệ.',
    '103': 'eSMS: Tài khoản hết tiền.',
    '104': 'eSMS: Brandname chưa đăng ký hoặc không khớp.',
    '108': 'eSMS: Số điện thoại không hợp lệ.',
    '140': 'eSMS: IP chưa whitelist trên portal.',
    '146':
      'eSMS: Nội dung chưa khớp template CSKH đã đăng ký. Cập nhật ESMS_OTP_TEMPLATE.',
  };
  if (known[code]) return known[code];
  if (detail?.trim()) return `eSMS: ${detail.trim()}`;
  return null;
}
