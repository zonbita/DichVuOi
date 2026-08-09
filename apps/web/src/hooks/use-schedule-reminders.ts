import { useEffect } from 'react';
import type { Booking } from '../types/catalog';

const SEEN_KEY = 'dichvuoi_schedule_remind_seen';

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<string>) {
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-80)));
}

/**
 * Nhắc lịch local khi app đang mở / PWA đã cấp quyền Notification.
 * Không phải Web Push server — đủ cho P1 nhẹ.
 */
export function useScheduleReminders(
  enabled: boolean,
  bookings: Booking[] | undefined,
) {
  useEffect(() => {
    if (!enabled || !bookings?.length) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    const seen = loadSeen();
    const now = Date.now();
    const horizon = now + 24 * 60 * 60 * 1000;

    for (const b of bookings) {
      if (!['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)) continue;
      const at = new Date(b.scheduledAt).getTime();
      if (!Number.isFinite(at) || at < now || at > horizon) continue;
      const key = `${b.id}:${b.scheduledAt}`;
      if (seen.has(key)) continue;

      const mins = Math.round((at - now) / 60_000);
      const when =
        mins < 60
          ? `${mins} phút nữa`
          : `${Math.round(mins / 60)} giờ nữa`;
      const title = b.service?.name ?? 'Lịch dịch vụ';
      try {
        new Notification(`Nhắc lịch · ${title}`, {
          body: `Bắt đầu ${when} · ${new Date(b.scheduledAt).toLocaleString('vi-VN')}`,
          icon: '/favicon.png',
          tag: key,
          data: { url: `/don-cua-toi/don/${b.id}` },
        });
        seen.add(key);
      } catch {
        /* ignore */
      }
    }
    saveSeen(seen);
  }, [enabled, bookings]);
}

export async function requestScheduleNotificationPermission() {
  if (typeof Notification === 'undefined') {
    return 'denied' as NotificationPermission;
  }
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}
