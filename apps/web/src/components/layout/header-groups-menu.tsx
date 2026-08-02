import { useQuery } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { catalogQueries } from '../../lib/catalog-queries';
import { CATALOG_MENU_DARK } from '../../utils/catalog-colors';
import { Icon } from '../ui/icon';
import {
  CatalogMobileDrawer,
  GroupListItem,
  MegaPanel,
} from '../home/catalog-menu-shared';

export function HeaderGroupsMenu({ onDark = false }: { onDark?: boolean }) {
  const treeQuery = useQuery(catalogQueries.groupsTree);

  const groups = treeQuery.data ?? [];
  const [open, setOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const activeGroup = groups.find((group) => group.slug === activeSlug) ?? groups[0] ?? null;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', onKey);
    if (!isNarrow) document.addEventListener('mousedown', onPointer);

    const previous = document.body.style.overflow;
    if (isNarrow) document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
      document.body.style.overflow = previous;
    };
  }, [open, isNarrow]);

  useEffect(() => {
    if (open && groups.length && !activeSlug) {
      setActiveSlug(groups[0]!.slug);
    }
  }, [open, groups, activeSlug]);

  function close() {
    setOpen(false);
  }

  const triggerClass = open
    ? onDark
      ? 'bg-white/15 text-white'
      : 'bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]'
    : onDark
      ? 'text-white/90 hover:bg-white/10'
      : 'text-[var(--color-ink)] hover:bg-[var(--color-brand-soft)]';

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[15px] font-bold transition sm:gap-2 sm:px-3 ${triggerClass}`}
      >
        <Icon name="menu" className="h-5 w-5 text-[var(--color-brand)]" />
        <span className="hidden whitespace-nowrap sm:inline">NHÓM DỊCH VỤ</span>
        <Icon
          name="chevronDown"
          className={`h-4 w-4 transition ${open ? 'rotate-180' : ''} ${
            onDark ? 'text-white/60' : 'text-[var(--color-muted)]'
          }`}
        />
      </button>

      {open && !isNarrow ? (
        <div
          id={menuId}
          role="menu"
          className="absolute top-[calc(100%+8px)] left-0 z-[9990] flex overflow-hidden border border-[color-mix(in_srgb,#5eb8e8_45%,transparent)] bg-transparent shadow-[0_18px_48px_rgba(2,22,36,0.42)]"
          onMouseLeave={() => setActiveSlug(groups[0]?.slug ?? null)}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('a')) close();
          }}
        >
          <div
            className={`w-[240px] shrink-0 border-r border-[color-mix(in_srgb,#5eb8e8_35%,transparent)] ${CATALOG_MENU_DARK.surfaceClass}`}
          >
            <p
              className="flex items-center gap-2.5 border-b px-3 py-3 text-[13px] font-bold tracking-wide text-white uppercase"
              style={{ borderColor: CATALOG_MENU_DARK.border }}
            >
              <Icon name="menu" className="h-5 w-5 text-white" />
              nhóm dịch vụ
            </p>
            <ul className="max-h-[min(70vh,560px)] overflow-y-auto py-1.5">
              {treeQuery.isLoading ? (
                <li className="px-3 py-2 text-sm text-white/50">Đang tải...</li>
              ) : null}
              {groups.map((group) => (
                <li key={group.id}>
                  <GroupListItem
                    group={group}
                    active={activeSlug === group.slug}
                    onEnter={() => setActiveSlug(group.slug)}
                    onClick={close}
                    tone="dark"
                  />
                </li>
              ))}
              <li className="mt-1 border-t pt-1" style={{ borderColor: CATALOG_MENU_DARK.border }}>
                <Link
                  to="/nhom"
                  onClick={close}
                  className="mx-2 flex items-center gap-2.5 rounded-[11px] px-2.5 py-[9px] text-[14.5px] font-medium lowercase hover:bg-white/[0.06]"
                  style={{ color: '#fff' }}
                >
                  <Icon name="grid" className="h-5 w-5 shrink-0" style={{ color: '#fff' }} />
                  xem tất cả danh mục
                </Link>
              </li>
            </ul>
          </div>

          <div className="w-[min(720px,calc(100vw-280px))] max-w-[720px]">
            {activeGroup ? <MegaPanel group={activeGroup} /> : null}
          </div>
        </div>
      ) : null}

      {open && isNarrow
        ? createPortal(
            <CatalogMobileDrawer
              groups={groups}
              expanded={mobileExpanded}
              onExpandedChange={setMobileExpanded}
              onClose={close}
            />,
            document.body,
          )
        : null}
    </div>
  );
}
