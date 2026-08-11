import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { groupColor } from '../../utils/catalog-colors';
import { Icon } from '../ui/icon';

export type ProfessionTab = {
  id: string;
  label: string;
  count: number;
  groupSlug?: string;
  groupName?: string;
  categoryName?: string;
};

type Props = {
  tabs: ProfessionTab[];
  value: string;
  onChange: (id: string) => void;
  /** `vertical` = dropdown góc phải bảng Đơn thuê. */
  orientation?: 'horizontal' | 'vertical';
};

function groupProfessionTabs(tabs: ProfessionTab[]) {
  const grouped = new Map<string, { groupName: string; items: ProfessionTab[] }>();
  for (const tab of tabs) {
    if (tab.id === 'all' || !tab.groupSlug || !tab.groupName) continue;
    const entry = grouped.get(tab.groupSlug) ?? {
      groupName: tab.groupName,
      items: [],
    };
    entry.items.push(tab);
    grouped.set(tab.groupSlug, entry);
  }
  return Array.from(grouped.entries()).map(([groupSlug, entry]) => ({
    groupSlug,
    groupName: entry.groupName,
    items: entry.items.sort((a, b) => a.label.localeCompare(b.label, 'vi')),
  }));
}

/** Dropdown lọc theo nghề (service) — dùng trong Đơn thuê. */
export function PartnerProfessionTabs({
  tabs,
  value,
  onChange,
  orientation = 'horizontal',
}: Props) {
  if (tabs.length <= 1) return null;

  const vertical = orientation === 'vertical';
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = tabs.find((item) => item.id === value) ?? tabs[0];
  const triggerColor =
    selected.groupSlug && selected.id !== 'all'
      ? groupColor(selected.groupSlug)
      : null;
  const groupedTabs = useMemo(() => groupProfessionTabs(tabs), [tabs]);

  useEffect(() => {
    if (!vertical || !open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, vertical]);

  function pick(id: string) {
    onChange(id);
    setOpen(false);
  }

  if (vertical) {
    return (
      <div
        ref={rootRef}
        className="relative rounded-xl border border-[var(--glass-line,rgba(23,32,51,0.08))] bg-white/70 px-3 py-2.5 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2.5">
          <p className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted)]">
            Nghề của bạn
          </p>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((prev) => !prev)}
            className="field-input flex min-w-0 flex-1 items-center justify-between gap-2 py-2 text-left"
            style={
              triggerColor
                ? { borderLeftWidth: '4px', borderLeftColor: triggerColor.main }
                : undefined
            }
          >
            <span className="min-w-0 truncate font-semibold">
              {selected.label}
            </span>
            <span className="ml-auto shrink-0 text-sm font-semibold text-[var(--color-muted)]">
              {selected.count}
            </span>
            <Icon
              name="chevronDown"
              className={`h-4 w-4 shrink-0 text-[var(--color-muted)] transition ${open ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {open ? (
          <div
            id={listId}
            role="listbox"
            className="absolute left-3 right-3 top-full z-30 mt-1 max-h-[min(420px,60vh)] overflow-y-auto rounded-xl border border-[var(--glass-line,rgba(23,32,51,0.08))] bg-white/95 py-1 shadow-[var(--shadow-card)] backdrop-blur-md"
          >
            <button
              type="button"
              role="option"
              aria-selected={selected.id === 'all'}
              onClick={() => pick('all')}
              className={`mx-2 mb-1 flex w-[calc(100%-1rem)] items-center justify-between rounded-lg px-4 py-2.5 text-left text-sm font-bold transition ${
                selected.id === 'all'
                  ? 'bg-[var(--color-ink)] text-white'
                  : 'text-[var(--color-ink)] hover:bg-[var(--color-brand-soft)]'
              }`}
            >
              <span>Tất cả nghề</span>
              <span className={selected.id === 'all' ? 'text-white/80' : 'text-[var(--color-muted)]'}>
                {tabs[0]?.count ?? 0}
              </span>
            </button>

            {groupedTabs.map((group) => {
              const color = groupColor(group.groupSlug);
              return (
                <div key={group.groupSlug} className="py-1">
                  <p
                    className="mx-2 mb-1 px-2 py-1 text-sm font-bold"
                    style={{
                      color: color.ink,
                      borderLeft: `4px solid ${color.main}`,
                    }}
                  >
                    {group.groupName}
                  </p>
                  {group.items.map((item) => {
                    const active = selected.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => pick(item.id)}
                        className="mx-2 mb-0.5 flex w-[calc(100%-1rem)] items-center gap-2 rounded-lg py-2 pl-5 pr-4 text-left text-sm transition hover:[background-color:var(--svc-soft)]"
                        style={{
                          ['--svc-soft' as string]: color.soft,
                          borderLeft: `4px solid ${color.main}`,
                          backgroundColor: active ? color.soft : undefined,
                          color: active ? color.ink : 'var(--color-ink)',
                        }}
                      >
                        <span className="min-w-0 flex-1 truncate font-semibold">
                          {item.label}
                        </span>
                        <span className="shrink-0 text-xs text-[var(--color-muted)]">
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <aside
      role="tablist"
      aria-label="Lọc theo nghề"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      className={
        vertical
          ? 'glass-card flex flex-col gap-1 !rounded-xl p-2 lg:sticky lg:top-[5.5rem]'
          : 'flex flex-wrap gap-2 border-b border-[var(--color-line)] pb-3'
      }
    >
      {vertical ? (
        <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted)]">
          Nghề của bạn
        </p>
      ) : null}
      {tabs.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={
              vertical
                ? `flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-bold transition ${
                    active
                      ? 'bg-[var(--color-ink)] text-white'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-brand-soft)]'
                  }`
                : `px-3 py-2 text-sm font-bold transition ${
                    active
                      ? 'bg-[var(--color-ink)] text-white'
                      : 'bg-[var(--color-canvas)] text-[var(--color-ink)] hover:bg-[var(--color-brand-soft)]'
                  }`
            }
          >
            <span className={vertical ? 'min-w-0 flex-1 truncate' : undefined}>
              {item.label}
            </span>
            <span
              className={`shrink-0 text-xs ${
                vertical ? '' : 'ml-1.5'
              } ${active ? 'text-white/80' : 'text-[var(--color-muted)]'}`}
            >
              {item.count}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
