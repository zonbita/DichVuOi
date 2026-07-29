const STORAGE_PREFIX = 'dichvuoi.chatRead.';

export function chatReadStorageKey(userId: string, bookingId: string) {
  return `${STORAGE_PREFIX}${userId}.${bookingId}`;
}

export function getBookingChatReadAt(
  userId: string,
  bookingId: string,
): string | null {
  try {
    return localStorage.getItem(chatReadStorageKey(userId, bookingId));
  } catch {
    return null;
  }
}

export function markBookingChatRead(userId: string, bookingId: string) {
  const at = new Date().toISOString();
  try {
    localStorage.setItem(chatReadStorageKey(userId, bookingId), at);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent('dichvuoi-chat-read', {
      detail: { bookingId, userId, at },
    }),
  );
  return at;
}

export function countUnreadMessages(
  messages: Array<{ sender: { id: string }; createdAt: string }>,
  currentUserId: string,
  readAt: string | null,
): number {
  const since = readAt ? Date.parse(readAt) : 0;
  let count = 0;
  for (const message of messages) {
    if (message.sender.id === currentUserId) continue;
    if (Date.parse(message.createdAt) > since) count += 1;
  }
  return count;
}
