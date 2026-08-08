const STORAGE_PREFIX = 'dichvuoi.supportRead.';

export function supportReadStorageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function getSupportChatReadAt(userId: string): string | null {
  try {
    return localStorage.getItem(supportReadStorageKey(userId));
  } catch {
    return null;
  }
}

export function markSupportChatRead(userId: string) {
  const at = new Date().toISOString();
  try {
    localStorage.setItem(supportReadStorageKey(userId), at);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent('dichvuoi-support-read', {
      detail: { userId, at },
    }),
  );
  return at;
}

export function countSupportUnread(
  messages: Array<{ senderId: string; createdAt: string }>,
  currentUserId: string,
  readAt: string | null,
): number {
  // Chưa từng mở: chỉ đếm tin 7 ngày gần nhất (tránh badge phình từ lịch sử cũ).
  const since = readAt
    ? Date.parse(readAt)
    : Date.now() - 7 * 24 * 60 * 60 * 1000;
  let count = 0;
  for (const message of messages) {
    if (message.senderId === currentUserId) continue;
    if (Date.parse(message.createdAt) > since) count += 1;
  }
  return count;
}

export const OPEN_CHATBOT_EVENT = 'dichvuoi-open-chatbot';

export type OpenChatbotDetail = {
  tab?: 'ai' | 'support';
};

export function openChatbot(detail: OpenChatbotDetail = { tab: 'support' }) {
  window.dispatchEvent(
    new CustomEvent(OPEN_CHATBOT_EVENT, { detail }),
  );
}
