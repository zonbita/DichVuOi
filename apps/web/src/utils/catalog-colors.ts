/**
 * Bảng màu ngành nghề — mỗi nhóm dịch vụ (Group) có một màu nhận diện riêng.
 * Icon menu «Nhóm dịch vụ» (sidebar tối) dùng `main`; chip/badge nền sáng dùng `soft` + `ink`.
 */

export type GroupColor = {
  /** Màu chính — chữ đậm, icon, viền nhấn. */
  main: string;
  /** Nền nhạt — chip, badge, khối nền. */
  soft: string;
  /** Màu chữ trên nền nhạt. */
  ink: string;
};

/**
 * Token menu nhóm — dark navy bubble glass + viền xanh (`.catalog-menu-glass`).
 */
export const CATALOG_MENU_DARK = {
  /** Class CSS dark gradient bubble glass (index.css). */
  surfaceClass: 'catalog-menu-glass',
  border: 'color-mix(in srgb, #5eb8e8 45%, transparent)',
  text: 'rgba(255,255,255,0.92)',
  muted: 'rgba(255,255,255,0.45)',
  hover: 'rgba(94,184,232,0.1)',
  active: 'rgba(94,184,232,0.16)',
} as const;

const GROUP_COLORS: Record<string, GroupColor> = {
  'nha-cua': { main: '#0f9d8a', soft: '#e6f6f3', ink: '#0a7a6b' },
  'sua-chua': { main: '#2563eb', soft: '#e5edff', ink: '#1d4ed8' },
  'xay-dung': { main: '#b45309', soft: '#fdf0dc', ink: '#92400e' },
  'cham-soc': { main: '#e11d74', soft: '#fde7f1', ink: '#be1560' },
  'lam-dep': { main: '#c026d3', soft: '#fbe8fe', ink: '#a21caf' },
  'bep-doi-song': { main: '#ea580c', soft: '#ffeade', ink: '#c2410c' },
  xe: { main: '#0e7490', soft: '#dff4f9', ink: '#155e75' },
  /** Học tập — xanh lá (sách), khớp menu tối. */
  'hoc-tap': { main: '#22c55e', soft: '#e3f7e9', ink: '#15803d' },
  /** Game — tím controller. */
  game: { main: '#a855f7', soft: '#eee8fe', ink: '#7e22ce' },
  /** Lập trình — xanh dương brackets. */
  'lap-trinh': { main: '#3b82f6', soft: '#e0f2fe', ink: '#1d4ed8' },
  /** Thiết kế — hồng / magenta. */
  'thiet-ke': { main: '#ec4899', soft: '#fde8f1', ink: '#be185d' },
  /** Sự kiện — hồng camera. */
  'su-kien': { main: '#f472b6', soft: '#fce7f3', ink: '#db2777' },
  'thu-cung': { main: '#d97706', soft: '#fef1d9', ink: '#b45309' },
  /** Thể thao — lime tạ. */
  'the-thao': { main: '#84cc16', soft: '#ecfccb', ink: '#4d7c0f' },
  /** Doanh nghiệp — nâu / tan cặp. */
  'doanh-nghiep': { main: '#c4a484', soft: '#f5efe8', ink: '#8b6914' },
  /** Tài chính — teal cân. */
  'tai-chinh': { main: '#2dd4bf', soft: '#e0f2f0', ink: '#0f766e' },
  'san-vuon': { main: '#65a30d', soft: '#eef8dc', ink: '#4d7c0f' },
  /** Marketing — đỏ biểu đồ. */
  'marketing-online': { main: '#ef4444', soft: '#fee7e7', ink: '#b91c1c' },
  /** Dịch thuật — cam chữ A. */
  'ngon-ngu': { main: '#f59e0b', soft: '#fef3c7', ink: '#b45309' },
  /** Trợ lý từ xa — bạc / xám đồng hồ. */
  'tro-ly-tu-xa': { main: '#a8a29e', soft: '#f1efed', ink: '#57534e' },
  /** Tư vấn — xanh dương nhạt nhóm người. */
  'tu-van-phat-trien': { main: '#38bdf8', soft: '#e0f2fe', ink: '#0284c7' },
  /** Giải trí — cam sparkles. */
  'giai-tri': { main: '#fb923c', soft: '#ffedd5', ink: '#c2410c' },
};

const FALLBACK: GroupColor = { main: '#0f9d8a', soft: '#e6f6f3', ink: '#0a7a6b' };

export function groupColor(slug: string | null | undefined): GroupColor {
  return GROUP_COLORS[slug ?? ''] ?? FALLBACK;
}

/** Màu chip/tab nghề — luôn theo nhóm catalog của service (README: soft + ink). */
export function offeringColor(groupSlug: string | null | undefined): GroupColor {
  return groupColor(groupSlug);
}
