import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { groupColor } from '../../utils/catalog-colors';
import { groupBanner } from '../../utils/catalog-images';

type GroupColor = ReturnType<typeof groupColor>;

function GlobeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}

type CatalogOverlayHeroProps = {
  image: string;
  imageAlt: string;
  backTo: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  note?: string;
  color: GroupColor;
  showOnlineBadge?: boolean;
  /** right = góc phải (trang nhóm); inline = dưới mô tả bên trái (trang nghề). */
  onlineBadgePlacement?: 'right' | 'inline';
  aside?: ReactNode;
  footer?: ReactNode;
  tall?: boolean;
};

function OnlineBadge({ color }: { color: GroupColor }) {
  return (
    <div className="flex w-fit items-center gap-3 rounded-2xl bg-black/45 px-4 py-3 text-white backdrop-blur-sm">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: color.main, color: '#fff' }}
      >
        <GlobeIcon />
      </span>
      <span className="text-sm font-semibold">Làm việc online</span>
      <span className="h-8 w-px bg-white/25" aria-hidden />
      <span className="relative flex h-3 w-3" aria-label="Đang hoạt động">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
      </span>
    </div>
  );
}

export function CatalogOverlayHero({
  image,
  imageAlt,
  backTo,
  backLabel,
  title,
  subtitle,
  note,
  color,
  showOnlineBadge = true,
  onlineBadgePlacement = 'right',
  aside,
  footer,
  tall = false,
}: CatalogOverlayHeroProps) {
  const minH = tall ? 'min-h-[340px] sm:min-h-[380px]' : 'min-h-[280px] sm:min-h-[320px]';

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5">
      <div className={`relative w-full ${minH}`}>
        <img src={image} alt={imageAlt} className="catalog-photo absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15"
          aria-hidden
        />
        <div className={`relative flex h-full flex-col justify-between p-5 sm:p-7 ${minH}`}>
          <Link
            to={backTo}
            className="inline-flex w-fit items-center rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm transition hover:brightness-95"
            style={{ color: color.main }}
          >
            {backLabel}
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl text-white">
              <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-md sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                {title}
              </h1>
              <div
                className="mt-3 h-1 w-14 rounded-full"
                style={{ backgroundColor: color.main }}
                aria-hidden
              />
              {subtitle ? (
                <p className="mt-4 text-base leading-relaxed text-white/90 sm:text-lg">{subtitle}</p>
              ) : null}
              {note ? <p className="mt-2 text-sm text-white/70">{note}</p> : null}
              {showOnlineBadge && onlineBadgePlacement === 'inline' ? (
                <div className="mt-4">
                  <OnlineBadge color={color} />
                </div>
              ) : null}
              {footer}
            </div>

            {aside ? <div className="shrink-0 lg:ml-4">{aside}</div> : null}

            {showOnlineBadge && onlineBadgePlacement === 'right' ? (
              <OnlineBadge color={color} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GroupDetailHero({
  name,
  description,
  slug,
  color,
}: {
  name: string;
  description: string;
  slug: string;
  color: GroupColor;
}) {
  return (
    <CatalogOverlayHero
      image={groupBanner(slug)}
      imageAlt={name}
      backTo="/nhom"
      backLabel="← Danh mục"
      title={name}
      subtitle={description || undefined}
      note="Chỉ liệt kê nghề làm được hoàn toàn online."
      color={color}
    />
  );
}
