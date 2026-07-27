export type PartnerReputation = {
  currentPoints: number;
  startingPoints: number;
  percent: number;
  periodIndex: number;
  periodStart: string;
  periodEnd: string;
  deductedThisPeriod: number;
};

type ReputationProgressBarProps = {
  reputation: PartnerReputation;
  className?: string;
  showLabel?: boolean;
  /** Thu gọn cho thẻ provider trên lưới dịch vụ. */
  variant?: 'default' | 'compact';
};

function formatPeriodEnd(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ReputationProgressBar({
  reputation,
  className = '',
  showLabel = true,
  variant = 'default',
}: ReputationProgressBarProps) {
  const { currentPoints, startingPoints, percent, periodEnd } = reputation;
  const compact = variant === 'compact';

  return (
    <div className={className}>
      {showLabel ? (
        <div
          className={`flex items-baseline justify-between gap-2 ${
            compact ? 'mb-1' : 'mb-1.5'
          }`}
        >
          <p
            className={`font-bold uppercase tracking-wide text-[var(--color-muted)] ${
              compact ? 'text-[10px]' : 'text-xs'
            }`}
          >
            Uy tín
          </p>
          <p
            className={`font-extrabold tabular-nums text-[var(--color-ink)] ${
              compact ? 'text-xs' : 'text-sm'
            }`}
          >
            {currentPoints}
            <span className="text-[10px] font-semibold text-[var(--color-muted)]">
              /{startingPoints}
            </span>
          </p>
        </div>
      ) : null}
      <div
        className={`w-full overflow-hidden rounded-full bg-[#e91e8c] ${
          compact ? 'h-2' : 'h-2.5'
        }`}
        role="progressbar"
        aria-valuenow={currentPoints}
        aria-valuemin={0}
        aria-valuemax={startingPoints}
        aria-label={`Uy tín ${currentPoints} trên ${startingPoints} điểm`}
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#ffe566_0%,#ffb347_55%,#ff7b54_100%)] transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && !compact ? (
        <p className="mt-1 text-[11px] leading-snug text-[var(--color-muted)]">
          Chu kỳ reset {formatPeriodEnd(periodEnd)} · Trừ điểm khi khiếu nại được Admin xác minh
        </p>
      ) : null}
    </div>
  );
}
