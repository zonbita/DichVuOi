import { CatalogMenu } from './catalog-menu';
import { HeroBanner } from './hero-banner';

/** Khối marketplace đầu trang — sidebar + banner. */
export function HeroSection() {
  return (
    <section className="page-shell min-w-0 overflow-x-clip pt-5 pb-1 lg:overflow-visible">
      <div className="section-container grid min-w-0 gap-4 overflow-x-clip lg:grid-cols-[360px_1fr] lg:gap-5 lg:overflow-visible">
        <div className="min-w-0 lg:contents">
          <CatalogMenu />
        </div>

        <div className="animate-fade-in relative z-0 min-w-0">
          <HeroBanner />
        </div>
      </div>
    </section>
  );
}

export { CatalogMenu as Sidebar };
export { HeroBanner };
