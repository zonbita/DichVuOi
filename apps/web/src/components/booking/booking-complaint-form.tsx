import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../services/api';
import { COMPLAINT_CATEGORIES } from '../../types/complaint';

type BookingComplaintFormProps = {
  bookingId: string;
  partnerId: string | null | undefined;
};

export function BookingComplaintForm({ bookingId, partnerId }: BookingComplaintFormProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>(COMPLAINT_CATEGORIES[0].value);
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.createBookingComplaint(bookingId, { category, description }),
    onSuccess: () => {
      setOpen(false);
      setDescription('');
      void queryClient.invalidateQueries({ queryKey: ['complaints', 'mine'] });
    },
  });

  if (!partnerId) return null;

  return (
    <div className="surface-card p-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
        >
          Gửi khiếu nại đơn này
        </button>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <p className="font-extrabold">Khiếu nại</p>
          <label className="block text-sm">
            <span className="font-semibold text-[var(--color-muted)]">Loại</span>
            <select
              className="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {COMPLAINT_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-[var(--color-muted)]">Mô tả</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2"
              rows={4}
              minLength={10}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả vấn đề, thời điểm, bằng chứng (ảnh chat đơn)…"
            />
          </label>
          {mutation.isError ? (
            <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
          ) : null}
          {mutation.isSuccess ? (
            <p className="text-sm font-semibold text-[var(--color-brand-deep)]">
              Đã gửi — Admin sẽ xử lý trong 1–3 ngày làm việc.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={mutation.isPending || description.trim().length < 10}
              className="btn-primary px-4 py-2 text-sm"
            >
              {mutation.isPending ? 'Đang gửi…' : 'Gửi khiếu nại'}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-semibold"
              onClick={() => setOpen(false)}
            >
              Hủy
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
