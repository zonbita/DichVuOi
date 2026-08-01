import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Vercel FS is read-only except `/tmp`. Local/dev uses `./uploads`.
 */
export function resolveUploadsRoot(): string {
  const fromEnv = process.env.UPLOADS_DIR?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL) return join('/tmp', 'dichvuoi-uploads');
  return join(process.cwd(), 'uploads');
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
