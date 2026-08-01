import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Trì hoãn giá trị ô tìm kiếm để không gọi API mỗi lần gõ. */
export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Bộ lọc admin sống trong URL để chia sẻ / bookmark được
 * (vd. `/admin/partners?verified=false`). Đổi filter luôn reset về trang 1.
 */
export function useFilterParams() {
  const [params, setParams] = useSearchParams();

  const get = (key: string) => params.get(key) ?? '';
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const setPage = (value: number) => setParam('page', String(value));

  return { get, page, setParam, setPage };
}

/** Ô tìm kiếm gõ tại chỗ, đẩy vào URL sau khi ngừng gõ. */
export function useSearchFilter(
  get: (key: string) => string,
  setParam: (key: string, value: string) => void,
) {
  const [input, setInput] = useState(() => get('q'));
  const debounced = useDebounced(input);

  useEffect(() => {
    if (debounced === get('q')) return;
    setParam('q', debounced);
    // `get` / `setParam` đổi mỗi render theo URL — chỉ chạy khi từ khóa đổi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return [input, setInput] as const;
}

export function bookingStatusTone(status: string) {
  if (status === 'COMPLETED') return 'green';
  if (status === 'CANCELLED') return 'red';
  if (status === 'IN_PROGRESS') return 'blue';
  if (status === 'PENDING') return 'amber';
  return 'neutral';
}

export function paymentStatusTone(status: string) {
  if (status === 'RELEASED') return 'green';
  if (status === 'HELD') return 'amber';
  if (status === 'REFUNDED') return 'red';
  return 'neutral';
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN');
}

export const BOOKING_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Chờ nhận việc' },
  { value: 'CONFIRMED', label: 'Đã nhận' },
  { value: 'IN_PROGRESS', label: 'Đang làm' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

export const PAYMENT_STATUS_OPTIONS = [
    { value: 'UNPAID', label: 'Chưa đặt cọc' },
    { value: 'HELD', label: 'Đã đặt cọc (escrow)' },
  { value: 'RELEASED', label: 'Đã giải ngân' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền' },
];

export const ROLE_OPTIONS = [
  { value: 'CUSTOMER', label: 'CUSTOMER' },
  { value: 'PARTNER', label: 'PARTNER' },
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'MODERATOR', label: 'MODERATOR' },
];
