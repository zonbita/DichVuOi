import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../services/api';
import type { BookingRequirement } from '../../types/catalog';
import {
  COMPLAINT_CATEGORIES_CUSTOMER,
  COMPLAINT_CATEGORIES_PARTNER,
} from '../../types/complaint';

type BookingComplaintFormProps = {
  bookingId: string;
  partnerId: string | null | undefined;
  bookingStatus: string;
  mode: 'customer' | 'partner';
  requirements?: BookingRequirement[];
};

export function BookingComplaintForm({
  bookingId,
  partnerId,
  bookingStatus,
  mode,
  requirements = [],
}: BookingComplaintFormProps) {
  const queryClient = useQueryClient();
  const categories =
    mode === 'partner' ? COMPLAINT_CATEGORIES_PARTNER : COMPLAINT_CATEGORIES_CUSTOMER;
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>(categories[0].value);
  const [description, setDescription] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [selectedReqs, setSelectedReqs] = useState<string[]>([]);

  const canFile =
    Boolean(partnerId) &&
    (bookingStatus === 'AWAITING_CONFIRM' || bookingStatus === 'DISPUTED');

  const mutation = useMutation({
    mutationFn: () =>
      api.createBookingComplaint(bookingId, {
        category,
        description,
        evidenceNote: evidenceNote.trim(),
        requirementIds: selectedReqs.length > 0 ? selectedReqs : undefined,
      }),
    onSuccess: () => {
      setOpen(false);
      setDescription('');
      setEvidenceNote('');
      setSelectedReqs([]);
      void queryClient.invalidateQueries({ queryKey: ['complaints', 'mine'] });
      void queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  if (!partnerId) return null;

  if (!canFile) {
    return (
      <div className="border border-[var(--color-line)] bg-white p-4 text-sm shadow-sm">
        <p className="font-extrabold">Khiếu nại</p>
        <p className="mt-1 text-[var(--color-muted)]">
          Chỉ gửi khi đơn đang <strong>chờ xác nhận</strong> hoặc{' '}
          <strong>đang tranh chấp</strong>. Cần lý do + bằng chứng; ban kiểm duyệt
          quyết hoàn / giải ngân.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[var(--color-line)] bg-white p-4 shadow-sm">
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
          <p className="font-extrabold">
            Khiếu nại — {mode === 'partner' ? 'phía người làm' : 'phía khách thuê'}
          </p>
          <label className="block text-sm">
            <span className="font-semibold text-[var(--color-muted)]">Loại</span>
            <select
              className="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((item) => (
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
              placeholder="Mô tả vấn đề, thời điểm…"
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-[var(--color-muted)]">
              Bằng chứng (link / mô tả ảnh·video·chat)
            </span>
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2"
              rows={2}
              minLength={3}
              required
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              placeholder="Vd. ảnh checklist, đoạn chat đơn…"
            />
          </label>
          {requirements.length > 0 ? (
            <fieldset className="text-sm">
              <legend className="font-semibold text-[var(--color-muted)]">
                Gắn mục checklist tranh chấp
              </legend>
              <ul className="mt-2 space-y-1.5">
                {requirements.map((req) => (
                  <li key={req.id}>
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1 size-4"
                        checked={selectedReqs.includes(req.id)}
                        onChange={(e) => {
                          setSelectedReqs((prev) =>
                            e.target.checked
                              ? [...prev, req.id]
                              : prev.filter((id) => id !== req.id),
                          );
                        }}
                      />
                      <span>
                        {req.content}
                        <span className="ml-1 text-[11px] text-[var(--color-muted)]">
                          {req.customerConfirmed ? '· khách đã nhận' : '· chưa nhận'}
                          {req.partnerDone ? ' · NL đã làm' : ''}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          ) : null}
          {mutation.isError ? (
            <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
          ) : null}
          {mutation.isSuccess ? (
            <p className="text-sm font-semibold text-[var(--color-brand-deep)]">
              Đã gửi — đơn chuyển tranh chấp; Admin xử lý escrow.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={
                mutation.isPending ||
                description.trim().length < 10 ||
                evidenceNote.trim().length < 3
              }
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
