import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { formatBookingStatus } from '../services/api';
import type { Booking, BookingMessage } from '../types/catalog';

const TOKEN_KEY = 'dichvuoi_token';

/**
 * Realtime đơn của khách thuê (namespace /partner-realtime, room customer:{userId}).
 */
export function useCustomerRealtime(enabled: boolean, currentUserId?: string) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const base = import.meta.env.VITE_API_URL ?? '';
    const socket = io(`${base}/partner-realtime`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
    socketRef.current = socket;

    const upsertMine = (booking: Booking) => {
      queryClient.setQueryData(['booking', booking.id], booking);
      queryClient.setQueryData<Booking[]>(['bookings', 'mine'], (prev) => {
        const list = prev ?? [];
        const idx = list.findIndex((b) => b.id === booking.id);
        if (idx >= 0) {
          const next = [...list];
          next[idx] = booking;
          return next;
        }
        return [booking, ...list];
      });
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'mine'] });

      const name = booking.service?.name ?? 'Đơn thuê';
      if (booking.partnerId && booking.status === 'CONFIRMED') {
        toast.success(`${name}: đã có người nhận việc`);
      } else if (booking.status === 'IN_PROGRESS') {
        toast.message(`${name}: ${formatBookingStatus(booking.status)}`);
      } else if (booking.status === 'COMPLETED') {
        toast.success(`${name}: hoàn thành`);
      } else if (booking.status === 'CANCELLED') {
        toast(`${name}: đã hủy`);
      }
    };

    socket.on('booking:customer_updated', upsertMine);
    socket.on('booking:message', (message: BookingMessage) => {
      queryClient.setQueryData<BookingMessage[]>(
        ['booking-messages', message.bookingId],
        (prev) => {
          const list = prev ?? [];
          if (list.some((m) => m.id === message.id)) return list;
          return [...list, message];
        },
      );
      if (currentUserId && message.sender.id !== currentUserId) {
        toast.message(`Tin mới từ ${message.sender.fullName}`, {
          description:
            message.body.length > 80
              ? `${message.body.slice(0, 80)}…`
              : message.body,
        });
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, currentUserId, queryClient]);
}
