import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AddressMapPicker } from '../components/booking/address-map-picker';
import { DatetimeLocalField } from '../components/ui/datetime-local-field';
import { CatalogOverlayHero } from '../components/catalog/group-detail-hero';
import { ProviderTile } from '../components/catalog/provider-tile';
import {
  ProviderFilterPanel,
  PRICE_SLIDER_MAX,
  PRICE_SLIDER_MIN,
  type ProviderSortKey,
} from '../components/catalog/provider-filter-panel';
import { ServiceHeroPricePanel } from '../components/catalog/service-hero-price-panel';
import {
  createBookingSchema,
  defaultScheduledAtLocal,
  type CreateBookingFormValues,
} from '../features/booking/create-booking-schema';
import { useAuth } from '../features/auth/auth-context';
import { api, formatPrice } from '../services/api';
import type { ServiceProvider } from '../types/catalog';
import { groupColor } from '../utils/catalog-colors';
import { fuzzyMatch } from '../utils/search';

export function ServiceDetailPage() {
  const { slug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const preselectPartnerId = searchParams.get('partner')?.trim() || '';
  const navigate = useNavigate();
  const { user, loading: authLoading, mode } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const [nameQuery, setNameQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [priceMin, setPriceMin] = useState(PRICE_SLIDER_MIN);
  const [priceMax, setPriceMax] = useState(PRICE_SLIDER_MAX);
  const [expMin, setExpMin] = useState('');
  const [sortKey, setSortKey] = useState<ProviderSortKey>('rating');

  /** Form thuê chỉ dành cho mode Khách thuê (không hiện khi đang Người làm). */
  const isHireMode = !user || mode === 'hire';
  /** Cột phải + form chỉ hiện khi đã chọn người làm. */
  const showHirePanel = isHireMode && Boolean(selectedProvider);

  const serviceQuery = useQuery({
    queryKey: ['service', slug],
    queryFn: () => api.getService(slug),
    enabled: Boolean(slug),
  });

  const providersQuery = useQuery({
    queryKey: ['service', slug, 'providers'],
    queryFn: () => api.getServiceProviders(slug),
    enabled: Boolean(slug),
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateBookingFormValues>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      address: '',
      scheduledAt: defaultScheduledAtLocal(),
      note: '',
    },
  });

  useEffect(() => {
    if (!user) return;
    reset((current) => ({
      ...current,
      customerName: current.customerName || user.fullName,
      customerPhone: current.customerPhone || user.phone || '',
      customerEmail: current.customerEmail || user.email,
    }));
  }, [user, reset]);

  useEffect(() => {
    if (!preselectPartnerId || !providersQuery.data?.length) return;
    const match = providersQuery.data.find(
      (p) => p.partner.userId === preselectPartnerId,
    );
    if (match) {
      setSelectedProvider(match);
      setShowBookingForm(true);
    }
  }, [preselectPartnerId, providersQuery.data]);

  const bookingMutation = useMutation({
    mutationFn: api.createBooking,
    onSuccess: (booking) => navigate(`/dat-lich/${booking.id}`),
  });

  const filteredProviders = useMemo(() => {
    const list = providersQuery.data ?? [];
    const min = priceMin;
    const max = priceMax;
    const exp = expMin ? Number(expMin) : null;
    const name = nameQuery.trim();
    const city = cityQuery.trim();

    const filtered = list.filter((item) => {
      const nameHay = `${item.partner.fullName} ${item.headline || item.partner.headline || ''}`;
      if (name && !fuzzyMatch(nameHay, name)) return false;
      if (city && !fuzzyMatch(item.partner.city || '', city)) return false;
      if (item.price < min) return false;
      if (item.price > max) return false;
      if (exp !== null && !Number.isNaN(exp) && item.experienceYears < exp) return false;
      return true;
    });

    filtered.sort((a, b) => {
      switch (sortKey) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name':
          return a.partner.fullName.localeCompare(b.partner.fullName, 'vi');
        case 'experience':
          return b.experienceYears - a.experienceYears;
        case 'rating':
        default:
          if (b.partner.isVerified !== a.partner.isVerified) {
            return Number(b.partner.isVerified) - Number(a.partner.isVerified);
          }
          return b.partner.ratingAvg - a.partner.ratingAvg;
      }
    });

    return filtered;
  }, [providersQuery.data, nameQuery, cityQuery, priceMin, priceMax, expMin, sortKey]);

  function openBooking(provider?: ServiceProvider | null) {
    if (!isHireMode) {
      return;
    }
    if (provider) setSelectedProvider(provider);
    if (!user) {
      navigate(`/dang-nhap?redirect=/dich-vu/${slug}`);
      return;
    }
    setShowBookingForm(true);
    requestAnimationFrame(() => {
      document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  useEffect(() => {
    if (mode === 'offer') {
      setShowBookingForm(false);
      setSelectedProvider(null);
    }
  }, [mode]);

  function onSubmit(values: CreateBookingFormValues) {
    if (!user) {
      navigate(`/dang-nhap?redirect=/dich-vu/${slug}`);
      return;
    }

    bookingMutation.mutate({
      serviceSlug: slug,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      customerEmail: values.customerEmail || undefined,
      address: values.address,
      scheduledAt: new Date(values.scheduledAt).toISOString(),
      partnerId: selectedProvider?.partner.userId,
      note: values.note || undefined,
    });
  }

  if (serviceQuery.isLoading || authLoading) return <p>Đang tải dịch vụ...</p>;
  if (serviceQuery.isError || !serviceQuery.data) {
    return <p className="text-red-600">Không tìm thấy dịch vụ.</p>;
  }

  const service = serviceQuery.data;
  const color = groupColor(service.category.group.slug);

  return (
    <div className="animate-fade-up space-y-8">
      <div className="full-bleed -mt-6">
        <CatalogOverlayHero
          backTo={`/nhom/${service.category.group.slug}`}
          backLabel={service.category.group.name}
          title={service.name}
          subtitle={service.description ?? undefined}
          color={color}
          compact
          showOnlineBadge={false}
          aside={
            <ServiceHeroPricePanel
              basePrice={service.basePrice}
              min={service.priceMin}
              max={service.priceMax}
              unit={service.unit}
              durationMin={service.durationMin}
              compact
            />
          }
        />
      </div>

      {showHirePanel ? (
        <aside className="surface-card flex flex-col justify-center gap-4 p-5 sm:p-6">
          <h2 className="text-xl font-extrabold">Thuê dịch vụ này</h2>
          <p
            className="rounded-xl px-3 py-2 text-[15px]"
            style={{ backgroundColor: color.soft, color: color.ink }}
          >
            Đã chọn: <strong>{selectedProvider!.partner.fullName}</strong> · Giá chào{' '}
            {formatPrice(selectedProvider!.price)}/{service.unit}
          </p>
          <p className="text-xs text-[var(--color-muted)]">
            Sau khi tạo đơn bạn phải <strong>đặt cọc giữ chỗ</strong> mới vào hàng chờ / mở chat.
          </p>
          <button
            type="button"
            onClick={() => openBooking(selectedProvider)}
            className="btn-primary px-4 py-3 text-[15px]"
          >
            {showBookingForm ? 'Cuộn tới form thuê' : 'Hiện form thuê dịch vụ'}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedProvider(null);
              setShowBookingForm(false);
            }}
            className="text-sm font-semibold hover:underline"
            style={{ color: color.ink }}
          >
            Bỏ chọn người làm
          </button>
        </aside>
      ) : null}

      {showHirePanel && showBookingForm ? (
        <section id="booking-form" className="surface-card animate-fade-in p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold">Form thuê dịch vụ</h2>
            <button
              type="button"
              onClick={() => setShowBookingForm(false)}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--color-muted)] hover:bg-black/5"
            >
              Đóng
            </button>
          </div>

          {selectedProvider ? (
            <div
              className="mt-3 flex items-center justify-between gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: color.soft, color: color.ink }}
            >
              <p className="text-[15px]">
                Đang thuê: <strong>{selectedProvider.partner.fullName}</strong> · Giá chào{' '}
                {formatPrice(selectedProvider.price)}/{service.unit}
              </p>
            </div>
          ) : null}

          {!user ? (
            <div className="mt-4 space-y-3">
              <Link
                to={`/dang-nhap?redirect=/dich-vu/${slug}`}
                className="btn-primary inline-block px-4 py-3 text-[15px]"
              >
                Đăng nhập để thuê
              </Link>
              <p className="text-sm text-[var(--color-muted)]">
                Chưa có tài khoản?{' '}
                <Link to="/dang-ky" className="font-semibold text-[var(--color-brand-deep)]">
                  Đăng ký
                </Link>
              </p>
            </div>
          ) : (
            <form
              className="mt-4 grid gap-3 sm:grid-cols-2"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <div>
                <input {...register('customerName')} placeholder="Họ và tên" className="field-input" />
                {errors.customerName ? (
                  <p className="mt-1 text-sm text-red-600">{errors.customerName.message}</p>
                ) : null}
              </div>
              <div>
                <input
                  {...register('customerPhone')}
                  placeholder="Số điện thoại"
                  className="field-input"
                />
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
                <Controller
                  name="scheduledAt"
                  control={control}
                  render={({ field }) => (
                    <DatetimeLocalField
                      id="service-booking-scheduled"
                      name={field.name}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      invalid={Boolean(errors.scheduledAt)}
                    />
                  )}
                />
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
                      id="service-booking-address"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.address?.message}
                    />
                  )}
                />
              </div>
              <div className="sm:col-span-2">
                <textarea
                  {...register('note')}
                  rows={3}
                  placeholder="Ghi chú thêm"
                  className="field-input"
                />
              </div>
              {bookingMutation.isError ? (
                <p className="sm:col-span-2 text-sm text-red-600">
                  {(bookingMutation.error as Error).message || 'Thuê dịch vụ thất bại'}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={bookingMutation.isPending}
                className="btn-primary px-4 py-3 text-[15px] disabled:opacity-60 sm:col-span-2"
              >
                {bookingMutation.isPending
                  ? 'Đang gửi...'
                  : `Xác nhận thuê ${selectedProvider?.partner.fullName ?? ''}`}
              </button>
            </form>
          )}
        </section>
      ) : null}

      <section>
        <ProviderFilterPanel
          nameQuery={nameQuery}
          onNameQueryChange={setNameQuery}
          cityQuery={cityQuery}
          onCityQueryChange={setCityQuery}
          expMin={expMin}
          onExpMinChange={setExpMin}
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
          priceMin={priceMin}
          priceMax={priceMax}
          onPriceRangeChange={({ min, max }) => {
            setPriceMin(min);
            setPriceMax(max);
          }}
          onClear={() => {
            setNameQuery('');
            setCityQuery('');
            setPriceMin(PRICE_SLIDER_MIN);
            setPriceMax(PRICE_SLIDER_MAX);
            setExpMin('');
            setSortKey('rating');
          }}
        />

        {providersQuery.isLoading ? (
          <p className="mt-4 text-[var(--color-muted)]">Đang tải danh sách...</p>
        ) : null}
        {providersQuery.isError ? (
          <p className="mt-4 text-red-600">Không tải được danh sách người làm.</p>
        ) : null}

        {!providersQuery.isLoading && filteredProviders.length === 0 ? (
          <p className="mt-4 text-[var(--color-muted)]">
            Không có người khớp bộ lọc. Thử xóa lọc.
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-4 rounded-[22px] bg-[#F4F8FC] p-3 sm:p-4">
          {filteredProviders.map((provider) => (
            <ProviderTile
              key={provider.id}
              provider={provider}
              unit={service.unit}
              canHire={isHireMode}
              selected={selectedProvider?.partner.userId === provider.partner.userId}
              onSelect={() => openBooking(provider)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
