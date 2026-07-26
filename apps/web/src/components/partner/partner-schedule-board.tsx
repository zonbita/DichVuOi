import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, formatBookingStatus, formatPrice } from '../../services/api';
import type { ScheduleSlot } from '../../types/catalog';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const ROW_H = 40; // px / hour

function statusTone(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-sky-500/90 text-white';
    case 'IN_PROGRESS':
      return 'bg-amber-500/95 text-white';
    case 'COMPLETED':
      return 'bg-emerald-600/90 text-white';
    default:
      return 'bg-[var(--color-brand)]/90 text-white';
  }
}

function formatHourLabel(h: number) {
  return `${String(h).padStart(2, '0')}:00`;
}

function formatTimeRange(slot: ScheduleSlot) {
  const start = new Date(slot.scheduledAt);
  const end = new Date(start.getTime() + slot.durationMin * 60_000);
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${fmt(start)}–${fmt(end)}`;
}

type Props = {
  enabled: boolean;
};

export function PartnerScheduleBoard({ enabled }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const scheduleQuery = useQuery({
    queryKey: ['bookings', 'partner', 'schedule', year, month],
    queryFn: () => api.getPartnerSchedule(year, month),
    enabled,
  });

  const daysInMonth =
    scheduleQuery.data?.daysInMonth ?? new Date(year, month, 0).getDate();
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );

  const itemsByDay = useMemo(() => {
    const map = new Map<number, ScheduleSlot[]>();
    for (const item of scheduleQuery.data?.items ?? []) {
      const list = map.get(item.day) ?? [];
      list.push(item);
      map.set(item.day, list);
    }
    return map;
  }, [scheduleQuery.data?.items]);

  const selected = (scheduleQuery.data?.items ?? []).find((i) => i.id === selectedId);

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setSelectedId(null);
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className="surface-card overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-xl font-extrabold">Lịch thuê theo tháng</h2>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">
            Mỗi cột = 1 ngày · 24 hàng giờ · khối = giờ thuê (theo thời lượng dịch vụ)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm font-bold hover:bg-[var(--color-canvas)]"
          >
            ‹
          </button>
          <span className="min-w-[9rem] text-center text-sm font-extrabold capitalize">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm font-bold hover:bg-[var(--color-canvas)]"
          >
            ›
          </button>
        </div>
      </div>

      <div className="max-h-[min(70vh,720px)] overflow-auto">
        <div
          className="relative grid min-w-[720px]"
          style={{
            gridTemplateColumns: `52px repeat(${daysInMonth}, minmax(40px, 1fr))`,
          }}
        >
          <div className="sticky top-0 left-0 z-30 border-b border-[var(--color-line)] bg-white px-1 py-2 text-center text-[10px] font-bold text-[var(--color-muted)]">
            Giờ
          </div>
          {days.map((day) => {
            const isToday =
              day === now.getDate() &&
              month === now.getMonth() + 1 &&
              year === now.getFullYear();
            return (
              <div
                key={`h-${day}`}
                className={`sticky top-0 z-20 border-b border-l border-[var(--color-line)] py-2 text-center text-[11px] font-bold ${
                  isToday
                    ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand-deep)]'
                    : 'bg-[var(--color-canvas)] text-[var(--color-ink)]'
                }`}
              >
                {day}
              </div>
            );
          })}

          {/* Cột nhãn giờ */}
          <div className="relative" style={{ height: ROW_H * 24 }}>
            {HOURS.map((hour) => (
              <div
                key={`label-${hour}`}
                className="sticky left-0 z-10 flex items-start justify-end border-b border-[var(--color-line)] bg-white pr-1.5 pt-0.5 text-[10px] font-semibold text-[var(--color-muted)]"
                style={{ height: ROW_H }}
              >
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {/* Cột ngày: lưới giờ + khối thuê absolute */}
          {days.map((day) => (
            <div
              key={`day-${day}`}
              className="relative border-l border-[var(--color-line)]"
              style={{ height: ROW_H * 24 }}
            >
              {HOURS.map((hour) => (
                <div
                  key={`g-${day}-${hour}`}
                  className="border-b border-[var(--color-line)] bg-white/70"
                  style={{ height: ROW_H }}
                />
              ))}
              {(itemsByDay.get(day) ?? []).map((slot) => {
                const top = slot.startHour * ROW_H;
                const height = Math.max(
                  16,
                  (slot.endHour - slot.startHour) * ROW_H - 2,
                );
                return (
                  <button
                    key={slot.id}
                    type="button"
                    title={`${slot.customerName} · ${slot.service.name} · ${formatTimeRange(slot)}`}
                    onClick={() => setSelectedId(slot.id)}
                    className={`absolute left-0.5 right-0.5 z-[1] overflow-hidden rounded-md px-1 py-0.5 text-left shadow-sm ring-1 ring-black/10 transition hover:brightness-110 ${statusTone(slot.status)} ${
                      selectedId === slot.id ? 'ring-2 ring-[var(--color-ink)]' : ''
                    }`}
                    style={{ top, height }}
                  >
                    <span className="block truncate text-[9px] font-extrabold leading-tight">
                      {formatTimeRange(slot)}
                    </span>
                    <span className="block truncate text-[8px] leading-tight opacity-95">
                      {slot.customerName}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {scheduleQuery.isLoading ? (
        <p className="px-5 py-3 text-sm text-[var(--color-muted)]">Đang tải lịch…</p>
      ) : null}

      {selected ? (
        <div className="border-t border-[var(--color-line)] bg-[var(--color-canvas)]/50 px-4 py-3 sm:px-5">
          <p className="text-sm font-extrabold">
            {selected.service.name} · {formatBookingStatus(selected.status)}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Khách thuê:{' '}
            <strong className="text-[var(--color-ink)]">{selected.customerName}</strong>
            {' · '}
            {formatTimeRange(selected)} ({selected.durationHours} giờ)
            {' · '}
            {formatPrice(selected.totalPrice)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">{selected.address}</p>
        </div>
      ) : (scheduleQuery.data?.items.length ?? 0) === 0 && !scheduleQuery.isLoading ? (
        <p className="px-5 py-3 text-sm text-[var(--color-muted)]">
          Tháng này chưa có đơn trên lịch. Nhận việc hoặc được thuê thẳng sẽ hiện giờ thuê tại đây.
        </p>
      ) : null}
    </section>
  );
}
