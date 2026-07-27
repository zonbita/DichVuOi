import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context';
import { api } from '../../services/api';
import { ScrollRail } from '../common/scroll-rail';
import { Icon } from '../ui/icon';
import { RetentionPartnerCard } from './retention-partner-card';

function SectionShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="page-shell mt-10">
      <div className="section-container">
        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 border border-[var(--color-line)] bg-white px-4 py-3.5 shadow-[0_1px_0_rgba(18,32,46,0.04)] sm:px-5 sm:py-4">
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-2xl">
            {title}
          </h2>
          {action ? <div className="ml-auto">{action}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export function RebookSection() {
  const { user } = useAuth();
  const hintsQuery = useQuery({
    queryKey: ['rebook-hints'],
    queryFn: api.getRebookHints,
    enabled: Boolean(user),
    staleTime: 60_000,
  });

  const hints = hintsQuery.data ?? [];
  if (!user || hints.length === 0) return null;

  return (
    <SectionShell
      title="Thuê lại nhanh"
      action={
        <Link
          to="/don-cua-toi"
          className="group flex items-center gap-1 text-[15px] font-bold text-[var(--color-brand-deep)] transition hover:text-[var(--color-brand)]"
        >
          Đơn của tôi
          <Icon name="chevronRight" className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      }
    >
      <ScrollRail>
        {hints.map((hint) => (
          <RetentionPartnerCard
            key={`${hint.partnerUserId}:${hint.serviceSlug}`}
            partnerUserId={hint.partnerUserId}
            fullName={hint.partnerName}
            avatarUrl={hint.partnerAvatarUrl}
            serviceSlug={hint.serviceSlug}
            serviceName={hint.serviceName}
            price={hint.lastPrice}
            ratingAvg={undefined}
            badge={
              hint.bookingCount > 1
                ? `Đã thuê ${hint.bookingCount} lần · ${new Date(hint.lastBookedAt).toLocaleDateString('vi-VN')}`
                : `Lần trước ${new Date(hint.lastBookedAt).toLocaleDateString('vi-VN')}`
            }
            ctaLabel="Thuê lại"
          />
        ))}
      </ScrollRail>
    </SectionShell>
  );
}

export function FamiliarPartnersSection() {
  const { user } = useAuth();
  const favoritesQuery = useQuery({
    queryKey: ['partner-favorites', 'list'],
    queryFn: api.getFavoritePartners,
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  const favorites = favoritesQuery.data ?? [];
  if (!user || favorites.length === 0) return null;

  return (
    <SectionShell title="Người làm quen">
      <ScrollRail>
        {favorites.map((item) => (
          <RetentionPartnerCard
            key={item.partnerUserId}
            partnerUserId={item.partnerUserId}
            fullName={item.fullName}
            avatarUrl={item.avatarUrl}
            subtitle={item.headline}
            ratingAvg={item.ratingAvg}
            level={item.level}
            isVerified={item.isVerified}
            serviceSlug={item.topOffering?.serviceSlug}
            serviceName={item.topOffering?.serviceName}
            price={item.topOffering?.price}
            unit={item.topOffering?.unit}
            badge={item.acceptingJobs ? 'Đang nhận việc' : 'Tạm nghỉ'}
            ctaLabel={item.topOffering ? 'Thuê nghề này' : 'Xem hồ sơ'}
          />
        ))}
      </ScrollRail>
    </SectionShell>
  );
}
