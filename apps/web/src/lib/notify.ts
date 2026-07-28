export type NotifyType = 'success' | 'error' | 'warning' | 'info';

export type NotifyPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'left-center'
  | 'right-center'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type NotifyItem = {
  id: string;
  type: NotifyType;
  title: string;
  description?: string;
  duration: number;
  confetti: boolean;
  createdAt: number;
};

export type NotifyOptions = {
  title?: string;
  description?: string;
  duration?: number;
  /** Confetti — mặc định bật với success. */
  confetti?: boolean;
};

const DEFAULT_TITLES: Record<NotifyType, string> = {
  success: 'Thành công',
  error: 'Lỗi',
  warning: 'Cảnh báo',
  info: 'Thông báo',
};

const DEFAULT_DURATION = 4500;
const MAX_VISIBLE = 5;

type Listener = () => void;

let items: NotifyItem[] = [];
const listeners = new Set<Listener>();
let defaultPosition: NotifyPosition = 'top-right';

function emit() {
  for (const listener of listeners) listener();
}

function uid() {
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function push(type: NotifyType, message: string, options: NotifyOptions = {}) {
  let title: string;
  let description: string | undefined;

  if (options.title) {
    title = options.title;
    description = options.description ?? message;
  } else if (options.description) {
    title = message;
    description = options.description;
  } else {
    title = DEFAULT_TITLES[type];
    description = message;
  }

  const item: NotifyItem = {
    id: uid(),
    type,
    title,
    description,
    duration: options.duration ?? DEFAULT_DURATION,
    confetti: options.confetti ?? type === 'success',
    createdAt: Date.now(),
  };

  items = [item, ...items].slice(0, MAX_VISIBLE);
  emit();

  if (item.duration > 0) {
    window.setTimeout(() => dismiss(item.id), item.duration);
  }

  return item.id;
}

export function dismiss(id: string) {
  const next = items.filter((n) => n.id !== id);
  if (next.length === items.length) return;
  items = next;
  emit();
}

export function dismissAll() {
  if (items.length === 0) return;
  items = [];
  emit();
}

export function getNotifySnapshot() {
  return items;
}

export function subscribeNotify(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getNotifyPosition() {
  return defaultPosition;
}

export function setNotifyPosition(position: NotifyPosition) {
  defaultPosition = position;
  emit();
}

/** API chính — kiểu RxNotify: success / error / warning / info. */
export const notify = {
  success: (message: string, options?: NotifyOptions) =>
    push('success', message, options),
  error: (message: string, options?: NotifyOptions) =>
    push('error', message, options),
  warning: (message: string, options?: NotifyOptions) =>
    push('warning', message, options),
  info: (message: string, options?: NotifyOptions) =>
    push('info', message, options),
};

type ToastCallOptions = {
  description?: string;
  duration?: number;
  title?: string;
  confetti?: boolean;
};

/**
 * Shim tương thích Sonner — hooks realtime chỉ đổi import.
 * toast('...') / toast.message / toast.success / toast.error
 */
export function toast(
  message: string,
  options?: ToastCallOptions,
): string {
  return notify.info(message, options);
}

toast.success = (message: string, options?: ToastCallOptions) =>
  notify.success(message, options);
toast.error = (message: string, options?: ToastCallOptions) =>
  notify.error(message, options);
toast.warning = (message: string, options?: ToastCallOptions) =>
  notify.warning(message, options);
toast.info = (message: string, options?: ToastCallOptions) =>
  notify.info(message, options);
toast.message = (message: string, options?: ToastCallOptions) =>
  notify.info(message, options);
toast.dismiss = dismiss;
toast.dismissAll = dismissAll;
