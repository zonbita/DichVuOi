import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Booking } from '../../types/catalog';

type Props = {
  booking: Booking;
  currentUserId: string;
};

export function BookingReviewForm({ booking, currentUserId }: Props) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const already = (booking.reviews ?? []).some((r) => r.fromUserId === currentUserId);
  const isCustomer = booking.userId === currentUserId;
  const targetName = isCustomer
    ? booking.partner?.fullName ?? 'người làm'
    : booking.customerName;

  const mutation = useMutation({
    mutationFn: () => api.createReview(booking.id, { rating, comment: comment.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', booking.id] });
    },
  });

  if (booking.status !== 'COMPLETED') return null;
  if (already) {
    return (
      <p className="mt-3 text-sm text-[var(--color-sea)]">Bạn đã đánh giá đơn này.</p>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 rounded-md border border-black/8 bg-white p-3">
      <p className="text-sm font-semibold">
        Đánh giá {targetName ?? 'đối tác'} <span className="font-normal text-[var(--color-muted)]">(1–5)</span>
      </p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`h-9 w-9 rounded-full text-sm font-bold ${
              n <= rating
                ? 'bg-[var(--color-brand)] text-white'
                : 'bg-[var(--color-canvas)] text-[var(--color-muted)]'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Nhận xét ngắn (tuỳ chọn)"
        className="field-input mt-2 w-full text-sm"
      />
      <button
        type="submit"
        disabled={mutation.isPending}
        className="btn-primary mt-2 px-4 py-2 text-sm disabled:opacity-50"
      >
        Gửi đánh giá
      </button>
      {mutation.isError ? (
        <p className="mt-1 text-xs text-red-600">{(mutation.error as Error).message}</p>
      ) : null}
    </form>
  );
}
