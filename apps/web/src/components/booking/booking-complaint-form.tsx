import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
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

function buildEvidenceNote(text: string, imageUrls: string[]) {
  const parts = [text.trim(), ...imageUrls].filter(Boolean);
  return parts.join('\n');
}

export function BookingComplaintForm({
  bookingId,
  partnerId,
  bookingStatus,
  mode,
  requirements = [],
}: BookingComplaintFormProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categories =
    mode === 'partner' ? COMPLAINT_CATEGORIES_PARTNER : COMPLAINT_CATEGORIES_CUSTOMER;
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>(categories[0].value);
  const [description, setDescription] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedReqs, setSelectedReqs] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState('');

  const canFile =
    Boolean(partnerId) &&
    (bookingStatus === 'AWAITING_CONFIRM' || bookingStatus === 'DISPUTED');

  const evidenceCombined = buildEvidenceNote(evidenceNote, imageUrls);

  const mutation = useMutation({
    mutationFn: () =>
      api.createBookingComplaint(bookingId, {
        category,
        description,
        evidenceNote: evidenceCombined,
        requirementIds: selectedReqs.length > 0 ? selectedReqs : undefined,
      }),
    onSuccess: () => {
      setOpen(false);
      setDescription('');
      setEvidenceNote('');
      setImageUrls([]);
      setSelectedReqs([]);
      setUploadError('');
      void queryClient.invalidateQueries({ queryKey: ['complaints', 'mine'] });
      void queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadEvidenceImage(file),
    onSuccess: (data) => {
      setImageUrls((prev) => [...prev, data.url]);
      setUploadError('');
    },
    onError: (err) => {
      setUploadError((err as Error).message || 'Tải ảnh thất bại');
    },
  });

  function onPickFiles(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Chỉ nhận file ảnh');
        continue;
      }
      uploadMutation.mutate(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

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
          <div className="block text-sm">
            <span className="font-semibold text-[var(--color-muted)]">
              Bằng chứng (ảnh hoặc mô tả)
            </span>
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2"
              rows={2}
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              placeholder="Vd. mô tả thêm, link chat…"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => onPickFiles(e.target.files)}
              />
              <button
                type="button"
                disabled={uploadMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-canvas)] disabled:opacity-60"
              >
                {uploadMutation.isPending ? 'Đang tải ảnh…' : 'Tải ảnh lên'}
              </button>
              <span className="text-xs text-[var(--color-muted)]">
                JPG/PNG/WEBP/GIF · tối đa 5MB
              </span>
            </div>
            {imageUrls.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {imageUrls.map((url) => (
                  <li key={url} className="relative">
                    <img
                      src={url}
                      alt="Bằng chứng"
                      className="h-20 w-20 rounded-lg border border-[var(--color-line)] object-cover"
                    />
                    <button
                      type="button"
                      aria-label="Xóa ảnh"
                      onClick={() =>
                        setImageUrls((prev) => prev.filter((u) => u !== url))
                      }
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {uploadError ? (
              <p className="mt-1 text-sm text-red-600">{uploadError}</p>
            ) : null}
          </div>
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
              Đã gửi — đơn chuyển tranh chấp; Admin xử lý cọc giữ chỗ.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={
                mutation.isPending ||
                description.trim().length < 10 ||
                evidenceCombined.trim().length < 3
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
