import { useRef } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../ui/icon';

export function ScrollRail({
  children,
  showArrows = true,
}: {
  children: ReactNode;
  /** Nút tròn < > — tắt theo mockup Deal. */
  showArrows?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(direction: number) {
    trackRef.current?.scrollBy({ left: direction * 440, behavior: 'smooth' });
  }

  return (
    <div className="group/rail relative overflow-hidden">
      <div ref={trackRef} className="no-scrollbar flex gap-3.5 overflow-x-auto pb-1">
        {children}
      </div>

      {showArrows ? (
        <>
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Xem mục trước"
            className="absolute left-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[var(--color-ink)] shadow-md transition hover:bg-[var(--color-brand-soft)] lg:flex"
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Xem mục kế tiếp"
            className="absolute right-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[var(--color-ink)] shadow-md transition hover:bg-[var(--color-brand-soft)] lg:flex"
          >
            <Icon name="chevronRight" className="h-4 w-4" />
          </button>
        </>
      ) : null}
    </div>
  );
}
