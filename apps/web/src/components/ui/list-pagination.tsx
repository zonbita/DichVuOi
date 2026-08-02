import { Icon } from './icon';

export function pageNumbers(current: number, pageCount: number): Array<number | '…'> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, pageCount, current, current - 1, current + 1]);
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= pageCount - 2) {
    pages.add(pageCount - 1);
    pages.add(pageCount - 2);
    pages.add(pageCount - 3);
  }
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: Array<number | '…'> = [];
  for (const p of sorted) {
    if (out.length > 0) {
      const prev = out[out.length - 1];
      if (typeof prev === 'number' && p - prev > 1) out.push('…');
    }
    out.push(p);
  }
  return out;
}

type Props = {
  page: number;
  pageCount: number;
  total: number;
  unitLabel: string;
  onChange: (page: number) => void;
  ariaLabel: string;
};

/** Thanh phân trang [1][2]… + Trước/Sau — dùng danh sách dashboard. */
export function ListPagination({
  page,
  pageCount,
  total,
  unitLabel,
  onChange,
  ariaLabel,
}: Props) {
  if (total <= 0 || pageCount <= 1) return null;

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[var(--color-line)] pt-3">
      <p className="text-sm text-[var(--color-muted)]">
        {total} {unitLabel} · trang {page}/{pageCount}
      </p>
      <nav className="flex flex-wrap items-center gap-2" aria-label={ariaLabel}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(Math.max(1, page - 1))}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-canvas)] disabled:opacity-40"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
          Trước
        </button>
        <div className="flex items-center gap-1">
          {pageNumbers(page, pageCount).map((item, idx) =>
            item === '…' ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-1 text-[var(--color-muted)]"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onChange(item)}
                aria-current={item === page ? 'page' : undefined}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2.5 text-sm font-bold transition ${
                  item === page
                    ? 'bg-[var(--color-navy)] text-white'
                    : 'border border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-canvas)]'
                }`}
              >
                {item}
              </button>
            ),
          )}
        </div>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onChange(Math.min(pageCount, page + 1))}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-canvas)] disabled:opacity-40"
        >
          Sau
          <Icon name="chevronRight" className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
