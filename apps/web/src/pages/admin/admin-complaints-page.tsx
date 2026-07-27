import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_DEDUCTION_OPTIONS,
  type ComplaintStatus,
} from '../../types/complaint';
import { EmptyState, PageHeader } from './admin-ui';
import { formatDateTime } from './admin-utils';

const statusLabels: Record<ComplaintStatus, string> = {
  SUBMITTED: 'Mới gửi',
  UNDER_REVIEW: 'Đang xử lý',
  VERIFIED: 'Xác minh đúng',
  REJECTED: 'Từ chối',
};

export function AdminComplaintsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ComplaintStatus | ''>('');
  const [deductionById, setDeductionById] = useState<Record<string, number>>({});

  const complaintsQuery = useQuery({
    queryKey: ['admin', 'complaints', filter],
    queryFn: () => api.adminComplaints(filter ? { status: filter } : {}),
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      id,
      status,
      deductionPoints,
    }: {
      id: string;
      status: 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW';
      deductionPoints?: number;
    }) => api.adminResolveComplaint(id, { status, deductionPoints }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'complaints'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  const items = complaintsQuery.data ?? [];

  return (
    <div>
      <PageHeader
        title="Khiếu nại đơn"
        description="Xác minh khiếu nại — trừ điểm uy tín partner khi đúng."
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {(['', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'] as const).map((value) => (
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
        ))}
        <Link
          to="/admin/flagged"
          className="ml-auto text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
        >
          Tin chat bị lọc PII →
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

          return (
            <article
              key={item.id}
              className="rounded-2xl border border-[var(--color-line)] bg-white p-4 text-sm shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">
                    {COMPLAINT_CATEGORIES.find((c) => c.value === item.category)?.label ??
                      item.category}{' '}
                    ·{' '}
                    <Link
                      to={`/admin/bookings/${item.bookingId}`}
                      className="hover:text-[var(--color-brand-deep)]"
                    >
                      {item.booking.service.name}
                    </Link>
                  </p>
                  <p className="text-[var(--color-muted)]">
                    Khách {item.reporter.fullName} → Partner {item.partner.fullName} ·{' '}
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--color-brand-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-brand-deep)]">
                  {statusLabels[item.status]}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-line leading-relaxed">{item.description}</p>

              {item.status === 'VERIFIED' && item.deductionPoints ? (
                <p className="mt-2 text-xs font-semibold text-amber-800">
                  Đã trừ {item.deductionPoints} điểm uy tín
                </p>
              ) : null}

              {pending ? (
                <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-[var(--color-line)] pt-3">
                  <label className="text-xs font-semibold text-[var(--color-muted)]">
                    Mức trừ
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
                        resolveMutation.mutate({ id: item.id, status: 'UNDER_REVIEW' })
                      }
                    >
                      Nhận xử lý
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-lg bg-[var(--color-brand-deep)] px-3 py-1.5 text-sm font-semibold text-white"
                    disabled={resolveMutation.isPending}
                    onClick={() =>
                      resolveMutation.mutate({
                        id: item.id,
                        status: 'VERIFIED',
                        deductionPoints: deduction,
                      })
                    }
                  >
                    Xác minh đúng & trừ điểm
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700"
                    disabled={resolveMutation.isPending}
                    onClick={() => resolveMutation.mutate({ id: item.id, status: 'REJECTED' })}
                  >
                    Từ chối
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
