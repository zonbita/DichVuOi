import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';

const TOKEN_KEY = 'dichvuoi_token';
const PING_MS = 45_000;

/**
 * Giữ Socket.IO + heartbeat để tích giờ online (level) khi người làm đang mở app.
 * Nhẹ: không listen booking events (dashboard dùng usePartnerRealtime riêng).
 */
export function usePartnerPresence(enabled: boolean) {
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
    const timer = window.setInterval(ping, PING_MS);

    return () => {
      window.clearInterval(timer);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);
}
