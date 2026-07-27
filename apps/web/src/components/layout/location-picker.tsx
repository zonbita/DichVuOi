import { useEffect, useMemo, useRef, useState } from 'react';
import {
  filterProvinces,
  findProvince,
  loadProvinceSlug,
  saveProvinceSlug,
} from '../../data/provinces';
import { Icon } from '../ui/icon';

export function LocationPicker({
  className = '',
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  const [slug, setSlug] = useState(DEFAULT_VISIBLE);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = findProvince(slug);
  const results = useMemo(() => filterProvinces(query), [query]);

  useEffect(() => {
    setSlug(loadProvinceSlug());
  }, []);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  function pick(nextSlug: string) {
    setSlug(nextSlug);
    saveProvinceSlug(nextSlug);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Chọn tỉnh / thành"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-1.5 text-[15px] font-medium ${
          onDark ? 'text-white' : 'text-[var(--color-ink)]'
        }`}
      >
        <Icon name="pin" className={`h-4 w-4 ${onDark ? 'text-[var(--color-brand)]' : 'text-[var(--color-brand)]'}`} />
        <span className="max-w-[9.5rem] truncate">{selected.name}</span>
        <Icon
          name="chevronDown"
          className={`h-4 w-4 ${onDark ? 'text-white/60' : 'text-[var(--color-muted)]'}`}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Tỉnh / thành"
          className="absolute right-0 z-[9990] mt-2 w-[min(280px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-xl"
        >
          <div className="border-b border-[var(--color-line)] p-2">
            <div className="flex items-center gap-2 rounded-xl bg-[var(--color-canvas)] px-3 py-2">
              <Icon name="search" className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm tỉnh / thành..."
                aria-label="Tìm tỉnh thành"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)]"
              />
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {results.length === 0 ? (
              <li className="px-3 py-3 text-sm text-[var(--color-muted)]">Không tìm thấy</li>
            ) : (
              results.map((province) => {
                const active = province.slug === selected.slug;
                return (
                  <li key={province.slug}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => pick(province.slug)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[15px] transition hover:bg-[var(--color-brand-soft)] ${
                        active ? 'bg-[var(--color-brand-soft)] font-bold text-[var(--color-brand-deep)]' : ''
                      }`}
                    >
                      <span>{province.name}</span>
                      {province.kind === 'city' ? (
                        <span className="text-xs font-semibold text-[var(--color-muted)]">TP</span>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** Tránh hydration mismatch — giá trị ổn định trước khi đọc localStorage. */
const DEFAULT_VISIBLE = 'ho-chi-minh';
