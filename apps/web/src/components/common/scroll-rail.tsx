import { useEffect, useRef } from 'react';
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
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startScroll: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  function scroll(direction: number) {
    trackRef.current?.scrollBy({ left: direction * 440, behavior: 'smooth' });
  }

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('a, button, input, textarea, select, label')) return;

      suppressClickRef.current = false;
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startScroll: el.scrollLeft,
        moved: false,
      };
      el.setPointerCapture(e.pointerId);
      el.classList.add('cursor-grabbing');
    };

    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dx = e.clientX - drag.startX;
      if (Math.abs(dx) > 4) {
        drag.moved = true;
        suppressClickRef.current = true;
      }
      if (drag.moved) {
        el.scrollLeft = drag.startScroll - dx;
        e.preventDefault();
      }
    };

    const endDrag = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      if (drag.moved) suppressClickRef.current = true;
      dragRef.current = null;
      el.classList.remove('cursor-grabbing');
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    };

    const onClickCapture = (e: MouseEvent) => {
      if (!suppressClickRef.current) return;
      suppressClickRef.current = false;
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
    el.addEventListener('click', onClickCapture, true);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', endDrag);
      el.removeEventListener('pointercancel', endDrag);
      el.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  return (
    <div className="group/rail relative min-w-0 max-w-full overflow-hidden">
      <div
        ref={trackRef}
        className="no-scrollbar flex cursor-grab gap-3.5 overflow-x-auto pb-1 active:cursor-grabbing"
        style={{ touchAction: 'pan-y' }}
      >
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
