import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bannerHangNgan from '../../assets/banner-hang-ngan-dich-vu.webp';
import bannerUyTin from '../../assets/banner-uy-tin-dam-bao.webp';
import type { IconName } from '../ui/icon';
import { Icon } from '../ui/icon';

type ComposeSlide = {
  kind?: 'compose';
  tag: string;
  title: string;
  subtitle: string;
  focus: IconName;
  icons: IconName[];
  accent: string;
};

type ImageSlide = {
  kind: 'image';
  /** Ảnh đã vẽ sẵn (slogan + art). */
  src: string;
  alt: string;
  href: string;
  ctaLabel: string;
};

type BannerSlide = ComposeSlide | ImageSlide;

const banners: BannerSlide[] = [
  {
    kind: 'image',
    src: bannerHangNgan,
    alt: 'Hàng ngàn dịch vụ • Đặt lịch nhanh • Thanh toán an toàn',
    href: '/nhom',
    ctaLabel: 'Khám phá ngay',
  },
  {
    kind: 'image',
    src: bannerUyTin,
    alt: 'Uy tín · Đảm bảo · Ngăn lừa đảo — Cọc giữ trên sàn, chat trong app, không lộ SĐT sớm',
    href: '/nhom',
    ctaLabel: 'Thuê ngay',
  },
  {
    tag: 'Dịch vụ yêu thích',
    title: 'Dọn nhà sạch sâu',
    subtitle: 'Thư giãn cuối tuần, việc nhà để bọn mình lo',
    focus: 'home',
    icons: ['home', 'sparkles', 'utensils', 'leaf', 'paw'],
    accent: '#009c95',
  },
  {
    tag: 'Thợ giỏi — giá tốt',
    title: 'Sửa điện nước nhanh',
    subtitle: 'Thợ có mặt trong 30 phút tại nội thành',
    focus: 'wrench',
    icons: ['wrench', 'snowflake', 'hammer', 'truck', 'settings'],
    accent: '#0b6e99',
  },
  {
    tag: 'Gia sư chất lượng',
    title: 'Gia sư IELTS 1 kèm 1',
    subtitle: 'Cam kết đầu ra, học thử miễn phí buổi đầu',
    focus: 'graduation',
    icons: ['graduation', 'book', 'code', 'palette', 'laptop'],
    accent: '#007a74',
  },
];

/** Vị trí trang trí icon bên phải banner (desktop). */
const ICON_LAYOUT: Array<{ top: string; left: string; size: string; opacity: number }> = [
  { top: '8%', left: '8%', size: '3.25rem', opacity: 0.95 },
  { top: '12%', left: '52%', size: '2.5rem', opacity: 0.75 },
  { top: '38%', left: '28%', size: '4.5rem', opacity: 1 },
  { top: '42%', left: '68%', size: '2.75rem', opacity: 0.8 },
  { top: '68%', left: '12%', size: '2.35rem', opacity: 0.7 },
  { top: '72%', left: '48%', size: '3rem', opacity: 0.88 },
];

function ProfessionArt({ slide }: { slide: ComposeSlide }) {
  const tiles = [slide.focus, ...slide.icons].slice(0, ICON_LAYOUT.length);

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] md:block lg:w-[52%]" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 70% at 55% 45%, ${slide.accent}55 0%, transparent 70%)`,
        }}
      />
      <div className="absolute left-[18%] top-[18%] h-40 w-40 rounded-full border border-white/15" />
      <div className="absolute bottom-[12%] right-[10%] h-28 w-28 rounded-full border border-white/10" />
      <div className="absolute right-[22%] top-[8%] h-16 w-16 rounded-full bg-white/10" />

      {tiles.map((name, index) => {
        const spot = ICON_LAYOUT[index] ?? ICON_LAYOUT[0];
        const isFocus = index === 2;
        return (
          <div
            key={`${slide.title}-${name}-${index}`}
            className="hero-banner__tile absolute flex items-center justify-center text-white"
            style={{
              top: spot.top,
              left: spot.left,
              width: isFocus ? '4.75rem' : spot.size,
              height: isFocus ? '4.75rem' : spot.size,
              opacity: spot.opacity,
              color: '#fff',
            }}
          >
            <Icon
              name={name}
              className={`drop-shadow-[0_2px_4px_rgba(5,45,71,0.35)] ${isFocus ? 'h-9 w-9' : 'h-6 w-6'}`}
              style={{ color: 'inherit' }}
            />
          </div>
        );
      })}
    </div>
  );
}

function slideKey(banner: BannerSlide, index: number) {
  return banner.kind === 'image' ? `image-${index}` : banner.title;
}

export function HeroBanner() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % banners.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  function move(step: number) {
    setActive((current) => (current + step + banners.length) % banners.length);
  }

  return (
    <div className="hero-banner relative overflow-hidden bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-20 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),transparent_70%)]"
      />
      <div className="relative h-[220px] w-full sm:h-[340px] md:h-[420px] lg:h-[500px]">
        {banners.map((banner, index) => (
          <div
            key={slideKey(banner, index)}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === active ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            {banner.kind === 'image' ? (
              <>
                <img
                  src={banner.src}
                  alt={banner.alt}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  draggable={false}
                  decoding="async"
                  fetchPriority={index === 0 ? 'high' : 'low'}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
                {/* Hit-area CTA — nút trên ảnh chỉ là art */}
                <Link
                  to={banner.href}
                  className="absolute bottom-[14%] left-[6%] z-[1] inline-flex min-h-[44px] min-w-[6.5rem] items-center justify-center rounded-full px-5 py-2.5 text-[15px] font-bold text-transparent sm:bottom-[16%] sm:left-[9%] sm:min-w-[7.5rem] sm:px-6 sm:py-3"
                  aria-label={banner.ctaLabel}
                >
                  {banner.ctaLabel}
                </Link>
              </>
            ) : (
              <>
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(ellipse 130% 160% at 18% -30%, #0a5678 0%, #073b5c 38%, ${banner.accent} 72%, #041f32 100%)`,
                  }}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_55%)]"
                />
                <div
                  className="absolute inset-0 opacity-35"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.14) 0 1px, transparent 1px), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.1) 0 1px, transparent 1px)',
                    backgroundSize: '28px 28px, 36px 36px',
                  }}
                />
                <ProfessionArt slide={banner} />

                <div className="absolute inset-0 z-[1] flex flex-col justify-center gap-2 px-5 py-5 text-white sm:gap-3 sm:px-10 sm:py-9 md:pl-16 md:pr-16 lg:pl-[4.5rem] lg:pr-[4.5rem]">
                  <span className="hero-banner__tag w-fit rounded-full px-3 py-1 text-[12px] font-semibold text-white sm:px-3.5 sm:py-1.5 sm:text-[13px]">
                    {banner.tag}
                  </span>
                  <h2 className="max-w-[28rem] text-[22px] font-extrabold uppercase leading-[1.15] tracking-tight drop-shadow-sm sm:text-[30px] lg:text-[32px]">
                    {banner.title}
                  </h2>
                  <p className="max-w-[28rem] text-sm leading-relaxed text-white/90 sm:text-base">
                    {banner.subtitle}
                  </p>
                  <div className="mt-0.5 sm:mt-1">
                    <Link
                      to="/nhom"
                      className="hero-banner__cta inline-flex items-center gap-1.5 rounded-[14px] px-5 py-2.5 text-sm font-bold text-white sm:px-6 sm:py-3 sm:text-[15px]"
                    >
                      Đặt ngay
                      <Icon name="chevronRight" className="h-4 w-4 drop-shadow-sm" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => move(-1)}
        aria-label="Banner trước"
        className="hero-banner__nav absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[var(--color-muted)] transition hover:brightness-105 sm:left-3 sm:h-10 sm:w-10"
      >
        <Icon name="chevronLeft" className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => move(1)}
        aria-label="Banner kế tiếp"
        className="hero-banner__nav absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[var(--color-muted)] transition hover:brightness-105 sm:right-3 sm:h-10 sm:w-10"
      >
        <Icon name="chevronRight" className="h-5 w-5" />
      </button>

      <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2 sm:bottom-4">
        {banners.map((banner, index) => (
          <button
            key={slideKey(banner, index)}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Xem banner ${index + 1}`}
            className={`h-2 rounded-full transition-all duration-[180ms] ease-in-out ${
              index === active
                ? 'w-6 bg-[var(--color-brand)] shadow-[0_2px_8px_rgba(0,156,149,0.45)]'
                : 'w-2 bg-white/70 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
