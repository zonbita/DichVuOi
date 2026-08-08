/**
 * Env helpers for production hardening (mock payments, secrets).
 */

const WEAK_JWT = new Set([
  '',
  'change-me-in-production',
  'dichvuoi-dev-secret',
]);

const WEAK_VIETQR = new Set(['', 'dichvuoi-dev-vietqr-secret']);

export function isProductionLike(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production'
  );
}

/** Email/mật khẩu: bật ở local; product chỉ Google. Override: ALLOW_PASSWORD_AUTH=1|0. */
export function allowPasswordAuth(): boolean {
  const flag = process.env.ALLOW_PASSWORD_AUTH?.trim().toLowerCase();
  if (flag === '1' || flag === 'true') return true;
  if (flag === '0' || flag === 'false') return false;
  return !isProductionLike();
}

/** Parse ALLOW_MOCK_PAYMENTS; default = on outside production-like envs. */
export function allowMockPayments(): boolean {
  const flag = process.env.ALLOW_MOCK_PAYMENTS?.trim().toLowerCase();
  if (flag === '1' || flag === 'true' || flag === 'yes') return true;
  if (flag === '0' || flag === 'false' || flag === 'no') return false;
  return !isProductionLike();
}

export function resolveJwtSecret(): string {
  const raw = process.env.JWT_SECRET?.trim() ?? '';
  const weak = WEAK_JWT.has(raw) || raw.length < 16;
  if (isProductionLike()) {
    if (weak) {
      throw new Error(
        'JWT_SECRET must be set to a strong value (≥16 chars) in production',
      );
    }
    return raw;
  }
  if (weak) {
    console.warn(
      '[security] Weak/missing JWT_SECRET — using dev fallback. Set JWT_SECRET before production.',
    );
    return raw.length >= 8 ? raw : 'dichvuoi-dev-secret';
  }
  return raw;
}

export function resolveVietQrIntentSecret(): string {
  const raw = process.env.VIETQR_INTENT_SECRET?.trim() ?? '';
  const weak = WEAK_VIETQR.has(raw) || raw.length < 16;
  if (isProductionLike()) {
    if (weak) {
      throw new Error(
        'VIETQR_INTENT_SECRET must be set to a strong value (≥16 chars) in production',
      );
    }
    return raw;
  }
  if (weak) {
    console.warn(
      '[security] Weak/missing VIETQR_INTENT_SECRET — using dev fallback.',
    );
    return raw.length >= 8 ? raw : 'dichvuoi-dev-vietqr-secret';
  }
  return raw;
}

/** Call once at bootstrap so misconfig fails fast. */
export function assertBootSecrets(): void {
  resolveJwtSecret();
  resolveVietQrIntentSecret();
  if (isProductionLike() && allowMockPayments()) {
    console.warn(
      '[security] ALLOW_MOCK_PAYMENTS is ON in production — free wallet credit / bank mock-verify are enabled.',
    );
  }
}
