import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Icon } from '../ui/icon';

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diff / 60_000));
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

const kindIcon = {
  open: 'briefcase' as const,
  apply: 'users' as const,
  completed: 'check' as const,
};

/** Ticker hoạt động ẩn danh — cảm giác sàn đang sống. */
export function HomeActivityTicker() {
  const query = useQuery({
    queryKey: ['public-activity'],
    queryFn: () => api.getPublicActivity(12),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const items = query.data?.items ?? [];
  if (query.isLoading || items.length === 0) return null;

  const loop = [...items, ...items];

  return (
    <section className="page-shell mt-4">
      <div className="section-container">
        <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-[0_4px_14px_rgba(24,49,63,0.06)]">
          <div className="flex items-center gap-3 border-b border-[var(--color-line)] px-4 py-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <p className="text-sm font-bold text-[var(--color-navy)]">
              Đang diễn ra trên sàn
            </p>
          </div>
          <div className="relative overflow-hidden py-2.5 marquee">
          <div className="marquee__track flex w-max gap-3 px-4" style={{ animationDuration: '45s' }}>
              {loop.map((item, i) => (
                <span
                  key={`${item.id}-${i}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--color-canvas)] px-3.5 py-1.5 text-sm text-[var(--color-ink)] ring-1 ring-[var(--color-line)]"
                >
                  <Icon
                    name={kindIcon[item.kind]}
                    className="h-3.5 w-3.5 text-[var(--color-brand)]"
                  />
                  <span className="font-semibold text-[var(--color-navy)]">
                    {item.label}
                  </span>
                  <span className="text-[var(--color-muted)]">·</span>
                  <span className="font-medium">{item.serviceName}</span>
                  <span className="text-[var(--color-muted)]">
                    {relativeTime(item.at)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
