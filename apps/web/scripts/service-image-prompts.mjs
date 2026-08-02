/**
 * Prompt ảnh theo nghề — CHỈ các slug đang dùng (by-service).
 * Mỗi slug một quan cảnh riêng, không trùng bối cảnh.
 */
import { catalogGroups } from '../../api/prisma/catalog-data.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { IN_USE_SERVICE_SLUGS } from './in-use-service-slugs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BY_SERVICE_DIR = path.resolve(__dirname, '../src/assets/services/by-service');

const STYLE =
  ', photorealistic professional stock photo, bright natural lighting, modern Vietnam urban setting, no text, no watermark, 16:9 landscape';

/** Mỗi nghề đang dùng — quan cảnh KHÁC NHAU. */
export const SCENE_PROMPTS = {
  'don-nha-theo-ca':
    'Vietnamese cleaner wiping dining table in bright open-plan living dining room, teal uniform',
  'giup-viec-theo-gio':
    'Domestic helper organizing kitchen pantry shelves with labeled containers, different room from living room',
  'tong-ve-sinh':
    'Deep cleaning team scrubbing bathroom tiles with steam cleaner, fog and gloves, wet bathroom scene',
  've-sinh-sau-xay-dung':
    'Workers removing construction dust sheets from unfinished apartment with vacuum and masks',
  'diet-con-trung':
    'Pest control technician spraying skirting board in kitchen corner with protective gear',
  've-sinh-kinh':
    'Window cleaner on safety harness washing high-rise apartment glass exterior, city view',
  'don-kho-gac':
    'Organizer sorting storage boxes in attic loft with ladder and daylight from roof window',
  'giat-sofa':
    'Technician steam-cleaning grey fabric sofa with extraction machine in living room',
  've-sinh-rem-tham':
    'Worker taking down curtains in bedroom for cleaning, ladder and fabric stacks',
  'giat-nem':
    'Mattress cleaning service using UV sanitizer on bed in master bedroom',
  'khu-khuan-nha':
    'Technician in mask fogging disinfectant in nursery room with crib visible',
  'khu-khuan-van-phong-nho':
    'Office disinfection spray on desks in small startup office with laptops covered',
  've-sinh-may-lanh':
    'AC technician washing split unit filters on balcony with water hose',
  'sua-tu-lanh':
    'Repairman diagnosing refrigerator compressor with multimeter in kitchen',
  'sua-may-giat':
    'Technician fixing front-load washing machine drum in laundry room',
  'bao-tri-binh-nong-lanh':
    'Plumber draining electric water heater tank in bathroom utility closet',
  'sua-dien-nuoc':
    'Plumber fixing under-sink pipe leak with wrench, water droplets, bathroom vanity',
  'sua-o-cam-den':
    'Electrician installing new wall outlet with screwdriver, exposed wiring box',
  'thong-tac-cong':
    'Plumber using drain snake on floor drain in shower stall, rubber gloves',
  'lap-camera':
    'CCTV installer mounting dome camera on ceiling corner with cable drill',
  'sua-wifi':
    'Network tech configuring router on desk with laptop showing signal map',
  'lap-quat-tran':
    'Electrician installing ceiling fan on ladder in bedroom, wires hanging',
  'chong-tham':
    'Waterproofing worker applying membrane on rooftop terrace corner',
  'son-nha-phong':
    'Painter rolling teal paint on bedroom accent wall with drop cloth and tray',
  'tho-ho-sua-chua':
    'Mason repointing brick wall in courtyard with trowel and mortar bucket',
  'lap-dat-noi-that':
    'Carpenter assembling flat-pack wardrobe in empty bedroom with allen keys',
  'lam-cua-kinh':
    'Glazier fitting sliding glass door track in modern apartment balcony',
  'lap-rem-cua':
    'Installer measuring window for roman blinds with tape measure and fabric samples',
  'thao-do-nhe':
    'Demolition worker removing old kitchen tiles with hammer and dust mask',
  'op-lat-gach':
    'Tiler laying ceramic floor tiles with spacers in hallway entrance',
  'tran-thach-cao':
    'Drywall worker installing gypsum ceiling panels on scaffolding in new room',
  'lat-san-go':
    'Flooring installer clicking SPC vinyl planks in sunlit corridor',
  'ba-tuong':
    'Worker skim-coating wall with putty knife before painting, empty room',
  'cham-soc-nguoi-gia':
    'Caregiver reading newspaper with elderly man on garden bench, warm afternoon',
  'cham-benh-nhe':
    'Home nurse checking blood pressure of patient in bed with kit bag',
  'massage-tai-nha':
    'Massage therapist setting up portable massage table in living room',
  'spa-foot-tai-nha':
    'Foot spa basin with herbs on low table, client relaxing on sofa',
  'dong-hanh-kham-benh':
    'Companion helping senior with hospital registration queue and documents',
  'cham-me-sau-sinh':
    'Postpartum helper preparing warm meal tray for new mother in bedroom',
  'bao-mau-theo-gio':
    'Babysitter playing blocks with toddler on play mat in kids room',
  'bao-mau-cuoi-tuan':
    'Night babysitter reading bedtime story to child with nightlight',
  'makeup-tai-nha':
    'Makeup artist applying foundation to client at vanity mirror with ring light',
  'makeup-co-dau':
    'Bridal makeup artist with tiara and veil on bride in hotel prep room',
  'nail-tai-nha':
    'Nail technician doing gel manicure at portable table on apartment balcony',
  'noi-mi-tai-nha':
    'Lash artist applying eyelash extensions with magnifying lamp on recliner',
  'cham-da-tai-nha':
    'Esthetician applying face mask to client lying on spa bed at home',
  'goi-dau-duong-sinh':
    'Hair wash ritual with herbal steam bowl in Vietnamese spa corner setup',
  'lam-toc-tai-nha':
    'Hair stylist cutting hair with client in chair near window, cape on',
  'nhuom-toc-tai-nha':
    'Colorist applying hair dye foils in bathroom with timer and gloves',
  'nau-an-theo-bua':
    'Private chef stir-frying in wok in client kitchen with fresh vegetables',
  'meal-prep-tuan':
    'Meal prep containers lined on counter with rice chicken broccoli portions',
  'di-cho-ho':
    'Shopper selecting vegetables at wet market with reusable bags and list',
  'giat-ui':
    'Laundry service folding clothes on ironing board with steam iron nearby',
  'ui-do-cong-so':
    'Pressing dress shirts on board with hanger rack of office clothes',
  'may-sua-do':
    'Tailor altering pants hem on sewing machine with pin cushion',
  'nau-tiec-nho':
    'Chef plating appetizers for home dinner party table set for twelve',
  'chuyen-nha-nhe':
    'Movers carrying cardboard boxes through apartment elevator lobby',
  'be-do-van-phong':
    'Workers moving office desks with dollies in corporate floor',
  'rua-xe-tai-nha':
    'Mobile car wash foaming sedan in underground parking lot',
  'danh-bong-xe':
    'Detailer polishing car hood with buffer in driveway, reflections visible',
  'tai-xe-theo-gio':
    'Professional driver opening rear door of black sedan for client',
  'cuu-ho-xe-nhe':
    'Roadside assistant jump-starting car battery with cables at night',
  'gia-su-toan':
    'Math tutor explaining geometry on whiteboard to student at desk',
  'day-nhac-tai-nha':
    'Music teacher showing guitar chords to child on small stage rug',
  'coaching-game':
    'Esports coach reviewing game replay on ultrawide monitor with student',
  'sua-may-cai-dat':
    'IT technician reinstalling Windows on laptop at client desk with USB drive',
  'excel-tu-dong-hoa':
    'Consultant building Excel dashboard on laptop with charts visible',
  'thiet-ke-banner-logo':
    'Graphic designer sketching logo concepts on tablet with stylus',
  'viet-content':
    'Content writer typing blog post on laptop in cafe with notebook',
  'seo-specialist':
    'SEO specialist analyzing organic traffic charts and keyword rankings on dual monitors in coworking desk',
  'chay-ads-facebook':
    'Digital marketer managing social ads campaign dashboard with creatives and CPC metrics on dual screens',
  'chay-ads-google':
    'PPC specialist optimizing search ads bids and shopping product ads on ultrawide monitor',
  'chay-ads-tiktok':
    'Creator editing short-form vertical video ads on laptop with phone stand showing draft clip',
  'email-marketing':
    'Email marketer designing newsletter template with open-rate analytics on secondary screen',
  'affiliate-marketing':
    'Affiliate marketer reviewing partner commission dashboard and referral tracking table on laptop',
  'nghien-cuu-tu-khoa':
    'SEO researcher clustering keyword sticky notes with volume difficulty spreadsheet on laptop',
  'toi-uu-ty-le-chuyen-doi':
    'CRO specialist comparing landing page heatmap and A/B test variants on large monitor',
  'chup-quay-su-kien':
    'Event photographer with DSLR capturing wedding toast in banquet hall',
  'tam-cat-thu-cung':
    'Pet groomer trimming poodle fur on grooming table with clippers',
  'pt-gym':
    'Personal trainer spotting client on bench press in apartment gym corner',
  'don-van-phong':
    'Cleaning crew vacuuming open office carpet after hours with machines',
  'ke-toan-ho-kd':
    'Accountant reviewing ledger books with calculator at small shop counter',
  'cat-co-cham-cay':
    'Gardener trimming hedge with electric trimmer in villa front yard',
};

export function promptForSlug(slug, name, groupName) {
  const scene =
    SCENE_PROMPTS[slug] ??
    `Vietnamese professional performing ${name} service, unique ${groupName} workplace scene`;
  return `${scene}${STYLE}`;
}

function serviceBySlug() {
  const map = new Map();
  for (const group of catalogGroups) {
    for (const category of group.categories) {
      for (const service of category.services) {
        map.set(service.slug, { service, groupName: group.name, categoryName: category.name });
      }
    }
  }
  return map;
}

export function listInUsePending() {
  const existing = new Set(
    fs.existsSync(BY_SERVICE_DIR)
      ? fs.readdirSync(BY_SERVICE_DIR).filter((f) => f.endsWith('.jpg')).map((f) => f.replace(/\.jpg$/, ''))
      : [],
  );
  const bySlug = serviceBySlug();
  const inUse = new Set(IN_USE_SERVICE_SLUGS);
  return IN_USE_SERVICE_SLUGS.filter((slug) => inUse.has(slug)).map((slug) => {
    const meta = bySlug.get(slug);
    return {
      slug,
      name: meta?.service.name ?? slug,
      group: meta?.groupName ?? '',
      hasImage: existing.has(slug),
      prompt: promptForSlug(slug, meta?.service.name ?? slug, meta?.groupName ?? ''),
    };
  });
}

if (process.argv[1]?.endsWith('service-image-prompts.mjs')) {
  const cmd = process.argv[2] ?? 'summary';
  const items = listInUsePending();
  if (cmd === 'summary') {
    const missingPrompt = items.filter((i) => !SCENE_PROMPTS[i.slug]);
    console.log(`In-use: ${items.length}, có prompt: ${items.length - missingPrompt.length}, thiếu prompt: ${missingPrompt.length}`);
    if (missingPrompt.length) console.log(missingPrompt.map((i) => i.slug).join(', '));
  } else if (cmd === 'json') {
    console.log(JSON.stringify(items, null, 2));
  } else if (cmd === 'next') {
    const n = Number(process.argv[3] ?? 10);
    console.log(JSON.stringify(items.slice(0, n), null, 2));
  }
}
