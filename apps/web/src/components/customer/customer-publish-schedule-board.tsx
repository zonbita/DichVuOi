import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatBookingStatus, formatPrice } from '../../services/api';
import type { ScheduleSlot } from '../../types/catalog';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const ROW_H = 40; // px / hour

function statusTone(status: string) {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-violet-500/90 text-white';
    case 'PENDING':
      return 'bg-[var(--color-brand)]/90 text-white';
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

function formatPublishTime(slot: ScheduleSlot) {
  const start = new Date(slot.publishAt ?? slot.scheduledAt);
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return fmt(start);
}

function formatWorkTime(slot: ScheduleSlot) {
  const start = new Date(slot.scheduledAt);
  return start.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function dayLabel(year: number, month: number, day: number) {
  return new Date(year, month - 1, day).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

type Props = {
  enabled: boolean;
};

function ScheduleSelectedDetail({ selected }: { selected: ScheduleSlot }) {
  return (
    <div className="border-t border-[var(--glass-line,rgba(23,32,51,0.08))] bg-white/30 px-4 py-3 sm:px-5">
      <p className="text-sm font-extrabold">
        {selected.service.name} · {formatBookingStatus(selected.status)}
      </p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Đăng lúc{' '}
        <strong className="text-[var(--color-ink)]">
          {formatPublishTime(selected)}
        </strong>
        {' · '}
        Giờ làm mong muốn: {formatWorkTime(selected)}
        {' · '}
        {formatPrice(selected.totalPrice)}
      </p>
      <p className="mt-1 text-xs text-[var(--color-muted)]">{selected.address}</p>
      <Link
        to={`/don-cua-toi/don/${selected.id}`}
        className="mt-2 inline-block text-sm font-bold text-[var(--color-brand-deep)] hover:underline"
      >
        Xem đơn
      </Link>
    </div>
  );
}

function MobileAgendaList({
  year,
  month,
  itemsByDay,
  days,
  selectedId,
  onSelect,
}: {
  year: number;
  month: number;
  itemsByDay: Map<number, ScheduleSlot[]>;
  days: number[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const daysWithSlots = days.filter((day) => (itemsByDay.get(day) ?? []).length > 0);

  if (daysWithSlots.length === 0) {
    return (
      <p className="px-4 py-4 text-sm text-[var(--color-muted)] md:hidden">
        Tháng này chưa có lịch đăng đơn.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--color-line)] md:hidden">
      {daysWithSlots.map((day) => {
        const slots = [...(itemsByDay.get(day) ?? [])].sort(
          (a, b) => a.startHour - b.startHour,
        );
        return (
          <li key={day} className="px-4 py-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--color-muted)]">
              {dayLabel(year, month, day)}
            </p>
            <ul className="mt-2 space-y-2">
              {slots.map((slot) => (
                <li key={slot.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(slot.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                      selectedId === slot.id
                        ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)]/80'
                        : 'border-[var(--glass-line,rgba(23,32,51,0.08))] bg-white/55 hover:border-[var(--color-brand)]/40'
                    }`}
                  >
                    <span
                      className={`mt-0.5 shrink-0 rounded-md px-2 py-1 text-[11px] font-bold ${statusTone(slot.status)}`}
                    >
                      {formatPublishTime(slot)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-[var(--color-ink)]">
                        {slot.service.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--color-muted)]">
                        {formatBookingStatus(slot.status)} ·{' '}
                        {formatPrice(slot.totalPrice)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

function DesktopMonthGrid({
  daysInMonth,
  days,
  now,
  year,
  month,
  itemsByDay,
  selectedId,
  onSelect,
}: {
  daysInMonth: number;
  days: number[];
  now: Date;
  year: number;
  month: number;
  itemsByDay: Map<number, ScheduleSlot[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="hidden max-h-[min(70vh,720px)] overflow-auto md:block">
      <div
        className="relative grid min-w-[720px]"
        style={{
          gridTemplateColumns: `52px repeat(${daysInMonth}, minmax(40px, 1fr))`,
        }}
      >
        <div className="sticky top-0 left-0 z-30 border-b border-[var(--glass-line,rgba(23,32,51,0.08))] bg-white/80 px-1 py-2 text-center text-[10px] font-bold text-[var(--color-muted)] backdrop-blur-sm">
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
              className={`sticky top-0 z-20 border-b border-l border-[var(--glass-line,rgba(23,32,51,0.08))] py-2 text-center text-[11px] font-bold backdrop-blur-sm ${
                isToday
                  ? 'bg-[var(--color-brand)]/15 text-[var(--color-brand-deep)]'
                  : 'bg-white/70 text-[var(--color-ink)]'
              }`}
            >
              {day}
            </div>
          );
        })}

        <div className="relative" style={{ height: ROW_H * 24 }}>
          {HOURS.map((hour) => (
            <div
              key={`label-${hour}`}
              className="sticky left-0 z-10 flex items-start justify-end border-b border-[var(--glass-line,rgba(23,32,51,0.08))] bg-white/80 pr-1.5 pt-0.5 text-[10px] font-semibold text-[var(--color-muted)] backdrop-blur-sm"
              style={{ height: ROW_H }}
            >
              {formatHourLabel(hour)}
            </div>
          ))}
        </div>

        {days.map((day) => (
          <div
            key={`day-${day}`}
            className="relative border-l border-[var(--color-line)]"
            style={{ height: ROW_H * 24 }}
          >
            {HOURS.map((hour) => (
              <div
                key={`g-${day}-${hour}`}
                className="border-b border-[var(--glass-line,rgba(23,32,51,0.08))] bg-white/40"
                style={{ height: ROW_H }}
              />
            ))}
            {(itemsByDay.get(day) ?? []).map((slot) => {
              const top = slot.startHour * ROW_H;
              const height = Math.max(16, (slot.endHour - slot.startHour) * ROW_H - 2);
              return (
                <button
                  key={slot.id}
                  type="button"
                  title={`${slot.service.name} · đăng ${formatPublishTime(slot)}`}
                  onClick={() => onSelect(slot.id)}
                  className={`absolute left-0.5 right-0.5 z-[1] overflow-hidden rounded-md px-1 py-0.5 text-left shadow-sm ring-1 ring-black/10 transition hover:brightness-110 ${statusTone(slot.status)} ${
                    selectedId === slot.id ? 'ring-2 ring-[var(--color-ink)]' : ''
                  }`}
                  style={{ top, height }}
                >
                  <span className="block truncate text-[9px] font-extrabold leading-tight">
                    {formatPublishTime(slot)}
                  </span>
                  <span className="block truncate text-[8px] leading-tight opacity-95">
                    {slot.service.name}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CustomerPublishScheduleBoard({ enabled }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const scheduleQuery = useQuery({
    queryKey: ['bookings', 'mine', 'publish-schedule', year, month],
    queryFn: () => api.getCustomerPublishSchedule(year, month),
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

  function goToToday() {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setSelectedId(null);
  }

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className="glass-card overflow-hidden !rounded-2xl p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--glass-line,rgba(23,32,51,0.08))] bg-white/25 px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-xl font-extrabold">Lịch đăng đơn theo tháng</h2>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">
            <span className="md:hidden">Danh sách theo ngày · chạm để xem chi tiết</span>
            <span className="hidden md:inline">
              Mỗi cột = 1 ngày · 24 hàng giờ · khối = giờ đăng lên bảng tin
            </span>
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
          <button
            type="button"
            onClick={goToToday}
            disabled={isCurrentMonth}
            className="rounded-lg border border-[var(--color-brand)]/40 bg-[var(--color-brand-soft)]/70 px-3 py-1.5 text-sm font-bold text-[var(--color-brand-deep)] transition hover:bg-[var(--color-brand-soft)] disabled:cursor-default disabled:opacity-50"
          >
            Hôm nay
          </button>
        </div>
      </div>

      {scheduleQuery.isLoading ? (
        <p className="px-5 py-3 text-sm text-[var(--color-muted)]">Đang tải lịch…</p>
      ) : (
        <>
          <MobileAgendaList
            year={year}
            month={month}
            itemsByDay={itemsByDay}
            days={days}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <DesktopMonthGrid
            daysInMonth={daysInMonth}
            days={days}
            now={now}
            year={year}
            month={month}
            itemsByDay={itemsByDay}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </>
      )}

      {selected ? <ScheduleSelectedDetail selected={selected} /> : null}

      {!selected &&
      (scheduleQuery.data?.items.length ?? 0) === 0 &&
      !scheduleQuery.isLoading ? (
        <p className="hidden px-5 py-3 text-sm text-[var(--color-muted)] md:block">
          Tháng này chưa có lịch đăng. Khi thuê dịch vụ, bật «Hẹn giờ đăng» để
          đặt lịch tại đây.
        </p>
      ) : null}
    </section>
  );
}
