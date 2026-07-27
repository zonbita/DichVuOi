import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { groupIcon } from '../../utils/catalog-display';
import { groupColor } from '../../utils/catalog-colors';
import { Icon } from '../ui/icon';

const fallbackServices = [
  { slug: 'don-nha-theo-ca', name: 'Dọn nhà theo ca', groupSlug: 'nha-cua', icon: 'home' as const },
  { slug: 'sua-dien-nuoc', name: 'Sửa điện nước', groupSlug: 'sua-chua', icon: 'wrench' as const },
  { slug: 'gia-su-tai-nha', name: 'Gia sư tại nhà', groupSlug: 'hoc-tap', icon: 'book' as const },
  { slug: 'makeup-tai-nha', name: 'Makeup tại nhà', groupSlug: 'lam-dep', icon: 'beauty' as const },
  { slug: 'coaching-game', name: 'Coaching game', groupSlug: 'game', icon: 'game' as const },
];

function ServiceTag({
  item,
  duplicate = false,
}: {
  item: {
    slug: string;
    name: string;
    groupSlug: string;
    icon: ReturnType<typeof groupIcon>;
  };
  duplicate?: boolean;
}) {
  const iconColor = groupColor(item.groupSlug).main;

  return (
    <Link
      to={`/dich-vu/${item.slug}`}
      aria-hidden={duplicate}
      tabIndex={duplicate ? -1 : undefined}
      className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-brand-soft)] px-4 py-2 text-[14px] font-medium text-[var(--color-navy)] transition hover:border-[var(--color-brand)]/35 hover:shadow-sm"
    >
      <Icon name={item.icon} className="h-4 w-4 shrink-0" style={{ color: iconColor }} />
      {item.name}
    </Link>
  );
}

export function ServiceTagNav() {
  const [paused, setPaused] = useState(false);
  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: () => api.getServices(),
  });

  const navItems = servicesQuery.data?.length
    ? servicesQuery.data.map((service) => ({
        slug: service.slug,
        name: service.name,
        groupSlug: service.category.group.slug,
        icon: groupIcon(service.category.group.slug),
      }))
    : fallbackServices;

  const loopItems = [...navItems, ...navItems];

  return (
    <nav
      className="relative mt-4 overflow-hidden rounded-full border border-[var(--color-line)] bg-white py-1 shadow-[var(--shadow-card)]"
      aria-label="Dịch vụ nổi bật"
    >
      <div className={`marquee py-2.5 pr-12 ${paused ? 'marquee--paused' : ''}`}>
        <div className="marquee__track gap-3 px-4">
          {loopItems.map((item, index) => (
            <ServiceTag
              key={`${item.slug}-${index}`}
              item={item}
              duplicate={index >= navItems.length}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label={paused ? 'Tiếp tục cuộn' : 'Tạm dừng cuộn'}
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
        className="absolute top-1/2 right-2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-[var(--color-navy)] shadow-sm transition hover:bg-[var(--color-brand-soft)]"
      >
        <Icon name="chevronRight" className="h-4 w-4" />
      </button>
    </nav>
  );
}
