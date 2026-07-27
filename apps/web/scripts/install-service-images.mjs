/**
 * Copy ảnh đã generate vào đúng thư mục web app.
 * Usage: node apps/web/scripts/install-service-images.mjs [sourceDir]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '..');
const BY_SERVICE = path.join(WEB_ROOT, 'src/assets/services/by-service');
const ASSETS_ROOT = path.join(WEB_ROOT, 'src/assets');
const DEFAULT_SOURCE =
  process.argv[2] ??
  path.resolve(process.env.USERPROFILE ?? '', '.cursor/projects/c-zzzzzzzzzzzzzzzzzzz-DichVuOi/assets');

import { IN_USE_SERVICE_SLUGS } from './in-use-service-slugs.mjs';

const IN_USE = new Set(IN_USE_SERVICE_SLUGS);

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`✓ ${path.basename(dest)}`);
}

if (!fs.existsSync(DEFAULT_SOURCE)) {
  console.error('Source not found:', DEFAULT_SOURCE);
  process.exit(1);
}

const BANNERS = ['banner-don-nha.jpg', 'banner-dien-nuoc.jpg', 'banner-gia-su.jpg'];

for (const name of fs.readdirSync(DEFAULT_SOURCE).filter((f) => f.endsWith('.jpg'))) {
  const src = path.join(DEFAULT_SOURCE, name);
  if (BANNERS.includes(name)) {
    copyFile(src, path.join(ASSETS_ROOT, name));
    continue;
  }
  const slug = name.replace(/-v\d+\.jpg$/, '').replace('.jpg', '');
  if (!IN_USE.has(slug)) continue;
  const destName = `${slug}.jpg`;
  copyFile(src, path.join(BY_SERVICE, destName));
}

// Dọn file banner/hero lẻ trong by-service (không thuộc slug nghề)
for (const stray of ['banner-don-nha.jpg', 'banner-dien-nuoc.jpg', 'banner-gia-su.jpg', 'hero-dichvuoi.jpg']) {
  const strayPath = path.join(BY_SERVICE, stray);
  if (fs.existsSync(strayPath)) {
    fs.unlinkSync(strayPath);
    console.log(`✗ removed stray ${stray} from by-service`);
  }
}

console.log('Done.');
