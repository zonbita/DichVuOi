import { useSyncExternalStore, type CSSProperties } from 'react';
import {
  dismiss,
  getNotifyPosition,
  getNotifySnapshot,
  subscribeNotify,
  type NotifyItem,
  type NotifyPosition,
  type NotifyType,
} from '../../lib/notify';

const POSITION_CLASS: Record<NotifyPosition, string> = {
  'top-left': 'rx-notify-host--top-left',
  'top-center': 'rx-notify-host--top-center',
  'top-right': 'rx-notify-host--top-right',
  'left-center': 'rx-notify-host--left-center',
  'right-center': 'rx-notify-host--right-center',
  'bottom-left': 'rx-notify-host--bottom-left',
  'bottom-center': 'rx-notify-host--bottom-center',
  'bottom-right': 'rx-notify-host--bottom-right',
};

const TYPE_META: Record<
  NotifyType,
  { label: string; icon: string; accent: string }
> = {
  success: { label: 'OK', icon: '✓', accent: '#22c55e' },
  error: { label: 'ERR', icon: '✕', accent: '#ef4444' },
  warning: { label: '!', icon: '!', accent: '#f59e0b' },
  info: { label: 'i', icon: 'ℹ', accent: '#38bdf8' },
};

function ConfettiBurst() {
  const bits = Array.from({ length: 14 }, (_, i) => i);
  return (
    <span className="rx-notify-confetti" aria-hidden>
      {bits.map((i) => (
        <span
          key={i}
          className="rx-notify-confetti__bit"
          style={
            {
              '--rx-i': i,
              '--rx-x': `${(i % 7) * 12 - 36}px`,
              '--rx-hue': `${(i * 37) % 360}`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

function NotifyCard({ item }: { item: NotifyItem }) {
  const meta = TYPE_META[item.type];

  return (
    <div
      className={`rx-notify rx-notify--${item.type}`}
      role="status"
      style={{ '--rx-accent': meta.accent } as CSSProperties}
    >
      {item.confetti ? <ConfettiBurst /> : null}
      <div className="rx-notify__glow" aria-hidden />
      <div className="rx-notify__icon" aria-hidden>
        <span>{meta.icon}</span>
      </div>
      <div className="rx-notify__body">
        <p className="rx-notify__title">{item.title}</p>
        {item.description ? (
          <p className="rx-notify__desc">{item.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        className="rx-notify__close"
        aria-label="Đóng thông báo"
        onClick={() => dismiss(item.id)}
      >
        ×
      </button>
      <span
        className="rx-notify__progress"
        style={{ animationDuration: `${item.duration}ms` }}
        aria-hidden
      />
    </div>
  );
}

type Props = {
  position?: NotifyPosition;
};

export function RxNotifyToaster({ position }: Props) {
  const items = useSyncExternalStore(
    subscribeNotify,
    getNotifySnapshot,
    () => [] as NotifyItem[],
  );
  const resolved = position ?? getNotifyPosition();

  if (items.length === 0) return null;

  return (
    <div
      className={`rx-notify-host ${POSITION_CLASS[resolved]}`}
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((item) => (
        <NotifyCard key={item.id} item={item} />
      ))}
    </div>
  );
}
