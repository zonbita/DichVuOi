import { formatPrice, formatPriceNumber } from '../../services/api';
import { Icon } from '../ui/icon';
import { marketPriceRange } from '../../utils/market-price';

type Props = {
  basePrice: number;
  min?: number;
  max?: number;
  unit?: string;
  durationMin: number;
  /** Gọn cho hero 80px — một hàng ngang. */
  compact?: boolean;
};

/** Khối giá + thời lượng overlay trên hero trang nghề. */
export function ServiceHeroPricePanel({
  basePrice,
  min,
  max,
  unit,
  durationMin,
  compact = false,
}: Props) {
  const range = marketPriceRange({
    basePrice,
    priceMin: min,
    priceMax: max,
  });
  const same = range.min === range.max;

  const priceText = same ? (
    formatPrice(range.min)
  ) : (
    <>
      {formatPriceNumber(range.min)}
      <span className="mx-0.5 font-semibold text-white/60">–</span>
      {formatPriceNumber(range.max)}
      <span className="ml-0.5">VNĐ</span>
    </>
  );

  if (compact) {
    return (
      <div className="flex max-w-full items-center gap-2 rounded-lg border border-white/20 bg-black/55 px-2.5 py-1 text-white backdrop-blur-md sm:gap-3 sm:px-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] leading-tight text-white/70 sm:text-[11px]">
            Giá tham khảo
          </p>
          <p className="truncate text-sm font-extrabold leading-tight text-[var(--color-sale)] sm:text-[15px]">
            {priceText}
            {unit ? (
              <span className="text-[11px] font-semibold text-white/70">/{unit}</span>
            ) : null}
          </p>
        </div>
        <span className="hidden h-8 w-px shrink-0 bg-white/25 sm:block" aria-hidden />
        <p className="hidden shrink-0 items-center gap-1 text-[11px] text-white/85 sm:flex">
          <Icon name="clock" className="h-3.5 w-3.5 shrink-0" />
          ~{durationMin} phút
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-white/20 bg-black/50 px-5 py-4 text-white backdrop-blur-md sm:min-w-[280px] sm:max-w-[320px]">
      <p className="text-sm text-white/75">Giá tham khảo (thị trường)</p>
      <p className="mt-1 text-2xl font-extrabold leading-tight text-[var(--color-sale)] sm:text-[1.75rem]">
        {priceText}
        {unit ? <span className="text-base font-semibold text-white/70">/{unit}</span> : null}
      </p>
      <div className="my-3 border-t border-dotted border-white/30" aria-hidden />
      <p className="flex items-center gap-2 text-sm text-white/85">
        <Icon name="clock" className="h-4 w-4 shrink-0" />
        Thời lượng khoảng {durationMin} phút
      </p>
    </div>
  );
}
