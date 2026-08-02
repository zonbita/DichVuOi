import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import {
  hireServiceSchema,
  defaultScheduledAtLocal,
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
import { AddressMapPicker } from './address-map-picker';
import { HireServicePicker } from './hire-service-picker';
import { HireTasksInput } from './hire-tasks-input';
import type { CatalogServicePick } from '../home/catalog-menu-shared';
import { PRICE_SLIDER_MIN, PriceRangeSlider } from '../ui/price-range-slider';
import { Icon } from '../ui/icon';

type ServiceOption = CatalogServicePick &
  Pick<CatalogTreeService, 'basePrice' | 'priceMin' | 'priceMax'>;

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
      className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]"
    >
      {children}
    </label>
  );
}

function HireStepper({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2" aria-label="Tiến trình đăng ký">
      {STEPS.map((step, index) => {
        const done = activeStep > step.id;
        const current = activeStep === step.id;
        return (
          <li key={step.id} className="flex items-center gap-1.5 sm:gap-2">
            {index > 0 ? (
              <span
                className={`hidden h-px w-5 sm:block sm:w-8 ${
                  activeStep >= step.id
                    ? 'bg-[var(--color-brand)]'
                    : 'bg-[var(--color-line)]'
                }`}
                aria-hidden
              />
            ) : null}
            <span className="flex items-center gap-1.5 sm:gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 sm:text-sm ${
                  done || current
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'bg-[var(--color-canvas)] text-[var(--color-muted)] ring-1 ring-[var(--color-line)]'
                }`}
              >
                {done ? (
                  <Icon name="check" className="h-3.5 w-3.5" />
                ) : (
                  step.id
                )}
              </span>
              <span
                className={`hidden text-xs font-semibold sm:inline md:text-sm ${
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
      address: '',
      scheduledAt: defaultScheduledAtLocal(),
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
  const address = watch('address');
  const scheduledAt = watch('scheduledAt');

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
    : !(
          customerName?.trim() &&
          customerPhone?.trim() &&
          address?.trim() &&
          scheduledAt
        )
      ? 2
      : 3;

  const bookingMutation = useMutation({
    mutationFn: api.createBooking,
    onSuccess: async (booking) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
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
      address: values.address,
      scheduledAt: new Date(values.scheduledAt).toISOString(),
      note: taskNote || undefined,
      budgetMin: values.budgetMin,
      budgetMax: values.budgetMax,
      applyDepositPercent: values.applyDepositPercent,
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-line)] bg-gradient-to-br from-white via-white to-[var(--color-brand-soft)]/60 px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-white shadow-sm">
            <Icon name="briefcase" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight text-[var(--color-navy)] sm:text-2xl">
              Đăng ký thuê dịch vụ
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Chọn nghề, điền thông tin rồi gửi yêu cầu — đặt cọc sau khi tạo đơn.
            </p>
          </div>
        </div>
        <HireStepper activeStep={activeStep} />
      </div>

      <div className="px-5 py-5 sm:px-7 sm:py-6">
        {!user ? (
          <div className="mb-5 rounded-xl bg-[var(--color-brand-soft)] px-4 py-3 text-sm">
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
          className="grid gap-5 sm:grid-cols-2"
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
              className="flex flex-wrap items-center gap-2.5 self-end rounded-xl px-4 py-3.5"
              style={{
                backgroundColor: activeColor.soft,
                color: activeColor.ink,
              }}
            >
              <Icon
                name="briefcase"
                className="h-4 w-4 shrink-0"
                style={{ color: activeColor.main }}
              />
              <div className="min-w-0 flex flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p className="font-bold">{activeService.name}</p>
                <p className="text-sm opacity-80">
                  {activeService.groupName} · {activeService.categoryName}
                </p>
              </div>
              <Link
                to={`/dich-vu/${activeService.slug}`}
                className="ml-auto shrink-0 text-sm font-semibold hover:underline"
                style={{ color: activeColor.ink }}
              >
                Xem chi tiết ›
              </Link>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 self-end rounded-xl bg-[var(--color-brand-soft)] px-4 py-3.5 text-sm text-[var(--color-brand-deep)]">
              <Icon name="briefcase" className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <span className="font-semibold">Nghề / dịch vụ chưa được chọn.</span>{' '}
                Chọn từ danh sách bên trái để tiếp tục.
              </p>
            </div>
          )}

          <div className="sm:col-span-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)]/50 p-4 sm:p-5">
            <PriceRangeSlider
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

          <div className="sm:col-span-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)]/50 p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <FieldLabel htmlFor="hire-apply-deposit">
                  Mức cọc ứng tuyển người làm
                </FieldLabel>
                <p className="text-xs text-[var(--color-muted)]">
                  {(budgetMax || 0) > APPLY_DEPOSIT_BUDGET_THRESHOLD
                    ? 'Ngân sách trên 5 triệu: chọn từ 50% đến 100%.'
                    : 'Ngân sách từ 5 triệu trở xuống: chọn từ 0% đến 50%.'}{' '}
                  Cọc giữ chỗ của bạn vẫn theo ngân sách đơn.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="hire-apply-deposit"
                  type="number"
                  min={depositBounds.min}
                  max={depositBounds.max}
                  step={1}
                  {...register('applyDepositPercent', { valueAsNumber: true })}
                  className="field-input w-24 text-center font-bold tabular-nums"
                />
                <span className="text-sm font-bold text-[var(--color-ink)]">%</span>
              </div>
            </div>
            <input
              type="range"
              min={depositBounds.min}
              max={depositBounds.max}
              step={1}
              value={
                Number.isFinite(applyDepositPercent)
                  ? clampApplyDepositPercent(applyDepositPercent, budgetMax || 0)
                  : depositBounds.defaultPercent
              }
              onChange={(e) =>
                setValue(
                  'applyDepositPercent',
                  clampApplyDepositPercent(Number(e.target.value), budgetMax || 0),
                  { shouldValidate: true },
                )
              }
              className="mt-4 w-full accent-[var(--color-brand)]"
              aria-label="Mức cọc ứng tuyển %"
            />
            <p className="mt-2 text-sm font-semibold text-[var(--color-brand-deep)]">
              {Number.isFinite(applyDepositPercent)
                ? applyDepositPercent
                : depositBounds.defaultPercent}
              % · ước tính{' '}
              {Math.max(
                applyDepositPercent === 0 ? 0 : 1,
                Math.round(
                  ((budgetMax || 0) *
                    (Number.isFinite(applyDepositPercent)
                      ? applyDepositPercent
                      : depositBounds.defaultPercent)) /
                    100,
                ),
              ).toLocaleString('vi-VN')}{' '}
              VNĐ
              <span className="ml-1 font-medium text-[var(--color-muted)]">
                ({depositBounds.min}–{depositBounds.max}%)
              </span>
            </p>
            {errors.applyDepositPercent ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.applyDepositPercent.message}
              </p>
            ) : null}
          </div>

          <div>
            <FieldLabel htmlFor="hire-name">Họ và tên</FieldLabel>
            <input
              id="hire-name"
              {...register('customerName')}
              placeholder="Nguyễn Văn A"
              className="field-input"
            />
            {errors.customerName ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.customerName.message}
              </p>
            ) : null}
          </div>
          <div>
            <FieldLabel htmlFor="hire-phone">Số điện thoại</FieldLabel>
            <input
              id="hire-phone"
              {...register('customerPhone')}
              placeholder="09xx xxx xxx"
              className="field-input"
            />
            {errors.customerPhone ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.customerPhone.message}
              </p>
            ) : null}
          </div>
          <div>
            <FieldLabel htmlFor="hire-email">Email</FieldLabel>
            <input
              id="hire-email"
              {...register('customerEmail')}
              type="email"
              placeholder="email@example.com (tuỳ chọn)"
              className="field-input"
            />
          </div>
          <div>
            <FieldLabel htmlFor="hire-scheduled">Thời gian mong muốn</FieldLabel>
            <div className="relative">
              <Icon
                name="calendar"
                className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-muted)]"
              />
              <input
                id="hire-scheduled"
                {...register('scheduledAt')}
                type="datetime-local"
                className="field-input bg-[var(--color-canvas)] pl-10"
              />
            </div>
            {errors.scheduledAt ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.scheduledAt.message}
              </p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <AddressMapPicker
                  id="hire-address"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.address?.message}
                  disabled={!user}
                  placeholder="Số nhà, đường, phường / quận…"
                />
              )}
            />
          </div>

          <div className="sm:col-span-2">
            <FieldLabel htmlFor="hire-task-draft">Công việc cần làm</FieldLabel>
            <p className="mb-2 text-xs text-[var(--color-muted)]">
              Thêm từng mục trước khi gửi. Sau khi đăng đơn, danh sách bị khóa —
              không thêm được nữa.
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

          <div className="sm:col-span-2 flex flex-col gap-4 border-t border-[var(--color-line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5 text-sm text-[var(--color-muted)]">
              <Icon
                name="shield"
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
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
              className="btn-primary inline-flex shrink-0 items-center justify-center gap-2 px-5 py-3 text-[15px] disabled:opacity-60"
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
  );
}
