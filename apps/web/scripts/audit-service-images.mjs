/**
 * Audit: ảnh trùng / thiếu cho từng nghề (mirror logic catalog-images.ts).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { catalogGroups } from '../../api/prisma/catalog-data.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(__dirname, '..');
const BY_SERVICE = path.join(WEB, 'src/assets/services/by-service');
const MAP_PATH = path.join(WEB, 'src/utils/service-image-map.generated.json');

const generatedServiceImages = Object.fromEntries(
  fs
    .readdirSync(BY_SERVICE)
    .filter((f) => f.endsWith('.jpg'))
    .map((f) => [f.replace(/\.jpg$/, ''), `by-service/${f}`]),
);

const { assignments } = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));

function resolveImageFile(filename) {
  const slug = filename.replace(/\.jpg$/, '');
  if (generatedServiceImages[slug]) return generatedServiceImages[slug];
  return filename;
}

function resolveImage(service) {
  const mappedFile = assignments[service.slug];
  if (mappedFile) {
    const slug = mappedFile.replace(/\.jpg$/, '');
    const kind = generatedServiceImages[slug] ? 'dedicated' : 'fallback';
    return { src: resolveImageFile(mappedFile), kind };
  }
  if (generatedServiceImages[service.slug]) {
    return { src: generatedServiceImages[service.slug], kind: 'dedicated' };
  }
  return { src: `group:${service.group}`, kind: 'group' };
}

const services = catalogGroups.flatMap((g) =>
  g.categories.flatMap((c) =>
    c.services.map((s) => ({
      slug: s.slug,
      name: s.name,
      group: g.slug,
      category: c.slug,
      online: s.supportsOnline,
    })),
  ),
);

/** Gán ảnh by-service của slug khác cho nghề này (sai). */
const wrongCrossSlug = services.filter((s) => {
  const mapped = assignments[s.slug];
  if (!mapped) return false;
  const stem = mapped.replace(/\.jpg$/, '');
  return generatedServiceImages[stem] && stem !== s.slug;
});

const bySrc = new Map();
for (const s of services) {
  const { src, kind } = resolveImage(s);
  if (!bySrc.has(src)) bySrc.set(src, []);
  bySrc.get(src).push({ ...s, kind });
}

const dupes = [...bySrc.entries()].filter(([, list]) => list.length > 1);
dupes.sort((a, b) => b[1].length - a[1].length);

if (wrongCrossSlug.length) {
  console.log('=== WRONG CROSS-SLUG ASSIGNMENTS ===');
  for (const s of wrongCrossSlug) {
    console.log(`  - ${s.slug} → ${assignments[s.slug]} (ảnh của slug khác)`);
  }
} else {
  console.log('=== WRONG CROSS-SLUG ASSIGNMENTS ===');
  console.log('  (none)');
}

console.log('\n=== DUPLICATE IMAGE ASSIGNMENTS ===');
for (const [src, list] of dupes.slice(0, 30)) {
  console.log(`\n${src} (${list.length} nghề):`);
  for (const s of list) {
    console.log(`  - ${s.slug} [${s.kind}] ${s.online ? 'online' : 'offline'} | ${s.group}/${s.category}`);
  }
}

const onlineDupes = dupes.filter(([, list]) => list.some((s) => s.online) && list.filter((s) => s.online).length > 1);
console.log(`\n=== SUMMARY ===`);
console.log(`Total services: ${services.length}`);
console.log(`Dedicated images: ${Object.keys(generatedServiceImages).length}`);
console.log(`Wrong cross-slug: ${wrongCrossSlug.length}`);
console.log(`Duplicate image groups: ${dupes.length}`);
console.log(`Online services in duplicate groups: ${onlineDupes.reduce((n, [, l]) => n + l.filter((s) => s.online).length, 0)}`);
