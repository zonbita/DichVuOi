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
  /** Ảnh nền — chỉ dùng khi không compact. */
  image?: string;
  imageAlt?: string;
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
  /** Thanh hero gọn — soft-3D navy, không ảnh (trang nghề). */
  compact?: boolean;
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
  compact = false,
}: CatalogOverlayHeroProps) {
  if (compact) {
    return (
      <div
        className="soft-3d-navy relative flex min-h-20 w-full items-center overflow-hidden rounded-[14px]"
        style={{
          background: `radial-gradient(ellipse 140% 200% at 12% -50%, color-mix(in srgb, ${color.main} 55%, #0a5678) 0%, #073b5c 46%, #052d47 78%, #041f32 100%)`,
        }}
      >
        <div aria-hidden className="section-header-bar__highlight" />
        <div
          aria-hidden
          className="absolute inset-y-3 left-0 w-1 rounded-r-full opacity-90"
          style={{ backgroundColor: color.main }}
        />
        <div className="relative flex w-full items-center gap-2.5 px-3.5 py-3 sm:gap-3.5 sm:px-5 sm:py-3.5">
          <Link
            to={backTo}
            className="inline-flex max-w-[38%] shrink-0 items-center gap-1.5 truncate rounded-full bg-white px-2.5 py-1 text-[11px] font-bold shadow-sm transition hover:brightness-95 sm:max-w-none sm:px-3 sm:text-xs"
            style={{ color: color.ink }}
            title={backLabel}
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: color.main }}
              aria-hidden
            />
            {backLabel.replace(/^←\s*/, '')}
          </Link>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-extrabold tracking-tight text-white drop-shadow-sm sm:text-base lg:text-lg">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-0.5 hidden truncate text-[11px] text-white/75 sm:block sm:text-xs">
                {subtitle}
              </p>
            ) : null}
          </div>

          {aside ? <div className="shrink-0">{aside}</div> : null}
        </div>
      </div>
    );
  }

  const minH = tall ? 'min-h-[340px] sm:min-h-[380px]' : 'min-h-[280px] sm:min-h-[320px]';
  const heroImage = image ?? '';
  const heroAlt = imageAlt ?? title;

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5">
      <div className={`relative w-full ${minH}`}>
        <img src={heroImage} alt={heroAlt} className="catalog-photo absolute inset-0 h-full w-full object-cover" />
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
