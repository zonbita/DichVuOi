import type { CSSProperties } from 'react';
import type { ChatbotSource } from '../../types/chatbot';

export const FAB_SURFACE: CSSProperties = {
  background:
    'radial-gradient(circle at 42% 36%, #5eead4 0%, #14b8a6 38%, #009c95 68%, #0f766e 100%)',
  boxShadow:
    '0 10px 28px rgba(0, 122, 116, 0.38), 0 2px 6px rgba(7, 59, 92, 0.18), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -10px 18px rgba(7, 59, 92, 0.18)',
};

export const PANEL_SHADOW =
  '0 18px 48px rgba(7, 59, 92, 0.18), 0 4px 14px rgba(0, 156, 149, 0.12)';

export type ChatTab = 'ai' | 'support';

export type AiMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  source?: ChatbotSource;
  matchedQuestion?: string;
};

export function sourceLabel(source?: ChatbotSource) {
  if (source === 'faq') return 'FAQ sẵn';
  if (source === 'chatgpt') return 'ChatGPT';
  if (source === 'fallback') return 'Gợi ý';
  return '';
}

export function newSessionId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `s-${Date.now()}`;
  }
}

export const TOKEN_KEY = 'dichvuoi_token';
export const FAB_POS_KEY = 'dichvuoi_chatbot_fab_pos';
export const FAB_SIZE = 56;
export const FAB_GAP = 12;
export const DRAG_THRESHOLD = 6;

export type FabPos = { x: number; y: number };

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function defaultFabPos(): FabPos {
  if (typeof window === 'undefined') return { x: 24, y: 24 };
  return {
    x: Math.max(8, window.innerWidth - FAB_SIZE - 24),
    y: Math.max(8, window.innerHeight - FAB_SIZE - 24),
  };
}

export function loadFabPos(): FabPos {
  try {
    const raw = sessionStorage.getItem(FAB_POS_KEY);
    if (!raw) return defaultFabPos();
    const parsed = JSON.parse(raw) as FabPos;
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
      return clampFabPos(parsed);
    }
  } catch {
    /* ignore */
  }
  return defaultFabPos();
}

export function saveFabPos(pos: FabPos) {
  try {
    sessionStorage.setItem(FAB_POS_KEY, JSON.stringify(pos));
  } catch {
    /* ignore */
  }
}

export function clampFabPos(pos: FabPos): FabPos {
  if (typeof window === 'undefined') return pos;
  const margin = 8;
  return {
    x: clamp(pos.x, margin, Math.max(margin, window.innerWidth - FAB_SIZE - margin)),
    y: clamp(pos.y, margin, Math.max(margin, window.innerHeight - FAB_SIZE - margin)),
  };
}

/** Panel neo cạnh FAB — ưu tiên phía trên, canh mép phải với nút. */
export function panelStyleFromFab(fab: FabPos): CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const panelW = Math.min(380, vw - 16);
  const panelH = Math.min(vh * 0.7, 560);
  const margin = 8;

  let left = fab.x + FAB_SIZE - panelW;
  left = clamp(left, margin, Math.max(margin, vw - panelW - margin));

  let top = fab.y - FAB_GAP - panelH;
  if (top < margin) {
    top = fab.y + FAB_SIZE + FAB_GAP;
  }
  top = clamp(top, margin, Math.max(margin, vh - Math.min(panelH, vh - margin * 2) - margin));

  return {
    left,
    top,
    width: panelW,
    height: Math.min(panelH, vh - margin * 2),
  };
}
