import { Link } from 'react-router-dom';
import type { ServiceGroup } from '../../types/catalog';
import { groupColor } from '../../utils/catalog-colors';
import { groupImage } from '../../utils/catalog-images';

export function GroupCard({ group, to }: { group: ServiceGroup; to?: string }) {
  const image = groupImage(group.slug);
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
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
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
  const image = groupImage(group.slug);
  const color = groupColor(group.slug);

  return (
    <Link
      to={`/nhom/${group.slug}`}
      className="group flex w-full min-w-0 flex-col overflow-hidden bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderTop: `3px solid ${color.main}` }}
    >
      <span className="relative aspect-[4/3] overflow-hidden bg-[var(--color-canvas)]">
        <img
          src={image}
          alt={group.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </span>
      <span className="line-clamp-2 px-2.5 py-3.5 text-center text-base font-bold leading-snug sm:text-[17px]">
        {group.name}
      </span>
    </Link>
  );
}
