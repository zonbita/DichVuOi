import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Writable uploads root.
 * Vercel FS is read-only except `/tmp` — production uploads must use Vercel Blob.
 */
export function resolveUploadsRoot(): string {
  const fromEnv = process.env.UPLOADS_DIR?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL) return join('/tmp', 'dichvuoi-uploads');
  return join(process.cwd(), 'uploads');
}

/** Ảnh đóng gói theo repo (`apps/api/uploads`) — chỉ đọc, không ghi trên Vercel. */
export function resolveBundledUploadsRoot(): string | null {
  const bundled = join(process.cwd(), 'uploads');
  return existsSync(bundled) ? bundled : null;
}

export function ensureUploadsRoot(): string {
  const root = resolveUploadsRoot();
  try {
    if (!existsSync(root)) {
      mkdirSync(root, { recursive: true });
    }
  } catch {
    // Serverless may already have /tmp; skip hard fail on bootstrap.
  }
  return root;
}
