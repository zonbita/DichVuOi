/**
 * Nơi DUY NHẤT trong API được đọc `process.env`.
 *
 * - Mỗi biến có kiểu rõ ràng và giá trị mặc định tại một chỗ.
 * - Đọc lười (getter) để giá trị luôn phản ánh env hiện tại — dotenv do
 *   ConfigModule nạp, và test có thể ghi đè `process.env` trước khi gọi.
 * - `validateEnv` chạy lúc khởi động qua `ConfigModule.forRoot({ validate })`
 *   và chặn boot nếu thiếu biến bắt buộc ở môi trường production.
 */

type RawEnv = Record<string, string | undefined>;

function str(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v ? v : undefined;
}

function strOr(name: string, fallback: string): string {
  return str(name) ?? fallback;
}

/** '1' | 'true' | 'yes' → true, '0' | 'false' | 'no' → false, khác → undefined. */
function flag(name: string): boolean | undefined {
  const v = str(name)?.toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes') return true;
  if (v === '0' || v === 'false' || v === 'no') return false;
  return undefined;
}

function int(name: string, fallback: number): number {
  const v = str(name);
  if (v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  // Runtime
  get nodeEnv() {
    return strOr('NODE_ENV', 'development');
  },
  get vercel() {
    return Boolean(str('VERCEL'));
  },
  get vercelEnv() {
    return str('VERCEL_ENV');
  },
  get isProductionLike() {
    return this.nodeEnv === 'production' || this.vercelEnv === 'production';
  },
  get port() {
    return int('PORT', 3001);
  },
  get enableSwagger() {
    return str('ENABLE_SWAGGER') === '1';
  },

  // HTTP / CORS
  get corsOrigin() {
    return str('CORS_ORIGIN');
  },
  get webOrigin() {
    return str('WEB_ORIGIN');
  },

  // Auth
  get jwtSecret() {
    return str('JWT_SECRET') ?? '';
  },
  get allowPasswordAuth() {
    return flag('ALLOW_PASSWORD_AUTH');
  },
  get googleClientId() {
    return str('GOOGLE_CLIENT_ID');
  },

  // Payments
  get allowMockPayments() {
    return flag('ALLOW_MOCK_PAYMENTS');
  },
  get vietQrIntentSecret() {
    return str('VIETQR_INTENT_SECRET') ?? '';
  },
  /** BIN ngân hàng VietQR; không có mặc định ở đây vì mỗi nơi dùng mặc định khác nhau. */
  get vietQrBankId() {
    return str('VIETQR_BANK_ID');
  },
  get vietQrAccountNo() {
    return strOr('VIETQR_ACCOUNT_NO', '19002888');
  },
  get vietQrAccountName() {
    return strOr('VIETQR_ACCOUNT_NAME', 'DICH VU OI');
  },
  get payosClientId() {
    return str('PAYOS_CLIENT_ID') ?? '';
  },
  get payosApiKey() {
    return str('PAYOS_API_KEY') ?? '';
  },
  get payosChecksumKey() {
    return str('PAYOS_CHECKSUM_KEY') ?? '';
  },

  // Mail
  get gmailUser() {
    return str('GMAIL_USER');
  },
  /** App password của Gmail thường được dán kèm khoảng trắng — bỏ đi. */
  get gmailAppPassword() {
    return str('GMAIL_APP_PASSWORD')?.replace(/\s+/g, '');
  },
  get emailFrom() {
    return str('EMAIL_FROM');
  },

  // SMS
  get smsProvider() {
    return strOr('SMS_PROVIDER', 'mock').toLowerCase();
  },
  get esmsApiKey() {
    return str('ESMS_API_KEY');
  },
  get esmsSecretKey() {
    return str('ESMS_SECRET_KEY');
  },
  get esmsBrandname() {
    return str('ESMS_BRANDNAME');
  },
  get esmsSandbox() {
    return flag('ESMS_SANDBOX') === true;
  },
  get esmsUnicode() {
    return str('ESMS_UNICODE') === '1';
  },
  get esmsOtpTemplate() {
    return str('ESMS_OTP_TEMPLATE');
  },

  // Storage
  get uploadsDir() {
    return str('UPLOADS_DIR');
  },
  get blobReadWriteToken() {
    return str('BLOB_READ_WRITE_TOKEN');
  },
};

/** Biến bắt buộc khi chạy production. */
const REQUIRED_IN_PRODUCTION = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN'];

/**
 * Validator cho `ConfigModule.forRoot({ validate })`.
 * Chỉ kiểm tra sự tồn tại/định dạng; độ mạnh secret do `assertBootSecrets` lo.
 */
export function validateEnv(raw: RawEnv): RawEnv {
  const errors: string[] = [];
  const isProd =
    raw.NODE_ENV === 'production' || raw.VERCEL_ENV === 'production';

  if (isProd) {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!raw[key]?.trim()) errors.push(`${key} is required in production`);
    }
  }

  const port = raw.PORT?.trim();
  if (port && !/^\d+$/.test(port)) errors.push('PORT must be an integer');

  const sms = raw.SMS_PROVIDER?.trim().toLowerCase();
  if (sms && sms !== 'mock' && sms !== 'esms') {
    errors.push('SMS_PROVIDER must be "mock" or "esms"');
  }

  if (errors.length) {
    throw new Error(`Invalid environment:\n  - ${errors.join('\n  - ')}`);
  }
  return raw;
}
