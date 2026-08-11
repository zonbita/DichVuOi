import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HireServiceForm } from '../components/booking/hire-service-form';
import { HireWalletGate } from '../components/booking/hire-wallet-gate';
import type { CatalogServicePick } from '../components/home/catalog-menu-shared';
import { useAuth } from '../features/auth/auth-context';
import { HIRE_PAGE_MIN_WALLET_VND } from '../features/booking/hire-wallet-gate';
import { catalogQueries } from '../lib/catalog-queries';
import { api } from '../services/api';

export function HireServicePage() {
  const [searchParams] = useSearchParams();
  const preselectSlug = (searchParams.get('dich-vu') ?? '').trim();
  const { user, loading: authLoading, refreshMe } = useAuth();

  const treeQuery = useQuery(catalogQueries.groupsTree);
  const walletQuery = useQuery({
    queryKey: ['wallet', 'summary'],
    queryFn: () => api.getWallet(),
    enabled: Boolean(user),
    staleTime: 15_000,
  });

  const groups = treeQuery.data ?? [];
  const [selected, setSelected] = useState<CatalogServicePick | null>(null);

  const preselectPick = useMemo(() => {
    if (!preselectSlug || groups.length === 0) return null;
    for (const group of groups) {
      for (const category of group.categories ?? []) {
        const service = category.services.find((item) => item.slug === preselectSlug);
        if (service) {
          return {
            id: service.id,
            slug: service.slug,
            name: service.name,
            categoryName: category.name,
            groupSlug: group.slug,
            groupName: group.name,
          } satisfies CatalogServicePick;
        }
      }
    }
    return null;
  }, [groups, preselectSlug]);

  useEffect(() => {
    if (preselectPick) setSelected(preselectPick);
  }, [preselectPick]);

  useEffect(() => {
    if (!user) return;
    void refreshMe();
  }, [user?.id, refreshMe]);

  if (authLoading) {
    return <p className="text-sm text-[var(--color-muted)]">Đang tải…</p>;
  }

  if (!user) {
    return (
      <div className="animate-fade-up flex h-full min-h-0 w-full flex-1 items-center justify-center">
        <section className="glass-card w-full max-w-md !rounded-xl p-6 text-center sm:p-8">
          <h1 className="text-lg font-extrabold text-[var(--glass-ink,#172033)]">
            Đăng nhập để thuê dịch vụ
          </h1>
          <p className="mt-2 text-sm text-[var(--glass-muted,#7c8799)]">
            Cần tài khoản và số dư ví tối thiểu{' '}
            {HIRE_PAGE_MIN_WALLET_VND.toLocaleString('vi-VN')}₫ để mở form thuê.
          </p>
          <Link
            to="/dang-nhap?redirect=/don-cua-toi/thue"
            className="btn-primary mt-5 inline-flex px-5 py-2.5 text-sm"
          >
            Đăng nhập
          </Link>
        </section>
      </div>
    );
  }

  const balance =
    walletQuery.data?.balance ?? user.walletBalance ?? 0;

  if (!walletQuery.isLoading && balance < HIRE_PAGE_MIN_WALLET_VND) {
    return <HireWalletGate balance={balance} />;
  }

  if (treeQuery.isLoading || walletQuery.isLoading) {
    return <p className="text-sm text-[var(--color-muted)]">Đang tải danh mục...</p>;
  }

  if (treeQuery.isError) {
    return <p className="text-red-600">Không tải được danh mục dịch vụ.</p>;
  }

  return (
    <div className="animate-fade-up flex h-full min-h-0 w-full min-w-0 flex-1 flex-col">
      <HireServiceForm
        groups={groups}
        selected={selected}
        onSelectedChange={setSelected}
      />
    </div>
  );
}
