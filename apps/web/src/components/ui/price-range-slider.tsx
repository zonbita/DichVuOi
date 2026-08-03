import { useEffect, useId, useState } from 'react';
import { formatPrice, formatPriceNumber } from '../../services/api';

export const PRICE_SLIDER_MAX = 100_000_000;
export const PRICE_SLIDER_MIN = 0;
const STEP = 100_000;

type Props = {
  min: number;
  max: number;
  onChange: (next: { min: number; max: number }) => void;
  className?: string;
  layout?: 'stacked' | 'split' | 'vertical';
  /** Tiêu đề thẻ (layout vertical). */
  title?: string;
  /** Tooltip giá trên 2 thumb — giống mockup đăng ký thuê. */
  showBubbles?: boolean;
  /** Trần chọn tối đa của slider (vd: số dư ví). */
  maxSelectable?: number;
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
  const normalized = Number.isInteger(tr) ? String(tr) : tr.toFixed(1).replace(/\.0$/, '');
  return `${normalized}tr`;
}

export function PriceRangeSlider({
  min,
  max,
  onChange,
  className = '',
  layout = 'stacked',
  title,
  showBubbles = false,
  maxSelectable = PRICE_SLIDER_MAX,
}: Props) {
  const id = useId();
  const hardMax = clamp(maxSelectable, PRICE_SLIDER_MIN, PRICE_SLIDER_MAX);
  const safeMin = clamp(min, PRICE_SLIDER_MIN, hardMax);
  const safeMax = clamp(max, PRICE_SLIDER_MIN, hardMax);
  const lo = Math.min(safeMin, safeMax);
  const hi = Math.max(safeMin, safeMax);
  const [minInput, setMinInput] = useState(lo.toLocaleString('vi-VN'));
  const [maxInput, setMaxInput] = useState(hi.toLocaleString('vi-VN'));

  useEffect(() => {
    setMinInput(lo.toLocaleString('vi-VN'));
  }, [lo]);

  useEffect(() => {
    setMaxInput(hi.toLocaleString('vi-VN'));
  }, [hi]);

  const range = hardMax - PRICE_SLIDER_MIN || 1;
  const leftPct = ((lo - PRICE_SLIDER_MIN) / range) * 100;
  const rightPct = ((hi - PRICE_SLIDER_MIN) / range) * 100;
  const displayTicks = Array.from(
    new Set(
      [
        PRICE_SLIDER_MIN,
        PRICE_SLIDER_MIN + range * 0.25,
        PRICE_SLIDER_MIN + range * 0.5,
        PRICE_SLIDER_MIN + range * 0.75,
        hardMax,
      ].map((tick) => Math.round(tick / STEP) * STEP),
    ),
  );

  function setMin(next: number) {
    const value = clamp(next, PRICE_SLIDER_MIN, hi);
    onChange({ min: value, max: hi });
  }

  function setMax(next: number) {
    const value = clamp(next, lo, hardMax);
    onChange({ min: lo, max: value });
  }

  function jumpToTick(value: number) {
    const distLo = Math.abs(value - lo);
    const distHi = Math.abs(value - hi);
    if (distLo <= distHi) setMin(value);
    else setMax(value);
  }

  const isCard = layout === 'vertical';
  const hideTicks = isCard;

  const slider = (
    <>
      <div
        className={`price-range-wrap relative px-1 ${showBubbles ? (hideTicks ? 'h-9 pt-5' : 'h-11 pt-6') : 'h-8'} ${hideTicks ? 'mb-0' : 'mb-1'}`}
      >
        {showBubbles ? (
          <>
            <span
              className="pointer-events-none absolute top-0 z-4 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#079A9A] px-2 py-0.5 text-[11px] font-bold leading-none text-white shadow-sm"
              style={{ left: `${leftPct}%` }}
            >
              {formatPriceNumber(lo)} VNĐ
            </span>
            <span
              className="pointer-events-none absolute top-0 z-4 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#079A9A] px-2 py-0.5 text-[11px] font-bold leading-none text-white shadow-sm"
              style={{ left: `${rightPct}%` }}
            >
              {formatPriceNumber(hi)} VNĐ
            </span>
          </>
        ) : null}
        <div className="price-range-track absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#DCE6EC]" />
        <div
          className="price-range-fill absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#079A9A]"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        <input
          type="range"
          aria-label="Giá tối thiểu"
          aria-valuemin={PRICE_SLIDER_MIN}
          aria-valuemax={hardMax}
          aria-valuenow={lo}
          min={PRICE_SLIDER_MIN}
          max={hardMax}
          step={STEP}
          value={lo}
          onChange={(event) => setMin(Number(event.target.value))}
          className="price-range-thumb absolute left-0 right-0 top-1/2 z-2 w-full -translate-y-1/2 appearance-none bg-transparent"
        />
        <input
          type="range"
          aria-label="Giá tối đa"
          aria-valuemin={PRICE_SLIDER_MIN}
          aria-valuemax={hardMax}
          aria-valuenow={hi}
          min={PRICE_SLIDER_MIN}
          max={hardMax}
          step={STEP}
          value={hi}
          onChange={(event) => setMax(Number(event.target.value))}
          className="price-range-thumb absolute left-0 right-0 top-1/2 z-3 w-full -translate-y-1/2 appearance-none bg-transparent"
        />
      </div>

      {hideTicks ? null : (
        <div className="price-range-ticks relative h-6 px-1" aria-hidden>
          {displayTicks.map((tick) => {
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
                <span className="block h-2 w-px bg-[#DCE6EC]" />
                <span className="mt-0.5 whitespace-nowrap text-[11px] font-semibold leading-none text-[#64748B]">
                  {formatTick(tick)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );

  const fieldShell = isCard
    ? 'flex min-w-0 items-stretch overflow-hidden rounded-lg border border-[#DCE6EC] bg-white transition-[border-color,box-shadow] focus-within:border-[#079A9A] focus-within:shadow-[0_0_0_3px_rgba(7,154,154,0.15)]'
    : 'flex min-w-0 items-stretch overflow-hidden rounded-[10px] border border-[var(--color-line)] bg-white transition-[border-color,box-shadow] focus-within:border-[var(--color-brand)] focus-within:shadow-[0_0_0_3px_rgba(0,156,149,0.15)]';

  const prefixClass = isCard
    ? 'flex shrink-0 items-center bg-[#F4F8FA] px-2.5 text-sm font-semibold text-[#0F2F4A]'
    : 'flex shrink-0 items-center px-3 text-sm font-semibold text-[var(--color-ink)]';

  const dividerClass = isCard ? 'w-px shrink-0 bg-[#DCE6EC]' : 'w-px shrink-0 bg-[var(--color-line)]';

  const inputTextClass = isCard
    ? 'min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium tabular-nums text-[#0F2F4A] outline-none'
    : 'min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium text-[var(--color-ink)] outline-none';

  const suffixClass = isCard
    ? 'shrink-0 text-sm font-medium text-[#64748B]'
    : 'shrink-0 text-sm font-medium text-[var(--color-ink)]';

  const inputPadClass = isCard ? 'px-2 py-1.5' : 'px-3 py-2.5';

  const manualInputs = (
    <div className={`grid grid-cols-2 ${isCard ? 'gap-2' : 'gap-2.5 sm:gap-3'}`}>
      <label className={fieldShell} htmlFor={`${id}-min`}>
        <span className={prefixClass}>Từ</span>
        <span className={dividerClass} aria-hidden />
        <span className={`flex min-w-0 flex-1 items-center gap-1.5 ${inputPadClass}`}>
          <input
            id={`${id}-min`}
            type="text"
            inputMode="numeric"
            value={minInput}
            onChange={(event) => {
              setMinInput(event.target.value);
            }}
            onBlur={() => {
              const parsed = parseMoney(minInput);
              if (parsed === null) {
                setMinInput(lo.toLocaleString('vi-VN'));
                return;
              }
              setMin(parsed);
            }}
            className={inputTextClass}
          />
          <span className={suffixClass}>VNĐ</span>
        </span>
      </label>
      <label className={fieldShell} htmlFor={`${id}-max`}>
        <span className={prefixClass}>Đến</span>
        <span className={dividerClass} aria-hidden />
        <span className={`flex min-w-0 flex-1 items-center gap-1.5 ${inputPadClass}`}>
          <input
            id={`${id}-max`}
            type="text"
            inputMode="numeric"
            value={maxInput}
            onChange={(event) => {
              setMaxInput(event.target.value);
            }}
            onBlur={() => {
              const parsed = parseMoney(maxInput);
              if (parsed === null) {
                setMaxInput(hi.toLocaleString('vi-VN'));
                return;
              }
              setMax(parsed);
            }}
            className={inputTextClass}
          />
          <span className={suffixClass}>VNĐ</span>
        </span>
      </label>
    </div>
  );

  if (layout === 'vertical') {
    return (
      <div className={className}>
        {title ? (
          <h3 className="mb-1.5 text-[13px] font-bold leading-tight text-[#0F2F4A]">
            {title}
          </h3>
        ) : null}
        <div className="space-y-2">
          <div className="min-w-0">{slider}</div>
          <div className="min-w-0">{manualInputs}</div>
        </div>
      </div>
    );
  }

  if (layout === 'split') {
    return (
      <div className={`grid gap-4 lg:grid-cols-[3fr_auto_2fr] lg:items-end ${className}`}>
        <div className="min-w-0">{slider}</div>
        <div className="hidden self-stretch lg:block lg:w-px lg:bg-[var(--color-line)]" aria-hidden />
        <div className="min-w-0">{manualInputs}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-5">
        <div className="min-w-0 sm:col-span-3">{slider}</div>
        <div className="min-w-0 sm:col-span-2">{manualInputs}</div>
      </div>
    </div>
  );
}
