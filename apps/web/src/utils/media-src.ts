/**
 * Resolve URL ảnh upload / avatar.
 * - Absolute (http/blob/data) giữ nguyên (Vercel Blob, CDN…).
 * - `/avatars/...` luôn cùng origin web (`public/avatars`) — không gắn API.
 * - `/uploads/...` dùng cùng origin: local Vite proxy tới API; prod web `public/uploads`.
 * - Path tương đối khác: gắn `VITE_API_URL` nếu có.
 */

const warmedUrls = new Set<string>();

/** Prefetch 1 lần / URL để nhiều `<img>` dùng chung cache trình duyệt. */
export function warmMediaUrl(url: string) {
  if (!url || typeof window === 'undefined' || warmedUrls.has(url)) return;
  warmedUrls.add(url);
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
}

function apiBase() {
  return (import.meta.env.VITE_API_URL as string | undefined)?.replace(
    /\/$/,
    '',
  );
}

function toAvatarsPath(url: string): string | null {
  if (url.startsWith('/avatars/')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/avatars/')) return parsed.pathname;
  } catch {
    /* relative / invalid */
  }
  const base = apiBase();
  if (base && url.startsWith(`${base}/avatars/`)) {
    return url.slice(base.length);
  }
  return null;
}

export function mediaSrc(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^(blob:|data:)/i.test(trimmed)) return trimmed;

  const avatars = toAvatarsPath(trimmed);
  if (avatars) {
    warmMediaUrl(avatars);
    return avatars;
  }

  if (/^https?:/i.test(trimmed)) return trimmed;

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (path.startsWith('/uploads/')) {
    const uploadsPublic = (
      import.meta.env.VITE_UPLOADS_PUBLIC_URL as string | undefined
    )?.replace(/\/$/, '');
    return uploadsPublic ? `${uploadsPublic}${path}` : path;
  }

  const base = apiBase();
  return base ? `${base}${path}` : path;
}
