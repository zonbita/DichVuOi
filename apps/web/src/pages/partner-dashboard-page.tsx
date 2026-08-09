import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import {
  DashboardEmpty,
  DashboardPageHeader,
  DashboardSurface,
} from '../components/dashboard/dashboard-chrome';
import { PartnerAvatarUpload } from '../components/partner/partner-avatar-upload';
import { PartnerIncomingList } from '../components/partner/partner-incoming-list';
import { PartnerJobsList } from '../components/partner/partner-jobs-list';
import { PartnerLevelPanel } from '../components/partner/partner-level-panel';
import { PartnerScheduleBoard } from '../components/partner/partner-schedule-board';
import { PartnerStatsBar } from '../components/partner/partner-stats-bar';
import { PartnerGalleryPanel } from '../components/partner/partner-gallery-panel';
import { PartnerVerificationPanel } from '../components/partner/partner-verification-panel';
import { ProfessionTagsInput } from '../components/ui/profession-tags-input';
import type { ProfessionOption } from '../components/ui/profession-tags-input';
import { ProvinceSelect } from '../components/ui/province-select';
import { Icon } from '../components/ui/icon';
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const legacyTab = searchParams.get('tab');
  const tab =
    pathname.endsWith('/don-thue') || legacyTab === 'incoming'
      ? 'incoming'
      : pathname.endsWith('/viec') || legacyTab === 'jobs'
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
    onSuccess: async (_, id) => {
      setAppliedBookingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast.success('Đã ứng tuyển', {
        description: 'Đơn đã vào Việc của tôi — chờ chủ đơn chọn',
      });
      navigate('/doi-tac/viec');
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
      open.filter((b) => b.service?.id === serviceId).length;

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
        count: open.length,
        groupSlug: undefined,
        groupName: undefined,
        categoryName: undefined,
      },
      ...professionTabs,
    ];
  }, [
    openQuery.data,
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
  if (pathname === '/doi-tac' && legacyTab === 'incoming') {
    return <Navigate to="/doi-tac/don-thue" replace />;
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
      <div className="space-y-4">
        <DashboardPageHeader
          icon={
            tab === 'incoming'
              ? 'sparkles'
              : tab === 'jobs'
                ? 'briefcase'
                : tab === 'level'
                  ? 'chart'
                  : 'home'
          }
          title={
            tab === 'incoming'
              ? 'Đơn thuê'
              : tab === 'jobs'
                ? 'Việc của tôi'
                : tab === 'level'
                  ? 'Cấp độ'
                  : 'Tổng quan'
          }
          description="Điền hồ sơ người làm (SĐT, nghề, ảnh) rồi lưu — sau đó nhận việc bình thường."
        />
        <DashboardEmpty
          title="Chưa có hồ sơ người làm"
          body="Hoàn tất hồ sơ để xem đơn, việc và cấp độ của bạn."
          ctaTo="/doi-tac/ho-so"
          ctaLabel="Mở Hồ sơ"
        />
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
  return (
    <div
      className={
        tab === 'incoming'
          ? 'flex h-full min-h-0 flex-col overflow-hidden'
          : 'space-y-1 pb-6'
      }
    >
      {tab === 'level' ? (
        <DashboardPageHeader
          icon="chart"
          title="Cấp độ"
          description="Cấp merit 1–100 từ giờ online, đơn, đánh giá và hồ sơ."
        />
      ) : null}

      {(tab === 'overview' || !tab) && (
        <>
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

      {tab === 'incoming' && (
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <PartnerIncomingList
            bookings={filteredOpenBookings}
            loading={openQuery.isLoading}
            applyingId={acceptMutation.isPending ? (acceptMutation.variables ?? null) : null}
            appliedIds={appliedBookingIds}
            onApply={(id) => acceptMutation.mutate(id)}
            professionTabs={jobsProfessionTabs}
            professionId={jobsProfessionId}
            onProfessionChange={setJobsProfessionId}
            emptyHint={
              jobsProfessionId !== 'all' && openBookings.length > 0
                ? 'Không có đơn mở thuộc nghề đang chọn.'
                : undefined
            }
          />
        </div>
      )}

      {tab === 'jobs' && (
        <div className="min-w-0">
          <PartnerJobsList
            bookings={mineBookings}
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
          <DashboardPageHeader
            icon="user"
            title="Hồ sơ cá nhân"
            description="Cập nhật thông tin để hồ sơ của bạn đầy đủ và chuyên nghiệp hơn."
            actions={
              <Link
                to={`/user/${user.id}`}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white px-4 text-sm font-semibold text-[var(--color-navy)] shadow-[0_4px_16px_rgba(24,49,63,0.05)] transition hover:border-[var(--color-brand)]"
              >
                <Icon name="eye" className="h-4 w-4 text-[var(--color-brand)]" />
                Xem hồ sơ công khai
                <Icon name="chevronRight" className="h-4 w-4 text-[var(--color-muted)]" />
              </Link>
            }
          />

          <DashboardSurface className="overflow-hidden">
            <form
              className="grid gap-0 lg:grid-cols-[minmax(240px,30%)_1fr]"
              onSubmit={handleSubmit(async (values) => {
                await profileMutation.mutateAsync(values);
                reset(values);
              })}
            >
              <div className="border-b border-[var(--color-line)] p-4 sm:p-5 lg:border-r lg:border-b-0">
                <PartnerAvatarUpload
                  name={user?.fullName ?? 'Người làm'}
                  avatarUrl={profileQuery.data?.avatarUrl}
                  ensureProfile={() => ensurePartnerProfile()}
                />
              </div>

              <div className="flex min-w-0 flex-col p-4 sm:p-5 lg:p-6">
                <div className="space-y-4">
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-[var(--color-navy)]"
                      htmlFor="profile-phone"
                    >
                      Số điện thoại
                    </label>
                    <input
                      id="profile-phone"
                      {...register('phone')}
                      placeholder="0901234567"
                      className="h-11 w-full rounded-[12px] border border-[var(--color-line)] bg-white px-3 text-sm text-[var(--color-navy)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/25"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                    {errors.phone ? (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.phone.message}
                      </p>
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
                    <label className="mb-2 block text-sm font-medium text-[var(--color-navy)]">
                      Nghề bạn làm
                    </label>
                    <ProfessionTagsInput
                      value={profileServiceIds}
                      onChange={setProfileServiceIds}
                      options={professionOptions}
                      hoursByServiceId={hoursByServiceId}
                      placeholder="Gõ tên nghề để gắn / gỡ tag..."
                    />
                  </div>

                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-[var(--color-navy)]"
                      htmlFor="profile-bio"
                    >
                      Giới thiệu kỹ năng, kinh nghiệm
                    </label>
                    <textarea
                      id="profile-bio"
                      {...register('bio')}
                      rows={5}
                      placeholder="Giới thiệu kỹ năng, kinh nghiệm..."
                      className="min-h-[120px] w-full resize-y rounded-[12px] border border-[var(--color-line)] bg-white px-3 py-2.5 text-sm text-[var(--color-navy)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/25"
                    />
                  </div>

                  {profileMutation.isError ? (
                    <p className="text-sm text-red-600">
                      {(profileMutation.error as Error).message}
                    </p>
                  ) : null}
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-[var(--color-line)] pt-5 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    disabled={isSubmitting || profileMutation.isPending}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[var(--color-brand)] px-5 text-sm font-bold !text-white shadow-[0_2px_8px_rgba(7,154,154,0.22)] transition hover:bg-[var(--color-brand-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/40 focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    <Icon name="save" className="h-4 w-4 !text-white" />
                    {profileMutation.isPending ? 'Đang lưu…' : 'Lưu hồ sơ'}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting || profileMutation.isPending}
                    onClick={() => {
                      reset();
                      setProfileServiceIds(
                        profileQuery.data?.offerings?.map((o) => o.serviceId) ??
                          [],
                      );
                    }}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-[var(--color-line)] bg-white px-5 text-sm font-semibold text-[var(--color-navy)] transition hover:bg-[var(--color-canvas)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/30 focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto"
                  >
                    <Icon name="rotateCcw" className="h-4 w-4 text-[var(--color-muted)]" />
                    Khôi phục
                  </button>
                </div>
              </div>
            </form>
          </DashboardSurface>

          {profileQuery.data && !pathname.startsWith('/don-cua-toi') ? (
            <PartnerVerificationPanel
              profile={profileQuery.data}
              defaultPhone={profileQuery.data.user?.phone ?? user?.phone ?? ''}
            />
          ) : null}

          {profileQuery.data && pathname.includes('/ho-so') ? (
            <PartnerGalleryPanel />
          ) : null}
        </section>
      )}
    </div>
  );
}
