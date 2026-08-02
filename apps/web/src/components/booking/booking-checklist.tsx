import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Booking, BookingRequirement } from '../../types/catalog';

type RoleMode = 'customer' | 'partner' | 'admin';

type Props = {
  booking: Booking;
  mode: RoleMode;
  /** Không bọc glass-card — dùng khi nằm trong khung cha. */
  embedded?: boolean;
  /** Rút gọn trên thẻ list (ẩn bớt mục). */
  compact?: boolean;
};

const sourceLabel: Record<string, string> = {
  SERVICE_INCLUDES: 'Từ gói dịch vụ',
  CUSTOMER_NOTE: 'Từ ghi chú khách',
  MANUAL: 'Bổ sung',
};

function tickable(status: string) {
  return (
    status === 'CONFIRMED' ||
    status === 'IN_PROGRESS' ||
    status === 'AWAITING_CONFIRM' ||
    status === 'DISPUTED'
  );
}

export function BookingChecklist({
  booking,
  mode,
  embedded = false,
  compact = false,
}: Props) {
  const queryClient = useQueryClient();
  const items = booking.requirements ?? [];
  const canEdit = tickable(booking.status) || mode === 'admin';
  const visibleItems = compact ? items.slice(0, 6) : items;

  const toggleMutation = useMutation({
    mutationFn: ({
      requirementId,
      payload,
    }: {
      requirementId: string;
      payload: { partnerDone?: boolean; customerConfirmed?: boolean };
    }) => api.updateBookingRequirement(booking.id, requirementId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['booking', booking.id], updated);
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'partner'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'booking', booking.id] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
    },
  });

  const confirmedCount = items.filter((i) => i.customerConfirmed).length;
  const partnerDoneCount = items.filter((i) => i.partnerDone).length;
  const mismatchCount = items.filter(
    (i) => i.partnerDone !== i.customerConfirmed,
  ).length;
  const pending = toggleMutation.isPending;

  const hint =
    mode === 'customer'
      ? 'Bạn tích cột Khách — khác với cột Người làm. Đối chiếu trước khi nghiệm thu.'
      : mode === 'partner'
        ? 'Bạn tích cột Người làm — khác với checklist khách. Hai bên tự kiểm tra chéo.'
        : 'BQT xem hai cột độc lập — mục lệch giúp biết bên nào chưa xác nhận.';

  return (
    <div className={embedded ? 'p-0' : 'glass-card p-5 sm:p-6'}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold tracking-tight text-[var(--color-ink)]">
            Công việc cần làm
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">{hint}</p>
        </div>
        {items.length > 0 ? (
          <div className="text-right text-xs font-semibold text-[var(--color-muted)]">
            <p>
              Người làm {partnerDoneCount}/{items.length}
              {' · '}
              Khách {confirmedCount}/{items.length}
            </p>
            {mismatchCount > 0 ? (
              <p className="mt-0.5 font-bold text-amber-700">
                {mismatchCount} mục lệch giữa hai bên
              </p>
            ) : (
              <p className="mt-0.5 text-emerald-700">Hai bên khớp</p>
            )}
          </div>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="mt-3 rounded-[14px] border border-dashed border-[var(--color-line)] bg-white/40 px-3 py-4 text-center text-sm text-[var(--color-muted)]">
          Không có mục checklist — chỉ thêm được khi tạo đơn thuê.
        </p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 border-b border-[var(--color-line)] pb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted)]">
            <span className="w-14 text-center text-[var(--color-brand-deep)]">
              NL làm
            </span>
            <span className="w-14 text-center text-emerald-800">Khách</span>
            <span>Nội dung</span>
          </div>
          <ul className="mt-1 space-y-1.5">
            {visibleItems.map((item) => (
              <RequirementRow
                key={item.id}
                item={item}
                mode={mode}
                canEdit={canEdit}
                pending={pending}
                onTogglePartner={(done) =>
                  toggleMutation.mutate({
                    requirementId: item.id,
                    payload: { partnerDone: done },
                  })
                }
                onToggleCustomer={(confirmed) =>
                  toggleMutation.mutate({
                    requirementId: item.id,
                    payload: { customerConfirmed: confirmed },
                  })
                }
              />
            ))}
          </ul>
          {compact && items.length > visibleItems.length ? (
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              +{items.length - visibleItems.length} mục — mở chi tiết việc để xem
              hết
            </p>
          ) : null}
        </>
      )}

      {toggleMutation.isError ? (
        <p className="mt-2 text-sm text-red-600">
          {(toggleMutation.error as Error).message}
        </p>
      ) : null}
    </div>
  );
}

function RequirementRow({
  item,
  mode,
  canEdit,
  pending,
  onTogglePartner,
  onToggleCustomer,
}: {
  item: BookingRequirement;
  mode: RoleMode;
  canEdit: boolean;
  pending: boolean;
  onTogglePartner: (done: boolean) => void;
  onToggleCustomer: (done: boolean) => void;
}) {
  const partnerEditable = canEdit && (mode === 'partner' || mode === 'admin');
  const customerEditable = canEdit && (mode === 'customer' || mode === 'admin');
  const mismatched = item.partnerDone !== item.customerConfirmed;
  const bothDone = item.partnerDone && item.customerConfirmed;

  return (
    <li
      className={`grid grid-cols-[auto_auto_minmax(0,1fr)] items-start gap-x-3 rounded-lg border px-2.5 py-2 ${
        mismatched
          ? 'border-amber-300 bg-amber-50/70'
          : bothDone
            ? 'border-emerald-200 bg-emerald-50/40'
            : 'border-[var(--color-line)] bg-white'
      }`}
    >
      <label
        className={`flex w-14 flex-col items-center gap-0.5 pt-0.5 text-[10px] font-semibold ${
          partnerEditable
            ? 'cursor-pointer text-[var(--color-brand-deep)]'
            : 'cursor-default text-[var(--color-muted)] opacity-80'
        }`}
        title={
          partnerEditable
            ? 'Người làm đánh dấu đã làm'
            : 'Cột người làm (chỉ NL / BQT sửa)'
        }
      >
        <input
          type="checkbox"
          checked={item.partnerDone}
          disabled={!partnerEditable || pending}
          onChange={(e) => onTogglePartner(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="size-4 accent-[var(--color-brand-deep)]"
        />
        <span>NL</span>
      </label>

      <label
        className={`flex w-14 flex-col items-center gap-0.5 pt-0.5 text-[10px] font-semibold ${
          customerEditable
            ? 'cursor-pointer text-emerald-800'
            : 'cursor-default text-[var(--color-muted)] opacity-80'
        }`}
        title={
          customerEditable
            ? 'Khách xác nhận đã nhận / xong'
            : 'Cột khách (chỉ khách / BQT sửa)'
        }
      >
        <input
          type="checkbox"
          checked={item.customerConfirmed}
          disabled={!customerEditable || pending}
          onChange={(e) => onToggleCustomer(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="size-4 accent-emerald-700"
        />
        <span>Khách</span>
      </label>

      <div className="min-w-0">
        <p
          className={`text-sm ${
            bothDone
              ? 'text-[var(--color-muted)] line-through'
              : 'text-[var(--color-ink)]'
          }`}
        >
          {item.content}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">
          {sourceLabel[item.source] ?? item.source}
          {mismatched
            ? item.partnerDone
              ? ' · NL đã làm — khách chưa xác nhận'
              : ' · Khách đã xác nhận — NL chưa làm'
            : null}
        </p>
      </div>
    </li>
  );
}
