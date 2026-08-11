import { lazy, Suspense } from 'react';
import { DeferredMount } from '../components/home/deferred-mount';
import { HomeActivityTicker } from '../components/home/home-activity-ticker';
import { HomeLobbySection } from '../components/home/home-lobby-section';

const HomeBelowFold = lazy(() =>
  import('../components/home/home-below-fold').then((m) => ({
    default: m.HomeBelowFold,
  })),
);

export function HomePage() {
  return (
    <div className="min-w-0 overflow-x-clip pb-4">
      <HomeActivityTicker />
      <HomeLobbySection />
      <DeferredMount minHeight={640} rootMargin="280px">
        <Suspense fallback={<div className="min-h-[640px]" aria-hidden />}>
          <HomeBelowFold />
        </Suspense>
      </DeferredMount>
    </div>
  );
}
