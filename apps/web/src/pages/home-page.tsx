import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DealCard } from '../components/common/deal-card';
import { ScrollRail } from '../components/common/scroll-rail';
import { ServiceCard } from '../components/common/service-card';
import { HeroSection } from '../components/home/hero-section';
import { HomeOpenJobsSection } from '../components/home/home-open-jobs-section';
import { FamiliarPartnersSection, RebookSection } from '../components/home/retention-sections';
import { Icon } from '../components/ui/icon';
import type { IconName } from '../components/ui/icon';
import { PaymentPartnerBadges } from '../components/ui/payment-partner-badges';
import { useAuth } from '../features/auth/auth-context';
import {
  isCatalogServingStale,
  subscribeCatalogServingStale,
} from '../lib/catalog-cache';
import { catalogQueries } from '../lib/catalog-queries';
import { api } from '../services/api';
import { groupIcon } from '../utils/catalog-display';
import {
  rankFeaturedServices,
  signalsFromRebookHints,
} from '../utils/personalize-services';

const trustPoints: Array<{ icon: IconName; value: string; label: string }> = [
  { icon: 'users', value: '10.000+', label: 'Thợ chuyên nghiệp' },
  { icon: 'check', value: '98%', label: 'Khách hàng hài lòng' },
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
            className="flex min-w-[44px] flex-col items-center rounded-md bg-[var(--color-navy)] px-2.5 py-1.5 leading-none text-white"
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
    <div className="section-header-bar mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3.5 sm:px-5 sm:py-4">
      <h2 className="text-xl font-bold tracking-tight text-[var(--color-navy)] sm:text-2xl">
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
      className="group flex items-center gap-1 text-[15px] font-semibold text-[var(--color-brand)] transition hover:text-[var(--color-navy)]"
    >
      Xem tất cả
      <Icon
        name="chevronRight"
        className="h-4 w-4 transition group-hover:translate-x-0.5"
      />
    </Link>
  );
}

export function HomePage() {
  const { user } = useAuth();
  const groupsQuery = useQuery(catalogQueries.groupsAll);
  const servicesQuery = useQuery(catalogQueries.services);
  const rebookQuery = useQuery({
    queryKey: ['rebook-hints'],
    queryFn: api.getRebookHints,
    enabled: Boolean(user),
    staleTime: 60_000,
  });

  const [activeTab, setActiveTab] = useState('all');

  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data]);
  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);
  const tabs = useMemo(
    () => [
      { slug: 'all', name: 'Đề xuất cho bạn', icon: 'sparkles' as IconName },
      ...groups.map((group) => ({
        slug: group.slug,
        name: group.name,
        icon: groupIcon(group.slug),
      })),
    ],
    [groups],
  );
  const tabRailRef = useRef<HTMLDivElement>(null);

  const featuredServices = useMemo(() => {
    const limit = activeTab === 'all' ? 8 : 16;
    const signals = signalsFromRebookHints(rebookQuery.data ?? []);
    return rankFeaturedServices(services, activeTab, signals, limit);
  }, [services, activeTab, rebookQuery.data]);

  const servingStale = useSyncExternalStore(
    subscribeCatalogServingStale,
    isCatalogServingStale,
    () => false,
  );
  const apiDown = groupsQuery.isError || servicesQuery.isError;
  const hasCatalog = groups.length > 0 || services.length > 0;

  return (
    <div className="pb-4">
      <HeroSection />

      <RebookSection />
      <FamiliarPartnersSection />

      {(apiDown || servingStale) && (
        <div className="page-shell mt-4">
          <div className="section-container">
            <p className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {hasCatalog && !apiDown ? (
                <>
                  Đang hiển thị danh mục đã lưu trên máy. Chạy{' '}
                  <code className="font-semibold">npm run dev:api</code> để cập nhật dữ liệu mới.
                </>
              ) : (
                <>
                  Chưa kết nối được API. Chạy{' '}
                  <code className="font-semibold">npm run dev:api</code> để hiển thị dữ liệu dịch vụ.
                </>
              )}
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

      <HomeOpenJobsSection />

      <section className="page-shell mt-10">
        <div className="section-container">
          <SectionHeader title="Dịch vụ nổi bật" action={<ViewAllLink />} />

          <div className="relative mb-5">
            <div
              ref={tabRailRef}
              className="no-scrollbar flex gap-2.5 overflow-x-auto scroll-smooth pr-12 pb-0.5"
            >
              {tabs.map((tab) => {
                const active = activeTab === tab.slug;
                return (
                  <button
                    key={tab.slug}
                    type="button"
                    onClick={() => setActiveTab(tab.slug)}
                    className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-[14px] font-semibold transition ${
                      active
                        ? 'border-[var(--color-navy)] bg-[var(--color-navy)] text-white shadow-sm'
                        : 'border-[var(--color-line)] bg-[#eef2f5] text-[var(--color-ink)] hover:border-[var(--color-navy)]/25 hover:bg-white'
                    }`}
                  >
                    <Icon
                      name={tab.icon}
                      className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-[var(--color-navy)]'}`}
                    />
                    {tab.name}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-label="Cuộn danh mục tiếp"
              onClick={() =>
                tabRailRef.current?.scrollBy({ left: 240, behavior: 'smooth' })
              }
              className="absolute top-1/2 right-0 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-[var(--color-navy)] shadow-sm transition hover:bg-[var(--color-brand-soft)]"
            >
              <Icon name="chevronRight" className="h-4 w-4" />
            </button>
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
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-[14px] border border-[var(--color-line)] bg-white px-6 py-5 shadow-[var(--shadow-card)]">
            {trustPoints.map((point) => (
              <div key={point.label} className="flex items-center gap-3">
                <span className="icon-tile h-11 w-11">
                  <Icon name={point.icon} className="h-5 w-5" />
                </span>
                <span className="leading-snug">
                  <span className="block text-base font-bold text-[var(--color-navy)]">
                    {point.value}
                  </span>
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
