import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bannerDienNuoc from '../../assets/banner-dien-nuoc.jpg';
import bannerDonNha from '../../assets/banner-don-nha.jpg';
import bannerGiaSu from '../../assets/banner-gia-su.jpg';
import { api } from '../../services/api';
import { groupColor } from '../../utils/catalog-colors';
import { Icon } from '../ui/icon';
import type { IconName } from '../ui/icon';
import { CatalogMenu } from './catalog-menu';

const banners = [
  {
    image: bannerDonNha,
    tag: 'Dịch vụ yêu thích',
    title: 'Dọn nhà sạch sâu',
    subtitle: 'Thư giãn cuối tuần, việc nhà để bọn mình lo',
    discount: '20%',
    tone: 'from-[#0b5f52]/88',
  },
  {
    image: bannerDienNuoc,
    tag: 'Thợ giỏi — giá tốt',
    title: 'Sửa điện nước nhanh',
    subtitle: 'Thợ có mặt trong 30 phút tại nội thành',
    discount: '15%',
    tone: 'from-[#123a63]/88',
  },
  {
    image: bannerGiaSu,
    tag: 'Gia sư chất lượng',
    title: 'Gia sư IELTS 1 kèm 1',
    subtitle: 'Cam kết đầu ra, học thử miễn phí buổi đầu',
    discount: '20%',
    tone: 'from-[#7a4a12]/88',
  },
];

const perks: Array<{ icon: IconName; title: string; body: string }> = [
  { icon: 'percent', title: 'Ưu đãi thành viên', body: 'Giảm thêm đến 10%' },
  { icon: 'calendar', title: 'Đặt lịch dễ dàng', body: 'Chọn giờ phù hợp' },
  { icon: 'shield', title: 'Thợ giỏi — uy tín', body: 'Hồ sơ & cấp độ rõ ràng' },
  { icon: 'check', title: 'An tâm bảo hành', body: 'Hỗ trợ sau dịch vụ' },
  { icon: 'card', title: 'Thanh toán tiện lợi', body: 'Tiền mặt hoặc online' },
];

const fallbackServices = [
  { slug: 'don-nha-theo-ca', name: 'Dọn nhà theo ca', group: 'nha-cua' },
  { slug: 'sua-dien-nuoc', name: 'Sửa điện nước', group: 'sua-chua' },
  { slug: 'lap-camera', name: 'Lắp camera', group: 'sua-chua' },
  { slug: 'gia-su-tai-nha', name: 'Gia sư tại nhà', group: 'hoc-tap' },
  { slug: 'cham-soc-nguoi-gia', name: 'Chăm sóc người già', group: 'cham-soc' },
  { slug: 'makeup-tai-nha', name: 'Makeup tại nhà', group: 'lam-dep' },
  { slug: 'coaching-game', name: 'Coaching game', group: 'game' },
];

function BannerCarousel() {
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
    <div className="relative overflow-hidden bg-white shadow-sm">
      <div className="relative aspect-[16/6.5] min-h-[260px] w-full">
        {banners.map((banner, index) => (
          <div
            key={banner.title}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === active ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-r ${banner.tone} via-black/40 to-transparent`} />
            <div className="absolute inset-0 flex flex-col justify-center gap-3 p-7 text-white sm:p-10">
              <span className="w-fit bg-white/20 px-3.5 py-1.5 text-sm font-medium backdrop-blur-sm">
                {banner.tag}
              </span>
              <h2 className="max-w-md text-3xl font-extrabold uppercase leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.6rem]">
                {banner.title}
              </h2>
              <p className="max-w-md text-base text-white/90 sm:text-lg">{banner.subtitle}</p>
              <div className="mt-1 flex items-center gap-3">
                <span className="bg-white px-3.5 py-2.5 text-center leading-tight text-[var(--color-ink)] shadow-sm">
                  <span className="block text-xs font-medium">Giảm đến</span>
                  <span className="block text-xl font-extrabold text-[var(--color-sale)]">
                    {banner.discount}
                  </span>
                </span>
                <Link
                  to="/nhom"
                  className="bg-[var(--color-brand)] px-6 py-3 text-base font-bold text-white transition hover:bg-[var(--color-brand-deep)]"
                >
                  Đặt ngay
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
        className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center bg-white/85 text-[var(--color-ink)] shadow transition hover:bg-white sm:flex"
      >
        <Icon name="chevronLeft" className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => move(1)}
        aria-label="Banner kế tiếp"
        className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center bg-white/85 text-[var(--color-ink)] shadow transition hover:bg-white sm:flex"
      >
        <Icon name="chevronRight" className="h-5 w-5" />
      </button>

      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {banners.map((banner, index) => (
          <button
            key={banner.title}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Xem banner ${index + 1}`}
            className={`h-2 transition-all ${
              index === active ? 'w-6 bg-white' : 'w-2 bg-white/55'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/** Chip nghề chạy ngang — đặt dưới vùng perks trên trang chủ. */
function ServiceMarquee() {
  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: () => api.getServices(),
  });

  const navItems = servicesQuery.data?.length
    ? servicesQuery.data.map((service) => ({
        slug: service.slug,
        name: service.name,
        group: service.category.group.slug,
      }))
    : fallbackServices;

  return (
    <nav
      className="mt-4 overflow-hidden border border-[var(--color-line)] bg-white shadow-[0_1px_0_rgba(18,32,46,0.04)]"
      aria-label="Dịch vụ nổi bật"
    >
      <div className="marquee py-2.5">
        <div className="marquee__track gap-2 px-4">
          {[...navItems, ...navItems].map((item, index) => {
            const color = groupColor(item.group);
            return (
              <Link
                key={`${item.slug}-${index}`}
                to={`/dich-vu/${item.slug}`}
                aria-hidden={index >= navItems.length}
                tabIndex={index >= navItems.length ? -1 : undefined}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition hover:brightness-95"
                style={{ backgroundColor: color.soft, color: color.ink }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: color.main }}
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function HeroSection() {
  return (
    <section className="page-shell pt-5">
      <div className="section-container grid gap-4 overflow-visible lg:grid-cols-[260px_1fr]">
        <CatalogMenu />

        <div className="animate-fade-in min-w-0">
          <BannerCarousel />

          <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
            {perks.map((perk) => (
              <div
                key={perk.title}
                className="flex min-w-[210px] flex-1 items-center gap-3 bg-white px-4 py-3.5 shadow-sm"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]">
                  <Icon name={perk.icon} className="h-5 w-5" />
                </span>
                <span className="leading-snug">
                  <span className="block text-[15px] font-bold">{perk.title}</span>
                  <span className="mt-0.5 block text-sm text-[var(--color-muted)]">{perk.body}</span>
                </span>
              </div>
            ))}
          </div>

          <ServiceMarquee />
        </div>
      </div>
    </section>
  );
}
