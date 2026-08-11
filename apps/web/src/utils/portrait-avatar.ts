import { mediaSrc } from './media-src';

/** Số ảnh chân dung trong `public/avatars` — khớp API `portraitAvatarUrl`. */
const PORTRAIT_COUNT = 9;

/** Ảnh chân dung ổn định theo seed (id/email). */
export function portraitAvatarUrl(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const index = (hash % PORTRAIT_COUNT) + 1;
  return `/avatars/vn-avatar-${String(index).padStart(2, '0')}.jpg`;
}

export function resolveUserAvatarUrl(input: {
  id?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}): string {
  if (input.avatarUrl) return mediaSrc(input.avatarUrl);
  return mediaSrc(portraitAvatarUrl(input.id || input.email || 'guest'));
}
