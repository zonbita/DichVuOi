import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * - Unset / `*` → reflect request origin (works cross-site with credentials)
 * - Comma list → exact match
 * - On Vercel, also allow `*.vercel.app` so preview FE can call API
 */
export function buildCorsOrigin(): CorsOptions['origin'] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw || raw === '*') {
    return true;
  }

  const allowlist = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowlist.includes(origin)) {
      callback(null, true);
      return;
    }
    if (process.env.VERCEL && /\.vercel\.app$/i.test(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  };
}
