/**
 * Sinh map slug → file ảnh (unique trong từng danh mục, ưu tiên nghề online).
 * Chạy: node apps/web/scripts/generate-service-image-map.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { catalogGroups } from '../../api/prisma/catalog-data.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(__dirname, '..');
const BY_SERVICE = path.join(WEB, 'src/assets/services/by-service');
const SVC_DIR = path.join(WEB, 'src/assets/services');
const OUT = path.join(WEB, 'src/utils/service-image-map.generated.json');

const categoryImages = {
  've-sinh': 'svc-ve-sinh.jpg',
  'sofa-rem-tham': 'svc-sofa-rem.jpg',
  'khu-khuan': 'svc-khu-khuan.jpg',
  'dien-lanh': 'svc-dien-lanh.jpg',
  'dien-nuoc': 'sua-dien-nuoc.jpg',
  'camera-mang': 'svc-camera-mang.jpg',
  'son-chong-tham': 'svc-son-chong-tham.jpg',
  'hoan-thien': 'svc-hoan-thien.jpg',
  'op-lat-thach-cao': 'svc-op-lat.jpg',
  'cham-soc-tai-nha': 'svc-cham-soc-tai-nha.jpg',
  'trong-tre': 'svc-trong-tre.jpg',
  'lam-dep-tai-nha': 'svc-lam-dep-tai-nha.jpg',
  'toc-goi-dau': 'svc-toc-goi-dau.jpg',
  'nau-an-doi-song': 'svc-nau-an.jpg',
  'van-chuyen': 'svc-van-chuyen.jpg',
  'gia-su': 'svc-gia-su.jpg',
  'nhac-hoa-tin-hoc': 'svc-nhac-hoa.jpg',
  esports: 'svc-esports.jpg',
  'cong-nghe': 'svc-cong-nghe.jpg',
  'tu-dong-hoa': 'svc-excel.jpg',
  'sang-tao': 'svc-sang-tao.jpg',
  'content-kenh': 'svc-content.jpg',
  'su-kien-truyen-thong': 'svc-su-kien-tt.jpg',
  'cham-soc-pet': 'svc-cham-soc-pet.jpg',
  'pt-the-thao': 'svc-pt-the-thao.jpg',
  'van-phong': 'svc-van-phong.jpg',
  'hanh-chinh': 'svc-hanh-chinh.jpg',
  'san-vuon-ngoai-troi': 'svc-san-vuon-ngoai-troi.jpg',
  'su-kien-truc-tuyen': 'svc-su-kien-2.jpg',
  'huan-luyen-online': 'svc-the-thao-2.jpg',
  'van-hanh-tu-xa': 'svc-doanh-nghiep-2.jpg',
  'quang-cao-so': 'svc-sang-tao.jpg',
  'van-hanh-kenh-ban': 'svc-content.jpg',
  'bien-dich': 'svc-hoc-tap-2.jpg',
  'phien-dich-phu-de': 'svc-hoc-tap.jpg',
  'tro-ly-ao': 'svc-van-phong.jpg',
  'nhap-lieu-bao-cao': 'svc-excel.jpg',
  'huong-nghiep-su-nghiep': 'svc-doanh-nghiep.jpg',
  'ky-nang-can-bang': 'svc-cham-soc-2.jpg',
  'bieu-dien-online': 'svc-su-kien-2.jpg',
  'tro-choi-giai-tri': 'svc-game-2.jpg',
  'dong-hanh-giai-tri': 'svc-su-kien.jpg',
};

const groupVariants = {
  'nha-cua': ['svc-nha-cua.jpg', 'svc-nha-cua-2.jpg', 'svc-sofa-rem.jpg', 'svc-khu-khuan.jpg'],
  'sua-chua': ['svc-sua-chua.jpg', 'svc-sua-chua-2.jpg', 'svc-dien-lanh.jpg', 'sua-dien-nuoc.jpg', 'svc-camera-mang.jpg', 'svc-son-chong-tham.jpg'],
  'xay-dung': ['svc-xay-dung.jpg', 'svc-xay-dung-2.jpg', 'svc-op-lat.jpg'],
  'cham-soc': ['svc-cham-soc.jpg', 'svc-cham-soc-2.jpg', 'svc-trong-tre.jpg'],
  'lam-dep': ['svc-lam-dep.jpg', 'svc-lam-dep-2.jpg', 'svc-toc-goi-dau.jpg'],
  'bep-doi-song': ['svc-bep.jpg', 'svc-bep-2.jpg'],
  xe: ['svc-xe.jpg', 'svc-xe-2.jpg'],
  'hoc-tap': ['svc-hoc-tap.jpg', 'svc-hoc-tap-2.jpg', 'svc-nhac-hoa.jpg', 'svc-gia-su.jpg'],
  game: ['svc-game.jpg', 'svc-game-2.jpg', 'svc-esports.jpg'],
  'lap-trinh': ['svc-lap-trinh.jpg', 'svc-lap-trinh-2.jpg', 'svc-cong-nghe.jpg', 'svc-excel.jpg'],
  'thiet-ke': ['svc-thiet-ke.jpg', 'svc-thiet-ke-2.jpg', 'svc-sang-tao.jpg', 'svc-content.jpg'],
  'su-kien': ['svc-su-kien.jpg', 'svc-su-kien-2.jpg', 'svc-su-kien-tt.jpg'],
  'thu-cung': ['svc-thu-cung.jpg', 'svc-thu-cung-2.jpg', 'svc-cham-soc-pet.jpg'],
  'the-thao': ['svc-the-thao.jpg', 'svc-the-thao-2.jpg', 'svc-pt-the-thao.jpg'],
  'doanh-nghiep': ['svc-doanh-nghiep.jpg', 'svc-doanh-nghiep-2.jpg', 'svc-van-phong.jpg'],
  'tai-chinh': ['svc-tai-chinh.jpg', 'svc-tai-chinh-2.jpg', 'svc-hanh-chinh.jpg'],
  'san-vuon': ['svc-san-vuon.jpg', 'svc-san-vuon-2.jpg', 'svc-san-vuon-ngoai-troi.jpg'],
  'marketing-online': ['svc-content.jpg', 'svc-sang-tao.jpg', 'svc-doanh-nghiep-2.jpg', 'svc-thiet-ke.jpg'],
  'ngon-ngu': ['svc-hoc-tap-2.jpg', 'svc-gia-su.jpg', 'svc-hoc-tap.jpg', 'svc-content.jpg'],
  'tro-ly-tu-xa': ['svc-van-phong.jpg', 'svc-hanh-chinh.jpg', 'svc-excel.jpg', 'svc-doanh-nghiep.jpg'],
  'tu-van-phat-trien': ['svc-cham-soc-2.jpg', 'svc-doanh-nghiep.jpg', 'svc-tai-chinh-2.jpg', 'svc-hoc-tap.jpg'],
  'giai-tri': ['svc-su-kien-2.jpg', 'svc-game-2.jpg', 'svc-su-kien.jpg', 'svc-game.jpg'],
};

/** Gợi ý ảnh theo từ khóa slug — ưu tiên khớp nghề. */
const slugKeywordFiles = [
  { re: /gia-su|ielts|toeic|tieng-anh|tieng-trung|tieng-nhat|tieng-han|luyen-thi|day-ve|day-nhac|tin-hoc|day-excel|day-canva|day-ai|day-lap-trinh-tre/, files: ['svc-gia-su.jpg', 'svc-hoc-tap.jpg', 'svc-hoc-tap-2.jpg', 'svc-nhac-hoa.jpg'] },
  { re: /coaching|esport|stream|overlay|pubg|valorant|lmht|lien-quan|fc-online|game/, files: ['svc-esports.jpg', 'svc-game.jpg', 'svc-game-2.jpg'] },
  { re: /lap-trinh|website|wordpress|chatbot|dashboard|api|google-workspace|tu-dong-hoa|excel|phan-tich|mvp|sua-loi-website|may-tinh|ho-tro-may/, files: ['svc-lap-trinh.jpg', 'svc-lap-trinh-2.jpg', 'svc-cong-nghe.jpg', 'svc-excel.jpg'] },
  { re: /thiet-ke|logo|banner|ui-ux|video|retouch|thumbnail|motion|slide|content|voice|podcast|menu-catalogue|an-pham/, files: ['svc-thiet-ke.jpg', 'svc-thiet-ke-2.jpg', 'svc-sang-tao.jpg', 'svc-content.jpg'] },
  { re: /dich-|phien-dich|phu-de|hieu-dinh|go-bang|cv-tieng/, files: ['svc-hoc-tap-2.jpg', 'svc-hoc-tap.jpg', 'svc-content.jpg'] },
  { re: /ads-|seo|quang-cao|fanpage|shopee|tiktok-shop|inbox|marketing|mo-ta-san-pham|tu-khoa|chuyen-doi|affiliate|email-marketing/, files: ['svc-content.jpg', 'svc-sang-tao.jpg', 'svc-doanh-nghiep-2.jpg', 'svc-thiet-ke.jpg'] },
  { re: /tro-ly|nhap-lieu|bao-cao|nghien-cuu-thi-truong|lam-sach-du-lieu/, files: ['svc-van-phong.jpg', 'svc-hanh-chinh.jpg', 'svc-excel.jpg'] },
  { re: /ke-toan|thue|tai-chinh|hop-dong|huong-nghiep|coach-su-nghiep|coach-quan-ly|luyen-phong-van|phong-van|cv|linkedin|dinh-duong|tam-ly|thien/, files: ['svc-tai-chinh.jpg', 'svc-tai-chinh-2.jpg', 'svc-cham-soc-2.jpg', 'svc-doanh-nghiep.jpg'] },
  { re: /webinar|mc-online|hop-truc-tuyen|su-kien|chup-quay|livestream|trang-tri-tiec|mc-su-kien|ban-nhac/, files: ['svc-su-kien.jpg', 'svc-su-kien-2.jpg', 'svc-su-kien-tt.jpg'] },
  { re: /pt-|yoga|coach-chay|giao-an-tap|the-thao|pickleball|tennis|boxing|boi|chay-bo/, files: ['svc-pt-the-thao.jpg', 'svc-the-thao.jpg', 'svc-the-thao-2.jpg'] },
  { re: /hat-live|ao-thuat|dj-|mc-tiec|rpg|board-game|co-vua|quiz|ke-chuyen|xem-phim|tro-chuyen|playlist|giai-tri/, files: ['svc-su-kien-2.jpg', 'svc-game-2.jpg', 'svc-su-kien.jpg'] },
  { re: /don-nha|ve-sinh|giup-viec|tong-ve-sinh|diet-con|giat-|khu-khuan/, files: ['svc-ve-sinh.jpg', 'svc-sofa-rem.jpg', 'svc-giat-nem.jpg', 'svc-ve-sinh-rem-tham.jpg'] },
  { re: /sua-|lap-|thong-tac|chong-tham|son-nha|khoa/, files: ['svc-sua-chua.jpg', 'svc-sua-chua-2.jpg', 'svc-dien-lanh.jpg', 'svc-dien-nuoc.jpg', 'svc-camera-mang.jpg'] },
  { re: /makeup|nail|noi-mi|toc|goi-dau|nhuom|cham-da|lam-dep/, files: ['svc-lam-dep.jpg', 'svc-lam-dep-2.jpg', 'svc-lam-dep-tai-nha.jpg', 'svc-toc-goi-dau.jpg'] },
  { re: /nau-|meal|di-cho|giat-ui|may-sua/, files: ['svc-nau-an.jpg', 'svc-bep.jpg', 'svc-bep-2.jpg'] },
  { re: /xe|rua-xe|chuyen-nha|tai-xe|cuu-ho|danh-bong/, files: ['svc-xe.jpg', 'svc-xe-2.jpg', 'svc-van-chuyen.jpg'] },
  { re: /cham-soc|massage|spa|bao-mau|nguoi-gia|benh|me-sau-sinh|kham-benh/, files: ['svc-cham-soc.jpg', 'svc-cham-soc-2.jpg', 'svc-cham-soc-tai-nha.jpg', 'svc-trong-tre.jpg'] },
  { re: /pet|thu-cung|tam-cat/, files: ['svc-cham-soc-pet.jpg', 'svc-thu-cung.jpg', 'svc-thu-cung-2.jpg'] },
  { re: /cat-co|san-vuon|vuon|ho-ca|tieu-canh/, files: ['svc-san-vuon.jpg', 'svc-san-vuon-2.jpg', 'svc-san-vuon-ngoai-troi.jpg'] },
];

const byServiceFiles = fs.existsSync(BY_SERVICE)
  ? fs.readdirSync(BY_SERVICE).filter((f) => f.endsWith('.jpg'))
  : [];
const svcFiles = fs.readdirSync(SVC_DIR).filter((f) => f.startsWith('svc-') && f.endsWith('.jpg'));
const allFiles = [...new Set([...byServiceFiles, ...svcFiles])];

function fileExists(name) {
  return allFiles.includes(name);
}

function normalizeFile(name) {
  return fileExists(name) ? name : null;
}

function scoreFile(slug, name, group, category, file) {
  let score = 0;
  const stem = file.replace(/\.jpg$/, '');
  if (stem === slug) score += 1000;
  if (file.startsWith('by-service/') || byServiceFiles.includes(file)) {
    if (stem === slug) score += 500;
  }
  const slugParts = slug.split('-');
  for (const part of slugParts) {
    if (part.length >= 3 && stem.includes(part)) score += 40;
  }
  for (const { re, files } of slugKeywordFiles) {
    if (re.test(slug) && files.includes(file)) score += 120;
  }
  const catFile = categoryImages[category];
  if (catFile === file) score += 30;
  if ((groupVariants[group] ?? []).includes(file)) score += 20;
  if (name && stem.replace(/-/g, ' ').split(' ').some((w) => name.toLowerCase().includes(w) && w.length > 3)) {
    score += 15;
  }
  return score;
}

function buildPool(slug, group, category) {
  const dedicated = `${slug}.jpg`;
  if (byServiceFiles.includes(dedicated)) return [dedicated];

  const catFile = categoryImages[category];
  const groupFiles = groupVariants[group] ?? [];
  const keywordFiles = slugKeywordFiles
    .filter(({ re }) => re.test(slug))
    .flatMap(({ files }) => files)
    .map(normalizeFile)
    .filter(Boolean)
    .filter((file) => !byServiceFiles.includes(file) || file === dedicated);

  return [...new Set([catFile, ...groupFiles, ...keywordFiles].map(normalizeFile).filter(Boolean))];
}

const map = {};
const usedGlobal = new Set();
const categoryUsage = new Map();

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

// Dedicated by-service first
for (const s of services) {
  const dedicated = `${s.slug}.jpg`;
  if (byServiceFiles.includes(dedicated)) {
    map[s.slug] = dedicated;
    usedGlobal.add(dedicated);
    const ck = `${s.group}/${s.category}`;
    if (!categoryUsage.has(ck)) categoryUsage.set(ck, new Set());
    categoryUsage.get(ck).add(dedicated);
  }
}

// Online services without dedicated image — unique per category
const pending = services.filter((s) => !map[s.slug]).sort((a, b) => {
  if (a.online !== b.online) return a.online ? -1 : 1;
  return a.slug.localeCompare(b.slug);
});

for (const s of pending) {
  const ck = `${s.group}/${s.category}`;
  if (!categoryUsage.has(ck)) categoryUsage.set(ck, new Set());
  const usedInCat = categoryUsage.get(ck);
  const pool = buildPool(s.slug, s.group, s.category);

  const ranked = pool
    .map((file) => ({
      file,
      score: scoreFile(s.slug, s.name, s.group, s.category, file) - (usedGlobal.has(file) ? 50 : 0) - (usedInCat.has(file) ? 200 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  let pick = ranked.find((r) => !usedInCat.has(r.file))?.file;
  if (!pick) pick = ranked.find((r) => !usedGlobal.has(r.file))?.file;
  if (!pick) pick = ranked[0]?.file;
  if (!pick) {
    pick =
      normalizeFile(categoryImages[s.category]) ??
      normalizeFile((groupVariants[s.group] ?? [])[0]) ??
      'svc-nha-cua.jpg';
  }

  if (byServiceFiles.includes(pick) && pick !== `${s.slug}.jpg`) {
    pick =
      normalizeFile(categoryImages[s.category]) ??
      normalizeFile((groupVariants[s.group] ?? []).find((f) => !byServiceFiles.includes(f) || f === `${s.slug}.jpg`)) ??
      pick;
  }

  map[s.slug] = pick;
  usedGlobal.add(pick);
  usedInCat.add(pick);
}

fs.writeFileSync(
  OUT,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      total: Object.keys(map).length,
      assignments: map,
    },
    null,
    2,
  ),
);

console.log(`Wrote ${Object.keys(map).length} assignments → ${path.relative(WEB, OUT)}`);

// Quick duplicate report within online services
const onlineByFile = new Map();
for (const s of services.filter((x) => x.online)) {
  const f = map[s.slug];
  if (!onlineByFile.has(f)) onlineByFile.set(f, []);
  onlineByFile.get(f).push(s.slug);
}
const onlineDupes = [...onlineByFile.entries()].filter(([, slugs]) => slugs.length > 1);
console.log(`Online duplicate image groups: ${onlineDupes.length}`);
if (onlineDupes.length) {
  for (const [file, slugs] of onlineDupes.slice(0, 8)) {
    console.log(`  ${file}: ${slugs.join(', ')}`);
  }
}
