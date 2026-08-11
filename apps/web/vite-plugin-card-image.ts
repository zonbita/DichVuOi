import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import type { Plugin } from 'vite';

const CARD_W = 360;
const CARD_H = 240;

function wantsCard(id: string) {
  return /[?&]card(?:=|&|$)/.test(id) && /\.(jpe?g|png|webp)(?:\?|$)/i.test(id);
}

export function cardImagePlugin(): Plugin {
  let command: 'build' | 'serve' = 'build';
  const cacheDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../node_modules/.cache/dichvuoi-card',
  );

  return {
    name: 'dichvuoi-card-image',
    enforce: 'pre',
    configResolved(config) {
      command = config.command;
    },
    async load(id) {
      if (!wantsCard(id)) return null;
      const file = id.split('?')[0];
      const stat = await fs.stat(file);
      const key = createHash('sha1')
        .update(`${file}:${stat.mtimeMs}:${stat.size}`)
        .digest('hex')
        .slice(0, 12);
      const cached = path.join(
        cacheDir,
        `${path.parse(file).name}-${key}.jpg`,
      );
      await fs.mkdir(cacheDir, { recursive: true });
      try {
        await fs.access(cached);
      } catch {
        const buf = await sharp(file)
          .rotate()
          .resize(CARD_W, CARD_H, { fit: 'cover' })
          .jpeg({ quality: 68, mozjpeg: true })
          .toBuffer();
        await fs.writeFile(cached, buf);
      }

      if (command === 'serve') {
        const url = `/@fs/${cached.replace(/\\/g, '/')}`;
        return `export default ${JSON.stringify(url)}`;
      }

      const source = await fs.readFile(cached);
      const ref = this.emitFile({
        type: 'asset',
        name: `${path.parse(file).name}-card.jpg`,
        source,
      });
      return `export default import.meta.ROLLUP_FILE_URL_${ref}`;
    },
  };
}
