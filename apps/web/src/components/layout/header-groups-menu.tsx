import { useQuery } from '@tanstack/react-query';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { catalogQueries } from '../../lib/catalog-queries';
import { Icon } from '../ui/icon';
import {
  CatalogAllCategoriesLink,
  CatalogMenuHeader,
  CatalogMobileDrawer,
  GroupListItem,
  MegaPanel,
} from '../home/catalog-menu-shared';

type PanelPos = { top: number; left: number };

const VIEWPORT_PAD = 12;

export function HeaderGroupsMenu({ onDark = false }: { onDark?: boolean }) {
  const treeQuery = useQuery(catalogQueries.groupsTree);

  const groups = treeQuery.data ?? [];
  const [open, setOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const [panelPos, setPanelPos] = useState<PanelPos>({ top: 0, left: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const activeGroup = groups.find((group) => group.slug === activeSlug) ?? groups[0] ?? null;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useLayoutEffect(() => {
    if (!open || isNarrow) return;

    function place() {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const gap = 8;
      let top = rect.bottom + gap;
      const maxLeft = Math.max(8, window.innerWidth - 8 - Math.min(1040, window.innerWidth - 16));
      const left = Math.min(rect.left, maxLeft);

      if (panel) {
        const panelHeight = panel.offsetHeight;
        const maxBottom = window.innerHeight - VIEWPORT_PAD;
        if (top + panelHeight > maxBottom) {
          top = Math.max(VIEWPORT_PAD, maxBottom - panelHeight);
        }
      }

      setPanelPos({ top, left });
    }

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, isNarrow, groups.length, treeQuery.isLoading, activeSlug]);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
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

  const desktopPanel =
    open && !isNarrow
      ? createPortal(
          <div
            ref={panelRef}
            id={menuId}
            role="menu"
            style={{ top: panelPos.top, left: panelPos.left }}
            className="mega-menu-shell fixed z-[9990] flex overflow-hidden"
            onMouseLeave={() => setActiveSlug(groups[0]?.slug ?? null)}
            onClick={(event) => {
              if ((event.target as HTMLElement).closest('a')) close();
            }}
          >
            <div className="mega-menu-aside relative z-10 flex w-[320px] shrink-0 flex-col">
              <CatalogMenuHeader size="sm" tone="glass" />
              <ul className="py-2">
                {treeQuery.isLoading ? (
                  <li className="px-4 py-2 text-sm text-[var(--glass-muted,#7c8799)]">
                    Đang tải...
                  </li>
                ) : null}
                {groups.map((group, index) => (
                  <li key={group.id}>
                    <GroupListItem
                      group={group}
                      active={activeSlug === group.slug}
                      onEnter={() => setActiveSlug(group.slug)}
                      onClick={close}
                      tone="glass"
                      showSeparator={index < groups.length - 1}
                    />
                  </li>
                ))}
              </ul>
              <div
                className="shrink-0 border-t py-2"
                style={{ borderColor: 'var(--glass-line, rgba(23, 32, 51, 0.08))' }}
              >
                <CatalogAllCategoriesLink onClick={close} tone="glass" />
              </div>
            </div>

            <div
              className="w-[min(720px,calc(100vw-340px))] max-w-[720px] shrink-0"
              aria-hidden
            />
            <div className="mega-menu-panel absolute inset-y-0 left-[320px] w-[min(720px,calc(100vw-340px))] max-w-[720px] overflow-hidden">
              {activeGroup ? <MegaPanel group={activeGroup} fitContent glass /> : null}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
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

      {desktopPanel}

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
