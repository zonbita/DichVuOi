import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ServiceCard } from '../components/common/service-card';
import { HomeActivityTicker } from '../components/home/home-activity-ticker';
import { HomeHotJobsSection } from '../components/home/home-hot-jobs-section';
import { HomeLobbySection } from '../components/home/home-lobby-section';
import { HomeOpenJobsSection } from '../components/home/home-open-jobs-section';
import { HomeServicePostsSection } from '../components/home/home-service-posts-section';
import {
  HomeFeaturedReviewsSection,
  HomeRecentCompletedSection,
} from '../components/home/home-social-proof-section';
import { FamiliarPartnersSection, RebookSection } from '../components/home/retention-sections';
import {
  SectionHeaderBar,
  SectionHeaderViewAll,
} from '../components/home/section-header-bar';
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
    const limit = 4;
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
    <div className="min-w-0 overflow-x-clip pb-4">
      <HomeActivityTicker />
      <HomeLobbySection />
      <HomeServicePostsSection />

      <RebookSection />
      <HomeOpenJobsSection />
      <HomeRecentCompletedSection />
      <FamiliarPartnersSection />
      <HomeFeaturedReviewsSection />

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

      <HomeHotJobsSection />

      <section className="page-shell mt-10">
        <div className="section-container min-w-0">
          <SectionHeaderBar
            icon="star"
            title="Dịch vụ nổi bật"
            action={<SectionHeaderViewAll to="/nhom" />}
          />

          <div className="relative mb-5 min-w-0 max-w-full overflow-hidden">
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
        <div className="section-container min-w-0">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-[14px] border border-[var(--color-line)] bg-white px-4 py-5 shadow-[var(--shadow-card)] sm:px-6">
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
            <PaymentPartnerBadges className="w-full basis-full sm:ml-auto sm:w-auto sm:basis-auto" />
          </div>
        </div>
      </section>
    </div>
  );
}
