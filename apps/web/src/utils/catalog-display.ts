import type { IconName } from '../components/ui/icon';

// Nhận cả `icon` của nhóm lẫn `slug`, vì service chỉ trả về slug của nhóm.
const groupIcons: Record<string, IconName> = {
  home: 'home',
  wrench: 'wrench',
  snowflake: 'snowflake',
  heart: 'heart',
  book: 'book',
  graduation: 'graduation',
  beauty: 'beauty',
  hammer: 'hammer',
  utensils: 'utensils',
  camera: 'camera',
  dumbbell: 'dumbbell',
  briefcase: 'briefcase',
  scale: 'scale',
  leaf: 'leaf',
  code: 'code',
  game: 'game',
  design: 'palette',
  truck: 'truck',
  pet: 'paw',
  chart: 'chart',
  clock: 'clock',
  users: 'users',
  sparkles: 'sparkles',
  'nha-cua': 'home',
  'sua-chua': 'wrench',
  'xay-dung': 'hammer',
  'cham-soc': 'heart',
  'lam-dep': 'beauty',
  'bep-doi-song': 'utensils',
  xe: 'truck',
  'hoc-tap': 'graduation',
  'lap-trinh': 'code',
  'thiet-ke': 'palette',
  'su-kien': 'camera',
  'thu-cung': 'paw',
  'the-thao': 'dumbbell',
  'doanh-nghiep': 'briefcase',
  'tai-chinh': 'scale',
  'san-vuon': 'leaf',
  'marketing-online': 'chart',
  'ngon-ngu': 'book',
  'tro-ly-tu-xa': 'clock',
  'tu-van-phat-trien': 'users',
  'giai-tri': 'sparkles',
};

export function groupIcon(icon: string | null | undefined): IconName {
  return groupIcons[icon ?? ''] ?? 'sparkles';
}

function hash(seed: string) {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) {
    value = (value * 31 + seed.charCodeAt(index)) % 100000;
  }
  return value;
}

/**
 * Số liệu trưng bày cho giao diện (rating demo).
 * Số người làm nghề lấy từ API `_count.partners` trên ServiceCard.
 */
export function displayStats(seed: string) {
  const value = hash(seed);
  return {
    rating: (4.6 + ((value % 4) * 0.1)).toFixed(1),
    reviews: 320 + (value % 1800),
  };
}
