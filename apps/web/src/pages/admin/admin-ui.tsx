import { useEffect, type ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--admin-ink)] sm:text-[1.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-[var(--admin-muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'warn';
}) {
  return (
    <div
      className={`admin-card p-4 ${
        tone === 'warn' ? 'border-amber-300 bg-amber-50/70' : ''
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-xl font-extrabold tracking-tight">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`admin-card p-4 sm:p-5 ${className}`}>{children}</div>;
}

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 admin-card p-3">
      {children}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Tìm kiếm…',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="field-input h-10 w-full py-1.5 text-sm sm:w-72"
    />
  );
}

export function SelectFilter({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="field-input h-10 w-auto py-1.5 text-sm"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Pagination({
  page,
  pageCount,
  total,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onChange: (page: number) => void;
}) {
  // Khi pageSize theo viewport đổi, clamp page về pageCount hợp lệ
  useEffect(() => {
    if (pageCount >= 1 && page > pageCount) onChange(pageCount);
  }, [page, pageCount, onChange]);

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-[var(--color-muted)]">
        {total} kết quả · trang {page}/{pageCount}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-1.5 font-semibold disabled:opacity-40"
        >
          Trước
        </button>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
          className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-1.5 font-semibold disabled:opacity-40"
        >
          Sau
        </button>
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: string;
}) {
  const map: Record<string, string> = {
    neutral: 'admin-badge-neutral',
    green: 'admin-badge-green',
    amber: 'admin-badge-amber',
    red: 'admin-badge-red',
    blue: 'admin-badge-blue',
  };
  return (
    <span className={`admin-badge ${map[tone] ?? map.neutral}`}>{children}</span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="admin-card border-dashed p-8 text-center text-sm text-[var(--color-muted)]">
      {children}
    </p>
  );
}
