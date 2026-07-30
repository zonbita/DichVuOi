import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Icon } from '../ui/icon';
import { groupColor } from '../../utils/catalog-colors';
import { fuzzyMatch } from '../../utils/search';

export type ProfessionOption = {
  id: string;
  name: string;
  slug: string;
  groupSlug: string;
  groupName: string;
  categoryName: string;
};

type Props = {
  value: string[];
  onChange: (serviceIds: string[]) => void;
  options: ProfessionOption[];
  /** Giờ làm theo serviceId — hiện trên chip nếu user có nghề đó. */
  hoursByServiceId?: Record<string, number>;
  /** Tối đa số nghề (mặc định 40 — khớp API). */
  max?: number;
  placeholder?: string;
  disabled?: boolean;
};

/**
 * Chọn nhiều nghề kiểu tags (gần UE5 Gameplay Tags):
 * chip có màu theo nhóm + ô gõ tìm + dropdown gợi ý + Enter / Backspace.
 */
export function ProfessionTagsInput({
  value,
  onChange,
  options,
  hoursByServiceId,
  max = 40,
  placeholder = 'Gõ để tìm nghề…',
  disabled = false,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const byId = useMemo(() => {
    const map = new Map<string, ProfessionOption>();
    for (const option of options) map.set(option.id, option);
    return map;
  }, [options]);

  const selected = useMemo(
    () => value.map((id) => byId.get(id)).filter(Boolean) as ProfessionOption[],
    [value, byId],
  );

  const selectedSet = useMemo(() => new Set(value), [value]);

  const suggestions = useMemo(() => {
    const available = options.filter((option) => !selectedSet.has(option.id));
    return query.trim()
      ? available.filter((option) =>
          fuzzyMatch(
            `${option.name} ${option.categoryName} ${option.groupName}`,
            query,
          ),
        )
      : available;
  }, [options, query, selectedSet]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  function add(id: string) {
    if (disabled || selectedSet.has(id) || value.length >= max) return;
    onChange([...value, id]);
    setQuery('');
    setOpen(true);
    inputRef.current?.focus();
  }

  function remove(id: string) {
    if (disabled) return;
    onChange(value.filter((item) => item !== id));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !query && value.length) {
      event.preventDefault();
      remove(value[value.length - 1]);
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!suggestions.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlight((index) => (index + 1) % suggestions.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setHighlight(
        (index) => (index - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const pick = suggestions[highlight] ?? suggestions[0];
      if (pick) add(pick.id);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div
        className={`field-input flex min-h-[48px] flex-wrap items-center gap-1.5 py-2 ${
          disabled ? 'opacity-60' : 'cursor-text'
        }`}
        onClick={() => {
          if (disabled) return;
          inputRef.current?.focus();
          setOpen(true);
        }}
      >
        {selected.map((tag) => {
          const color = groupColor(tag.groupSlug);
          const hours = hoursByServiceId?.[tag.id];
          const hoursLabel =
            hours !== undefined
              ? hours <= 0
                ? '0 giờ'
                : `${Number.isInteger(hours) ? hours : hours.toFixed(1)} giờ`
              : null;
          return (
            <span
              key={tag.id}
              className="inline-flex max-w-full items-center gap-1 rounded-md px-2 py-1 text-xs font-bold"
              style={{ backgroundColor: color.soft, color: color.ink }}
              title={
                hoursLabel
                  ? `${tag.groupName} › ${tag.categoryName} · ${hoursLabel} trên sàn`
                  : `${tag.groupName} › ${tag.categoryName}`
              }
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: color.main }}
              />
              <span className="truncate">{tag.name}</span>
              {hoursLabel ? (
                <span className="shrink-0 opacity-70">· {hoursLabel}</span>
              ) : null}
              {!disabled ? (
                <button
                  type="button"
                  aria-label={`Gỡ ${tag.name}`}
                  className="ml-0.5 rounded p-0.5 leading-none hover:bg-black/10"
                  onClick={(event) => {
                    event.stopPropagation();
                    remove(tag.id);
                  }}
                >
                  ×
                </button>
              ) : null}
            </span>
          );
        })}

        <input
          ref={inputRef}
          value={query}
          disabled={disabled || value.length >= max}
          placeholder={selected.length ? '' : placeholder}
          className="min-w-[140px] flex-1 border-0 bg-transparent py-1 text-sm outline-none placeholder:text-[var(--color-muted)]"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </div>

      <p className="mt-1.5 text-xs text-[var(--color-muted)]">
        {value.length}/{max} nghề · Enter để thêm · Backspace để gỡ tag cuối
      </p>

      {open && !disabled ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-80 w-full overflow-auto rounded-xl border border-[var(--color-line)] bg-white py-1 shadow-lg"
        >
          {suggestions.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-[var(--color-muted)]">
              {value.length >= max
                ? 'Đã đạt giới hạn nghề'
                : 'Không tìm thấy nghề phù hợp'}
            </li>
          ) : (
            suggestions.map((option, index) => {
              const color = groupColor(option.groupSlug);
              const active = index === highlight;
              return (
                <li key={option.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    className={`flex w-full items-start gap-2.5 px-3 py-2 text-left text-sm ${
                      active ? 'bg-[var(--color-brand-soft)]' : 'hover:bg-[var(--color-canvas)]'
                    }`}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => add(option.id)}
                  >
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: color.main }}
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold">{option.name}</span>
                      <span className="block text-xs text-[var(--color-muted)]">
                        {option.groupName} › {option.categoryName}
                      </span>
                    </span>
                    {active ? (
                      <Icon
                        name="check"
                        className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand-deep)]"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
