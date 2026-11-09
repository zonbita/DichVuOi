import type {
  HomeLobbyFeed,
  HomeShout,
  HomeShoutKind,
} from '../../../types/home-lobby';
import { DEFAULT_LOBBY_SMILES } from '../../../types/home-lobby';

export const TOKEN_KEY = 'dichvuoi_token';
export const GUEST_KEY = 'dichvuoi_lobby_guest';

export const KIND_HINT: Record<HomeShoutKind, string> = {
  GREETING: 'Chào dịch vụ',
  AVAILABLE: 'Đang nhận việc',
  PROMO: 'Ưu đãi',
  LOOKING: 'Còn slot',
  THANKS: 'Cảm ơn khách',
};

/** 7 màu cầu vồng cho loại hô — tách biệt bảng màu ngành nghề. */
export const KIND_RAINBOW = [
  '#dc2626', // đỏ
  '#ea580c', // cam
  '#ca8a04', // vàng
  '#16a34a', // lục
  '#2563eb', // lam
  '#4f46e5', // chàm
  '#9333ea', // tím
] as const;

export const KIND_ORDER: HomeShoutKind[] = [
  'GREETING',
  'AVAILABLE',
  'PROMO',
  'LOOKING',
  'THANKS',
];

export function kindRainbowColor(kind: HomeShoutKind): string {
  const i = KIND_ORDER.indexOf(kind);
  return KIND_RAINBOW[i >= 0 ? i % KIND_RAINBOW.length : 0];
}

export type SmileChat = {
  id: string;
  text: string;
  at: string;
  fromName: string;
  userId: string | null;
};

export function ensureGuestId() {
  try {
    const existing = localStorage.getItem(GUEST_KEY);
    if (existing) return existing;
    const id = `g_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(GUEST_KEY, id);
    return id;
  } catch {
    return `g_${Date.now()}`;
  }
}

export function prependShout(prev: HomeLobbyFeed | undefined, shout: HomeShout): HomeLobbyFeed {
  const kinds =
    prev?.kinds ??
    (Object.entries(KIND_HINT).map(([k, label]) => ({
      kind: k as HomeShoutKind,
      label,
    })) as HomeLobbyFeed['kinds']);
  const smiles = prev?.smiles?.length ? prev.smiles : [...DEFAULT_LOBBY_SMILES];
  const items = prev?.items ?? [];
  if (items.some((item) => item.id === shout.id)) {
    return prev ?? { items, kinds, smiles };
  }
  return { kinds, smiles, items: [shout, ...items].slice(0, 40) };
}
