import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { PartnerAvatarUpload } from '../components/partner/partner-avatar-upload';
import { PartnerIncomingList } from '../components/partner/partner-incoming-list';
import { PartnerJobsList } from '../components/partner/partner-jobs-list';
import { PartnerLevelPanel } from '../components/partner/partner-level-panel';
import { PartnerProfessionTabs } from '../components/partner/partner-profession-tabs';
import { PartnerScheduleBoard } from '../components/partner/partner-schedule-board';
import { PartnerStatsBar } from '../components/partner/partner-stats-bar';
import { LevelBadgeGold, VerificationBadge } from '../components/ui/partner-badges';
import { ProfessionTagsInput } from '../components/ui/profession-tags-input';
import type { ProfessionOption } from '../components/ui/profession-tags-input';
import { ProvinceSelect } from '../components/ui/province-select';
import { useAuth } from '../features/auth/auth-context';
import { usePartnerRealtime } from '../hooks/use-partner-realtime';
import { catalogQueries } from '../lib/catalog-queries';
import { toast } from '../lib/notify';
import {
  DEFAULT_PROVINCE_SLUG,
  findProvince,
  findProvinceByName,
} from '../data/provinces';
import { api } from '../services/api';

const phoneRegex = /^(0|\+84)\d{8,10}$/;
const defaultCity = findProvince(DEFAULT_PROVINCE_SLUG).name;

const profileSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Số điện thoại không hợp lệ'),
  bio: z.string().max(2000).optional(),
  city: z.string().min(1, 'Chọn tỉnh / thành phố'),
});

/** `z.coerce` khiến giá trị vào form (input) khác giá trị đã parse (output). */
type ProfileInput = z.input<typeof profileSchema>;
type ProfileValues = z.output<typeof profileSchema>;

export function PartnerDashboardPage() {
  const { user, loading, canOffer, applySession, setMode, refreshMe } = useAuth();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const legacyTab = searchParams.get('tab');
  const tab =
    pathname.endsWith('/viec') || legacyTab === 'jobs'
      ? 'jobs'
      : pathname.endsWith('/ho-so') || legacyTab === 'profile'
        ? 'profile'
        : pathname.endsWith('/cap-do') || legacyTab === 'level'
          ? 'level'
          : 'overview';
  const [profileServiceIds, setProfileServiceIds] = useState<string[]>([]);
  /** Lọc Việc của tôi theo nghề — `'all'` = mọi nghề. */
  const [jobsProfessionId, setJobsProfessionId] = useState('all');
  const [appliedBookingIds, setAppliedBookingIds] = useState<string[]>([]);

  const openQuery = useQuery({
    queryKey: ['bookings', 'open'],
    queryFn: api.getOpenBookings,
    enabled: canOffer,
  });

  const mineQuery = useQuery({
    queryKey: ['bookings', 'partner'],
    queryFn: api.getPartnerBookings,
    enabled: canOffer,
  });

  const profileQuery = useQuery({
    queryKey: ['partner', 'me'],
    queryFn: api.getPartnerProfile,
    enabled: canOffer,
  });

  const levelQuery = useQuery({
    queryKey: ['partner', 'me', 'level'],
    queryFn: api.getPartnerLevel,
    enabled: canOffer,
  });

  usePartnerRealtime(canOffer, user?.id);

  const servicesQuery = useQuery(catalogQueries.services);

  const professionOptions = useMemo<ProfessionOption[]>(
    () =>
      (servicesQuery.data ?? []).map((service) => ({
        id: service.id,
        name: service.name,
        slug: service.slug,
        groupSlug: service.category.group.slug,
        groupName: service.category.group.name,
        categoryName: service.category.name,
      })),
    [servicesQuery.data],
  );

  const hoursByServiceId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const offering of profileQuery.data?.offerings ?? []) {
      map[offering.serviceId] = offering.hoursWorked ?? 0;
    }
    return map;
  }, [profileQuery.data?.offerings]);

  useEffect(() => {
    if (!profileQuery.data) return;
    setProfileServiceIds(
      profileQuery.data.serviceIds ??
        profileQuery.data.offerings?.map((o) => o.serviceId) ??
        [],
    );
  }, [profileQuery.data]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    formState: { isSubmitting, errors },
  } = useForm<ProfileInput, unknown, ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      phone: profileQuery.data?.user?.phone ?? user?.phone ?? '',
      bio: profileQuery.data?.bio ?? '',
      city:
        findProvinceByName(profileQuery.data?.city)?.name ??
        findProvinceByName(profileQuery.data?.districtsList?.[0])?.name ??
        defaultCity,
    },
  });

  /** Tạo hồ sơ nhận việc lần đầu (API enable) — không còn form «Bật nhận việc» riêng. */
  async function ensurePartnerProfile(values?: ProfileValues) {
    if (canOffer) return;
    const v = values ?? getValues();
    const phone = (v.phone || user?.phone || '').trim();
    if (!phoneRegex.test(phone)) {
      throw new Error('Nhập SĐT hợp lệ trên hồ sơ trước khi tải ảnh');
    }
    const city = v.city || defaultCity;
    const session = await api.enableOffering({
      phone,
      bio: v.bio,
      city,
      districts: city,
      serviceIds: profileServiceIds,
    });
    applySession(session);
    setMode('offer');
    await queryClient.invalidateQueries({ queryKey: ['partner'] });
    await queryClient.invalidateQueries({ queryKey: ['bookings'] });
    await queryClient.invalidateQueries({ queryKey: ['services'] });
  }

  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.applyBooking(id),
    onSuccess: (_, id) => {
      setAppliedBookingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast.success('Đã ứng tuyển', {
        description: 'Chờ chủ đơn chọn người làm',
      });
    },
    onError: (err) => {
      const message = (err as Error).message || 'Không ứng tuyển được';
      toast.error(message, {
        description:
          message.includes('chưa có đăng ký nghề')
            ? 'Vào Hồ sơ để thêm nghề này rồi thử lại'
            : undefined,
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateBookingStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['partner', 'me', 'level'] });
    },
  });

  const approveSettlementMutation = useMutation({
    mutationFn: (id: string) => api.approveBookingSettlement(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
      void queryClient.invalidateQueries({ queryKey: ['partner', 'me', 'level'] });
    },
  });

  const profileMutation = useMutation({
    mutationFn: async (values: ProfileValues) => {
      if (!canOffer) {
        await ensurePartnerProfile(values);
        return;
      }
      await api.updatePartnerProfile({
        phone: values.phone,
        bio: values.bio,
        city: values.city,
        districts: values.city,
      });
      await api.syncPartnerOfferings(profileServiceIds);
    },
    onSuccess: async () => {
      await refreshMe();
      await queryClient.invalidateQueries({ queryKey: ['partner', 'me'] });
      await queryClient.invalidateQueries({ queryKey: ['partner', 'me', 'level'] });
      await queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Đã lưu hồ sơ', {
        description: 'Thông tin người làm đã được cập nhật',
      });
    },
    onError: (err) => {
      toast.error('Không lưu được hồ sơ', {
        description: (err as Error).message || 'Thử lại sau',
      });
    },
  });

  const jobsProfessionTabs = useMemo(() => {
    const open = openQuery.data ?? [];
    const mine = mineQuery.data ?? [];

    /** Chỉ nghề user đã gắn trên hồ sơ — không suy từ đơn lạ. */
    const fromOfferings = (profileQuery.data?.offerings ?? [])
      .filter((o) => o.isActive !== false)
      .map((o) => ({ id: o.serviceId, label: o.service.name }));

    const selected =
      fromOfferings.length > 0
        ? fromOfferings
        : (profileQuery.data?.serviceIds ?? profileServiceIds).map((id) => {
            const opt = professionOptions.find((p) => p.id === id);
            return { id, label: opt?.name ?? id };
          });

    const countFor = (serviceId: string) =>
      open.filter((b) => b.service?.id === serviceId).length +
      mine.filter((b) => b.service?.id === serviceId).length;

    const professionTabs = selected
      .map((s) => {
        const option = professionOptions.find((p) => p.id === s.id);
        return {
          id: s.id,
          label: s.label,
          count: countFor(s.id),
          groupSlug: option?.groupSlug,
          groupName: option?.groupName,
          categoryName: option?.categoryName,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));

    return [
      {
        id: 'all',
        label: 'Tất cả nghề',
        count: open.length + mine.length,
        groupSlug: undefined,
        groupName: undefined,
        categoryName: undefined,
      },
      ...professionTabs,
    ];
  }, [
    openQuery.data,
    mineQuery.data,
    profileQuery.data?.offerings,
    profileQuery.data?.serviceIds,
    profileServiceIds,
    professionOptions,
  ]);

  useEffect(() => {
    if (jobsProfessionId === 'all') return;
    const stillExists = jobsProfessionTabs.some((t) => t.id === jobsProfessionId);
    if (!stillExists) setJobsProfessionId('all');
  }, [jobsProfessionId, jobsProfessionTabs]);

  if (loading) return <p>Đang tải...</p>;
  if (!user) return <Navigate to="/dang-nhap?redirect=/doi-tac" replace />;

  // Redirect URL cũ ?tab= → nested path
  if (pathname === '/doi-tac' && legacyTab === 'jobs') {
    return <Navigate to="/doi-tac/viec" replace />;
  }
  if (pathname === '/doi-tac' && legacyTab === 'profile') {
    return <Navigate to="/doi-tac/ho-so" replace />;
  }
  if (pathname === '/doi-tac' && legacyTab === 'level') {
    return <Navigate to="/doi-tac/cap-do" replace />;
  }

  // Chưa có hồ sơ: vẫn mở được «Hồ sơ»; tab khác gợi ý sang hồ sơ (không form «Bật nhận việc»).
  if (!canOffer && tab !== 'profile') {
    return (
      <div className="w-full rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold">
          {tab === 'jobs'
            ? 'Việc của tôi'
            : tab === 'level'
              ? 'Cấp độ'
              : 'Tổng quan'}
        </h1>
        <p className="mt-2 text-[15px] text-[var(--color-muted)]">
          Điền hồ sơ người làm (SĐT, nghề, ảnh) rồi lưu — sau đó nhận việc bình thường.
        </p>
        <Link
          to="/doi-tac/ho-so"
          className="mt-5 inline-flex rounded-xl bg-[var(--color-brand)] px-5 py-3 text-sm font-bold text-white"
        >
          Mở Hồ sơ
        </Link>
      </div>
    );
  }

  const needStartCount = (mineQuery.data ?? []).filter((b) => b.status === 'CONFIRMED').length;
  const inProgressCount = (mineQuery.data ?? []).filter((b) => b.status === 'IN_PROGRESS').length;
  const openCount = (openQuery.data ?? []).length;

  const openBookings = openQuery.data ?? [];
  const mineBookings = mineQuery.data ?? [];
  const filteredOpenBookings = (
    jobsProfessionId === 'all'
      ? openBookings
      : openBookings.filter((b) => b.service?.id === jobsProfessionId)
  )
    .slice()
    .sort((a, b) => {
      const ta = new Date(a.createdAt ?? a.scheduledAt).getTime();
      const tb = new Date(b.createdAt ?? b.scheduledAt).getTime();
      return tb - ta;
    });
  const filteredMineBookings =
    jobsProfessionId === 'all'
      ? mineBookings
      : mineBookings.filter((b) => b.service?.id === jobsProfessionId);

  return (
    <div className="space-y-1 pb-6">
      {tab !== 'overview' ? (
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {tab !== 'profile' ? (
                <h1 className="text-2xl font-extrabold sm:text-3xl">
                  {tab === 'jobs'
                    ? 'Việc của tôi'
                    : tab === 'level'
                      ? 'Cấp độ'
                      : 'Nhận việc'}
                </h1>
              ) : null}
              {tab === 'jobs' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Live
                </span>
              ) : null}
            </div>
            {tab === 'jobs' ? (
              <p className="mt-2 text-[15px] text-[var(--color-muted)]">
                Đơn mở realtime và việc đã nhận.
              </p>
            ) : tab === 'level' ? (
              <p className="mt-2 text-[15px] text-[var(--color-muted)]">
                Cấp merit 1–100 từ giờ online, đơn, đánh giá và hồ sơ.
              </p>
            ) : null}
          </div>
          {tab === 'jobs' ? (
            <div className="w-full md:w-[360px]">
              <PartnerProfessionTabs
                tabs={jobsProfessionTabs}
                value={jobsProfessionId}
                onChange={setJobsProfessionId}
                orientation="vertical"
              />
            </div>
          ) : null}
        </header>
      ) : null}

      {(tab === 'overview' || !tab) && (
        <>
          {user.partnerProfile ? (
            <div className="flex flex-wrap items-center gap-2">
              <LevelBadgeGold level={levelQuery.data?.level ?? user.partnerProfile.level ?? 1} />
              <VerificationBadge
                verified={Boolean(
                  levelQuery.data?.inputs.isVerified ?? user.partnerProfile.isVerified,
                )}
              />
              <Link
                to={`/user/${user.id}`}
                className="text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
              >
                Xem hồ sơ công khai ›
              </Link>
            </div>
          ) : null}

          <PartnerStatsBar
            mine={mineQuery.data ?? []}
            openCount={openCount}
          />

          {needStartCount + inProgressCount > 0 ? (
            <div className="flex flex-wrap gap-2">
              {needStartCount > 0 ? (
                <Link
                  to="/doi-tac/viec"
                  className="rounded-full bg-sky-100 px-3.5 py-1.5 text-sm font-semibold text-sky-900 hover:bg-sky-200"
                >
                  {needStartCount} việc chờ bắt đầu →
                </Link>
              ) : null}
              {inProgressCount > 0 ? (
                <Link
                  to="/doi-tac/viec"
                  className="rounded-full bg-violet-100 px-3.5 py-1.5 text-sm font-semibold text-violet-900 hover:bg-violet-200"
                >
                  {inProgressCount} đang làm →
                </Link>
              ) : null}
            </div>
          ) : null}

          <PartnerScheduleBoard enabled={canOffer} />
        </>
      )}

      {tab === 'jobs' && (
        <div className="min-w-0 space-y-5">
          <div className="min-w-0 space-y-8">
            <PartnerIncomingList
              bookings={filteredOpenBookings}
              loading={openQuery.isLoading}
              applyingId={acceptMutation.isPending ? (acceptMutation.variables ?? null) : null}
              appliedIds={appliedBookingIds}
              onApply={(id) => acceptMutation.mutate(id)}
              emptyHint={
                jobsProfessionId !== 'all' && openBookings.length > 0
                  ? 'Không có đơn mở thuộc nghề đang chọn.'
                  : undefined
              }
            />
            <PartnerJobsList
              bookings={filteredMineBookings}
              sourceTotal={mineBookings.length}
              loading={mineQuery.isLoading}
              currentUserId={user.id}
              statusPending={statusMutation.isPending}
              statusVariables={statusMutation.variables ?? null}
              statusError={statusMutation.isError ? (statusMutation.error as Error) : null}
              settlementPending={approveSettlementMutation.isPending}
              settlementBookingId={approveSettlementMutation.variables ?? null}
              settlementError={
                approveSettlementMutation.isError
                  ? (approveSettlementMutation.error as Error)
                  : null
              }
              onStart={(id) => statusMutation.mutate({ id, status: 'IN_PROGRESS' })}
              onComplete={(id) =>
                statusMutation.mutate({ id, status: 'AWAITING_CONFIRM' })
              }
              onApproveSettlement={(id) => approveSettlementMutation.mutate(id)}
            />
          </div>
        </div>
      )}

      {tab === 'level' && canOffer ? (
        levelQuery.isLoading ? (
          <p className="text-sm text-[var(--color-muted)]">Đang tải cấp độ…</p>
        ) : levelQuery.isError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {(levelQuery.error as Error).message || 'Không tải được cấp độ'}
          </p>
        ) : levelQuery.data ? (
          <PartnerLevelPanel data={levelQuery.data} />
        ) : null
      ) : null}

      {tab === 'profile' && (
      <section className="space-y-4">
      <div className="surface-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PartnerAvatarUpload
            name={user?.fullName ?? 'Người làm'}
            avatarUrl={profileQuery.data?.avatarUrl}
            ensureProfile={() => ensurePartnerProfile()}
          />
          <Link
            to={`/user/${user.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-brand)]/15 bg-[var(--color-brand-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--color-brand-deep)] shadow-[0_10px_24px_rgba(0,156,149,0.18)] ring-1 ring-white/70 transition hover:-translate-y-0.5 hover:bg-[#f2fbfa]"
          >
            Xem hồ sơ công khai
            <span aria-hidden>›</span>
          </Link>
        </div>
        <form
          className="mt-4 space-y-3"
          onSubmit={handleSubmit(async (values) => {
            await profileMutation.mutateAsync(values);
            reset(values);
          })}
        >
          <div>
            <label className="mb-1.5 block text-sm font-semibold" htmlFor="profile-phone">
              Số điện thoại
            </label>
            <input
              id="profile-phone"
              {...register('phone')}
              placeholder="0901234567"
              className="field-input w-full"
              inputMode="tel"
              autoComplete="tel"
            />
            {errors.phone ? (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            ) : null}
          </div>

          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <ProvinceSelect
                id="profile-city"
                value={field.value}
                onChange={field.onChange}
                error={errors.city?.message}
              />
            )}
          />

          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              Nghề bạn làm
            </label>
            <ProfessionTagsInput
              value={profileServiceIds}
              onChange={setProfileServiceIds}
              options={professionOptions}
              hoursByServiceId={hoursByServiceId}
              placeholder="Gõ tên nghề để gắn / gỡ tag…"
            />
          </div>

          <textarea
            {...register('bio')}
            rows={4}
            placeholder="Giới thiệu kỹ năng, kinh nghiệm..."
            className="field-input w-full"
          />
          {profileMutation.isError ? (
            <p className="text-sm text-red-600">
              {(profileMutation.error as Error).message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting || profileMutation.isPending}
            className="btn-primary px-5 py-2.5 text-[15px] disabled:opacity-60"
          >
            {profileMutation.isPending ? 'Đang lưu…' : 'Lưu hồ sơ'}
          </button>
        </form>
      </div>
      </section>
      )}
    </div>
  );
}
