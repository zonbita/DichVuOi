import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAuth } from '../../features/auth/auth-context';
import { api } from '../../services/api';
import { ScrollRail } from '../common/scroll-rail';
import type { IconName } from '../ui/icon';
import { RetentionPartnerCard } from './retention-partner-card';
import { SectionHeaderBar, SectionHeaderViewAll } from './section-header-bar';

function SectionShell({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon?: IconName;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="page-shell mt-10">
      <div className="section-container min-w-0">
        <SectionHeaderBar title={title} icon={icon} action={action} />
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
      icon="rotateCcw"
      action={<SectionHeaderViewAll to="/don-cua-toi" label="Đơn của tôi" />}
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
    <SectionShell title="Người làm quen" icon="users">
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
            phoneVerified={item.phoneVerified}
            bankVerified={item.bankVerified}
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
