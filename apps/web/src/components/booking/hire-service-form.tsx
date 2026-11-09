import { Controller } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { HireBookingPreview } from './hire-booking-preview';
import { HireServicePicker } from './hire-service-picker';
import { HireTasksInput } from './hire-tasks-input';
import { Icon } from '../ui/icon';
import { HireBudgetDeposit } from './hire-form/hire-budget-deposit';
import { HireScheduleFields } from './hire-form/hire-schedule-fields';
import { HireStepper } from './hire-form/hire-stepper';
import {
  useHireServiceForm,
  type HireServiceFormProps,
} from './hire-form/use-hire-service-form';

type Props = HireServiceFormProps;

export function HireServiceForm({ groups, selected, onSelectedChange }: Props) {
  const state = useHireServiceForm({ groups, selected, onSelectedChange });
  const {
    user,
    tasks,
    setTasks,
    services,
    handleSubmit,
    register,
    control,
    errors,
    budgetMin,
    budgetMax,
    customerName,
    customerPhone,
    scheduledAt,
    schedulePublish,
    publishAt,
    jobTitle,
    activeService,
    activeColor,
    activeStep,
    depositPercent,
    bookingMutation,
    onSubmit,
  } = state;

  return (
    <div className="grid h-full min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] xl:items-stretch xl:gap-5">
      <section className="hire-form glass-card flex h-full min-h-0 min-w-0 flex-col overflow-hidden !rounded-xl">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--glass-line,rgba(23,32,51,0.08))] bg-white/25 px-4 py-2.5 sm:px-5 sm:py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-sm">
            <Icon name="briefcase" className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold tracking-tight text-[var(--color-navy)] sm:text-lg">
              Đăng ký thuê dịch vụ
            </h1>
            <p className="mt-0.5 hidden text-xs text-[var(--color-muted)] sm:block">
              Chọn nghề, điền thông tin rồi gửi yêu cầu — đặt cọc sau khi tạo đơn.
            </p>
          </div>
        </div>
        <HireStepper activeStep={activeStep} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5 sm:py-3.5">
        {!user ? (
          <div className="mb-3 rounded-lg bg-[var(--color-brand-soft)] px-3 py-2 text-sm">
            <Link
              to="/dang-nhap?redirect=/don-cua-toi/thue"
              className="font-semibold text-[var(--color-brand-deep)] hover:underline"
            >
              Đăng nhập
            </Link>{' '}
            để gửi yêu cầu thuê dịch vụ.
          </div>
        ) : null}

        <form
          id="hire-service-form"
          className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-3"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div>
            <Controller
              name="serviceSlug"
              control={control}
              render={({ field }) => (
                <HireServicePicker
                  id="hire-service-slug"
                  value={field.value}
                  onChange={field.onChange}
                  groups={groups}
                  services={services}
                  aria-label="Nghề / dịch vụ cần thuê"
                />
              )}
            />
            {errors.serviceSlug ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.serviceSlug.message}
              </p>
            ) : null}
          </div>

          {activeService && activeColor ? (
            <div
              className="flex flex-wrap items-center gap-2 self-end rounded-lg px-3 py-2"
              style={{
                backgroundColor: activeColor.soft,
                color: activeColor.ink,
              }}
            >
              <Icon
                name="briefcase"
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: activeColor.main }}
              />
              <div className="min-w-0 flex flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p className="text-sm font-bold">{activeService.name}</p>
                <p className="text-xs opacity-80">
                  {activeService.groupName} · {activeService.categoryName}
                </p>
              </div>
              <Link
                to={`/dich-vu/${activeService.slug}`}
                className="ml-auto shrink-0 text-xs font-semibold hover:underline"
                style={{ color: activeColor.ink }}
              >
                Xem chi tiết ›
              </Link>
            </div>
          ) : (
            <div className="flex items-start gap-2 self-end rounded-lg bg-[var(--color-brand-soft)] px-3 py-2 text-xs text-[var(--color-brand-deep)]">
              <Icon name="briefcase" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                <span className="font-semibold">Nghề / dịch vụ chưa được chọn.</span>{' '}
                Chọn từ danh sách bên trái để tiếp tục.
              </p>
            </div>
          )}

          <HireBudgetDeposit state={state} />

          <HireScheduleFields state={state} />

          <div className="sm:col-span-2">
            <input
              id="hire-job-title"
              {...register('jobTitle')}
              aria-label="Tên công việc cần làm"
              placeholder="Mô tả ngắn tên công việc cần làm"
              maxLength={120}
              className="field-input hire-field-input"
              disabled={bookingMutation.isPending || !user}
            />
            {errors.jobTitle ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.jobTitle.message}
              </p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <HireTasksInput
              value={tasks}
              onChange={setTasks}
              disabled={bookingMutation.isPending || !user}
            />
          </div>

          {bookingMutation.isError ? (
            <p className="sm:col-span-2 text-sm text-red-600">
              {(bookingMutation.error as Error).message ||
                'Gửi yêu cầu thất bại'}
            </p>
          ) : null}
        </form>
        </div>

        <div className="flex shrink-0 flex-col gap-2.5 border-t border-[var(--glass-line,rgba(23,32,51,0.08))] bg-white/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-2 text-xs text-[var(--color-muted)]">
            <Icon
              name="shield"
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
            />
            <p>
              Sau khi gửi, bạn cần{' '}
              <strong className="text-[var(--color-ink)]">đặt cọc giữ chỗ</strong>{' '}
              trên sàn để đơn vào hàng chờ người làm.
            </p>
          </div>
          <button
            type="submit"
            form="hire-service-form"
            disabled={bookingMutation.isPending || !user}
            className="btn-primary inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 text-sm disabled:opacity-60"
          >
            <Icon name="send" className="h-4 w-4" />
            {bookingMutation.isPending
              ? 'Đang gửi…'
              : 'Gửi yêu cầu thuê dịch vụ'}
          </button>
        </div>
      </div>
    </section>

      <HireBookingPreview
        service={activeService}
        customerName={customerName ?? ''}
        customerPhone={customerPhone ?? ''}
        scheduledAt={scheduledAt ?? ''}
        schedulePublish={Boolean(schedulePublish)}
        publishAt={publishAt ?? ''}
        budgetMin={budgetMin ?? 0}
        budgetMax={budgetMax ?? 0}
        applyDepositPercent={depositPercent}
        jobTitle={jobTitle ?? ''}
        tasks={tasks}
      />
    </div>
  );
}
