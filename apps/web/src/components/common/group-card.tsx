import { Link } from 'react-router-dom';
import type { ServiceGroup } from '../../types/catalog';
import { groupColor } from '../../utils/catalog-colors';
import { groupIcon } from '../../utils/catalog-display';
import { groupBanner } from '../../utils/catalog-images';
import { Icon } from '../ui/icon';

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
      className="group flex w-full min-w-0 flex-col overflow-hidden rounded-[16px] bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]"
    >
      <span className="relative aspect-[16/10] overflow-hidden bg-[var(--color-canvas)]">
        <img
          src={image}
          alt={group.name}
          className="catalog-photo h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </span>
      <span className="flex items-center gap-2.5 px-3 py-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-white"
          style={{ backgroundColor: color.main }}
          aria-hidden
        >
          <Icon name={groupIcon(group.slug)} className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 line-clamp-2 text-[14px] font-bold leading-snug text-[var(--color-navy)] sm:text-[15px]">
          {group.name}
        </span>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef2f5] text-[var(--color-muted)] transition group-hover:bg-[var(--color-brand-soft)] group-hover:text-[var(--color-navy)]"
          aria-hidden
        >
          <Icon name="chevronRight" className="h-4 w-4" />
        </span>
      </span>
    </Link>
  );
}
