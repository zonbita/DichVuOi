import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { catalogQueries } from '../../lib/catalog-queries';
import { groupColor } from '../../utils/catalog-colors';
import { GroupCatalogIcon } from '../catalog/group-catalog-icon';
import { Icon } from '../ui/icon';
import {
  CatalogAllCategoriesLink,
  CatalogMenuHeader,
  CatalogMobileDrawer,
  GroupListItem,
  MegaPanel,
  type CatalogServicePick,
} from './catalog-menu-shared';

type CatalogMenuProps = {
  pickerMode?: boolean;
  onServiceSelect?: (pick: CatalogServicePick) => void;
  selectedServiceSlug?: string | null;
};

export function CatalogMenu({
  pickerMode = false,
  onServiceSelect,
  selectedServiceSlug = null,
}: CatalogMenuProps = {}) {
  const treeQuery = useQuery(catalogQueries.groupsTree);

  const groups = treeQuery.data ?? [];
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const activeGroup = groups.find((group) => group.slug === activeSlug) ?? null;
  const asideRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function handleItemEnter(slug: string) {
    setActiveSlug(slug);
  }

  function handleServiceSelect(pick: CatalogServicePick) {
    onServiceSelect?.(pick);
    if (pickerMode) {
      setActiveSlug(pick.groupSlug);
    }
  }

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
      <div className="mb-3 min-w-0 max-w-full overflow-hidden lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 text-left shadow-sm"
        >
          <span className="flex items-center gap-2.5 text-base font-bold">
            <Icon name="menu" className="h-5 w-5 text-[var(--color-brand)]" />
            NHÓM DỊCH VỤ
          </span>
          <span className="text-sm font-semibold text-[var(--color-brand-deep)]">
            {groups.length ? `${groups.length} nhóm` : 'Mở'} ›
          </span>
        </button>

        {!pickerMode ? (
          <div className="no-scrollbar mt-2 flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1">
            {groups.slice(0, 10).map((group) => (
              <Link
                key={group.id}
                to={`/nhom/${group.slug}`}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold shadow-sm"
                style={{ borderBottom: `2px solid ${groupColor(group.slug).main}` }}
              >
                <GroupCatalogIcon
                  slug={group.slug}
                  icon={group.icon}
                  className="h-4 w-4"
                  tint={groupColor(group.slug).main}
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
        ) : null}
      </div>

      {/* Desktop: sidebar + mega panel hover — glass-page */}
      <aside
        ref={asideRef}
        className="relative z-[100] hidden w-full max-w-[360px] lg:block"
        onMouseLeave={() => {
          if (!pickerMode) {
            setActiveSlug(null);
          }
        }}
      >
        <div className="mega-menu-shell flex flex-col overflow-hidden">
          <CatalogMenuHeader size="lg" tone="glass" />

          <ul className="py-2">
            {treeQuery.isLoading ? (
              <li className="px-5 py-3 text-sm text-[var(--glass-muted,#7c8799)]">Đang tải...</li>
            ) : null}
            {groups.map((group, index) => (
              <li key={group.id}>
                <GroupListItem
                  group={group}
                  active={activeSlug === group.slug}
                  onEnter={() => handleItemEnter(group.slug)}
                  tone="glass"
                  showSeparator={index < groups.length - 1}
                />
              </li>
            ))}
          </ul>

          {!pickerMode ? (
            <div
              className="shrink-0 border-t py-2"
              style={{ borderColor: 'var(--glass-line, rgba(23, 32, 51, 0.08))' }}
            >
              <CatalogAllCategoriesLink tone="glass" />
            </div>
          ) : null}
        </div>

        <div
          ref={panelRef}
          className={`mega-menu-panel absolute top-0 left-full z-[110] ml-px w-[min(720px,calc(100vw-380px))] overflow-hidden rounded-r-[20px] border border-white/80 shadow-[0_18px_48px_rgba(15,39,71,0.12)] transition-[opacity,transform] duration-200 ease-out ${
            activeSlug && activeGroup
              ? 'pointer-events-auto translate-x-0 opacity-100'
              : 'pointer-events-none translate-x-1 opacity-0'
          }`}
          style={{ height: '100%' }}
          onMouseEnter={() => {
            if (activeSlug) setActiveSlug(activeSlug);
          }}
        >
          {activeGroup ? (
            <MegaPanel
              group={activeGroup}
              onServiceSelect={pickerMode ? handleServiceSelect : onServiceSelect}
              selectedServiceSlug={selectedServiceSlug}
              glass
            />
          ) : null}
        </div>
      </aside>

      {mobileOpen
        ? createPortal(
            <CatalogMobileDrawer
              groups={groups}
              expanded={mobileExpanded}
              onExpandedChange={setMobileExpanded}
              onClose={() => setMobileOpen(false)}
              pickerMode={pickerMode}
              onServiceSelect={(pick) => {
                handleServiceSelect(pick);
                setMobileOpen(false);
              }}
              selectedServiceSlug={selectedServiceSlug}
            />,
            document.body,
          )
        : null}
    </>
  );
}
