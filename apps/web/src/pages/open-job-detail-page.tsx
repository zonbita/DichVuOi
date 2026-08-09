import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { openJobRoomTone, openJobTitle } from '../components/common/open-job-card';
import { Icon } from '../components/ui/icon';
import type { IconName } from '../components/ui/icon';
import { useAuth } from '../features/auth/auth-context';
import { usePartnerRealtime } from '../hooks/use-partner-realtime';
import {
  api,
  formatBookingStatus,
  formatPrice,
  formatPriceNumber,
} from '../services/api';
import { serviceImage } from '../utils/catalog-images';

function formatRemainingTime(deadlineIso: string) {
  const diffMs = new Date(deadlineIso).getTime() - Date.now();
  if (diffMs <= 0) return 'Đã hết hạn';
  const totalHours = Math.ceil(diffMs / (60 * 60 * 1000));
  if (totalHours < 24) return `Còn ${totalHours} giờ`;
  const totalDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return `Còn ${totalDays} ngày`;
}

function PosterAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-brand-soft)] to-white text-lg font-extrabold tracking-tight text-[var(--color-brand-deep)]">
      {initials || '?'}
    </div>
  );
}

function MetaTile({
  icon,
  iconClass,
  label,
  value,
  hint,
}: {
  icon: IconName;
  iconClass: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="group flex min-w-[200px] flex-1 items-start gap-3 rounded-2xl border border-white/80 bg-white/60 px-3.5 py-3 shadow-[0_1px_0_rgba(255,255,255,0.8)] transition hover:border-[var(--color-brand)]/25 hover:bg-white/80 lg:min-w-0">
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-bold leading-snug text-[var(--color-ink)]">
          {value}
        </p>
        {hint ? (
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Chi tiết đơn mở — polish: hero + sidebar trong 500px, nội dung bên dưới. */
export function OpenJobDetailPage() {
  const { id = '' } = useParams();
  const { user, loading, canOffer } = useAuth();
  const queryClient = useQueryClient();
  const detailPath = `/viec-moi/${id}`;

  usePartnerRealtime(Boolean(user) && canOffer, user?.id);

  const bookingQuery = useQuery({
    queryKey: ['booking', 'open-public', id, user?.id ?? 'guest'],
    queryFn: () =>
      user ? api.getBooking(id) : api.getPublicOpenBooking(id),
    enabled: Boolean(id) && !loading,
  });

  const applyMutation = useMutation({
    mutationFn: () => api.applyBooking(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['booking'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'open'] });
      void queryClient.invalidateQueries({ queryKey: ['open-jobs-board'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'partner'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });

  if (loading || bookingQuery.isLoading) {
    return (
      <div className="page-shell py-6">
        <div
          className="section-container space-y-4"
          aria-busy="true"
          aria-label="Đang tải đơn"
        >
          <div className="h-4 w-40 animate-pulse rounded-full bg-[var(--color-line)]" />
          <div className="h-[500px] animate-pulse rounded-[20px] bg-[var(--color-line)]/60" />
          <div className="h-40 animate-pulse rounded-[20px] bg-[var(--color-line)]/50" />
        </div>
      </div>
    );
  }

  if (bookingQuery.isError || !bookingQuery.data) {
    return (
      <div className="page-shell py-8">
        <div className="section-container">
          <div className="glass-card p-5 sm:p-6">
            <p className="text-red-600">
              Không tìm thấy đơn hoặc đơn đã đóng / hết hạn ghép.
            </p>
            <Link
              to="/"
              className="mt-3 inline-block font-semibold text-[var(--color-brand-deep)]"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const booking = bookingQuery.data;
  const isOpen =
    booking.status === 'PENDING' &&
    !booking.partnerId &&
    booking.paymentStatus === 'HELD';
  const isApplied =
    booking.applications?.some((a) =>
      ['APPLIED', 'SELECTED'].includes(a.status),
    ) ?? false;
  const tone = isApplied
    ? {
        label: 'Đã vào phòng',
        badge: 'border border-amber-400/80 bg-amber-50 text-amber-800',
        dot: 'bg-amber-500',
      }
    : openJobRoomTone(booking);

  const posterName = booking.user?.fullName || booking.customerName;
  const posterUserId = booking.user?.id ?? booking.userId ?? null;
  const posterProfileTo = posterUserId ? `/user/${posterUserId}` : null;
  const tasks = (booking.note ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const cover = serviceImage(booking.service);
  const durationHours =
    Math.round((booking.service.durationMin / 60) * 10) / 10;

  const budgetLabel =
    booking.budgetMin != null && booking.budgetMax != null
      ? `${formatPriceNumber(booking.budgetMin)} – ${formatPriceNumber(booking.budgetMax)}`
      : formatPriceNumber(booking.totalPrice);

  const matchingLabel = booking.matchingDeadlineAt
    ? formatRemainingTime(booking.matchingDeadlineAt)
    : null;

  const depositLabel = `${booking.applyDepositPercent ?? 10}% · ${formatPrice(booking.applyDepositAmount ?? 0)}`;

  const applyCta = (() => {
    if (!isOpen) {
      return (
        <Link
          to="/"
          className="mt-3 inline-flex w-full items-center justify-center rounded-[14px] border border-[var(--color-line)] bg-white/70 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-white"
        >
          Đơn đã đóng
        </Link>
      );
    }
    if (!user) {
      return (
        <Link
          to={`/dang-nhap?redirect=${encodeURIComponent(detailPath)}`}
          className="btn-primary mt-3 inline-flex w-full items-center justify-center gap-2 py-2.5 text-sm shadow-md"
        >
          Đăng nhập để ứng tuyển
          <Icon name="chevronRight" className="h-4 w-4" />
        </Link>
      );
    }
    if (!canOffer) {
      return (
        <Link
          to={`/doi-tac?redirect=${encodeURIComponent(detailPath)}`}
          className="mt-3 inline-flex w-full items-center justify-center rounded-[14px] border border-[var(--color-line)] bg-white/70 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-white"
        >
          Mở hồ sơ người làm để ứng tuyển
        </Link>
      );
    }
    return (
      <button
        type="button"
        disabled={applyMutation.isPending || isApplied}
        onClick={() => applyMutation.mutate()}
        className={`btn-primary mt-3 inline-flex w-full items-center justify-center gap-2 py-2.5 text-sm shadow-md disabled:opacity-70 ${
          isApplied ? '!bg-amber-500 hover:!bg-amber-600' : ''
        }`}
      >
        {isApplied
          ? 'Đã ứng tuyển'
          : applyMutation.isPending
            ? 'Đang ứng tuyển…'
            : 'Ứng tuyển đơn này'}
        <Icon
          name={isApplied ? 'check' : 'chevronRight'}
          className="h-4 w-4"
        />
      </button>
    );
  })();

  return (
    <div className="page-shell animate-fade-up py-6">
      <div className="section-container space-y-4">
      <section className="glass-card overflow-hidden">
        <div className="grid lg:h-[500px] lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
          {/* Hero */}
          <div className="relative h-[220px] overflow-hidden bg-[var(--color-brand-soft)] sm:h-[300px] lg:h-full">
            <img
              src={cover}
              alt={openJobTitle(booking)}
              className="catalog-photo h-full w-full object-cover"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0F2747]/55 via-[#0F2747]/10 to-transparent"
              aria-hidden
            />
            <div className="absolute bottom-3 left-3 right-3 flex justify-end sm:bottom-4 sm:right-4">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide shadow-md backdrop-blur-sm ${tone.badge}`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${tone.dot} ${
                    !isApplied ? 'animate-pulse' : ''
                  }`}
                />
                {tone.label}
              </span>
            </div>
          </div>

          {/* Sidebar trong vùng ảnh */}
          <aside className="flex min-h-0 flex-col gap-2.5 overflow-hidden border-t border-white/60 bg-gradient-to-b from-white/50 to-white/25 p-2.5 sm:p-3 lg:border-t-0 lg:border-l lg:border-white/60">
            <div className="shrink-0 rounded-2xl border border-white/80 bg-white/75 p-3.5 shadow-[0_8px_24px_rgba(15,39,71,0.06)] backdrop-blur-md">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  Ngân sách đơn
                </p>
                <span className="rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[10px] font-bold text-[#C2410C]">
                  {booking.applicationCount ?? 0} UV
                </span>
              </div>
              <p className="mt-1.5 text-[1.35rem] font-extrabold leading-none tracking-tight text-[var(--color-sale)] sm:text-[1.55rem]">
                {budgetLabel}
                <span className="ml-1 text-sm font-semibold text-[var(--color-muted)]">
                  VNĐ
                </span>
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                <Icon name="shield" className="h-3.5 w-3.5 text-teal-700" />
                Cọc ứng tuyển:{' '}
                <strong className="text-[var(--color-ink)]">{depositLabel}</strong>
              </p>

              {applyCta}

              <Link
                to="/"
                className="mt-2 inline-flex w-full items-center justify-center rounded-[14px] border border-transparent py-2 text-sm font-semibold text-[var(--color-muted)] transition hover:bg-white/60 hover:text-[var(--color-ink)]"
              >
                Về trang chủ
              </Link>

              {applyMutation.isError ? (
                <p className="mt-2 text-xs text-red-600">
                  {(applyMutation.error as Error).message ||
                    'Ứng tuyển thất bại'}
                </p>
              ) : null}
            </div>

            <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/80 bg-white/75 p-3.5 shadow-[0_8px_24px_rgba(15,39,71,0.06)] backdrop-blur-md transition hover:bg-white/90">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                Người làm đơn
              </p>
              {posterProfileTo ? (
                <Link
                  to={posterProfileTo}
                  className="mt-2.5 block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                  aria-label={`Xem hồ sơ ${posterName}`}
                >
                  <div className="flex gap-3">
                    <div className="aspect-square w-12 shrink-0 overflow-hidden rounded-2xl ring-2 ring-white shadow-sm sm:w-14">
                      <PosterAvatar name={posterName} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-extrabold text-[var(--color-navy)] hover:text-[var(--color-brand-deep)]">
                        {posterName}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                        Khách thuê trên DichVuOi
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-soft)]/70 px-2 py-0.5 text-[11px] font-semibold text-[var(--color-brand-deep)]">
                        <Icon name="user" className="h-3 w-3" />
                        {booking.customerPhone}
                        {booking.customerPhoneMasked ? ' · che' : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="mt-2.5 flex gap-3">
                  <div className="aspect-square w-12 shrink-0 overflow-hidden rounded-2xl ring-2 ring-white shadow-sm sm:w-14">
                    <PosterAvatar name={posterName} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-extrabold text-[var(--color-navy)]">
                      {posterName}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      Khách thuê trên DichVuOi
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-soft)]/70 px-2 py-0.5 text-[11px] font-semibold text-[var(--color-brand-deep)]">
                      <Icon name="user" className="h-3 w-3" />
                      {booking.customerPhone}
                      {booking.customerPhoneMasked ? ' · che' : ''}
                    </p>
                  </div>
                </div>
              )}
              <p className="mt-auto pt-2.5 text-[11px] leading-relaxed text-[var(--color-muted)]">
                {booking.contactPolicy?.hint ??
                  'SĐT/địa chỉ đủ sau khi nhận việc — chat trên DichVuOi.'}
              </p>
            </div>
          </aside>
        </div>

        {/* Nội dung dưới hero */}
        <div className="space-y-5 border-t border-white/60 p-4 sm:p-6">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="min-w-0 text-2xl font-extrabold tracking-tight text-[var(--color-navy)] sm:text-[1.75rem]">
              {openJobTitle(booking)}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--color-ink)] ring-1 ring-[var(--color-line)]">
                {formatBookingStatus(booking.status)}
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
                {booking.applicationCount ?? 0} ứng viên
              </span>
            </div>
          </header>

          <div>
            <h2 className="text-base font-extrabold text-[var(--color-navy)]">
              Về đơn thuê này
            </h2>
            <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto overscroll-x-contain pb-0.5">
              <MetaTile
                icon="clock"
                iconClass="bg-sky-50 text-sky-700"
                label="Giờ mong muốn"
                value={new Date(booking.scheduledAt).toLocaleString('vi-VN')}
              />
              <MetaTile
                icon="briefcase"
                iconClass="bg-violet-50 text-violet-700"
                label="Thời lượng"
                value={`~${durationHours} giờ · ${booking.service.unit}`}
              />
              {matchingLabel ? (
                <MetaTile
                  icon="clock"
                  iconClass="bg-rose-50 text-rose-700"
                  label="Hạn ghép"
                  value={matchingLabel}
                  hint={
                    booking.matchingDeadlineAt
                      ? new Date(booking.matchingDeadlineAt).toLocaleString(
                          'vi-VN',
                        )
                      : undefined
                  }
                />
              ) : null}
              <MetaTile
                icon="pin"
                iconClass="bg-slate-100 text-slate-600"
                label="Địa chỉ"
                value={booking.address}
              />
              <MetaTile
                icon="shield"
                iconClass="bg-teal-50 text-teal-800"
                label="Cọc ứng tuyển"
                value={depositLabel}
              />
            </div>
          </div>

          <div className="border-t border-white/60 pt-5">
            <h3 className="text-base font-extrabold text-[var(--color-navy)]">
              Việc cần làm
            </h3>
            {tasks.length > 0 ? (
              <ol className="mt-3 space-y-2">
                {tasks.map((task, i) => (
                  <li
                    key={`${i}-${task.slice(0, 24)}`}
                    className="flex gap-3 rounded-2xl border border-white/70 bg-white/55 px-3.5 py-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-xs font-extrabold text-white">
                      {i + 1}
                    </span>
                    <p className="pt-0.5 text-sm leading-relaxed text-[var(--color-ink)]">
                      {task}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 rounded-2xl border border-dashed border-[var(--color-line)] bg-white/40 px-4 py-5 text-sm text-[var(--color-muted)]">
                Khách chưa ghi checklist công việc chi tiết.
              </p>
            )}
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
