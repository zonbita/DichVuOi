import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DealCard } from '../components/common/deal-card';
import { GroupTile } from '../components/common/group-card';
import { ScrollRail } from '../components/common/scroll-rail';
import { ServiceCard } from '../components/common/service-card';
import { HeroSection } from '../components/home/hero-section';
import { Icon } from '../components/ui/icon';
import type { IconName } from '../components/ui/icon';
import { PaymentPartnerBadges } from '../components/ui/payment-partner-badges';
import { api } from '../services/api';
import { groupColor } from '../utils/catalog-colors';

const trustPoints: Array<{ icon: IconName; value: string; label: string }> = [
  { icon: 'users', value: '10.000+', label: 'Thợ chuyên nghiệp' },
  { icon: 'check', value: '98%', label: 'Khách hàng hài lòng' },
  { icon: 'shield', value: 'Bảo hiểm', label: 'An tâm khi đặt' },
  { icon: 'headset', value: 'Hỗ trợ 24/7', label: 'Tư vấn tận tình' },
];

function msUntilEndOfDay() {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime() - now.getTime();
}

function CountdownBadge() {
  const [remaining, setRemaining] = useState(msUntilEndOfDay);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(msUntilEndOfDay()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const totalSeconds = Math.max(0, Math.floor(remaining / 1000));
  const parts = [
    { value: Math.floor(totalSeconds / 3600), label: 'Giờ' },
    { value: Math.floor((totalSeconds % 3600) / 60), label: 'Phút' },
    { value: totalSeconds % 60, label: 'Giây' },
  ];

  return (
    <span className="flex flex-wrap items-center gap-2.5 text-sm text-[var(--color-muted)]">
      <span className="font-medium">Kết thúc sau</span>
      <span className="flex gap-1.5">
        {parts.map((part) => (
          <span
            key={part.label}
            className="flex min-w-[44px] flex-col items-center bg-[var(--color-ink)] px-2.5 py-1.5 leading-none text-white"
          >
            <span className="text-base font-extrabold tabular-nums tracking-wide">
              {String(part.value).padStart(2, '0')}
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/65">
              {part.label}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}

function SectionHeader({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 border border-[var(--color-line)] bg-white px-4 py-3.5 shadow-[0_1px_0_rgba(18,32,46,0.04)] sm:px-5 sm:py-4">
      <h2 className="text-xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-2xl">
        {title}
      </h2>
      {children}
      {action ? (
        <div className="ml-auto flex shrink-0 items-center gap-3">{action}</div>
      ) : null}
    </div>
  );
}

function ViewAllLink({ to = '/nhom' }: { to?: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-1 text-[15px] font-bold text-[var(--color-brand-deep)] transition hover:text-[var(--color-brand)]"
    >
      Xem tất cả
      <Icon
        name="chevronRight"
        className="h-4 w-4 transition group-hover:translate-x-0.5"
      />
    </Link>
  );
}

function shuffleList<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j]!;
    arr[j] = tmp!;
  }
  return arr;
}

export function HomePage() {
  const groupsQuery = useQuery({
    queryKey: ['groups', 'all'],
    queryFn: () => api.getGroups(false),
  });
  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: () => api.getServices(),
  });

  const [activeTab, setActiveTab] = useState('all');

  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data]);
  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);
  const tabs = useMemo(
    () => [
      { slug: 'all', name: 'Đề xuất cho bạn' },
      ...groups.map((group) => ({
        slug: group.slug,
        name: group.name,
      })),
    ],
    [groups],
  );

  const featuredServices = useMemo(() => {
    const pool =
      activeTab === 'all'
        ? services
        : services.filter((service) => service.category.group.slug === activeTab);
    const limit = activeTab === 'all' ? 8 : 16;
    return shuffleList(pool).slice(0, limit);
  }, [services, activeTab]);

  const apiDown = groupsQuery.isError || servicesQuery.isError;

  return (
    <div className="pb-4">
      <HeroSection />

      {apiDown && (
        <div className="page-shell mt-4">
          <div className="section-container">
            <p className=" border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Chưa kết nối được API. Chạy <code className="font-semibold">npm run dev:api</code> để
              hiển thị dữ liệu dịch vụ.
            </p>
          </div>
        </div>
      )}

      <section className="page-shell mt-10">
        <div className="section-container">
          <SectionHeader title="Deal dịch vụ hôm nay" action={<ViewAllLink />}>
            <CountdownBadge />
          </SectionHeader>
          {servicesQuery.isLoading ? (
            <p className="text-base text-[var(--color-muted)]">Đang tải dịch vụ...</p>
          ) : (
            <ScrollRail>
              {services.slice(0, 8).map((service) => (
                <DealCard key={service.id} service={service} />
              ))}
            </ScrollRail>
          )}
        </div>
      </section>

      <section className="page-shell mt-10">
        <div className="section-container">
          <SectionHeader
            title="Tất cả ngành nghề"
            action={<ViewAllLink />}
          />
          {groupsQuery.isLoading ? (
            <p className="text-base text-[var(--color-muted)]">Đang tải ngành nghề...</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {groups.map((group) => (
                <GroupTile key={group.id} group={group} />
              ))}
            </div>
          )}
          {!groupsQuery.isLoading && groups.length === 0 ? (
            <p className="text-base text-[var(--color-muted)]">Chưa có nhóm dịch vụ.</p>
          ) : null}
        </div>
      </section>

      <section className="page-shell mt-10">
        <div className="section-container">
          <SectionHeader title="Dịch vụ nổi bật" action={<ViewAllLink />} />

          <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-0.5">
            {tabs.map((tab) => {
              const color =
                tab.slug === 'all'
                  ? groupColor('nha-cua')
                  : groupColor(tab.slug);
              const active = activeTab === tab.slug;
              return (
                <button
                  key={tab.slug}
                  type="button"
                  onClick={() => setActiveTab(tab.slug)}
                  className="shrink-0 whitespace-nowrap px-4 py-2 text-[14px] font-bold transition"
                  style={
                    active
                      ? {
                          backgroundColor: color.main,
                          color: '#fff',
                          boxShadow: `0 2px 8px ${color.main}40`,
                        }
                      : {
                          backgroundColor: color.soft,
                          color: color.ink,
                        }
                  }
                >
                  {tab.name}
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
          {!servicesQuery.isLoading && featuredServices.length === 0 && (
            <p className="text-base text-[var(--color-muted)]">Nhóm này chưa có dịch vụ.</p>
          )}
        </div>
      </section>

      <section className="page-shell mt-10">
        <div className="section-container">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 bg-white px-6 py-5 shadow-sm">
            {trustPoints.map((point) => (
              <div key={point.label} className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]">
                  <Icon name={point.icon} className="h-5 w-5" />
                </span>
                <span className="leading-snug">
                  <span className="block text-base font-extrabold">{point.value}</span>
                  <span className="block text-sm text-[var(--color-muted)]">{point.label}</span>
                </span>
              </div>
            ))}
            <PaymentPartnerBadges className="ml-auto" />
          </div>
        </div>
      </section>
    </div>
  );
}
