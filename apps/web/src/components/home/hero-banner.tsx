import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bannerDienNuoc from '../../assets/banner-dien-nuoc.jpg';
import bannerDonNha from '../../assets/banner-don-nha.jpg';
import bannerGiaSu from '../../assets/banner-gia-su.jpg';
import { Icon } from '../ui/icon';

const banners = [
  {
    image: bannerDonNha,
    tag: 'Dịch vụ yêu thích',
    title: 'Dọn nhà sạch sâu',
    subtitle: 'Thư giãn cuối tuần, việc nhà để bọn mình lo',
  },
  {
    image: bannerDienNuoc,
    tag: 'Thợ giỏi — giá tốt',
    title: 'Sửa điện nước nhanh',
    subtitle: 'Thợ có mặt trong 30 phút tại nội thành',
  },
  {
    image: bannerGiaSu,
    tag: 'Gia sư chất lượng',
    title: 'Gia sư IELTS 1 kèm 1',
    subtitle: 'Cam kết đầu ra, học thử miễn phí buổi đầu',
  },
];

const BANNER_GRADIENT =
  'linear-gradient(90deg, rgba(7,59,92,0.92) 0%, rgba(7,59,92,0.58) 48%, rgba(7,59,92,0.08) 100%)';

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
      <div className="relative aspect-[16/6.4] min-h-[248px] w-full">
        {banners.map((banner, index) => (
          <div
            key={banner.title}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === active ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <img
              src={banner.image}
              alt={banner.title}
              className="catalog-photo h-full w-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: BANNER_GRADIENT }} />
            <div className="absolute inset-0 z-[1] flex flex-col justify-center gap-3 py-7 pl-14 pr-14 text-white sm:py-9 sm:pl-16 sm:pr-16 lg:pl-[4.5rem] lg:pr-[4.5rem]">
              <span className="hero-banner__tag w-fit rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-white">
                {banner.tag}
              </span>
              <h2 className="max-w-[22rem] text-[28px] font-extrabold uppercase leading-[1.15] tracking-tight sm:text-[32px] lg:text-[34px]">
                {banner.title}
              </h2>
              <p className="max-w-[22rem] text-[15px] leading-relaxed text-white/88 sm:text-base">
                {banner.subtitle}
              </p>
              <div className="mt-1">
                <Link to="/nhom" className="hero-banner__cta inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-[15px] font-bold text-white">
                  Đặt ngay
                  <Icon name="chevronRight" className="h-4 w-4" />
                </Link>
              </div>
            </div>
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
            key={banner.title}
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
