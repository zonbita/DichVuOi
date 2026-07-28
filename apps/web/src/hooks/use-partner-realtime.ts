import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { toast } from '../lib/notify';
import { formatBookingStatus } from '../services/api';
import type { Booking, BookingMessage } from '../types/catalog';

const TOKEN_KEY = 'dichvuoi_token';

/**
 * Kết nối Socket.IO namespace /partner-realtime.
 * Invalidate / cập nhật cache khi có đơn mở hoặc đơn của partner.
 * Heartbeat presence:ping để tích giờ online (level).
 */
export function usePartnerRealtime(enabled: boolean, currentUserId?: string) {
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

    const ping = () => {
      if (socket.connected) socket.emit('presence:ping');
    };
    socket.on('connect', ping);
    const pingTimer = window.setInterval(ping, 45_000);

    const invalidateOpen = () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'open'] });
    };
    const invalidateMine = () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'partner'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'partner', 'schedule'] });
    };

    socket.on('booking:open', (booking: Booking) => {
      queryClient.setQueryData<Booking[]>(['bookings', 'open'], (prev) => {
        const list = prev ?? [];
        if (list.some((b) => b.id === booking.id)) return list;
        return [booking, ...list];
      });
      invalidateOpen();
      toast.message('Đơn mới trên hàng chờ', {
        description: booking.service?.name,
      });
    });

    socket.on('booking:open_removed', (payload: { id: string }) => {
      queryClient.setQueryData<Booking[]>(['bookings', 'open'], (prev) =>
        (prev ?? []).filter((b) => b.id !== payload.id),
      );
      invalidateOpen();
    });

    socket.on('booking:assigned', (booking: Booking) => {
      queryClient.setQueryData(['booking', booking.id], booking);
      queryClient.setQueryData<Booking[]>(['bookings', 'partner'], (prev) => {
        const list = prev ?? [];
        if (list.some((b) => b.id === booking.id)) {
          return list.map((b) => (b.id === booking.id ? booking : b));
        }
        return [booking, ...list];
      });
      invalidateMine();
      invalidateOpen();
      toast.success(`Đã nhận: ${booking.service?.name ?? 'đơn'}`);
    });

    socket.on('booking:updated', (booking: Booking) => {
      queryClient.setQueryData(['booking', booking.id], booking);
      queryClient.setQueryData<Booking[]>(['bookings', 'partner'], (prev) =>
        (prev ?? []).map((b) => (b.id === booking.id ? booking : b)),
      );
      invalidateMine();
      const name = booking.service?.name ?? 'Đơn';
      if (booking.status === 'COMPLETED') {
        toast.success(`${name}: hoàn thành — chờ giải ngân`);
      } else if (booking.status === 'CANCELLED') {
        toast(`${name}: đã hủy`);
      } else {
        toast.message(`${name}: ${formatBookingStatus(booking.status)}`);
      }
    });

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
      window.clearInterval(pingTimer);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, currentUserId, queryClient]);
}
