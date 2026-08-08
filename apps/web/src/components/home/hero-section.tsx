import { BenefitCard } from './benefit-card';
import { CatalogMenu } from './catalog-menu';
import { HeroBanner } from './hero-banner';
import { ServiceTagNav } from './service-tag-nav';
import type { IconName } from '../ui/icon';

const perks: Array<{ icon: IconName; title: string; body: string }> = [
  { icon: 'users', title: 'Thuê lại thợ quen', body: 'Lưu người làm yêu thích' },
  { icon: 'calendar', title: 'Đặt lịch dễ dàng', body: 'Chọn giờ phù hợp' },
  { icon: 'shield', title: 'Thợ giỏi — uy tín', body: 'Hồ sơ & cấp độ rõ ràng' },
  { icon: 'headset', title: 'An tâm bảo hành', body: 'Hỗ trợ sau dịch vụ' },
];

/** Khối marketplace đầu trang — sidebar + banner + benefit + tag nav. */
export function HeroSection() {
  return (
    <section className="page-shell min-w-0 overflow-x-clip pt-5 pb-1 lg:overflow-visible">
      <div className="section-container grid min-w-0 gap-4 overflow-x-clip lg:grid-cols-[360px_1fr] lg:gap-5 lg:overflow-visible">
        <div className="min-w-0 lg:contents">
          <CatalogMenu />
        </div>

        <div className="animate-fade-in relative z-0 min-w-0">
          <HeroBanner />

          <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-4">
            {perks.map((perk) => (
              <BenefitCard key={perk.title} {...perk} />
            ))}
          </div>

          <ServiceTagNav />
        </div>
      </div>
    </section>
  );
}

export { CatalogMenu as Sidebar };
export { HeroBanner, BenefitCard };
