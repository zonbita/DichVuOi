import serviceImageMapData from './service-image-map.generated.json';

const serviceImageMap = serviceImageMapData as {
  assignments: Record<string, string>;
};

/** Banner hero trang nhóm — ảnh chụp landscape, mỗi nhóm một file. */
const rootBannerModules = import.meta.glob<{ default: string }>(
  '../assets/banner-*.jpg',
  { eager: true },
);
const groupBannerModules = import.meta.glob<{ default: string }>(
  '../assets/banners/*.jpg',
  { eager: true },
);
const rootBannersByFile: Record<string, string> = Object.fromEntries(
  Object.entries(rootBannerModules).map(([path, module]) => [
    path.split('/').pop()!,
    module.default,
  ]),
);
const groupBannersByFile: Record<string, string> = Object.fromEntries(
  Object.entries(groupBannerModules).map(([path, module]) => [
    path.split('/').pop()!,
    module.default,
  ]),
);

/** slug nhóm → tên file banner (banner-{slug}.jpg hoặc ảnh by-service). */
const GROUP_BANNER_FILES: Record<string, string> = {
  'hoc-tap': 'banner-gia-su.jpg',
  game: 'banner-game.jpg',
  'lap-trinh': 'banner-lap-trinh.jpg',
  'thiet-ke': 'banner-thiet-ke.jpg',
  'su-kien': 'banner-su-kien.jpg',
  'the-thao': 'banner-the-thao.jpg',
  'doanh-nghiep': 'banner-doanh-nghiep.jpg',
  'tai-chinh': 'banner-tai-chinh.jpg',
  'marketing-online': 'banner-marketing-online.jpg',
  'ngon-ngu': 'banner-ngon-ngu.jpg',
  'tro-ly-tu-xa': 'banner-tro-ly-tu-xa.jpg',
  'tu-van-phat-trien': 'banner-tu-van-phat-trien.jpg',
  'giai-tri': 'banner-giai-tri.jpg',
};

/** Ảnh do AI tạo riêng theo từng Service; tên file phải trùng service.slug. */
const perServiceModules = import.meta.glob<{ default: string }>(
  '../assets/services/by-service/*.jpg',
  { eager: true },
);
const generatedServiceImages: Record<string, string> = Object.fromEntries(
  Object.entries(perServiceModules).map(([path, module]) => [
    path.split('/').pop()!.replace(/\.jpg$/, ''),
    module.default,
  ]),
);

/** Ảnh stock svc-* — tra theo tên file trong map sinh tự động. */
const stockModules = import.meta.glob<{ default: string }>(
  '../assets/services/svc-*.jpg',
  { eager: true },
);
const stockImagesByFile: Record<string, string> = Object.fromEntries(
  Object.entries(stockModules).map(([path, module]) => [
    path.split('/').pop()!,
    module.default,
  ]),
);

/** Ảnh đại diện nhóm (trang nhóm / tile). */
const groupImages: Record<string, string> = {
  'nha-cua': stockImagesByFile['svc-nha-cua.jpg'] ?? '',
  'sua-chua': stockImagesByFile['svc-sua-chua.jpg'] ?? '',
  'xay-dung': stockImagesByFile['svc-xay-dung.jpg'] ?? '',
  'cham-soc': stockImagesByFile['svc-cham-soc.jpg'] ?? '',
  'lam-dep': stockImagesByFile['svc-lam-dep.jpg'] ?? '',
  'bep-doi-song': stockImagesByFile['svc-bep.jpg'] ?? '',
  xe: stockImagesByFile['svc-xe.jpg'] ?? '',
  'hoc-tap': stockImagesByFile['svc-hoc-tap.jpg'] ?? '',
  game: stockImagesByFile['svc-game.jpg'] ?? '',
  'lap-trinh': stockImagesByFile['svc-lap-trinh.jpg'] ?? '',
  'thiet-ke': stockImagesByFile['svc-thiet-ke.jpg'] ?? '',
  'su-kien': stockImagesByFile['svc-su-kien.jpg'] ?? '',
  'thu-cung': stockImagesByFile['svc-thu-cung.jpg'] ?? '',
  'the-thao': stockImagesByFile['svc-the-thao.jpg'] ?? '',
  'doanh-nghiep': stockImagesByFile['svc-doanh-nghiep.jpg'] ?? '',
  'tai-chinh': stockImagesByFile['svc-tai-chinh.jpg'] ?? '',
  'san-vuon': stockImagesByFile['svc-san-vuon.jpg'] ?? '',
  'marketing-online': stockImagesByFile['svc-content.jpg'] ?? '',
  'ngon-ngu': stockImagesByFile['svc-hoc-tap-2.jpg'] ?? '',
  'tro-ly-tu-xa': stockImagesByFile['svc-van-phong.jpg'] ?? '',
  'tu-van-phat-trien': stockImagesByFile['svc-cham-soc-2.jpg'] ?? '',
  'giai-tri': stockImagesByFile['svc-su-kien-2.jpg'] ?? '',
};

const fallbackGroupImage =
  stockImagesByFile['svc-nha-cua.jpg'] ?? Object.values(stockImagesByFile)[0] ?? '';

function resolveImageFile(filename: string): string | undefined {
  const slug = filename.replace(/\.jpg$/, '');
  if (generatedServiceImages[slug]) return generatedServiceImages[slug];
  return stockImagesByFile[filename];
}

export function groupImage(slug: string | null | undefined): string {
  return groupImages[slug ?? ''] || fallbackGroupImage;
}

function resolveBannerFile(filename: string): string | undefined {
  return (
    rootBannersByFile[filename] ??
    groupBannersByFile[filename] ??
    resolveImageFile(filename)
  );
}

/** Banner hero nhóm — ưu tiên ảnh chụp banner riêng, fallback tile. */
export function groupBanner(slug: string | null | undefined): string {
  const key = slug ?? '';
  const mapped = GROUP_BANNER_FILES[key];
  if (mapped) {
    const resolved = resolveBannerFile(mapped);
    if (resolved) return resolved;
  }
  return groupImage(key);
}

type ServiceImageInput = {
  slug: string;
  category: {
    slug: string;
    group: { slug: string };
  };
};

/** Ảnh thẻ / chi tiết nghề — map sinh tự động, ưu tiên ảnh riêng by-service. */
export function serviceImage(service: ServiceImageInput): string {
  const mappedFile = serviceImageMap.assignments[service.slug];
  if (mappedFile) {
    const resolved = resolveImageFile(mappedFile);
    if (resolved) return resolved;
  }

  if (generatedServiceImages[service.slug]) {
    return generatedServiceImages[service.slug];
  }

  return groupImage(service.category.group.slug);
}
