import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  clampFabPos,
  DRAG_THRESHOLD,
  loadFabPos,
  saveFabPos,
  type FabPos,
} from './chatbot-utils';

/** Kéo-thả nút FAB; nhấp (không kéo) thì gọi onTap. */
export function useFabDrag(onTap: () => void) {
  const [fabPos, setFabPos] = useState<FabPos>(() => loadFabPos());
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  function onFabPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: fabPos.x,
      origY: fabPos.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onFabPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    setFabPos(
      clampFabPos({
        x: drag.origX + dx,
        y: drag.origY + dy,
      }),
    );
  }

  function onFabPointerUp(e: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (drag.moved) {
      setFabPos((current) => {
        const next = clampFabPos(current);
        saveFabPos(next);
        return next;
      });
      return;
    }
    onTap();
  }

  useEffect(() => {
    function onResize() {
      setFabPos((current) => clampFabPos(current));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return { fabPos, onFabPointerDown, onFabPointerMove, onFabPointerUp };
}
