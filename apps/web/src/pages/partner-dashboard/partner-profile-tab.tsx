import { Controller } from 'react-hook-form';
import { Link } from 'react-router-dom';
import {
  DashboardPageHeader,
  DashboardSurface,
} from '../../components/dashboard/dashboard-chrome';
import { PartnerAvatarUpload } from '../../components/partner/partner-avatar-upload';
import { PartnerGalleryPanel } from '../../components/partner/partner-gallery-panel';
import { PartnerVerificationPanel } from '../../components/partner/partner-verification-panel';
import { ProfessionTagsInput } from '../../components/ui/profession-tags-input';
import { ProvinceSelect } from '../../components/ui/province-select';
import { Icon } from '../../components/ui/icon';
import type { PartnerDashboardState } from './use-partner-dashboard';

export function PartnerProfileTab({
  state,
  user,
}: {
  state: PartnerDashboardState;
  user: NonNullable<PartnerDashboardState['user']>;
}) {
  const {
    pathname,
    handleSubmit,
    profileMutation,
    reset,
    profileQuery,
    ensurePartnerProfile,
    register,
    errors,
    control,
    profileServiceIds,
    setProfileServiceIds,
    professionOptions,
    hoursByServiceId,
    isSubmitting,
  } = state;
  return (
  <section className="space-y-4">
    {!pathname.startsWith('/don-cua-toi') ? (
      <DashboardPageHeader
        icon="user"
        title="Hồ sơ cá nhân"
        description="Cập nhật thông tin để hồ sơ của bạn đầy đủ và chuyên nghiệp hơn."
      />
    ) : null}

    <DashboardSurface className="overflow-hidden">
      <form
        className="grid gap-0 lg:grid-cols-[minmax(240px,30%)_1fr]"
        onSubmit={handleSubmit(async (values) => {
          await profileMutation.mutateAsync(values);
          reset(values);
        })}
      >
        <div className="space-y-3 border-b border-[var(--color-line)] p-4 sm:p-5 lg:border-r lg:border-b-0">
          <PartnerAvatarUpload
            name={user?.fullName ?? 'Người làm'}
            avatarUrl={profileQuery.data?.avatarUrl}
            ensureProfile={() => ensurePartnerProfile()}
          />
          <Link
            to={`/user/${user.id}`}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-line)] bg-white px-4 text-sm font-semibold text-[var(--color-navy)] shadow-[0_4px_16px_rgba(24,49,63,0.05)] transition hover:border-[var(--color-brand)]"
          >
            <Icon name="eye" className="h-4 w-4 shrink-0 text-[var(--color-brand)]" />
            <span className="truncate">Xem hồ sơ công khai</span>
            <Icon name="chevronRight" className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
          </Link>
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
  );
}
