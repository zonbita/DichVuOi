import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { PartnerCompletenessBar } from '../components/partner/partner-completeness-bar';
import { PartnerIncomingList } from '../components/partner/partner-incoming-list';
import { PartnerJobsList } from '../components/partner/partner-jobs-list';
import { PartnerScheduleBoard } from '../components/partner/partner-schedule-board';
import { PartnerStatsBar } from '../components/partner/partner-stats-bar';
import { LevelBadgeGold, VerificationBadge } from '../components/ui/partner-badges';
import { ProfessionTagsInput } from '../components/ui/profession-tags-input';
import type { ProfessionOption } from '../components/ui/profession-tags-input';
import { useAuth } from '../features/auth/auth-context';
import { usePartnerRealtime } from '../hooks/use-partner-realtime';
import { api } from '../services/api';
import type { PartnerLevelBreakdown } from '../types/auth';

const profileSchema = z.object({
  headline: z.string().max(120).optional(),
  bio: z.string().max(2000).optional(),
  city: z.string().max(80).optional(),
  districts: z.string().max(200).optional(),
  skillsText: z.string().max(200).optional(),
  workModes: z.string().max(40).optional(),
  acceptingJobs: z.boolean().optional(),
  responseMinutes: z.coerce.number().min(5).max(1440).optional(),
  avatarUrl: z.string().max(500).optional(),
  galleryText: z.string().max(4000).optional(),
});

/** `z.coerce` khiến giá trị vào form (input) khác giá trị đã parse (output). */
type ProfileInput = z.input<typeof profileSchema>;
type ProfileValues = z.output<typeof profileSchema>;

function skillsToText(skills?: string[] | null, skillsJson?: string | null) {
  if (skills?.length) return skills.join(', ');
  if (!skillsJson) return '';
  try {
    const parsed = JSON.parse(skillsJson) as unknown;
    if (Array.isArray(parsed)) return parsed.map(String).join(', ');
  } catch {
    /* ignore */
  }
  return skillsJson;
}

function parseSkillsText(text?: string) {
  return text
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function galleryToText(gallery?: string[] | null) {
  return gallery?.length ? gallery.join('\n') : '';
}

function parseGalleryText(text?: string) {
  return text
    ?.split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function PartnerDashboardPage() {
  const { user, loading, canOffer, applySession, setMode } = useAuth();
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
  const [enableError, setEnableError] = useState('');
  const [enableServiceIds, setEnableServiceIds] = useState<string[]>([]);
  const [profileServiceIds, setProfileServiceIds] = useState<string[]>([]);

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

  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: () => api.getServices(),
  });

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
    formState: { isSubmitting },
  } = useForm<ProfileInput, unknown, ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      headline: profileQuery.data?.headline ?? '',
      bio: profileQuery.data?.bio ?? '',
      city: profileQuery.data?.city ?? '',
      districts:
        profileQuery.data?.districtsList?.join(', ') ??
        profileQuery.data?.districts ??
        '',
      skillsText: skillsToText(
        profileQuery.data?.skills,
        profileQuery.data?.skillsJson,
      ),
      workModes: profileQuery.data?.workModes ?? 'onsite',
      acceptingJobs: profileQuery.data?.acceptingJobs ?? true,
      responseMinutes: profileQuery.data?.responseMinutes ?? 30,
      avatarUrl: profileQuery.data?.avatarUrl ?? '',
      galleryText: galleryToText(profileQuery.data?.gallery),
    },
  });

  const enableForm = useForm<ProfileInput, unknown, ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      headline: '',
      bio: '',
      city: 'Hồ Chí Minh',
      districts: '',
      skillsText: '',
      workModes: 'onsite',
      acceptingJobs: true,
      responseMinutes: 30,
      avatarUrl: '',
      galleryText: '',
    },
  });

  const acceptMutation = useMutation({
    mutationFn: api.acceptBooking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
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

  const profileMutation = useMutation({
    mutationFn: async (values: ProfileValues) => {
      await api.updatePartnerProfile({
        headline: values.headline,
        bio: values.bio,
        city: values.city,
        districts: values.districts,
        skills: parseSkillsText(values.skillsText),
        workModes: values.workModes,
        acceptingJobs: values.acceptingJobs,
        responseMinutes: values.responseMinutes,
        avatarUrl: values.avatarUrl,
        gallery: parseGalleryText(values.galleryText) ?? [],
      });
      await api.syncPartnerOfferings(profileServiceIds);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['partner', 'me'] });
      await queryClient.invalidateQueries({ queryKey: ['partner', 'me', 'level'] });
      await queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const enableMutation = useMutation({
    mutationFn: (values: ProfileValues) =>
      api.enableOffering({
        headline: values.headline,
        bio: values.bio,
        city: values.city,
        districts: values.districts,
        skills: parseSkillsText(values.skillsText),
        workModes: values.workModes,
        acceptingJobs: values.acceptingJobs,
        responseMinutes: values.responseMinutes,
        serviceIds: enableServiceIds,
      }),
    onSuccess: (session) => {
      applySession(session);
      setMode('offer');
      void queryClient.invalidateQueries({ queryKey: ['partner'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

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

  if (!canOffer) {
    return (
      <div className="mx-auto max-w-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold">Bắt đầu nhận việc</h1>
        <p className="mt-2 text-[15px] text-[var(--color-muted)]">
          Bạn đang chuyển sang vai người làm trên cùng tài khoản. Chọn một
          hoặc nhiều nghề (tags) — giống gắn gameplay tags trong UE5.
        </p>
        <form
          className="mt-6 space-y-3"
          onSubmit={enableForm.handleSubmit(async (values) => {
            setEnableError('');
            try {
              await enableMutation.mutateAsync(values);
            } catch (err) {
              setEnableError(
                (err as Error).message || 'Không bật được hồ sơ người làm',
              );
            }
          })}
        >
          <input
            {...enableForm.register('headline')}
            placeholder="Headline (vd: Thợ điện nước Quận 1)"
            className="field-input w-full"
          />
          <input
            {...enableForm.register('city')}
            placeholder="Thành phố"
            className="field-input w-full"
          />
          <input
            {...enableForm.register('districts')}
            placeholder="Quận / khu vực phục vụ (vd: Quận 1, Bình Thạnh)"
            className="field-input w-full"
          />

          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              Nghề bạn làm
            </label>
            <ProfessionTagsInput
              value={enableServiceIds}
              onChange={setEnableServiceIds}
              options={professionOptions}
              placeholder="Gõ tên nghề để gắn tag…"
            />          </div>

          <input
            {...enableForm.register('skillsText')}
            placeholder="Kỹ năng phụ (tuỳ chọn, cách nhau bởi dấu phẩy)"
            className="field-input w-full"
          />
          <select
            {...enableForm.register('workModes')}
            className="field-input w-full"
          >
            <option value="onsite">Tại chỗ</option>
            <option value="online">Online</option>
            <option value="onsite,online">Tại chỗ + Online</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...enableForm.register('acceptingJobs')}
              defaultChecked
            />
            Đang nhận việc
          </label>
          <input
            type="number"
            {...enableForm.register('responseMinutes')}
            placeholder="Phản hồi trong (phút)"
            className="field-input w-full"
          />
          <textarea
            {...enableForm.register('bio')}
            rows={4}
            placeholder="Giới thiệu kỹ năng, kinh nghiệm..."
            className="field-input w-full"
          />
          {enableError ? (
            <p className="text-sm text-red-600">{enableError}</p>
          ) : null}
          <button
            type="submit"
            disabled={enableMutation.isPending}
            className="w-full bg-[var(--color-brand)] py-3 text-[15px] font-bold text-white disabled:opacity-60"
          >
            {enableMutation.isPending
              ? 'Đang bật...'
              : 'Bật nhận việc trên tài khoản này'}
          </button>
        </form>
        <p className="mt-4 text-sm text-[var(--color-muted)]">
          Vẫn thuê được bình thường tại{' '}
          <Link
            to="/don-cua-toi"
            className="font-semibold text-[var(--color-brand-deep)]"
          >
            Đơn thuê
          </Link>
          .
        </p>
      </div>
    );
  }

  const needStartCount = (mineQuery.data ?? []).filter((b) => b.status === 'CONFIRMED').length;
  const inProgressCount = (mineQuery.data ?? []).filter((b) => b.status === 'IN_PROGRESS').length;
  const openCount = (openQuery.data ?? []).length;

  return (
    <div className="space-y-8 pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold sm:text-3xl">
              {tab === 'jobs'
                ? 'Việc của tôi'
                : tab === 'profile'
                  ? 'Hồ sơ người làm'
                  : tab === 'level'
                    ? 'Cấp độ'
                    : 'Nhận việc'}
            </h1>
            {tab === 'overview' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-[15px] text-[var(--color-muted)]">
            {user.fullName} — vừa là khách thuê vừa là người làm trên cùng tài khoản.
            {tab === 'overview'
              ? ' Đơn mở và lịch cập nhật realtime.'
              : null}
          </p>
          {user.partnerProfile && tab === 'overview' ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <LevelBadgeGold level={levelQuery.data?.level ?? user.partnerProfile.level ?? 1} />
              <VerificationBadge
                verified={Boolean(
                  levelQuery.data?.inputs.isVerified ?? user.partnerProfile.isVerified,
                )}
              />
              <Link
                to={`/nguoi/${user.id}`}
                className="text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
              >
                Xem hồ sơ công khai ›
              </Link>
            </div>
          ) : null}
        </div>
      </header>

      {(tab === 'overview' || !tab) && (
        <>
          {profileQuery.data ? (
            <PartnerCompletenessBar profile={profileQuery.data} />
          ) : null}

          <PartnerStatsBar
            mine={mineQuery.data ?? []}
            openCount={openCount}
          />

          {needStartCount + inProgressCount + openCount > 0 ? (
            <div className="flex flex-wrap gap-2">
              {openCount > 0 ? (
                <span className="rounded-full bg-emerald-100 px-3.5 py-1.5 text-sm font-semibold text-emerald-900">
                  {openCount} đơn mở trên hàng chờ
                </span>
              ) : null}
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

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <PartnerScheduleBoard enabled={canOffer} />
            <PartnerIncomingList
              bookings={openQuery.data ?? []}
              loading={openQuery.isLoading}
              accepting={acceptMutation.isPending}
              onAccept={(id) => acceptMutation.mutate(id)}
            />
          </div>
        </>
      )}

      {tab === 'jobs' && (
        <PartnerJobsList
          bookings={mineQuery.data ?? []}
          loading={mineQuery.isLoading}
          currentUserId={user.id}
          statusPending={statusMutation.isPending}
          statusVariables={statusMutation.variables ?? null}
          statusError={statusMutation.isError ? (statusMutation.error as Error) : null}
          onStart={(id) => statusMutation.mutate({ id, status: 'IN_PROGRESS' })}
          onComplete={(id) => statusMutation.mutate({ id, status: 'COMPLETED' })}
        />
      )}

      {tab === 'level' && canOffer && levelQuery.data ? (
        <LevelBreakdownCard data={levelQuery.data} />
      ) : null}

      {tab === 'profile' && (
      <section className="space-y-4">
        {profileQuery.data ? (
          <PartnerCompletenessBar profile={profileQuery.data} />
        ) : null}
      <div className="surface-card p-5">
        <h2 className="text-xl font-extrabold">Hồ sơ người làm</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={handleSubmit(async (values) => {
            await profileMutation.mutateAsync(values);
            reset(values);
          })}
        >
          <input
            {...register('headline')}
            placeholder="Headline (vd: Thợ điện nước Quận 1)"
            className="field-input w-full"
          />
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Ảnh đại diện (URL)</label>
            <input
              {...register('avatarUrl')}
              placeholder="https://…"
              className="field-input w-full"
            />
            {profileQuery.data?.avatarUrl ? (
              <img
                src={profileQuery.data.avatarUrl}
                alt="Avatar"
                className="mt-2 h-16 w-16 rounded-xl object-cover ring-1 ring-[var(--color-line)]"
              />
            ) : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              Portfolio (3–6 URL ảnh, mỗi dòng một URL)
            </label>
            <textarea
              {...register('galleryText')}
              rows={4}
              placeholder={'https://…/anh1.jpg\nhttps://…/anh2.jpg'}
              className="field-input w-full font-mono text-sm"
            />
          </div>
          <input
            {...register('city')}
            placeholder="Thành phố"
            className="field-input w-full"
          />
          <input
            {...register('districts')}
            placeholder="Quận / khu vực phục vụ"
            className="field-input w-full"
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

          <input
            {...register('skillsText')}
            placeholder="Kỹ năng phụ (tuỳ chọn, phẩy)"
            className="field-input w-full"
          />
          <select {...register('workModes')} className="field-input w-full">
            <option value="onsite">Tại chỗ</option>
            <option value="online">Online</option>
            <option value="onsite,online">Tại chỗ + Online</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('acceptingJobs')} />
            Đang nhận việc
          </label>
          <input
            type="number"
            {...register('responseMinutes')}
            placeholder="Phản hồi trong (phút)"
            className="field-input w-full"
          />
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

function LevelBreakdownCard({ data }: { data: PartnerLevelBreakdown }) {
  const rows = [
    { label: 'Giờ theo nghề', value: data.hoursPoints, hint: 'max 45' },
    { label: 'Đơn hoàn thành', value: data.jobsPoints, hint: 'max 20' },
    { label: 'Điểm ★ trung bình', value: data.ratingPoints, hint: 'max 15' },
    { label: 'Số đánh giá', value: data.reviewCountPoints, hint: 'max 5' },
    { label: 'Đã xác thực', value: data.verifiedBonus, hint: '+10' },
    { label: 'Đa dạng nghề', value: data.diversityBonus, hint: 'max 5' },
  ];

  return (
    <section className="surface-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">Cấp của bạn</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Công thức: giờ làm từng nghề + điểm đơn, ★, xác thực, đa dạng nghề → cấp 1–100.
          </p>
        </div>
        <LevelBadgeGold level={data.level} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)]/70 px-3 py-2"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {row.label}
            </p>
            <p className="mt-0.5 text-lg font-extrabold text-[var(--color-ink)]">
              {row.value}
              <span className="ml-1 text-xs font-medium text-[var(--color-muted)]">
                ({row.hint})
              </span>
            </p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm text-[var(--color-muted)]">
        Tổng điểm {data.totalPoints} · {data.inputs.completedJobs} đơn hoàn thành · ★{' '}
        {data.inputs.ratingAvg.toFixed(1)} ({data.inputs.ratingCount} đánh giá) ·{' '}
        {data.inputs.activeOfferings} nghề đang gắn
        {data.inputs.isVerified ? ' · Đã xác minh' : ' · Chưa xác minh'}
      </p>

      {data.hoursByServicePoints.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-bold">Điểm giờ theo nghề</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {data.hoursByServicePoints.slice(0, 8).map((row) => (
              <li
                key={row.serviceId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-[var(--color-line)]"
              >
                <span className="font-semibold">
                  {row.serviceName ?? row.serviceId}
                </span>
                <span className="text-[var(--color-muted)]">
                  {row.hours} giờ → <strong className="text-[var(--color-ink)]">{row.points}</strong> điểm
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Mỗi nghề: min(giờ, 120) × 0.25 (tối đa 30/nghề). Tổng giờ nghề tối đa 45 điểm.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--color-muted)]">
          Chưa có giờ làm trên sàn — hoàn thành đơn để tăng cấp theo nghề.
        </p>
      )}
    </section>
  );
}
