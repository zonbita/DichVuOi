import { Icon } from '../ui/icon';
import type { IconName } from '../ui/icon';

export type BenefitCardProps = {
  icon: IconName;
  title: string;
  body: string;
};

/** Benefit glass card — khớp mockup, chiều cao như bản cũ. */
export function BenefitCard({ icon, title, body }: BenefitCardProps) {
  return (
    <article className="group flex min-h-[120px] min-w-0 items-center gap-3.5 rounded-[18px] border border-white/75 bg-white/55 px-4 py-3.5 shadow-[0_10px_28px_rgba(15,39,71,0.06),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-md transition-[transform,box-shadow] duration-[180ms] ease-in-out hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-[0_14px_36px_rgba(15,39,71,0.09)]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--color-brand-soft)] text-[var(--color-brand)] shadow-[0_4px_12px_rgba(0,156,149,0.12),inset_0_1px_0_rgba(255,255,255,0.85)]">
        <Icon name={icon} className="h-[22px] w-[22px]" />
      </span>
      <span className="min-w-0 leading-snug">
        <span className="block truncate whitespace-nowrap text-[15px] font-semibold text-[var(--color-navy)]">
          {title}
        </span>
        <span className="mt-0.5 block truncate whitespace-nowrap text-[13px] leading-[1.45] text-[var(--color-muted)]">
          {body}
        </span>
      </span>
    </article>
  );
}
