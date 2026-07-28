import { formatPrice, formatPriceNumber } from '../../services/api';
import { marketPriceRange } from '../../utils/market-price';

type Props = {
  /** Đơn giá / khoảng — truyền min+max hoặc basePrice để suy ra khoảng. */
  min?: number;
  max?: number;
  basePrice?: number;
  unit?: string;
  /** stacked = nhãn trên + giá lớn; compact = nhãn nhỏ trên tile */
  variant?: 'stacked' | 'compact';
  className?: string;
};

/**
 * Giá tham khảo = khoảng giá thị trường (min–max).
 * Số tiền đặt cọc lấy từ totalPrice khi tạo booking.
 */
export function ReferencePrice({
  min,
  max,
  basePrice = 0,
  unit,
  variant = 'stacked',
  className = '',
}: Props) {
  const range = marketPriceRange({
    basePrice,
    priceMin: min,
    priceMax: max,
  });
  const same = range.min === range.max;
  const price = (
    <>
      {same ? (
        formatPrice(range.min)
      ) : (
        <>
          {formatPriceNumber(range.min)}
          <span className="mx-1 font-semibold text-[var(--color-muted)]">–</span>
          {formatPriceNumber(range.max)}
          <span className="ml-1">VNĐ</span>
        </>
      )}
      {unit ? (
        <span className="text-sm font-semibold text-[var(--color-muted)]">/{unit}</span>
      ) : null}
    </>
  );

  if (variant === 'compact') {
    return (
      <span className={`inline-flex flex-col items-start leading-tight ${className}`}>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Giá tham khảo
        </span>
        <span className="text-sm font-extrabold text-[var(--color-sale)]">
          {same ? (
            formatPrice(range.min)
          ) : (
            <>
              {formatPriceNumber(range.min)}
              <span className="mx-0.5 font-semibold text-[var(--color-muted)]">–</span>
              {formatPriceNumber(range.max)}
              <span className="ml-0.5">VNĐ</span>
            </>
          )}
          {unit ? (
            <span className="text-xs font-semibold text-[var(--color-muted)]">/{unit}</span>
          ) : null}
        </span>
      </span>
    );
  }

  return (
    <div className={className}>
      <p className="text-sm text-[var(--color-muted)]">Giá tham khảo (thị trường)</p>
      <p className="text-xl font-extrabold text-[var(--color-sale)] sm:text-2xl">{price}</p>
    </div>
  );
}
