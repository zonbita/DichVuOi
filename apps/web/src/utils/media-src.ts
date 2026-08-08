/**
 * Resolve URL ảnh upload.
 * - Absolute (http/blob/data) giữ nguyên (Vercel Blob, CDN…).
 * - `/uploads/...` dùng cùng origin: local Vite proxy → API; prod web `public/uploads`.
 * - Path tương đối khác: gắn `VITE_API_URL` nếu có.
 */
export function mediaSrc(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^(https?:|blob:|data:)/i.test(trimmed)) return trimmed;

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (path.startsWith('/uploads/')) {
    const uploadsPublic = (
      import.meta.env.VITE_UPLOADS_PUBLIC_URL as string | undefined
    )?.replace(/\/$/, '');
    return uploadsPublic ? `${uploadsPublic}${path}` : path;
  }

  const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(
    /\/$/,
    '',
  );
  return apiBase ? `${apiBase}${path}` : path;
}
