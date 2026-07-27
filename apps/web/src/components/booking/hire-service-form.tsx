import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import {
  hireServiceSchema,
  type HireServiceFormValues,
} from '../../features/booking/create-booking-schema';
import { useAuth } from '../../features/auth/auth-context';
import { api } from '../../services/api';
import type { CatalogTreeService, ServiceGroupTree } from '../../types/catalog';
import { groupColor } from '../../utils/catalog-colors';
import { marketPriceRange } from '../../utils/market-price';
import { AddressMapPicker } from './address-map-picker';
import type { CatalogServicePick } from '../home/catalog-menu-shared';
import { PRICE_SLIDER_MIN, PriceRangeSlider } from '../ui/price-range-slider';
import { Icon } from '../ui/icon';

type ServiceOption = CatalogServicePick & Pick<CatalogTreeService, 'basePrice' | 'priceMin' | 'priceMax'>;

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

type Props = {
  groups: ServiceGroupTree[];
  selected: CatalogServicePick | null;
  onSelectedChange: (pick: CatalogServicePick | null) => void;
};

export function HireServiceForm({ groups, selected, onSelectedChange }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

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
      scheduledAt: '',
      note: '',
      budgetMin: PRICE_SLIDER_MIN,
      budgetMax: 5_000_000,
    },
  });

  const serviceSlug = watch('serviceSlug');
  const budgetMin = watch('budgetMin');
  const budgetMax = watch('budgetMax');

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
    if (!serviceSlug) {
      if (selected) onSelectedChange(null);
      return;
    }
    const match = services.find((item) => item.slug === serviceSlug);
    if (match && match.slug !== selected?.slug) {
      onSelectedChange(match);
    }
  }, [serviceSlug, services, selected?.slug, onSelectedChange, selected]);

  const activeService = services.find((item) => item.slug === serviceSlug) ?? null;
  const activeColor = activeService ? groupColor(activeService.groupSlug) : null;

  useEffect(() => {
    if (!activeService) return;
    const range = defaultBudgetForService(activeService);
    setValue('budgetMin', range.min, { shouldValidate: true });
    setValue('budgetMax', range.max, { shouldValidate: true });
  }, [activeService?.slug, setValue, activeService]);

  const bookingMutation = useMutation({
    mutationFn: api.createBooking,
    onSuccess: (booking) => navigate(`/dat-lich/${booking.id}`),
  });

  function onSubmit(values: HireServiceFormValues) {
    if (!user) {
      navigate(`/dang-nhap?redirect=/don-cua-toi/thue`);
      return;
    }

    bookingMutation.mutate({
      serviceSlug: values.serviceSlug,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      customerEmail: values.customerEmail || undefined,
      address: values.address,
      scheduledAt: new Date(values.scheduledAt).toISOString(),
      note: values.note || undefined,
      budgetMin: values.budgetMin,
      budgetMax: values.budgetMax,
    });
  }

  return (
    <section className="surface-card min-w-0 p-5 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold sm:text-2xl">Đăng ký thuê dịch vụ</h1>
        <p className="mt-1.5 text-sm text-[var(--color-muted)] sm:text-[15px]">
          Chọn nghề trong form, điền thông tin rồi gửi yêu cầu. Sau khi tạo đơn bạn
          cần <strong>đặt cọc</strong> để vào hàng chờ người làm.
        </p>
      </div>

      {!user ? (
        <div className="mb-5 rounded-xl bg-[var(--color-brand-soft)] px-4 py-3">
          <Link
            to="/dang-nhap?redirect=/don-cua-toi/thue"
            className="font-semibold text-[var(--color-brand-deep)] hover:underline"
          >
            Đăng nhập
          </Link>{' '}
          để gửi yêu cầu thuê dịch vụ.
        </div>
      ) : null}

      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="sm:col-span-2">
          <label htmlFor="hire-service-slug" className="mb-1.5 block text-sm font-semibold">
            Nghề / dịch vụ cần thuê
          </label>
          <select id="hire-service-slug" {...register('serviceSlug')} className="field-input">
            <option value="">— Chọn nghề —</option>
            {groups.map((group) => {
              const groupServices = services.filter((item) => item.groupSlug === group.slug);
              if (groupServices.length === 0) return null;
              return (
                <optgroup key={group.id} label={group.name}>
                  {groupServices.map((service) => (
                    <option key={service.id} value={service.slug}>
                      {service.name} · {service.categoryName}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          {errors.serviceSlug ? (
            <p className="mt-1 text-sm text-red-600">{errors.serviceSlug.message}</p>
          ) : null}
        </div>

        {activeService && activeColor ? (
          <div
            className="sm:col-span-2 flex flex-wrap items-center gap-2 rounded-xl px-4 py-3"
            style={{ backgroundColor: activeColor.soft, color: activeColor.ink }}
          >
            <Icon name="sparkles" className="h-4 w-4 shrink-0" style={{ color: activeColor.main }} />
            <div className="min-w-0">
              <p className="font-bold">{activeService.name}</p>
              <p className="text-sm opacity-80">
                {activeService.groupName} · {activeService.categoryName}
              </p>
            </div>
            <Link
              to={`/dich-vu/${activeService.slug}`}
              className="ml-auto text-sm font-semibold hover:underline"
              style={{ color: activeColor.ink }}
            >
              Xem chi tiết ›
            </Link>
          </div>
        ) : (
          <p className="sm:col-span-2 rounded-xl border border-dashed border-[var(--color-line)] px-4 py-3 text-sm text-[var(--color-muted)]">
            Chọn nghề / dịch vụ trong dropdown phía trên.
          </p>
        )}

        <div className="sm:col-span-2">
          <PriceRangeSlider
            min={budgetMin}
            max={budgetMax}
            onChange={({ min, max }) => {
              setValue('budgetMin', min, { shouldValidate: true });
              setValue('budgetMax', max, { shouldValidate: true });
            }}
          />
          {errors.budgetMin ? (
            <p className="mt-1 text-sm text-red-600">{errors.budgetMin.message}</p>
          ) : null}
          {errors.budgetMax ? (
            <p className="mt-1 text-sm text-red-600">{errors.budgetMax.message}</p>
          ) : null}
        </div>

        <div>
          <input {...register('customerName')} placeholder="Họ và tên" className="field-input" />
          {errors.customerName ? (
            <p className="mt-1 text-sm text-red-600">{errors.customerName.message}</p>
          ) : null}
        </div>
        <div>
          <input {...register('customerPhone')} placeholder="Số điện thoại" className="field-input" />
          {errors.customerPhone ? (
            <p className="mt-1 text-sm text-red-600">{errors.customerPhone.message}</p>
          ) : null}
        </div>
        <div>
          <input
            {...register('customerEmail')}
            type="email"
            placeholder="Email (tuỳ chọn)"
            className="field-input"
          />
        </div>
        <div>
          <input {...register('scheduledAt')} type="datetime-local" className="field-input" />
          {errors.scheduledAt ? (
            <p className="mt-1 text-sm text-red-600">{errors.scheduledAt.message}</p>
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
              />
            )}
          />
        </div>
        <div className="sm:col-span-2">
          <textarea
            {...register('note')}
            rows={3}
            placeholder="Mô tả công việc, yêu cầu thêm…"
            className="field-input"
          />
        </div>

        {bookingMutation.isError ? (
          <p className="sm:col-span-2 text-sm text-red-600">
            {(bookingMutation.error as Error).message || 'Gửy yêu cầu thất bại'}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={bookingMutation.isPending || !user}
          className="btn-primary px-4 py-3 text-[15px] disabled:opacity-60 sm:col-span-2"
        >
          {bookingMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu thuê'}
        </button>
      </form>
    </section>
  );
}
