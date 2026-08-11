import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_DEDUCTION_OPTIONS,
  RESOLUTION_ACTION_LABELS,
  type ComplaintResolutionAction,
  type ComplaintStatus,
} from '../../types/complaint';
import { EmptyState, PageHeader } from './admin-ui';
import { formatDateTime } from './admin-utils';

const statusLabels: Record<ComplaintStatus, string> = {
  SUBMITTED: 'Mới gửi',
  UNDER_REVIEW: 'Đang xử lý',
  VERIFIED: 'Đã quyết',
  REJECTED: 'Từ chối',
};

export function AdminComplaintsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ComplaintStatus | ''>('');
  const [deductionById, setDeductionById] = useState<Record<string, number>>({});
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  const complaintsQuery = useQuery({
    queryKey: ['admin', 'complaints', filter],
    queryFn: () => api.adminComplaints(filter ? { status: filter } : {}),
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      id,
      status,
      deductionPoints,
      resolutionAction,
      adminNote,
    }: {
      id: string;
      status: 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW';
      deductionPoints?: number;
      resolutionAction?: ComplaintResolutionAction;
      adminNote?: string;
    }) =>
      api.adminResolveComplaint(id, {
        status,
        deductionPoints,
        resolutionAction,
        adminNote,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'complaints'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
    },
  });

  const items = complaintsQuery.data ?? [];

  return (
    <div>
      <PageHeader
        title="Khiếu nại / tranh chấp"
        description="Xem checklist + bằng chứng — quyết hoàn cọc / giải ngân / làm lại. Kết quả ghi công khai trên đơn."
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {(['', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'] as const).map(
          (value) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                filter === value
                  ? 'bg-[var(--color-brand-deep)] text-white'
                  : 'border border-[var(--color-line)] bg-white text-[var(--color-muted)]'
              }`}
            >
              {value ? statusLabels[value] : 'Tất cả'}
            </button>
          ),
        )}
        <Link
          to="/admin/flagged"
          className="ml-auto text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
        >
          Tin chat bị lọc PII
        </Link>
      </div>

      {complaintsQuery.isLoading ? <p className="mt-6">Đang tải…</p> : null}

      {items.length === 0 && !complaintsQuery.isLoading ? (
        <EmptyState>Chưa có khiếu nại khớp bộ lọc.</EmptyState>
      ) : null}

      <div className="mt-5 space-y-3">
        {items.map((item) => {
          const pending =
            item.status === 'SUBMITTED' || item.status === 'UNDER_REVIEW';
          const deduction = deductionById[item.id] ?? 100;
          const note = noteById[item.id] ?? '';
          const reporterIsPartner = item.reporter.id === item.partner.id;

          return (
            <article
              key={item.id}
              className="rounded-2xl border border-[var(--color-line)] bg-white p-4 text-sm shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">
                    {COMPLAINT_CATEGORIES.find((c) => c.value === item.category)
                      ?.label ?? item.category}{' '}
                    ·{' '}
                    <Link
                      to={`/admin/bookings/${item.bookingId}`}
                      className="hover:text-[var(--color-brand-deep)]"
                    >
                      {item.booking.service.name}
                    </Link>
                  </p>
                  <p className="text-[var(--color-muted)]">
                    {reporterIsPartner ? 'Người làm' : 'Khách'}{' '}
                    {item.reporter.fullName}
                    {item.against
                      ? ` · ${item.against.fullName}`
                      : ` · Partner ${item.partner.fullName}`}{' '}
                    · Đơn {item.booking.status}
                    {item.booking.paymentStatus
                      ? ` · ${item.booking.paymentStatus}`
                      : ''}{' '}
                    · {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--color-brand-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-brand-deep)]">
                  {statusLabels[item.status]}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-line leading-relaxed">
                {item.description}
              </p>
              {item.evidenceNote ? (
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  Bằng chứng: {item.evidenceNote}
                </p>
              ) : null}

              {item.booking.requirements && item.booking.requirements.length > 0 ? (
                <ul className="mt-3 space-y-1 rounded-lg bg-[var(--color-canvas)] p-3 text-xs">
                  {item.booking.requirements.map((req) => {
                    const linked = item.requirementIds.includes(req.id);
                    return (
                      <li
                        key={req.id}
                        className={linked ? 'font-semibold text-rose-800' : ''}
                      >
                        [{req.partnerDone ? '✓' : ' '} làm] [
                        {req.customerConfirmed ? '✓' : ' '} nhận] {req.content}
                        {linked ? ' ← tranh chấp' : ''}
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              {item.resolutionAction ? (
                <p className="mt-2 text-xs font-semibold text-amber-900">
                  {RESOLUTION_ACTION_LABELS[item.resolutionAction]}
                  {item.deductionPoints
                    ? ` · −${item.deductionPoints} uy tín`
                    : ''}
                </p>
              ) : null}
              {item.adminNote ? (
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Ghi chú: {item.adminNote}
                </p>
              ) : null}

              {pending ? (
                <div className="mt-4 space-y-3 border-t border-[var(--color-line)] pt-3">
                  <label className="block text-xs font-semibold text-[var(--color-muted)]">
                    Ghi chú công khai
                    <input
                      className="mt-1 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
                      value={note}
                      onChange={(e) =>
                        setNoteById((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      placeholder="Hiện trên đơn cho 2 bên…"
                    />
                  </label>
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="text-xs font-semibold text-[var(--color-muted)]">
                      Trừ uy tín (khi hoàn cọc)
                      <select
                        className="mt-1 block rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
                        value={deduction}
                        onChange={(e) =>
                          setDeductionById((prev) => ({
                            ...prev,
                            [item.id]: Number(e.target.value),
                          }))
                        }
                      >
                        {COMPLAINT_DEDUCTION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {item.status === 'SUBMITTED' ? (
                      <button
                        type="button"
                        className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm font-semibold"
                        disabled={resolveMutation.isPending}
                        onClick={() =>
                          resolveMutation.mutate({
                            id: item.id,
                            status: 'UNDER_REVIEW',
                            adminNote: note || undefined,
                          })
                        }
                      >
                        Nhận xử lý
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-lg bg-rose-700 px-3 py-1.5 text-sm font-semibold text-white"
                      disabled={resolveMutation.isPending}
                      onClick={() =>
                        resolveMutation.mutate({
                          id: item.id,
                          status: 'VERIFIED',
                          resolutionAction: 'REFUND',
                          deductionPoints: deduction,
                          adminNote: note || undefined,
                        })
                      }
                    >
                      Chấp nhận khách · hoàn cọc
                    </button>
                    <button
                      type="button"
                      className="rounded-lg bg-[var(--color-brand-deep)] px-3 py-1.5 text-sm font-semibold text-white"
                      disabled={resolveMutation.isPending}
                      onClick={() =>
                        resolveMutation.mutate({
                          id: item.id,
                          status: 'VERIFIED',
                          resolutionAction: 'RELEASE',
                          adminNote: note || undefined,
                        })
                      }
                    >
                      Chấp nhận NL · giải ngân
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm font-semibold"
                      disabled={resolveMutation.isPending}
                      onClick={() =>
                        resolveMutation.mutate({
                          id: item.id,
                          status: 'VERIFIED',
                          resolutionAction: 'RETRY_IN_PROGRESS',
                          adminNote: note || undefined,
                        })
                      }
                    >
                      Hòa · làm lại
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700"
                      disabled={resolveMutation.isPending}
                      onClick={() =>
                        resolveMutation.mutate({
                          id: item.id,
                          status: 'REJECTED',
                          resolutionAction: 'RELEASE',
                          adminNote: note || undefined,
                        })
                      }
                    >
                      Từ chối · giải ngân
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
