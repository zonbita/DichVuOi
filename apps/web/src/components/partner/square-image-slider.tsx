import { useState } from 'react';
import { Icon } from '../ui/icon';

type Props = {
  images: string[];
  resolveSrc?: (url: string) => string;
  /** Cạnh ô vuông (variant square). */
  size?: number;
  className?: string;
  /** square = khung phẳng; cover = ảnh full-bleed trên thẻ gig. */
  variant?: 'square' | 'cover';
  /** cover (mặc định) cắt khung; contain hiện đủ ảnh trong khung. */
  objectFit?: 'cover' | 'contain';
};

/** Slider ảnh — square (dashboard) hoặc cover (thẻ gig kiểu Fiverr). */
export function SquareImageSlider({
  images,
  resolveSrc = (url) => url,
  size = 112,
  className = 'mt-3',
  variant = 'square',
  objectFit = 'cover',
}: Props) {
  const [index, setIndex] = useState(0);
  if (!images.length) return null;

  const count = images.length;
  const current = ((index % count) + count) % count;
  const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  function go(delta: number) {
    setIndex((i) => (i + delta + count) % count);
  }

  if (variant === 'cover') {
    return (
      <div
        className={`relative aspect-[16/10] w-full overflow-hidden bg-[var(--color-canvas)] ${className}`}
      >
        <img
          src={resolveSrc(images[current])}
          alt=""
          className={`h-full w-full ${fitClass}`}
        />
        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label="Ảnh trước"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go(-1);
              }}
              className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-[var(--color-ink)] shadow-sm transition hover:bg-white"
            >
              <Icon name="chevronLeft" className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Ảnh sau"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go(1);
              }}
              className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-[var(--color-ink)] shadow-sm transition hover:bg-white"
            >
              <Icon name="chevronRight" className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
              {images.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  aria-label={`Ảnh ${i + 1}`}
                  aria-current={i === current}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIndex(i);
                  }}
                  className={`h-1.5 w-1.5 rounded-full ${
                    i === current ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`border border-[var(--color-line)] bg-[var(--color-canvas)] ${className}`}
    >
      <div className="relative flex items-center justify-center p-2">
        {count > 1 ? (
          <button
            type="button"
            aria-label="Ảnh trước"
            onClick={() => go(-1)}
            className="absolute left-2 z-10 flex h-8 w-8 items-center justify-center border border-[var(--color-line)] bg-white text-[var(--color-ink)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand-deep)]"
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
          </button>
        ) : null}

        <img
          src={resolveSrc(images[current])}
          alt=""
          className={`border border-[var(--color-line)] bg-white ${fitClass}`}
          style={{ width: size, height: size }}
        />

        {count > 1 ? (
          <button
            type="button"
            aria-label="Ảnh sau"
            onClick={() => go(1)}
            className="absolute right-2 z-10 flex h-8 w-8 items-center justify-center border border-[var(--color-line)] bg-white text-[var(--color-ink)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand-deep)]"
          >
            <Icon name="chevronRight" className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="flex items-center justify-center gap-1.5 border-t border-[var(--color-line)] px-2 py-2">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              aria-label={`Ảnh ${i + 1}`}
              aria-current={i === current}
              onClick={() => setIndex(i)}
              className={`h-2 w-2 border ${
                i === current
                  ? 'border-[var(--color-brand)] bg-[var(--color-brand)]'
                  : 'border-[var(--color-line)] bg-white hover:border-[var(--color-brand)]'
              }`}
            />
          ))}
          <span className="ml-2 text-[11px] font-bold text-[var(--color-muted)]">
            {current + 1}/{count}
          </span>
        </div>
      ) : null}
    </div>
  );
}
