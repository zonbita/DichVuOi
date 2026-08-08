import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import {
  hireServiceSchema,
  defaultScheduledAtLocal,
  defaultPublishAtLocal,
  APPLY_DEPOSIT_BUDGET_THRESHOLD,
  applyDepositPercentBounds,
  clampApplyDepositPercent,
  type HireServiceFormValues,
} from '../../features/booking/create-booking-schema';
import { useAuth } from '../../features/auth/auth-context';
import { api } from '../../services/api';
import type { CatalogTreeService, ServiceGroupTree } from '../../types/catalog';
import { groupColor } from '../../utils/catalog-colors';
import { marketPriceRange } from '../../utils/market-price';
import { HireBookingPreview } from './hire-booking-preview';
import { HireServicePicker } from './hire-service-picker';
import { HireTasksInput } from './hire-tasks-input';
import type { CatalogServicePick } from '../home/catalog-menu-shared';
import { PRICE_SLIDER_MIN, PriceRangeSlider } from '../ui/price-range-slider';
import { DatetimeLocalField } from '../ui/datetime-local-field';
import { Icon } from '../ui/icon';

type ServiceOption = CatalogServicePick &
  Pick<
    CatalogTreeService,
    'basePrice' | 'priceMin' | 'priceMax' | 'unit' | 'durationMin'
  >;

function flattenServices(groups: ServiceGroupTree[]): ServiceOption[] {
  return groups.flatMap((group) =>
    (group.categories ?? []).flatMap((category) =>
      category.services.map((service) => ({
        id: service.id,
        slug: service.slug,
        name: service.name,
        categoryName: category.name,
        groupSlug: group.slug,
        groupName: group.name,
        basePrice: service.basePrice,
        priceMin: service.priceMin,
        priceMax: service.priceMax,
        unit: service.unit,
        durationMin: service.durationMin,
      })),
    ),
  );
}

function defaultBudgetForService(service: ServiceOption | null) {
  if (!service) {
    return { min: PRICE_SLIDER_MIN, max: 5_000_000 };
  }
  return marketPriceRange({
    basePrice: service.basePrice,
    priceMin: service.priceMin,
    priceMax: service.priceMax,
  });
}

const STEPS = [
  { id: 1, label: 'Chọn dịch vụ' },
  { id: 2, label: 'Thông tin' },
  { id: 3, label: 'Xác nhận' },
] as const;

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-[13px] font-semibold text-[var(--color-ink)]"
    >
      {children}
    </label>
  );
}

function HireStepper({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-1 sm:gap-1.5" aria-label="Tiến trình đăng ký">
      {STEPS.map((step, index) => {
        const done = activeStep > step.id;
        const current = activeStep === step.id;
        return (
          <li key={step.id} className="flex items-center gap-1 sm:gap-1.5">
            {index > 0 ? (
              <span
                className={`hidden h-px w-4 sm:block sm:w-6 ${
                  activeStep >= step.id
                    ? 'bg-[var(--color-brand)]'
                    : 'bg-[var(--color-line)]'
                }`}
                aria-hidden
              />
            ) : null}
            <span className="flex items-center gap-1 sm:gap-1.5">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold sm:h-7 sm:w-7 sm:text-xs ${
                  done || current
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'bg-[var(--color-canvas)] text-[var(--color-muted)] ring-1 ring-[var(--color-line)]'
                }`}
              >
                {done ? (
                  <Icon name="check" className="h-3 w-3" />
                ) : (
                  step.id
                )}
              </span>
              <span
                className={`hidden text-xs font-semibold sm:inline ${
                  current || done
                    ? 'text-[var(--color-ink)]'
                    : 'text-[var(--color-muted)]'
                }`}
              >
                {step.label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

type Props = {
  groups: ServiceGroupTree[];
  selected: CatalogServicePick | null;
  onSelectedChange: (pick: CatalogServicePick | null) => void;
};

export function HireServiceForm({ groups, selected, onSelectedChange }: Props) {
  const { user, refreshMe } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState<string[]>([]);

  const services = useMemo(() => flattenServices(groups), [groups]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<HireServiceFormValues>({
    resolver: zodResolver(hireServiceSchema),
    defaultValues: {
      serviceSlug: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      scheduledAt: defaultScheduledAtLocal(),
      schedulePublish: false,
      publishAt: '',
      note: '',
      budgetMin: PRICE_SLIDER_MIN,
      budgetMax: 5_000_000,
      applyDepositPercent: 10,
    },
  });

  const serviceSlug = watch('serviceSlug');
  const budgetMin = watch('budgetMin');
  const budgetMax = watch('budgetMax');
  const applyDepositPercent = watch('applyDepositPercent');
  const depositBounds = applyDepositPercentBounds(budgetMax || 0);
  const customerName = watch('customerName');
  const customerPhone = watch('customerPhone');
  const scheduledAt = watch('scheduledAt');
  const schedulePublish = watch('schedulePublish');
  const publishAt = watch('publishAt');

  useEffect(() => {
    if (!schedulePublish) return;
    if (publishAt && publishAt.trim()) return;
    setValue('publishAt', defaultPublishAtLocal(), { shouldValidate: true });
  }, [schedulePublish, publishAt, setValue]);

  useEffect(() => {
    if (!user) return;
    reset((current) => ({
      ...current,
      customerName: current.customerName || user.fullName,
      customerPhone: current.customerPhone || user.phone || '',
      customerEmail: current.customerEmail || user.email || '',
    }));
  }, [user, reset]);

  useEffect(() => {
    if (selected?.slug) {
      setValue('serviceSlug', selected.slug, { shouldValidate: true });
    }
  }, [selected?.slug, setValue]);

  useEffect(() => {
    const next = clampApplyDepositPercent(
      Number.isFinite(applyDepositPercent) ? applyDepositPercent : depositBounds.defaultPercent,
      budgetMax || 0,
    );
    if (next !== applyDepositPercent) {
      setValue('applyDepositPercent', next, { shouldValidate: true });
    }
  }, [budgetMax, applyDepositPercent, depositBounds.defaultPercent, setValue]);

  useEffect(() => {
    if (!serviceSlug) {
      if (selected) onSelectedChange(null);
      return;
    }
    const match = services.find((item) => item.slug === serviceSlug);
    if (match && match.slug !== selected?.slug) {
      onSelectedChange(match);
    }
  }, [serviceSlug, services, selected?.slug, onSelectedChange, selected]);

  const activeService =
    services.find((item) => item.slug === serviceSlug) ?? null;
  const walletBudgetCap = useMemo(() => {
    if (!user) return null;
    const raw = user.walletBalance ?? 0;
    return Math.max(PRICE_SLIDER_MIN, raw);
  }, [user]);
  const activeColor = activeService
    ? groupColor(activeService.groupSlug)
    : null;

  useEffect(() => {
    if (walletBudgetCap === null) return;
    if (budgetMin > walletBudgetCap) {
      setValue('budgetMin', walletBudgetCap, { shouldValidate: true });
    }
    if (budgetMax > walletBudgetCap) {
      setValue('budgetMax', walletBudgetCap, { shouldValidate: true });
    }
  }, [walletBudgetCap, budgetMin, budgetMax, setValue]);

  useEffect(() => {
    if (!activeService) return;
    const range = defaultBudgetForService(activeService);
    const cap = walletBudgetCap ?? range.max;
    setValue('budgetMin', Math.min(range.min, cap), { shouldValidate: true });
    setValue('budgetMax', Math.min(range.max, cap), { shouldValidate: true });
  }, [activeService?.slug, setValue, activeService, walletBudgetCap]);

  const activeStep: 1 | 2 | 3 = !serviceSlug
    ? 1
    : !(customerName?.trim() && customerPhone?.trim() && scheduledAt)
      ? 2
      : 3;

  const depositPercent = Number.isFinite(applyDepositPercent)
    ? clampApplyDepositPercent(applyDepositPercent, budgetMax || 0)
    : depositBounds.defaultPercent;
  const depositFillPct =
    ((depositPercent - depositBounds.min) /
      Math.max(1, depositBounds.max - depositBounds.min)) *
    100;
  const depositEstimate = Math.max(
    depositPercent === 0 ? 0 : 1,
    Math.round(((budgetMax || 0) * depositPercent) / 100),
  );

  const bookingMutation = useMutation({
    mutationFn: api.createBooking,
    onSuccess: async (booking) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        queryClient.invalidateQueries({ queryKey: ['bookings', 'mine'] }),
        refreshMe(),
      ]);
      navigate(`/dat-lich/${booking.id}`);
    },
  });

  function onSubmit(values: HireServiceFormValues) {
    if (!user) {
      navigate(`/dang-nhap?redirect=/don-cua-toi/thue`);
      return;
    }

    const taskNote = tasks.map((t) => t.trim()).filter(Boolean).join('\n');
    bookingMutation.mutate({
      serviceSlug: values.serviceSlug,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      customerEmail: values.customerEmail || undefined,
      address: 'Cập nhật sau khi chọn người làm',
      scheduledAt: new Date(values.scheduledAt).toISOString(),
      publishAt:
        values.schedulePublish && values.publishAt?.trim()
          ? new Date(values.publishAt).toISOString()
          : undefined,
      note: taskNote || undefined,
      budgetMin: values.budgetMin,
      budgetMax: values.budgetMax,
      applyDepositPercent: values.applyDepositPercent,
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] xl:items-start xl:gap-5">
      <section className="hire-form min-w-0 overflow-hidden rounded-xl border border-[var(--color-line)] bg-white shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-line)] bg-gradient-to-br from-white via-white to-[var(--color-brand-soft)]/60 px-4 py-2.5 sm:px-5 sm:py-3">
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

      <div className="px-4 py-3 sm:px-5 sm:py-3.5">
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
          className="grid gap-3 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-3"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div>
            <FieldLabel htmlFor="hire-service-slug">
              Nghề / dịch vụ cần thuê
            </FieldLabel>
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

          <div className="sm:col-span-2 overflow-hidden rounded-xl border border-[#DCE6EC] bg-white">
            <div className="grid lg:grid-cols-2">
              <div className="px-3 py-2.5 sm:px-4 sm:py-3">
                <PriceRangeSlider
                  layout="vertical"
                  title="Ngân sách dự kiến"
                  min={budgetMin}
                  max={budgetMax}
                  maxSelectable={walletBudgetCap ?? undefined}
                  showBubbles
                  onChange={({ min, max }) => {
                    setValue('budgetMin', min, { shouldValidate: true });
                    setValue('budgetMax', max, { shouldValidate: true });
                  }}
                />
                {errors.budgetMin ? (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.budgetMin.message}
                  </p>
                ) : null}
                {errors.budgetMax ? (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.budgetMax.message}
                  </p>
                ) : null}
              </div>

              <div className="border-t border-[#DCE6EC] px-3 py-2.5 sm:px-4 sm:py-3 lg:border-t-0 lg:border-l">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-bold leading-tight text-[#0F2F4A]">
                      Mức cọc ứng tuyển người làm
                    </h3>
                    <p className="mt-0.5 text-[10px] leading-snug text-[#64748B] line-clamp-2">
                      {(budgetMax || 0) > APPLY_DEPOSIT_BUDGET_THRESHOLD
                        ? 'Ngân sách trên 5 triệu: chọn từ 50% đến 100%.'
                        : 'Ngân sách từ 5 triệu trở xuống: chọn từ 0% đến 50%.'}{' '}
                      Cọc giữ chỗ của bạn vẫn theo ngân sách đơn.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <input
                      id="hire-apply-deposit"
                      type="number"
                      min={depositBounds.min}
                      max={depositBounds.max}
                      step={1}
                      {...register('applyDepositPercent', { valueAsNumber: true })}
                      className="w-11 rounded-md border border-[#DCE6EC] bg-white px-1 py-1 text-center text-sm font-bold tabular-nums text-[#0F2F4A] outline-none transition focus:border-[#079A9A] focus:shadow-[0_0_0_3px_rgba(7,154,154,0.15)]"
                    />
                    <span className="text-sm font-bold text-[#0F2F4A]">%</span>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-[minmax(0,1fr)_5.75rem] items-end gap-2">
                  <div className="min-w-0">
                    <div className="price-range-wrap relative h-9 px-1 pt-5">
                      <span
                        className="pointer-events-none absolute top-0 z-4 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#079A9A] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm"
                        style={{ left: `${depositFillPct}%` }}
                      >
                        {depositPercent}%
                      </span>
                      <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#DCE6EC]" />
                      <div
                        className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#079A9A]"
                        style={{ width: `${depositFillPct}%` }}
                      />
                      <input
                        type="range"
                        min={depositBounds.min}
                        max={depositBounds.max}
                        step={1}
                        value={depositPercent}
                        onChange={(e) =>
                          setValue(
                            'applyDepositPercent',
                            clampApplyDepositPercent(
                              Number(e.target.value),
                              budgetMax || 0,
                            ),
                            { shouldValidate: true },
                          )
                        }
                        className="price-range-thumb absolute left-0 right-0 top-1/2 z-2 w-full -translate-y-1/2 appearance-none bg-transparent"
                        aria-label="Mức cọc ứng tuyển %"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-center rounded-lg bg-[#E8F7F6] px-2 py-1.5 text-center">
                    <p className="text-[10px] font-semibold text-[#079A9A]">
                      Ước tính
                    </p>
                    <p className="mt-0.5 text-base font-extrabold tabular-nums leading-none text-[#079A9A]">
                      {depositEstimate.toLocaleString('vi-VN')}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold text-[#079A9A]">
                      VNĐ
                    </p>
                  </div>
                </div>

                {errors.applyDepositPercent ? (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.applyDepositPercent.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="hire-phone">Số điện thoại</FieldLabel>
            <input
              id="hire-phone"
              {...register('customerPhone')}
              placeholder="09xx xxx xxx"
              className="field-input hire-field-input"
            />
            {errors.customerPhone ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.customerPhone.message}
              </p>
            ) : null}
          </div>
          <div>
            <FieldLabel htmlFor="hire-scheduled">Thời gian mong muốn</FieldLabel>
            <Controller
              name="scheduledAt"
              control={control}
              render={({ field }) => (
                <DatetimeLocalField
                  id="hire-scheduled"
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  invalid={Boolean(errors.scheduledAt)}
                  className="is-compact"
                />
              )}
            />
            {errors.scheduledAt ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.scheduledAt.message}
              </p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)]/60 px-3 py-2.5">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-[var(--color-line)] text-[var(--color-brand)]"
                {...register('schedulePublish')}
              />
              <span>
                <span className="block text-[13px] font-semibold text-[var(--color-ink)]">
                  Hẹn giờ đăng lên bảng tin
                </span>
                <span className="mt-0.5 block text-[11px] text-[var(--color-muted)]">
                  Giữ đơn riêng đến giờ chọn — chưa hiện cho người làm. Xem lịch tại
                  «Lịch đăng đơn».
                </span>
              </span>
            </label>
            {schedulePublish ? (
              <div className="mt-2">
                <FieldLabel htmlFor="hire-publish">Giờ đăng bảng tin</FieldLabel>
                <Controller
                  name="publishAt"
                  control={control}
                  render={({ field }) => (
                    <DatetimeLocalField
                      id="hire-publish"
                      name={field.name}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      invalid={Boolean(errors.publishAt)}
                      className="is-compact"
                    />
                  )}
                />
                {errors.publishAt ? (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.publishAt.message}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <FieldLabel htmlFor="hire-task-draft">Công việc cần làm</FieldLabel>
            <p className="mb-1.5 text-[11px] text-[var(--color-muted)]">
              Thêm từng mục trước khi gửi. Sau khi đăng đơn danh sách bị khóa.
            </p>
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

          <div className="sm:col-span-2 flex flex-col gap-2.5 border-t border-[var(--color-line)] pt-3 sm:flex-row sm:items-center sm:justify-between">
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
              disabled={bookingMutation.isPending || !user}
              className="btn-primary inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 text-sm disabled:opacity-60"
            >
              <Icon name="send" className="h-4 w-4" />
              {bookingMutation.isPending
                ? 'Đang gửi…'
                : 'Gửi yêu cầu thuê dịch vụ'}
            </button>
          </div>
        </form>
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
        tasks={tasks}
      />
    </div>
  );
}
