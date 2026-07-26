/** Số ảnh chân dung người Việt trong `apps/web/public/avatars` (200×200). */
const PORTRAIT_COUNT = 9;

/** Ảnh chân dung người Việt (asset local), ổn định theo seed — không cartoon, không API ngoài. */
export function portraitAvatarUrl(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const index = (hash % PORTRAIT_COUNT) + 1;
  return `/avatars/vn-avatar-${String(index).padStart(2, '0')}.jpg`;
}
