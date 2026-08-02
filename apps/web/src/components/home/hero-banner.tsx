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
            className="absolute flex items-center justify-center rounded-[22%] border border-white/25 bg-white/15 text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-[6px]"
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
              className={isFocus ? 'h-9 w-9' : 'h-6 w-6'}
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
    <div className="relative overflow-hidden rounded-[16px] border border-[var(--color-line)] bg-white shadow-[var(--shadow-card)]">
      <div className="relative h-[500px] w-full">
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
                  className="absolute bottom-[18%] left-[8%] z-[1] inline-flex min-h-[44px] min-w-[7.5rem] items-center justify-center rounded-full px-6 py-3 text-[15px] font-bold text-transparent sm:left-[9%] sm:bottom-[16%]"
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
                    background: `linear-gradient(115deg, #073b5c 0%, #0a4f6e 42%, ${banner.accent} 78%, #1a6b78 100%)`,
                  }}
                />
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.14) 0 1px, transparent 1px), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.1) 0 1px, transparent 1px)',
                    backgroundSize: '28px 28px, 36px 36px',
                  }}
                />
                <ProfessionArt slide={banner} />

                <div className="absolute inset-0 z-[1] flex flex-col justify-center gap-3 py-7 pl-14 pr-14 text-white sm:py-9 sm:pl-16 sm:pr-16 lg:pl-[4.5rem] lg:pr-[4.5rem]">
                  <span className="hero-banner__tag w-fit rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-white">
                    {banner.tag}
                  </span>
                  <h2 className="max-w-[28rem] text-[26px] font-extrabold uppercase leading-[1.15] tracking-tight sm:text-[30px] lg:text-[32px]">
                    {banner.title}
                  </h2>
                  <p className="max-w-[28rem] text-[15px] leading-relaxed text-white/88 sm:text-base">
                    {banner.subtitle}
                  </p>
                  <div className="mt-1">
                    <Link
                      to="/nhom"
                      className="hero-banner__cta inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-[15px] font-bold text-white"
                    >
                      Đặt ngay
                      <Icon name="chevronRight" className="h-4 w-4" />
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
        className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-white/95 text-[var(--color-muted)] shadow-md transition hover:bg-white"
      >
        <Icon name="chevronLeft" className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => move(1)}
        aria-label="Banner kế tiếp"
        className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-white/95 text-[var(--color-muted)] shadow-md transition hover:bg-white"
      >
        <Icon name="chevronRight" className="h-5 w-5" />
      </button>

      <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2">
        {banners.map((banner, index) => (
          <button
            key={slideKey(banner, index)}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Xem banner ${index + 1}`}
            className={`h-2 rounded-full transition-all duration-[180ms] ease-in-out ${
              index === active
                ? 'w-6 bg-[var(--color-brand)]'
                : 'w-2 bg-white/70 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
