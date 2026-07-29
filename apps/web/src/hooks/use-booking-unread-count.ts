import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  countUnreadMessages,
  getBookingChatReadAt,
} from '../lib/booking-chat-read';
import { api } from '../services/api';

/** Số tin từ đối phương chưa đọc (local last-read). */
export function useBookingUnreadCount(
  bookingId: string,
  currentUserId: string,
  enabled: boolean,
) {
  const [readAt, setReadAt] = useState(() =>
    currentUserId ? getBookingChatReadAt(currentUserId, bookingId) : null,
  );

  const messagesQuery = useQuery({
    queryKey: ['booking-messages', bookingId],
    queryFn: () => api.getBookingMessages(bookingId),
    enabled: enabled && Boolean(bookingId) && Boolean(currentUserId),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!currentUserId) return;
    setReadAt(getBookingChatReadAt(currentUserId, bookingId));

    function onChange(event: Event) {
      const detail = (event as CustomEvent<{ bookingId?: string }>).detail;
      if (detail?.bookingId && detail.bookingId !== bookingId) return;
      setReadAt(getBookingChatReadAt(currentUserId, bookingId));
    }

    window.addEventListener('dichvuoi-chat-read', onChange);
    return () => window.removeEventListener('dichvuoi-chat-read', onChange);
  }, [bookingId, currentUserId]);

  return useMemo(
    () =>
      countUnreadMessages(
        messagesQuery.data ?? [],
        currentUserId,
        readAt,
      ),
    [messagesQuery.data, currentUserId, readAt],
  );
}
