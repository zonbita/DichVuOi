import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { groupColor } from '../../utils/catalog-colors';
import { groupIcon } from '../../utils/catalog-display';
import { Icon } from '../ui/icon';
import {
  CatalogMobileDrawer,
  GroupListItem,
  MegaPanel,
} from './catalog-menu-shared';

export function CatalogMenu() {
  const treeQuery = useQuery({
    queryKey: ['groups', 'tree'],
    queryFn: api.getGroupsTree,
  });

  const groups = treeQuery.data ?? [];
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const activeGroup = groups.find((group) => group.slug === activeSlug) ?? groups[0] ?? null;

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile: nút mở menu nhóm — luôn hiện dưới lg */}
      <div className="mb-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex w-full items-center justify-between gap-3 bg-white px-4 py-3.5 text-left shadow-sm"
        >
          <span className="flex items-center gap-2.5 text-base font-bold">
            <Icon name="menu" className="h-5 w-5 text-[var(--color-brand)]" />
            NHÓM DỊCH VỤ
          </span>
          <span className="text-sm font-semibold text-[var(--color-brand-deep)]">
            {groups.length ? `${groups.length} nhóm` : 'Mở'} ›
          </span>
        </button>

        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
          {groups.slice(0, 10).map((group) => (
            <Link
              key={group.id}
              to={`/nhom/${group.slug}`}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold shadow-sm"
              style={{ borderBottom: `2px solid ${groupColor(group.slug).main}` }}
            >
              <Icon
                name={groupIcon(group.icon)}
                className="h-4 w-4"
                style={{ color: groupColor(group.slug).main }}
              />
              {group.name.split('&')[0]?.trim() ?? group.name}
            </Link>
          ))}
          <Link
            to="/nhom"
            className="flex shrink-0 items-center bg-[var(--color-brand-soft)] px-3 py-2 text-sm font-bold text-[var(--color-brand-deep)]"
          >
            Tất cả
          </Link>
        </div>
      </div>

      {/* Desktop: sidebar + mega panel hover */}
      <aside
        className="relative z-[100] hidden bg-white shadow-sm lg:block"
        onMouseLeave={() => setActiveSlug(null)}
      >
        <p className="flex items-center gap-2.5 px-3 py-3 text-base font-bold">
          <Icon name="menu" className="h-5 w-5" />
          NHÓM DỊCH VỤ
        </p>
        <ul className="pb-2">
          {treeQuery.isLoading ? (
            <li className="px-3 py-2 text-sm text-[var(--color-muted)]">Đang tải...</li>
          ) : null}
          {groups.map((group) => (
            <li key={group.id}>
              <GroupListItem
                group={group}
                active={activeSlug === group.slug}
                onEnter={() => setActiveSlug(group.slug)}
              />
            </li>
          ))}
          <li>
            <Link
              to="/nhom"
              className="flex items-center justify-between px-3 py-2.5 text-[15px] font-bold text-[var(--color-brand-deep)] hover:bg-[var(--color-brand-soft)]"
            >
              Xem tất cả danh mục
              <Icon name="chevronRight" className="h-4 w-4" />
            </Link>
          </li>
        </ul>

        <div
          className={`absolute top-0 left-full z-[110] w-[min(720px,calc(100vw-300px))] border border-l-0 border-[var(--color-line)] bg-white shadow-xl transition duration-200 ${
            activeSlug && activeGroup
              ? 'pointer-events-auto translate-x-0 opacity-100'
              : 'pointer-events-none translate-x-1 opacity-0'
          }`}
          onMouseEnter={() => {
            if (activeSlug) setActiveSlug(activeSlug);
          }}
        >
          {activeGroup ? <MegaPanel group={activeGroup} /> : null}
        </div>
      </aside>

      {mobileOpen
        ? createPortal(
            <CatalogMobileDrawer
              groups={groups}
              expanded={mobileExpanded}
              onExpandedChange={setMobileExpanded}
              onClose={() => setMobileOpen(false)}
            />,
            document.body,
          )
        : null}
    </>
  );
}
