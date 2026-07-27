import { Icon } from '../ui/icon';
import type { IconName } from '../ui/icon';

export type BenefitCardProps = {
  icon: IconName;
  title: string;
  body: string;
};

export function BenefitCard({ icon, title, body }: BenefitCardProps) {
  return (
    <article className="group flex min-w-0 items-center gap-3.5 rounded-[14px] border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-3.5 shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-[180ms] ease-in-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]">
      <span className="icon-tile h-11 w-11 shrink-0">
        <Icon name={icon} className="h-[22px] w-[22px]" />
      </span>
      <span className="min-w-0 leading-snug">
        <span className="block text-[15px] font-semibold text-[var(--color-ink)]">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-[1.45] text-[var(--color-muted)]">
          {body}
        </span>
      </span>
    </article>
  );
}
