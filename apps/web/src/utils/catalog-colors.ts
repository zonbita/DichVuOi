/**
 * Bảng màu ngành nghề — mỗi nhóm dịch vụ (Group) có một màu nhận diện riêng.
 * Quy định chi tiết xem mục "Bảng màu ngành nghề" trong README gốc.
 */

export type GroupColor = {
  /** Màu chính — chữ đậm, icon, viền nhấn. */
  main: string;
  /** Nền nhạt — chip, badge, khối nền. */
  soft: string;
  /** Màu chữ trên nền nhạt. */
  ink: string;
};

const GROUP_COLORS: Record<string, GroupColor> = {
  'nha-cua': { main: '#0f9d8a', soft: '#e6f6f3', ink: '#0a7a6b' },
  'sua-chua': { main: '#2563eb', soft: '#e5edff', ink: '#1d4ed8' },
  'xay-dung': { main: '#b45309', soft: '#fdf0dc', ink: '#92400e' },
  'cham-soc': { main: '#e11d74', soft: '#fde7f1', ink: '#be1560' },
  'lam-dep': { main: '#c026d3', soft: '#fbe8fe', ink: '#a21caf' },
  'bep-doi-song': { main: '#ea580c', soft: '#ffeade', ink: '#c2410c' },
  xe: { main: '#0e7490', soft: '#dff4f9', ink: '#155e75' },
  'hoc-tap': { main: '#4f46e5', soft: '#e8e7fd', ink: '#4338ca' },
  game: { main: '#7c3aed', soft: '#eee8fe', ink: '#6d28d9' },
  'lap-trinh': { main: '#0284c7', soft: '#e0f2fe', ink: '#0369a1' },
  'thiet-ke': { main: '#db2777', soft: '#fde8f1', ink: '#be185d' },
  'su-kien': { main: '#9333ea', soft: '#f2e9fe', ink: '#7e22ce' },
  'thu-cung': { main: '#d97706', soft: '#fef1d9', ink: '#b45309' },
  'the-thao': { main: '#16a34a', soft: '#e3f7e9', ink: '#15803d' },
  'doanh-nghiep': { main: '#475569', soft: '#eaeef4', ink: '#334155' },
  'tai-chinh': { main: '#0f766e', soft: '#e0f2f0', ink: '#115e59' },
  'san-vuon': { main: '#65a30d', soft: '#eef8dc', ink: '#4d7c0f' },
  'marketing-online': { main: '#dc2626', soft: '#fee7e7', ink: '#b91c1c' },
  'ngon-ngu': { main: '#ca8a04', soft: '#fdf4d7', ink: '#a16207' },
  'tro-ly-tu-xa': { main: '#78716c', soft: '#f1efed', ink: '#57534e' },
  'tu-van-phat-trien': { main: '#059669', soft: '#dff5ec', ink: '#047857' },
  'giai-tri': { main: '#eab308', soft: '#fef9c3', ink: '#a16207' },
};

const FALLBACK: GroupColor = { main: '#0f9d8a', soft: '#e6f6f3', ink: '#0a7a6b' };

export function groupColor(slug: string | null | undefined): GroupColor {
  return GROUP_COLORS[slug ?? ''] ?? FALLBACK;
}
