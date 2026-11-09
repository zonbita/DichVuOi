import type { Dispatch, RefObject, SetStateAction } from 'react';
import {
  FACEBOOK_EMOTICONS,
  FacebookEmoticonIcon,
} from '../facebook-emoticons';

export function LobbySmilePanel({
  smilePanelRef,
  smileOpen,
  setSmileOpen,
  onTapSmile,
  reactError,
}: {
  smilePanelRef: RefObject<HTMLDivElement | null>;
  smileOpen: boolean;
  setSmileOpen: Dispatch<SetStateAction<boolean>>;
  onTapSmile: (code: string) => void;
  reactError: string | null;
}) {
  return (
    <div ref={smilePanelRef} className="relative shrink-0 self-center">
      {smileOpen ? (
        <div
          className="absolute bottom-[calc(100%+10px)] right-0 z-30 w-[min(100vw-1.5rem,20rem)] overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-[0_12px_32px_rgba(15,39,71,0.14)] sm:w-[22rem]"
          role="dialog"
          aria-label="Bảng smile"
        >
          <div className="px-3 pb-2 pt-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted)]">
              Smile
            </p>
            <div className="grid max-h-[16rem] grid-cols-5 gap-1 overflow-y-auto overscroll-contain pr-0.5">
              {FACEBOOK_EMOTICONS.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => onTapSmile(item.code)}
                  className="lobby-smile-btn flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition hover:bg-[var(--color-canvas)] hover:scale-105 active:scale-95"
                  aria-label={`Chat ${item.code}`}
                  title={item.code}
                >
                  <FacebookEmoticonIcon
                    face={item.face}
                    className="h-7 w-7 sm:h-8 sm:w-8"
                  />
                  <span className="text-[10px] font-bold leading-none text-[var(--color-navy)]">
                    {item.code}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {reactError ? (
            <p className="px-3 pb-2 text-xs text-red-600">
              {reactError}
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setSmileOpen((open) => !open)}
        className={`flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md ring-1 transition ${
          smileOpen
            ? 'ring-[var(--color-brand)]'
            : 'ring-[var(--color-line)] hover:bg-[var(--color-canvas)]'
        }`}
        aria-label={smileOpen ? 'Đóng bảng smile' : 'Mở bảng smile'}
        aria-expanded={smileOpen}
      >
        <FacebookEmoticonIcon
          face="haha"
          className="h-7 w-7 sm:h-8 sm:w-8"
        />
      </button>
    </div>
  );
}
