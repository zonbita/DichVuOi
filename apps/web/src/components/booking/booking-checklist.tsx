import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Booking, BookingRequirement } from '../../types/catalog';

type RoleMode = 'customer' | 'partner' | 'admin';

type Props = {
  booking: Booking;
  mode: RoleMode;
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

export function BookingChecklist({ booking, mode }: Props) {
  const queryClient = useQueryClient();
  const items = booking.requirements ?? [];
  const canEdit = tickable(booking.status);

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
    },
  });

  const confirmedCount = items.filter((i) => i.customerConfirmed).length;
  const partnerDoneCount = items.filter((i) => i.partnerDone).length;
  const pending = toggleMutation.isPending;

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-bold tracking-tight text-[#172033]">
            Công việc cần làm
          </p>
          {mode === 'customer' ? (
            <p className="mt-0.5 text-xs text-[#7C8799]">
              Danh sách cố định từ lúc tạo đơn — chỉ tích đã xong
            </p>
          ) : null}
        </div>
        {items.length > 0 ? (
          <p className="text-xs font-semibold text-[#7C8799]">
            {mode === 'customer'
              ? `${confirmedCount}/${items.length} đã xong`
              : `Khách ${confirmedCount}/${items.length} · Người làm ${partnerDoneCount}/${items.length}`}
          </p>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-[#7C8799]">
          Không có mục checklist — chỉ thêm được khi tạo đơn thuê.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
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

  if (mode === 'customer') {
    return (
      <li className="flex items-start gap-3 rounded-lg border border-[var(--color-line)] px-3 py-2.5">
        <label
          className={`mt-0.5 flex shrink-0 items-center gap-2 text-sm ${
            customerEditable ? 'cursor-pointer' : 'opacity-70'
          }`}
        >
          <input
            type="checkbox"
            checked={item.customerConfirmed}
            disabled={!customerEditable || pending}
            onChange={(e) => onToggleCustomer(e.target.checked)}
            className="size-4 accent-emerald-700"
          />
          <span className="sr-only">Đã xong</span>
        </label>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm ${
              item.customerConfirmed
                ? 'text-[var(--color-muted)] line-through'
                : 'text-[var(--color-ink)]'
            }`}
          >
            {item.content}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">
            {sourceLabel[item.source] ?? item.source}
            {item.partnerDone ? ' · Người làm đã đánh dấu xong' : ''}
          </p>
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-start gap-3 rounded-lg border border-[var(--color-line)] px-3 py-2.5">
      <div className="flex shrink-0 items-center gap-3 pt-0.5">
        <label
          className={`flex items-center gap-1.5 text-xs ${
            partnerEditable ? 'cursor-pointer' : 'opacity-80'
          }`}
          title="Người làm đã làm"
        >
          <input
            type="checkbox"
            checked={item.partnerDone}
            disabled={!partnerEditable || pending}
            onChange={(e) => onTogglePartner(e.target.checked)}
            className="size-4 accent-[var(--color-brand-deep)]"
          />
          <span className="font-semibold text-[var(--color-muted)]">Làm</span>
        </label>
        <label
          className={`flex items-center gap-1.5 text-xs ${
            customerEditable ? 'cursor-pointer' : 'opacity-80'
          }`}
          title="Khách đã nhận / xác nhận"
        >
          <input
            type="checkbox"
            checked={item.customerConfirmed}
            disabled={!customerEditable || pending}
            onChange={(e) => onToggleCustomer(e.target.checked)}
            className="size-4 accent-emerald-700"
          />
          <span className="font-semibold text-emerald-800">Đã xong</span>
        </label>
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm ${
            item.customerConfirmed
              ? 'text-[var(--color-muted)] line-through'
              : 'text-[var(--color-ink)]'
          }`}
        >
          {item.content}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">
          {sourceLabel[item.source] ?? item.source}
        </p>
      </div>
    </li>
  );
}
