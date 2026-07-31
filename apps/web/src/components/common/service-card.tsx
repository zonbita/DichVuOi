import { Link } from 'react-router-dom';
import type { Service } from '../../types/catalog';
import { groupColor } from '../../utils/catalog-colors';
import { serviceImage } from '../../utils/catalog-images';
import { Icon } from '../ui/icon';
import { ReferencePrice } from './reference-price';

export function ServiceCard({ service }: { service: Service }) {
  const image = serviceImage(service);
  const color = groupColor(service.category.group.slug);
  const providerCount = service._count?.partners ?? 0;
  const groupLabel = service.category.group.name.replace(/\s*-\s*hỗ trợ$/i, '');

  return (
    <Link
      to={`/dich-vu/${service.slug}`}
      className="group flex flex-col overflow-hidden rounded-[16px] border border-[var(--color-line)] bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-canvas)]">
        <img
          src={image}
          alt={service.name}
          className="catalog-photo h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <span
          className="absolute bottom-3 left-3 inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-sm"
          style={{ backgroundColor: color.main, color: '#ffffff' }}
        >
          {groupLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-1 text-[17px] font-extrabold text-[var(--color-navy)] sm:text-lg">
          {service.name}
        </h3>

        <ReferencePrice
          basePrice={service.basePrice}
          min={service.priceMin}
          max={service.priceMax}
          unit={service.unit}
          variant="compact"
          className="mt-1.5"
        />

        <div className="mt-auto flex items-center justify-between pt-2.5 text-[13px] text-[var(--color-muted)]">
          <span className="flex items-center gap-1.5">
            <Icon name="clock" className="h-4 w-4" />
            {service.durationMin} phút
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="users" className="h-4 w-4" />
            {providerCount} người làm
          </span>
        </div>
      </div>
    </Link>
  );
}
