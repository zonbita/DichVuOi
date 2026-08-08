import { Link } from 'react-router-dom';
import { formatPrice, formatPriceNumber } from '../../services/api';
import type { Service } from '../../types/catalog';
import { displayStats } from '../../utils/catalog-display';
import { serviceImage } from '../../utils/catalog-images';
import { formatMarketPriceRange } from '../../utils/market-price';
import { Icon, StarIcon } from '../ui/icon';

export function DealCard({ service }: { service: Service }) {
  const stats = displayStats(service.id);
  const image = serviceImage(service);
  const rangeLabel = formatMarketPriceRange(service, formatPrice, formatPriceNumber);

  return (
    <Link
      to={`/dich-vu/${service.slug}`}
      className="group flex w-[228px] shrink-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-line)]/70 bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] sm:w-[244px]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-canvas)]">
        <img
          src={image}
          alt={service.name}
          className="catalog-photo h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-[var(--color-navy)]">
          {service.name}
        </h3>
        <p className="line-clamp-1 text-sm text-[var(--color-muted)]">{service.category.name}</p>

        <div className="mt-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Giá tham khảo
          </p>
          <p className="mt-1 text-base font-extrabold leading-snug text-[var(--color-sale)]">
            {rangeLabel}
          </p>
        </div>

        <p className="flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
          <Icon name="clock" className="h-4 w-4 shrink-0" />
          {service.durationMin} phút · {service.unit}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="flex min-w-0 items-center gap-1 text-sm text-[var(--color-muted)]">
            <StarIcon className="h-4 w-4 shrink-0" tone="gold" />
            <strong className="font-bold text-[var(--color-ink)]">{stats.rating}</strong>
            <span className="truncate">
              · {service._count?.partners ?? 0} người làm
            </span>
          </span>
          <span className="shrink-0 rounded-md bg-[var(--color-brand)] px-3 py-1.5 text-sm font-bold !text-white transition group-hover:bg-[var(--color-brand-deep)]">
            Đặt ngay
          </span>
        </div>
      </div>
    </Link>
  );
}
