import type { ReactNode } from 'react';
import { Icon } from '../../ui/icon';
import { STEPS } from './hire-form-utils';

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-[13px] font-semibold text-[var(--color-ink)]"
    >
      {children}
    </label>
  );
}

export function HireStepper({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-1 sm:gap-1.5" aria-label="Tiến trình đăng ký">
      {STEPS.map((step, index) => {
        const done = activeStep > step.id;
        const current = activeStep === step.id;
        return (
          <li key={step.id} className="flex items-center gap-1 sm:gap-1.5">
            {index > 0 ? (
              <span
                className={`hidden h-px w-4 sm:block sm:w-6 ${
                  activeStep >= step.id
                    ? 'bg-[var(--color-brand)]'
                    : 'bg-[var(--color-line)]'
                }`}
                aria-hidden
              />
            ) : null}
            <span className="flex items-center gap-1 sm:gap-1.5">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold sm:h-7 sm:w-7 sm:text-xs ${
                  done || current
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'bg-[var(--color-canvas)] text-[var(--color-muted)] ring-1 ring-[var(--color-line)]'
                }`}
              >
                {done ? (
                  <Icon name="check" className="h-3 w-3" />
                ) : (
                  step.id
                )}
              </span>
              <span
                className={`hidden text-xs font-semibold sm:inline ${
                  current || done
                    ? 'text-[var(--color-ink)]'
                    : 'text-[var(--color-muted)]'
                }`}
              >
                {step.label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
