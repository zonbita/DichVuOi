import { formatPrice } from '../../services/api';
import { Icon } from '../ui/icon';
import { marketPriceRange } from '../../utils/market-price';

type Props = {
  basePrice: number;
  min?: number;
  max?: number;
  unit?: string;
  durationMin: number;
};

/** Khối giá + thời lượng overlay trên hero trang nghề. */
export function ServiceHeroPricePanel({ basePrice, min, max, unit, durationMin }: Props) {
  const range = marketPriceRange({
    basePrice,
    priceMin: min,
    priceMax: max,
  });
  const same = range.min === range.max;

  return (
    <div className="w-full rounded-2xl border border-white/20 bg-black/50 px-5 py-4 text-white backdrop-blur-md sm:min-w-[280px] sm:max-w-[320px]">
      <p className="text-sm text-white/75">Giá tham khảo (thị trường)</p>
      <p className="mt-1 text-2xl font-extrabold leading-tight text-[var(--color-sale)] sm:text-[1.75rem]">
        {same ? (
          formatPrice(range.min)
        ) : (
          <>
            {formatPrice(range.min)}
            <span className="mx-1 font-semibold text-white/60">–</span>
            {formatPrice(range.max)}
          </>
        )}
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
