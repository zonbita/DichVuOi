import { useId } from 'react';
import { formatPrice } from '../../services/api';

export const PRICE_SLIDER_MAX = 100_000_000;
export const PRICE_SLIDER_MIN = 0;
const STEP = 100_000;

/** Mốc dưới thanh — dày ở vùng giá phổ biến, thưa về sau. */
const PRICE_TICKS = [
  0, 1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000, 30_000_000,
  40_000_000, 50_000_000, 75_000_000, 100_000_000,
] as const;

type Props = {
  min: number;
  max: number;
  onChange: (next: { min: number; max: number }) => void;
  className?: string;
};

function clamp(value: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, value));
}

function parseMoney(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;
  return Number(digits);
}

function formatTick(value: number) {
  if (value === 0) return '0';
  const tr = value / 1_000_000;
  return `${tr}tr`;
}

export function PriceRangeSlider({ min, max, onChange, className = '' }: Props) {
  const id = useId();
  const safeMin = clamp(min, PRICE_SLIDER_MIN, PRICE_SLIDER_MAX);
  const safeMax = clamp(max, PRICE_SLIDER_MIN, PRICE_SLIDER_MAX);
  const lo = Math.min(safeMin, safeMax);
  const hi = Math.max(safeMin, safeMax);

  const range = PRICE_SLIDER_MAX - PRICE_SLIDER_MIN || 1;
  const leftPct = ((lo - PRICE_SLIDER_MIN) / range) * 100;
  const rightPct = ((hi - PRICE_SLIDER_MIN) / range) * 100;

  function setMin(next: number) {
    const value = clamp(next, PRICE_SLIDER_MIN, hi);
    onChange({ min: value, max: hi });
  }

  function setMax(next: number) {
    const value = clamp(next, lo, PRICE_SLIDER_MAX);
    onChange({ min: lo, max: value });
  }

  function jumpToTick(value: number) {
    const distLo = Math.abs(value - lo);
    const distHi = Math.abs(value - hi);
    if (distLo <= distHi) setMin(value);
    else setMax(value);
  }

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">Khoảng giá tham khảo (₫)</span>
        <span className="text-sm font-bold text-[var(--color-sale)]">
          {formatPrice(lo)} – {formatPrice(hi)}
        </span>
      </div>

      <div className="price-range-wrap relative mb-1 h-8">
        <div className="price-range-track absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--color-line)]" />
        <div
          className="price-range-fill absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--color-brand)]"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        <input
          type="range"
          aria-label="Giá tối thiểu"
          aria-valuemin={PRICE_SLIDER_MIN}
          aria-valuemax={PRICE_SLIDER_MAX}
          aria-valuenow={lo}
          min={PRICE_SLIDER_MIN}
          max={PRICE_SLIDER_MAX}
          step={STEP}
          value={lo}
          onChange={(event) => setMin(Number(event.target.value))}
          className="price-range-thumb absolute inset-0 z-[2] w-full appearance-none bg-transparent"
        />
        <input
          type="range"
          aria-label="Giá tối đa"
          aria-valuemin={PRICE_SLIDER_MIN}
          aria-valuemax={PRICE_SLIDER_MAX}
          aria-valuenow={hi}
          min={PRICE_SLIDER_MIN}
          max={PRICE_SLIDER_MAX}
          step={STEP}
          value={hi}
          onChange={(event) => setMax(Number(event.target.value))}
          className="price-range-thumb absolute inset-0 z-[3] w-full appearance-none bg-transparent"
        />
      </div>

      <div className="price-range-ticks relative mb-3 h-7" aria-hidden>
        {PRICE_TICKS.map((tick) => {
          const pct = ((tick - PRICE_SLIDER_MIN) / range) * 100;
          const isMajor =
            tick === 0 ||
            tick === 10_000_000 ||
            tick === 50_000_000 ||
            tick === 100_000_000;
          return (
            <button
              key={tick}
              type="button"
              tabIndex={-1}
              onClick={() => jumpToTick(tick)}
              className="absolute top-0 flex flex-col items-center"
              style={{
                left: `${pct}%`,
                transform:
                  pct === 0
                    ? 'translateX(0)'
                    : pct === 100
                      ? 'translateX(-100%)'
                      : 'translateX(-50%)',
              }}
              title={formatPrice(tick)}
            >
              <span
                className={`block w-px bg-[var(--color-line)] ${
                  isMajor ? 'h-2.5' : 'h-1.5'
                }`}
              />
              <span
                className={`mt-0.5 whitespace-nowrap text-[10px] leading-none text-[var(--color-muted)] ${
                  isMajor || tick <= 5_000_000
                    ? 'font-semibold'
                    : 'hidden font-medium sm:inline'
                }`}
              >
                {formatTick(tick)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm" htmlFor={`${id}-min`}>
          <span className="mb-1 block font-semibold text-[var(--color-muted)]">Từ</span>
          <input
            id={`${id}-min`}
            type="text"
            inputMode="numeric"
            value={lo.toLocaleString('vi-VN')}
            onChange={(event) => {
              const parsed = parseMoney(event.target.value);
              if (parsed === null) {
                setMin(PRICE_SLIDER_MIN);
                return;
              }
              setMin(parsed);
            }}
            className="field-input"
          />
        </label>
        <label className="block text-sm" htmlFor={`${id}-max`}>
          <span className="mb-1 block font-semibold text-[var(--color-muted)]">Đến</span>
          <input
            id={`${id}-max`}
            type="text"
            inputMode="numeric"
            value={hi.toLocaleString('vi-VN')}
            onChange={(event) => {
              const parsed = parseMoney(event.target.value);
              if (parsed === null) {
                setMax(PRICE_SLIDER_MAX);
                return;
              }
              setMax(parsed);
            }}
            className="field-input"
          />
        </label>
      </div>
      <p className="mt-1.5 text-xs text-[var(--color-muted)]">
        Kéo thanh hoặc chạm mốc · phạm vi 0 – 100 triệu ₫
      </p>
    </div>
  );
}
