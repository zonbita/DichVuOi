/**
 * Nén ảnh catalog/hero/logo in-place để giảm kích thước tải trang.
 * Usage: node scripts/optimize-images.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsRoot = path.resolve(__dirname, '../src/assets');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function kindFor(relPosix) {
  const base = path.basename(relPosix).toLowerCase();
  if (base.startsWith('banner-hang-ngan') || base.startsWith('banner-uy-tin')) {
    return 'hero';
  }
  if (base.startsWith('logo-icon')) return 'logo';
  if (relPosix.includes('/banners/') || base.startsWith('banner-')) return 'banner';
  return 'service';
}

const PRESETS = {
  hero: { maxW: 1600, maxH: 900, quality: 78, webp: true },
  logo: { maxW: 192, maxH: 192, quality: 82, webp: true },
  banner: { maxW: 1400, maxH: 900, quality: 75, webp: false },
  service: { maxW: 960, maxH: 720, quality: 72, webp: false },
};

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

async function optimizeFile(file) {
  const rel = path.relative(assetsRoot, file).split(path.sep).join('/');
  const preset = PRESETS[kindFor(rel)];
  const ext = path.extname(file).toLowerCase();
  const before = (await fs.stat(file)).size;

  const pipeline = sharp(file, { failOn: 'none' }).rotate().resize({
    width: preset.maxW,
    height: preset.maxH,
    fit: 'inside',
    withoutEnlargement: true,
  });

  let outBuf;
  let outPath = file;
  if (preset.webp || ext === '.png') {
    // Hero/logo PNG → WebP sibling; keep original only if webp smaller path used by code.
    outPath = file.replace(/\.(png|jpe?g|webp)$/i, '.webp');
    outBuf = await pipeline.webp({ quality: preset.quality, effort: 4 }).toBuffer();
  } else if (ext === '.jpg' || ext === '.jpeg') {
    outBuf = await pipeline
      .jpeg({ quality: preset.quality, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toBuffer();
  } else {
    outBuf = await pipeline.webp({ quality: preset.quality, effort: 4 }).toBuffer();
  }

  // Chỉ ghi nếu nhỏ hơn rõ rệt (≥8%) hoặc đổi sang webp mới.
  const isNewWebp = outPath !== file;
  if (!isNewWebp && outBuf.length >= before * 0.92) {
    return { rel, before, after: before, skipped: true };
  }

  await fs.writeFile(outPath, outBuf);

  // Hero/logo: giữ PNG gốc chỉ khi webp đã tạo; có thể xóa PNG sau khi code trỏ webp.
  if (isNewWebp && (kindFor(rel) === 'hero' || kindFor(rel) === 'logo')) {
    // keep png temporarily for safety; code will import webp
  }

  const after = outBuf.length;
  return { rel: path.relative(assetsRoot, outPath).split(path.sep).join('/'), before, after, skipped: false };
}

async function main() {
  const files = await walk(assetsRoot);
  let saved = 0;
  let beforeTotal = 0;
  let afterTotal = 0;
  for (const file of files) {
    try {
      const result = await optimizeFile(file);
      beforeTotal += result.before;
      afterTotal += result.skipped ? result.before : result.after;
      if (!result.skipped) {
        saved += result.before - result.after;
        const pct = Math.round((1 - result.after / result.before) * 100);
        console.log(
          `✓ ${result.rel}  ${(result.before / 1024).toFixed(0)}KB → ${(result.after / 1024).toFixed(0)}KB (−${pct}%)`,
        );
      }
    } catch (err) {
      console.error(`✗ ${file}:`, err.message);
    }
  }
  console.log(
    `\nDone. Saved ~${(saved / 1024 / 1024).toFixed(1)} MB (before ${(beforeTotal / 1024 / 1024).toFixed(1)} MB → after ~${(afterTotal / 1024 / 1024).toFixed(1)} MB tracked).`,
  );
}

main();
