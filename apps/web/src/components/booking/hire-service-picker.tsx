import { useEffect, useId, useRef, useState } from 'react';
import type { ServiceGroupTree } from '../../types/catalog';
import { groupColor } from '../../utils/catalog-colors';
import { Icon } from '../ui/icon';

type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  groupSlug: string;
  groupName: string;
};

type Props = {
  id?: string;
  value: string;
  onChange: (slug: string) => void;
  groups: ServiceGroupTree[];
  services: ServiceRow[];
  placeholder?: string;
};

export function HireServicePicker({
  id,
  value,
  onChange,
  groups,
  services,
  placeholder = '— Chọn nghề —',
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = services.find((item) => item.slug === value) ?? null;
  const triggerColor = selected ? groupColor(selected.groupSlug) : null;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  function pick(slug: string) {
    onChange(slug);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        className="field-input flex w-full items-center justify-between gap-2 text-left"
        style={
          triggerColor
            ? { borderLeftWidth: '4px', borderLeftColor: triggerColor.main }
            : undefined
        }
      >
        <span className="min-w-0 truncate">
          {selected
            ? `${selected.name} · ${selected.categoryName}`
            : placeholder}
        </span>
        <Icon
          name="chevronDown"
          className={`h-4 w-4 shrink-0 text-[var(--color-muted)] transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-[min(420px,60vh)] w-full overflow-y-auto rounded-xl border border-[var(--color-line)] bg-white py-1 shadow-[var(--shadow-card)]"
        >
          {groups.map((group) => {
            const groupServices = services.filter(
              (item) => item.groupSlug === group.slug,
            );
            if (groupServices.length === 0) return null;
            const color = groupColor(group.slug);

            return (
              <div key={group.id} className="py-1">
                <p
                  className="mx-2 mb-1 px-2 py-1 text-sm font-bold"
                  style={{
                    color: color.ink,
                    borderLeft: `4px solid ${color.main}`,
                  }}
                >
                  {group.name}
                </p>
                {groupServices.map((service) => {
                  const active = service.slug === value;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => pick(service.slug)}
                      className="mx-2 mb-0.5 flex w-[calc(100%-1rem)] items-center gap-2 rounded-lg pl-5 pr-6 py-2 text-left text-sm transition hover:[background-color:var(--svc-soft)]"
                      style={{
                        ['--svc-soft' as string]: color.soft,
                        borderLeft: `4px solid ${color.main}`,
                        backgroundColor: active ? color.soft : undefined,
                        color: active ? color.ink : 'var(--color-ink)',
                      }}
                    >
                      <span className="min-w-0 truncate font-semibold">
                        {service.name}
                      </span>
                      <span className="shrink-0 text-[var(--color-muted)]">
                        · {service.categoryName}
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
