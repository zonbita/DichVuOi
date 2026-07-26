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

  return (
    <Link
      to={`/dich-vu/${service.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ border: `1px solid ${color.soft}`, borderTop: `3px solid ${color.soft}` }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-canvas)]">
        <img
          src={image}
          alt={service.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span
          className="inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide"
          style={{ backgroundColor: color.soft, color: color.ink }}
        >
          {service.category.group.name}
        </span>
        <h3 className="line-clamp-1 text-lg font-extrabold sm:text-xl">{service.name}</h3>

        <ReferencePrice
          basePrice={service.basePrice}
          min={service.priceMin}
          max={service.priceMax}
          unit={service.unit}
          variant="compact"
          className="mt-2"
        />

        <div className="mt-auto flex items-center justify-between pt-2 text-sm text-[var(--color-muted)]">
          <span className="flex items-center gap-1.5">
            <Icon name="clock" className="h-4 w-4" />
            {service.durationMin} phút
          </span>
          <span>{providerCount} người làm</span>
        </div>
      </div>
    </Link>
  );
}
