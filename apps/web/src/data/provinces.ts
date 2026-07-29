/**
 * 34 đơn vị hành chính cấp tỉnh (Nghị quyết 202/2025/QH15, từ 1/7/2025).
 * Nguồn duy nhất cho dropdown khu vực trên header — xem README mục «Tỉnh / thành».
 */
import { fuzzyMatch } from '../utils/search';

export type Province = {
  /** Mã ngắn (slug) — lưu localStorage. */
  slug: string;
  /** Tên hiển thị trong dropdown. */
  name: string;
  /** `city` = thành phố trực thuộc TW; `province` = tỉnh. */
  kind: 'city' | 'province';
};

/** 6 thành phố + 28 tỉnh — sắp xếp A→Z theo tên. */
export const PROVINCES: Province[] = [
  { slug: 'an-giang', name: 'An Giang', kind: 'province' },
  { slug: 'bac-ninh', name: 'Bắc Ninh', kind: 'province' },
  { slug: 'ca-mau', name: 'Cà Mau', kind: 'province' },
  { slug: 'cao-bang', name: 'Cao Bằng', kind: 'province' },
  { slug: 'can-tho', name: 'Cần Thơ', kind: 'city' },
  { slug: 'da-nang', name: 'Đà Nẵng', kind: 'city' },
  { slug: 'dak-lak', name: 'Đắk Lắk', kind: 'province' },
  { slug: 'dien-bien', name: 'Điện Biên', kind: 'province' },
  { slug: 'dong-nai', name: 'Đồng Nai', kind: 'province' },
  { slug: 'dong-thap', name: 'Đồng Tháp', kind: 'province' },
  { slug: 'gia-lai', name: 'Gia Lai', kind: 'province' },
  { slug: 'ha-noi', name: 'Hà Nội', kind: 'city' },
  { slug: 'ha-tinh', name: 'Hà Tĩnh', kind: 'province' },
  { slug: 'hai-phong', name: 'Hải Phòng', kind: 'city' },
  { slug: 'ho-chi-minh', name: 'Hồ Chí Minh', kind: 'city' },
  { slug: 'hung-yen', name: 'Hưng Yên', kind: 'province' },
  { slug: 'hue', name: 'Huế', kind: 'city' },
  { slug: 'khanh-hoa', name: 'Khánh Hòa', kind: 'province' },
  { slug: 'lai-chau', name: 'Lai Châu', kind: 'province' },
  { slug: 'lam-dong', name: 'Lâm Đồng', kind: 'province' },
  { slug: 'lang-son', name: 'Lạng Sơn', kind: 'province' },
  { slug: 'lao-cai', name: 'Lào Cai', kind: 'province' },
  { slug: 'nghe-an', name: 'Nghệ An', kind: 'province' },
  { slug: 'ninh-binh', name: 'Ninh Bình', kind: 'province' },
  { slug: 'phu-tho', name: 'Phú Thọ', kind: 'province' },
  { slug: 'quang-ngai', name: 'Quảng Ngãi', kind: 'province' },
  { slug: 'quang-ninh', name: 'Quảng Ninh', kind: 'province' },
  { slug: 'quang-tri', name: 'Quảng Trị', kind: 'province' },
  { slug: 'son-la', name: 'Sơn La', kind: 'province' },
  { slug: 'tay-ninh', name: 'Tây Ninh', kind: 'province' },
  { slug: 'thai-nguyen', name: 'Thái Nguyên', kind: 'province' },
  { slug: 'thanh-hoa', name: 'Thanh Hóa', kind: 'province' },
  { slug: 'tuyen-quang', name: 'Tuyên Quang', kind: 'province' },
  { slug: 'vinh-long', name: 'Vĩnh Long', kind: 'province' },
];

export const DEFAULT_PROVINCE_SLUG = 'ho-chi-minh';

const STORAGE_KEY = 'dichvuoi.province';

export function findProvince(slug: string | null | undefined): Province {
  return PROVINCES.find((p) => p.slug === slug) ?? PROVINCES.find((p) => p.slug === DEFAULT_PROVINCE_SLUG)!;
}

/** Khớp theo tên hiển thị (vd. «Hồ Chí Minh») — dùng cho hồ sơ partner. */
export function findProvinceByName(name: string | null | undefined): Province | undefined {
  const trimmed = name?.trim();
  if (!trimmed) return undefined;
  return PROVINCES.find(
    (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
  );
}

export function loadProvinceSlug(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && PROVINCES.some((p) => p.slug === saved)) return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_PROVINCE_SLUG;
}

export function saveProvinceSlug(slug: string) {
  try {
    localStorage.setItem(STORAGE_KEY, slug);
  } catch {
    /* ignore */
  }
}

export function filterProvinces(query: string): Province[] {
  if (!query.trim()) return PROVINCES;
  return PROVINCES.filter((p) => fuzzyMatch(`${p.name} ${p.slug}`, query));
}
