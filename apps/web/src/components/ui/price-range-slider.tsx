import { useId } from 'react';
import { formatPrice } from '../../services/api';

export const PRICE_SLIDER_MAX = 100_000_000;
export const PRICE_SLIDER_MIN = 0;
const STEP = 100_000;

/** Mốc hiển thị trên thanh — khớp mockup 0 / 25tr / 50tr / 75tr / 100tr. */
const DISPLAY_TICKS = [0, 25_000_000, 50_000_000, 75_000_000, 100_000_000] as const;

type Props = {
  min: number;
  max: number;
  onChange: (next: { min: number; max: number }) => void;
  className?: string;
  layout?: 'stacked' | 'split';
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

export function PriceRangeSlider({
  min,
  max,
  onChange,
  className = '',
  layout = 'stacked',
}: Props) {
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

  const header = (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm font-semibold text-[var(--color-ink)]">Khoảng giá tham khảo (₫)</span>
      <span className="text-sm font-bold text-[var(--color-sale)]">
        {formatPrice(lo)} – {formatPrice(hi)}
      </span>
    </div>
  );

  const slider = (
    <>
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

      <div className="price-range-ticks relative h-6" aria-hidden>
        {DISPLAY_TICKS.map((tick) => {
          const pct = ((tick - PRICE_SLIDER_MIN) / range) * 100;
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
              <span className="block h-2 w-px bg-[var(--color-line)]" />
              <span className="mt-0.5 whitespace-nowrap text-[11px] font-semibold leading-none text-[var(--color-muted)]">
                {formatTick(tick)}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );

  const manualInputs = (
    <div className="grid grid-cols-2 gap-3">
      <label className="block text-sm" htmlFor={`${id}-min`}>
        <span className="mb-1.5 block font-semibold text-[var(--color-ink)]">Từ</span>
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
        <span className="mb-1.5 block font-semibold text-[var(--color-ink)]">Đến</span>
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
  );

  if (layout === 'split') {
    return (
      <div className={`grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(220px,280px)] lg:items-center ${className}`}>
        <div className="min-w-0">
          {header}
          {slider}
        </div>
        <div className="hidden self-stretch lg:block lg:w-px lg:bg-[var(--color-line)]" aria-hidden />
        <div className="lg:pt-6">{manualInputs}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {header}
      {slider}
      <div className="mt-3">{manualInputs}</div>
    </div>
  );
}
