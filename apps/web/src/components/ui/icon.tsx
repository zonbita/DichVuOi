import type { CSSProperties, ReactNode } from 'react';
import { useId } from 'react';

const shapes = {
  home: (
    <>
      <path d="M3 10.5 12 3.5l9 7" />
      <path d="M5.5 9.5V20.5h13V9.5" />
      <path d="M10 20.5v-5h4v5" />
    </>
  ),
  wrench: (
    <>
      <path d="M15.2 3.6a5.2 5.2 0 0 0-5.6 7.1l-6 6a2.1 2.1 0 0 0 3 3l6-6a5.2 5.2 0 0 0 7.1-5.6l-3 3-2.6-.5-.5-2.6z" />
    </>
  ),
  snowflake: (
    <>
      <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5 4.2 16.5" />
      <path d="M9.5 4.8 12 7l2.5-2.2M9.5 19.2 12 17l2.5 2.2" />
    </>
  ),
  heart: (
    <>
      <path d="M12 20.2c-4.5-2.8-7.5-6-7.5-9.4A3.9 3.9 0 0 1 12 8.2a3.9 3.9 0 0 1 7.5 2.6c0 3.4-3 6.6-7.5 9.4z" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v14.5H6.5A2.5 2.5 0 0 0 4 20z" />
      <path d="M4 20a2.5 2.5 0 0 1 2.5-2.5H20V21H6.5A2.5 2.5 0 0 1 4 20z" />
    </>
  ),
  bookOpen: (
    <>
      <path d="M12 7c-2-1.6-4.6-2.4-8-2.4v14.2c3.4 0 6 0.8 8 2.4" />
      <path d="M12 7c2-1.6 4.6-2.4 8-2.4v14.2c-3.4 0-6 0.8-8 2.4" />
      <path d="M12 7v14.2" />
    </>
  ),
  graduation: (
    <>
      <path d="m12 4.5 9 4-9 4-9-4z" />
      <path d="M7 11v4.6c0 1.5 2.2 2.7 5 2.7s5-1.2 5-2.7V11" />
    </>
  ),
  sparkles: (
    <>
      <path d="m11 3.5 1.7 4.3 4.3 1.7-4.3 1.7L11 15.5 9.3 11.2 5 9.5l4.3-1.7z" />
      <path d="m17.5 14.5.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
    </>
  ),
  star: (
    <>
      <path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </>
  ),
  pencil: (
    <>
      <path d="M12 20.5h8.5" />
      <path d="M16.4 3.9a2.1 2.1 0 0 1 3 3l.7.7a2.1 2.1 0 0 1 0 3L9.2 18.5 4.5 19.5l1-4.7z" />
    </>
  ),
  languages: (
    <>
      <path d="M5 8h8M9 8c0 5-2.5 8.5-6 10" />
      <path d="M12.5 8c-.4 2.2-1.4 4.2-2.8 5.8" />
      <path d="M13.5 14h7M17 14l3 6M14.5 20l3-6" />
    </>
  ),
  code: (
    <>
      <path d="m9 8-5 4 5 4M15 8l5 4-5 4M13.2 6.5 10.8 17.5" />
    </>
  ),
  game: (
    <>
      <rect x="2.8" y="7.8" width="18.4" height="10.4" rx="4.5" />
      <path d="M7.5 11.2v3.4M5.8 12.9h3.4M15.3 12.2h.01M17.6 14.4h.01" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.1 0-.9.8-1.6 1.7-1.6h1.2A4.8 4.8 0 0 0 20.5 10c0-3.6-3.8-6.5-8.5-6.5z" />
      <path d="M7.8 12.2h.01M10 8.4h.01M14.4 8.4h.01" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6.8h10.5v10H3z" />
      <path d="M13.5 10h3.6l3.4 3.4v3.4h-7z" />
      <circle cx="7" cy="18.2" r="1.8" />
      <circle cx="17.2" cy="18.2" r="1.8" />
    </>
  ),
  hammer: (
    <>
      <path d="m15 4.5 4.5 4.5-2 2-4.5-4.5z" />
      <path d="m13.2 8.8-8.4 8.4a1.8 1.8 0 0 0 2.5 2.5l8.4-8.4" />
      <path d="m16.5 7.5 2.2-2.2" />
    </>
  ),
  utensils: (
    <>
      <path d="M7 3.5v8M5.2 3.5v4.2a1.8 1.8 0 0 0 3.6 0V3.5M7 11.5v9" />
      <path d="M16.5 3.5v7.5h2.2V3.5M17.6 11v9.5" />
    </>
  ),
  camera: (
    <>
      <path d="M3.5 8.5h4l1.5-2h6l1.5 2h4v10.5h-17z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M6.5 9.5v5M17.5 9.5v5M4 11v2M20 11v2M6.5 12h11" />
      <rect x="2.5" y="8.5" width="2.5" height="7" rx="0.8" />
      <rect x="19" y="8.5" width="2.5" height="7" rx="0.8" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M9 7.5V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7.5M3 12.5h18" />
    </>
  ),
  scale: (
    <>
      <path d="M12 3.5v17M5 7.5h14" />
      <path d="M5 7.5 2.8 13a3.2 3.2 0 0 0 6.4 0zM19 7.5 16.8 13a3.2 3.2 0 0 0 6.4 0z" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19.5c8-1.5 12.5-6.5 14-14-7.5 1.5-12.5 6-14 14z" />
      <path d="M8.5 15.5c2.5-2.5 5.5-4 9-5" />
    </>
  ),
  beauty: (
    <>
      <path d="m11 3.5 1.7 4.3 4.3 1.7-4.3 1.7L11 15.5 9.3 11.2 5 9.5l4.3-1.7z" />
      <path d="m17.5 14.5.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20.5c1.3-3.5 4-5.2 7-5.2s5.7 1.7 7 5.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.2V12l3.2 1.9" />
    </>
  ),
  shield: (
    <>
      <path d="m12 3 7.2 3v5.4c0 4.4-3 8.1-7.2 9.6-4.2-1.5-7.2-5.2-7.2-9.6V6z" />
      <path d="m9 12 2.2 2.2L15.4 10" />
    </>
  ),
  percent: (
    <>
      <path d="m6.5 17.5 11-11" />
      <circle cx="7.6" cy="7.6" r="2.1" />
      <circle cx="16.4" cy="16.4" r="2.1" />
    </>
  ),
  users: (
    <>
      <circle cx="9.2" cy="8.2" r="3.2" />
      <path d="M3.2 19.2c1-3 3.4-4.6 6-4.6s5 1.6 6 4.6" />
      <path d="M16.2 5.4a3.2 3.2 0 0 1 0 6M18 14.8c2 .8 3.2 2.3 3.8 4.4" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
      <path d="M2.5 10h19M6 14.5h3.5" />
    </>
  ),
  headset: (
    <>
      <path d="M4.5 13.5V12a7.5 7.5 0 0 1 15 0v1.5" />
      <rect x="2.5" y="13" width="4.2" height="6" rx="2.1" />
      <rect x="17.3" y="13" width="4.2" height="6" rx="2.1" />
      <path d="M19.4 19v.6a2.6 2.6 0 0 1-2.6 2.6h-3.3" />
    </>
  ),
  phone: (
    <>
      <path d="M6.2 3.5h2.9l1.5 3.9-2 1.5a12.4 12.4 0 0 0 5.5 5.5l1.5-2 3.9 1.5v2.9a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2z" />
    </>
  ),
  message: (
    <>
      <path d="M20.5 11.8c0 4-3.8 7.3-8.5 7.3-1 0-2-.2-2.9-.5l-4.6 1.5 1.4-3.7c-1.2-1.3-1.9-2.9-1.9-4.6 0-4 3.8-7.3 8.5-7.3s8.5 3.3 8.5 7.3z" />
    </>
  ),
  mail: (
    <>
      <rect x="2.8" y="5.2" width="18.4" height="13.6" rx="2.5" />
      <path d="m3.8 7 8.2 6 8.2-6" />
    </>
  ),
  check: (
    <>
      <path d="m5 12.5 4.6 4.6L19 7.5" />
    </>
  ),
  minus: (
    <>
      <path d="M5 12h14" />
    </>
  ),
  chevronLeft: (
    <>
      <path d="m14.5 5.5-7 6.5 7 6.5" />
    </>
  ),
  chevronRight: (
    <>
      <path d="m9.5 5.5 7 6.5-7 6.5" />
    </>
  ),
  chevronDown: (
    <>
      <path d="m5.5 9 6.5 6.5L18.5 9" />
    </>
  ),
  swap: (
    <>
      <path d="M7 8h12M16 5l3 3-3 3" />
      <path d="M17 16H5M8 13l-3 3 3 3" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  upload: (
    <>
      <path d="M12 4.5v10" />
      <path d="m8 8 4-3.5L16 8" />
      <path d="M5 16.5v2a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-2" />
    </>
  ),
  save: (
    <>
      <path d="M5 4.5h11.5L19.5 7.5V19.5H5z" />
      <path d="M8 4.5v5h7v-5M8 19.5v-6h8v6" />
    </>
  ),
  rotateCcw: (
    <>
      <path d="M4.5 10.5A7.5 7.5 0 1 0 7 6.2" />
      <path d="M4.5 5.5v5h5" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
      <path d="M8 7v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  paw: (
    <>
      <circle cx="7.6" cy="9.2" r="1.8" />
      <circle cx="12" cy="7.2" r="1.8" />
      <circle cx="16.4" cy="9.2" r="1.8" />
      <path d="M12 12.2c-2.9 0-4.9 2-4.9 4.1 0 1.6 1.4 2.6 2.9 2.2 1.4-.4 2.6-.4 4 0 1.5.4 2.9-.6 2.9-2.2 0-2.1-2-4.1-4.9-4.1z" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5V6.5A2 2 0 0 0 13.5 4.5h-7A2 2 0 0 0 4.5 6.5v7A2 2 0 0 0 6.5 15.5H8.5" />
    </>
  ),
  send: (
    <>
      <path d="m4.5 11.5 15-7-7 15-2.2-5.8z" />
      <path d="m10.3 13.7 9.2-9.2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19.5h16M7 16.5v-5M12 16.5V7.5M17 16.5v-8" />
    </>
  ),
  paperclip: (
    <>
      <path d="m15.5 8.5-6.8 6.8a2.6 2.6 0 0 0 3.7 3.7l7.2-7.2a4.2 4.2 0 0 0-5.9-5.9l-7.4 7.4a1.8 1.8 0 0 0 2.5 2.5l6.2-6.2" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </>
  ),
  laptop: (
    <>
      <rect x="4" y="6" width="16" height="10.5" rx="1.5" />
      <path d="M2.5 19.5h19" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14.5" r="1.2" />
    </>
  ),
  bank: (
    <>
      <path d="M4 9.5 12 4l8 5.5" />
      <path d="M5.5 10v8.5h13V10" />
      <path d="M3.5 19.5h17" />
      <path d="M8 13.5v3M12 13.5v3M16 13.5v3" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3.5h12v17l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2z" />
      <path d="M9 8h6M9 11.5h6M9 15h4" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof shapes;

/** Path geometry only — dùng khi cần layer soft-3D / gradient riêng. */
export function IconShape({ name }: { name: IconName }) {
  return <>{shapes[name]}</>;
}

export function Icon({
  name,
  className = 'h-5 w-5',
  filled = false,
  style,
}: {
  name: IconName;
  className?: string;
  filled?: boolean;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {shapes[name]}
    </svg>
  );
}

export function StarIcon({
  className = 'h-3.5 w-3.5',
  style,
  tone = 'gold',
}: {
  className?: string;
  style?: CSSProperties;
  tone?: 'gold' | 'muted';
}) {
  const gradientId = useId().replace(/:/g, '');
  const starPath = 'm12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z';

  if (tone === 'muted') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="var(--color-line)"
        className={className}
        style={style}
        aria-hidden="true"
      >
        <path d={starPath} />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={`star-icon-gold ${className}`}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff8dc" />
          <stop offset="28%" stopColor="#ffd76a" />
          <stop offset="55%" stopColor="#f0b429" />
          <stop offset="82%" stopColor="#c8940a" />
          <stop offset="100%" stopColor="#9a7209" />
        </linearGradient>
      </defs>
      <path fill={`url(#${gradientId})`} d={starPath} />
    </svg>
  );
}
