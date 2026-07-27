import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useForm, Controller } from 'react-hook-form';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AvatarLevelOverlay, LevelBadge, VerificationBadge } from '../components/ui/partner-badges';
import { AddressMapPicker } from '../components/booking/address-map-picker';
import { ReputationProgressBar } from '../components/partner/reputation-progress-bar';
import { CatalogOverlayHero } from '../components/catalog/group-detail-hero';
import {
  ProviderFilterPanel,
  PRICE_SLIDER_MAX,
  PRICE_SLIDER_MIN,
  type ProviderSortKey,
} from '../components/catalog/provider-filter-panel';
import { ServiceHeroPricePanel } from '../components/catalog/service-hero-price-panel';
import {
  createBookingSchema,
  type CreateBookingFormValues,
} from '../features/booking/create-booking-schema';
import { useAuth } from '../features/auth/auth-context';
import { api, formatPrice, formatWorkHours } from '../services/api';
import type { ServiceProvider } from '../types/catalog';
import { groupColor } from '../utils/catalog-colors';
import { serviceImage } from '../utils/catalog-images';
import { fuzzyMatch } from '../utils/search';

const TOOLTIP_W = 320;
const TOOLTIP_OFFSET = 14;

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function clampTooltipPosition(x: number, y: number) {
  const maxX = window.innerWidth - TOOLTIP_W - 12;
  const approxH = 280;
  const maxY = window.innerHeight - approxH - 12;
  return {
    left: Math.max(12, Math.min(x + TOOLTIP_OFFSET, maxX)),
    top: Math.max(12, Math.min(y + TOOLTIP_OFFSET, maxY)),
  };
}

function PartnerAvatar({
  name,
  src,
  size = 'md',
  round = false,
}: {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  round?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const box =
    size === 'xl'
      ? 'h-20 w-20'
      : size === 'lg'
        ? 'h-16 w-16'
        : size === 'sm'
          ? 'h-10 w-10'
          : 'h-16 w-16';
  const text = size === 'sm' ? 'text-sm' : size === 'xl' ? 'text-2xl' : 'text-lg';
  const shape = round ? 'rounded-full' : 'rounded-2xl';
  const ring = round ? 'ring-4 ring-white shadow-md' : 'ring-1 ring-[var(--color-brand)]/20';

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setBroken(true)}
        className={`${box} ${shape} object-cover ${ring}`}
      />
    );
  }

  return (
    <div
      className={`flex ${box} items-center justify-center ${shape} bg-gradient-to-br from-[var(--color-brand-soft)] to-white ${text} font-extrabold text-[var(--color-brand-deep)] ${ring}`}
    >
      {initials(name)}
    </div>
  );
}

function shortTrade(headline: string | null | undefined) {
  if (!headline) return '';
  const part = headline.split('·')[0]?.trim() || headline.trim();
  return part.length > 28 ? `${part.slice(0, 26)}…` : part;
}

function ProviderTile({
  provider,
  unit,
  selected,
  canHire,
  onSelect,
}: {
  provider: ServiceProvider;
  unit: string;
  selected: boolean;
  canHire: boolean;
  onSelect: () => void;
}) {
  const { partner } = provider;
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const trade = shortTrade(provider.headline || partner.headline);

  function onMove(event: MouseEvent<HTMLElement>) {
    setPos(clampTooltipPosition(event.clientX, event.clientY));
  }

  return (
    <article
      onMouseEnter={(event) => {
        setHover(true);
        setPos(clampTooltipPosition(event.clientX, event.clientY));
      }}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(false)}
      className={`relative mt-11 flex h-full flex-col rounded-3xl bg-white px-4 pb-4 pt-14 transition duration-200 ${
        selected
          ? 'shadow-[0_16px_34px_rgba(15,157,138,0.24)] ring-2 ring-[var(--color-brand)]'
          : 'shadow-[0_10px_28px_rgba(15,32,46,0.10)] ring-1 ring-black/5 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(15,32,46,0.16)]'
      }`}
    >
      {/* Avatar tròn nổi lên trên mép card */}
      <Link
        to={`/nguoi/${partner.userId}`}
        className="absolute -top-11 left-1/2 -translate-x-1/2"
        aria-label={`Xem hồ sơ ${partner.fullName}`}
      >
        <AvatarLevelOverlay level={partner.level}>
          <PartnerAvatar name={partner.fullName} src={partner.avatarUrl} size="xl" round />
        </AvatarLevelOverlay>
      </Link>

      <Link
        to={`/nguoi/${partner.userId}`}
        className="flex min-h-0 flex-1 flex-col items-center text-center"
        aria-label={`Xem hồ sơ ${partner.fullName}`}
      >
        <div className="min-h-[1.5rem]">
          <VerificationBadge verified={Boolean(partner.isVerified)} />
        </div>
        <h3 className="mt-2 line-clamp-2 min-h-[2.5rem] text-lg font-extrabold leading-snug text-[var(--color-ink)]">
          {partner.fullName}
        </h3>
        <p className="mt-0.5 line-clamp-1 min-h-[1rem] text-sm font-semibold text-[var(--color-brand-deep)]">
          {trade || '\u00A0'}
        </p>
        {partner.reputation ? (
          <div className="mt-2 w-full max-w-[200px]">
            <ReputationProgressBar reputation={partner.reputation} variant="compact" />
          </div>
        ) : null}
        <div className="mt-3 inline-flex flex-col items-center leading-tight">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Giá chào
          </span>
          <p className="text-xl font-extrabold text-[var(--color-sale)]">
            {formatPrice(provider.price)}
            <span className="text-sm font-semibold text-[var(--color-muted)]">/{unit}</span>
          </p>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-3 py-1 text-sm font-semibold text-[var(--color-ink)] shadow-sm">
          <span className="text-amber-500">★</span>
          {partner.ratingAvg.toFixed(1)}
          <span className="text-[var(--color-line)]">|</span>
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-[var(--color-muted)]" aria-hidden>
            <path
              fill="currentColor"
              d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 1.6a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm.75 1.9H7.4v3.6l3 1.8.7-1.2-2.35-1.4V5Z"
            />
          </svg>
          <span className="text-[var(--color-muted)]">
            {formatWorkHours(provider.hoursWorked)} làm
          </span>
        </div>
        <p
          className={`mt-2 min-h-[1rem] text-[11px] font-semibold ${
            partner.acceptingJobs === false ? 'text-amber-700' : 'invisible'
          }`}
        >
          Tạm nghỉ nhận việc
        </p>
      </Link>
      {canHire ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSelect();
          }}
          className={`mt-auto w-full rounded-2xl px-2 py-3 text-[15px] font-bold text-white transition ${
            selected
              ? 'bg-[var(--color-brand)]'
              : 'bg-[var(--color-navy)] hover:bg-[var(--color-navy-deep)]'
          }`}
        >
          {selected ? 'Đã chọn' : 'Thuê'}
        </button>
      ) : (
        <Link
          to={`/nguoi/${partner.userId}`}
          className="mt-auto w-full rounded-2xl bg-[var(--color-navy)] px-2 py-3 text-center text-[15px] font-bold text-white transition hover:bg-[var(--color-navy-deep)]"
        >
          Xem hồ sơ
        </Link>
      )}

      {hover
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[9990] w-[min(320px,calc(100vw-1.5rem))]"
              style={{ left: pos.left, top: pos.top }}
            >
              <div className="surface-card rounded-2xl p-4 text-left shadow-xl">
                <div className="flex items-start gap-3">
                  <PartnerAvatar name={partner.fullName} src={partner.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start gap-2">
                      <p className="text-base font-bold">{partner.fullName}</p>
                      <LevelBadge level={partner.level} />
                      <VerificationBadge verified={Boolean(partner.isVerified)} />
                    </div>
                    <p className="mt-1 text-sm font-medium text-[var(--color-brand-deep)]">
                      {provider.headline || partner.headline}
                    </p>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-sm text-[var(--color-muted)]">
                  <p>
                    ★ {partner.ratingAvg.toFixed(1)} ({partner.ratingCount} đánh giá)
                  </p>
                  <p>{partner.completedJobs} việc hoàn thành</p>
                  <p>{formatWorkHours(provider.hoursWorked)} làm nghề này</p>
                  <p>{provider.experienceYears} năm kinh nghiệm</p>
                  {partner.city ? <p>Khu vực: {partner.city}</p> : null}
                  {partner.districts?.length ? (
                    <p className="line-clamp-2">Phục vụ: {partner.districts.join(', ')}</p>
                  ) : null}
                  {partner.workModes?.length ? (
                    <p>
                      Hình thức:{' '}
                      {partner.workModes
                        .map((m) => (m === 'onsite' ? 'Tại chỗ' : 'Online'))
                        .join(' · ')}
                    </p>
                  ) : null}
                  {partner.responseMinutes ? (
                    <p>Phản hồi ~{partner.responseMinutes} phút</p>
                  ) : null}
                  <p>
                    {partner.acceptingJobs === false ? (
                      <span className="font-semibold text-amber-700">Tạm nghỉ nhận việc</span>
                    ) : (
                      <span className="font-semibold text-[var(--color-brand-deep)]">
                        Đang nhận việc
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">Giá chào</p>
                  <p className="font-extrabold text-[var(--color-sale)]">
                    {formatPrice(provider.price)} / {unit}
                  </p>
                </div>
                {partner.skills?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {partner.skills.slice(0, 5).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md bg-[var(--color-brand-soft)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-brand-deep)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}
                {provider.coverageNote || provider.includes ? (
                  <p className="mt-2 line-clamp-2 text-xs text-[var(--color-muted)]">
                    {provider.coverageNote || provider.includes}
                  </p>
                ) : null}
                {partner.bio ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--color-muted)]">
                    {partner.bio}
                  </p>
                ) : null}
                <p className="mt-3 text-sm font-bold text-[var(--color-brand-deep)]">
                  Nhấp thẻ để xem hồ sơ ›
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </article>
  );
}

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
      scheduledAt: '',
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
  const image = serviceImage(service);
  const color = groupColor(service.category.group.slug);

  return (
    <div className="animate-fade-up space-y-10">
      <div
        className={`grid gap-8 ${showHirePanel ? 'lg:grid-cols-[1.2fr_0.8fr]' : 'lg:grid-cols-1'}`}
      >
        <section>
          <CatalogOverlayHero
            image={image}
            imageAlt={service.name}
            backTo={`/nhom/${service.category.group.slug}`}
            backLabel={`← ${service.category.group.name}`}
            title={service.name}
            subtitle={service.description ?? undefined}
            color={color}
            tall
            onlineBadgePlacement="inline"
            aside={
              <ServiceHeroPricePanel
                basePrice={service.basePrice}
                min={service.priceMin}
                max={service.priceMax}
                unit={service.unit}
                durationMin={service.durationMin}
              />
            }
          />
          {!isHireMode ? (
            <p className="mt-4 rounded-xl bg-[var(--color-brand-soft)] px-4 py-3 text-[15px] text-[var(--color-brand-deep)]">
              Bạn đang ở mode <strong>Người làm</strong> — form thuê ẩn. Chuyển sang{' '}
              <strong>Khách thuê</strong> trên menu tài khoản để thuê dịch vụ.
            </p>
          ) : null}
        </section>

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
      </div>

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

        <div className="mt-5 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
