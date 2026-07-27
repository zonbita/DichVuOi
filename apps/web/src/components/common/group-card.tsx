import { Link } from 'react-router-dom';
import type { ServiceGroup } from '../../types/catalog';
import { groupColor } from '../../utils/catalog-colors';
import { groupBanner } from '../../utils/catalog-images';

export function GroupCard({ group, to }: { group: ServiceGroup; to?: string }) {
  const image = groupBanner(group.slug);
  const color = groupColor(group.slug);

  return (
    <Link
      to={to ?? `/nhom/${group.slug}`}
      className="group flex gap-3.5 overflow-hidden rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md sm:p-3.5"
      style={{ borderLeft: `4px solid ${color.main}` }}
    >
      <span className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-[var(--color-canvas)] sm:h-24 sm:w-28">
        <img
          src={image}
          alt={group.name}
          className="catalog-photo h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </span>
      <span className="min-w-0 py-0.5">
        <span className="block text-base font-bold leading-snug">{group.name}</span>
        <span className="mt-1 block line-clamp-2 text-sm leading-relaxed text-[var(--color-muted)]">
          {group.description}
        </span>
        {group._count?.categories ? (
          <span
            className="mt-2 inline-flex rounded-md px-2 py-0.5 text-sm font-semibold"
            style={{ backgroundColor: color.soft, color: color.ink }}
          >
            {group._count.categories} danh mục
          </span>
        ) : null}
      </span>
    </Link>
  );
}

export function GroupTile({ group }: { group: ServiceGroup }) {
  const image = groupBanner(group.slug);
  const color = groupColor(group.slug);

  return (
    <Link
      to={`/nhom/${group.slug}`}
      className="group flex w-full min-w-0 flex-col overflow-hidden bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]"
    >
      <span className="relative aspect-[3/2] overflow-hidden bg-[var(--color-canvas)]">
        <img
          src={image}
          alt={group.name}
          className="catalog-photo h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </span>
      <span className="flex flex-col items-center px-3 pb-4 pt-3">
        <span
          aria-hidden
          className="mb-2.5 h-1 w-7 rounded-full"
          style={{ backgroundColor: color.main }}
        />
        <span
          className="line-clamp-2 text-center text-[15px] font-bold leading-snug sm:text-base"
          style={{ color: color.main }}
        >
          {group.name}
        </span>
      </span>
    </Link>
  );
}
