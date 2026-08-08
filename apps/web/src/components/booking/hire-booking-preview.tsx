import { OpenJobCard, openJobRoomTone } from '../common/open-job-card';
import { formatPrice } from '../../services/api';
import type { Booking, CatalogTreeService } from '../../types/catalog';
import type { CatalogServicePick } from '../home/catalog-menu-shared';
import { Icon } from '../ui/icon';

export type HirePreviewService = CatalogServicePick &
  Pick<CatalogTreeService, 'basePrice' | 'priceMin' | 'priceMax' | 'unit' | 'durationMin'>;

type Props = {
  service: HirePreviewService | null;
  customerName: string;
  customerPhone: string;
  scheduledAt: string;
  schedulePublish?: boolean;
  publishAt?: string;
  budgetMin: number;
  budgetMax: number;
  applyDepositPercent: number;
  tasks: string[];
};

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return phone.trim() || '••••••••';
  return `${digits.slice(0, 3)}***${digits.slice(-3)}`;
}

function buildDemoBooking(props: Props): Booking | null {
  const { service } = props;
  if (!service) return null;

  const name = props.customerName.trim() || 'Khách thuê';
  const phone = props.customerPhone.trim();
  const scheduledMs = props.scheduledAt
    ? new Date(props.scheduledAt).getTime()
    : Date.now() + 24 * 60 * 60_000;
  const scheduledAt = Number.isNaN(scheduledMs)
    ? new Date(Date.now() + 24 * 60 * 60_000).toISOString()
    : new Date(scheduledMs).toISOString();

  const publishMs =
    props.schedulePublish && props.publishAt?.trim()
      ? new Date(props.publishAt).getTime()
      : Date.now();
  const publishBase = Number.isNaN(publishMs) ? Date.now() : publishMs;
  const matchingDeadlineAt = new Date(
    publishBase + 7 * 24 * 60 * 60_000,
  ).toISOString();

  const budgetMin = Math.max(0, props.budgetMin || 0);
  const budgetMax = Math.max(budgetMin, props.budgetMax || budgetMin);
  const applyDepositPercent = Math.max(0, Math.min(100, props.applyDepositPercent || 0));
  const applyDepositBps = applyDepositPercent * 100;
  const applyDepositAmount = Math.max(
    applyDepositPercent === 0 ? 0 : 1,
    Math.round((budgetMax * applyDepositPercent) / 100),
  );

  const note = props.tasks.map((t) => t.trim()).filter(Boolean).join('\n') || null;

  return {
    id: 'demo-preview',
    status: 'PENDING',
    address: 'Địa chỉ sẽ hiện sau khi nhận việc',
    scheduledAt,
    publishAt:
      props.schedulePublish && props.publishAt?.trim()
        ? new Date(props.publishAt).toISOString()
        : null,
    totalPrice: budgetMax,
    customerName: name,
    customerPhone: phone ? maskPhone(phone) : '••••••••',
    customerPhoneMasked: true,
    addressMasked: true,
    note,
    budgetMin,
    budgetMax,
    partnerId: null,
    paymentStatus: 'HELD',
    matchingDeadlineAt,
    applicationCount: 0,
    applyDepositAmount,
    applyDepositBps,
    applyDepositPercent,
    service: {
      id: service.id,
      slug: service.slug,
      name: service.name,
      description: null,
      basePrice: service.basePrice,
      priceMin: service.priceMin,
      priceMax: service.priceMax,
      unit: service.unit || 'ca',
      durationMin: service.durationMin || 60,
      supportsOnline: false,
      category: {
        id: 'demo-cat',
        name: service.categoryName,
        slug: 'demo',
        group: {
          id: 'demo-group',
          name: service.groupName,
          slug: service.groupSlug,
        },
      },
    },
    partner: null,
  };
}

export function HireBookingPreview(props: Props) {
  const booking = buildDemoBooking(props);
  const tasks = props.tasks.map((t) => t.trim()).filter(Boolean);

  if (!booking) {
    return (
      <aside className="flex h-full min-h-[220px] flex-col overflow-hidden rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-canvas)]/80">
        <div className="border-b border-[var(--color-line)] px-4 py-3">
          <p className="text-sm font-extrabold text-[var(--color-navy)]">
            Demo đơn trên bảng tin
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            Chọn nghề bên trái để xem trước cách đơn hiện với người làm.
          </p>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--color-brand)] shadow-sm ring-1 ring-[var(--color-line)]">
            <Icon name="briefcase" className="h-5 w-5" />
          </span>
          <p className="text-sm text-[var(--color-muted)]">
            Chưa có dịch vụ — demo sẽ cập nhật theo form.
          </p>
        </div>
      </aside>
    );
  }

  const tone = openJobRoomTone(booking);

  return (
    <aside className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-[var(--color-line)] bg-white shadow-[var(--shadow-card)] lg:sticky lg:top-4">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--color-line)] bg-gradient-to-br from-white via-white to-[var(--color-brand-soft)]/50 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-[var(--color-navy)]">
            Demo đơn trên bảng tin
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            {props.schedulePublish
              ? 'Sau giờ đăng — người làm sẽ thấy card như bên dưới.'
              : 'Cập nhật theo thông tin bạn đang điền (chưa gửi).'}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-700 ring-1 ring-violet-200">
          Preview
        </span>
      </div>

      <div className="space-y-3 p-3 sm:p-4">
        {props.schedulePublish && props.publishAt?.trim() ? (
          <p className="rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-800">
            Hẹn đăng{' '}
            <strong>
              {new Date(props.publishAt).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </strong>
            {' · '}
            trước đó đơn chưa lên bảng tin.
          </p>
        ) : null}

        <div className="hire-demo-card origin-top scale-[0.98] sm:scale-100">
          <OpenJobCard
            booking={booking}
            footerLeft={
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold tracking-wide uppercase ${tone.badge}`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
                {tone.label}
              </span>
            }
            footerRight={
              <span className="inline-flex min-w-[120px] cursor-default items-center justify-center gap-1.5 rounded-full bg-[var(--color-brand)]/80 px-4 py-2.5 text-sm font-bold !text-white opacity-90">
                Ứng tuyển
                <Icon name="chevronRight" className="h-4 w-4" />
              </span>
            }
          />
        </div>

        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)]/60 px-3 py-2.5 text-xs text-[var(--color-muted)]">
          <p>
            Ngân sách giữ chỗ:{' '}
            <strong className="text-[var(--color-ink)]">
              {formatPrice(booking.totalPrice)}
            </strong>
            {' · '}
            Cọc ứng tuyển người làm:{' '}
            <strong className="text-[var(--color-ink)]">
              {booking.applyDepositPercent}% ·{' '}
              {formatPrice(booking.applyDepositAmount ?? 0)}
            </strong>
          </p>
        </div>

        {tasks.length > 0 ? (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted)]">
              Việc cần làm
            </p>
            <ul className="mt-1.5 space-y-1">
              {tasks.slice(0, 6).map((task, i) => (
                <li
                  key={`${i}-${task.slice(0, 24)}`}
                  className="flex gap-2 text-sm text-[var(--color-ink)]"
                >
                  <Icon
                    name="check"
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                  />
                  <span className="min-w-0 break-words">{task}</span>
                </li>
              ))}
              {tasks.length > 6 ? (
                <li className="text-xs text-[var(--color-muted)]">
                  +{tasks.length - 6} mục khác
                </li>
              ) : null}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-[var(--color-muted)]">
            Thêm mục công việc ở form — sẽ hiện trong checklist đơn.
          </p>
        )}
      </div>
    </aside>
  );
}
