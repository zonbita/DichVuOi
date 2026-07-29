import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { api } from '../../services/api';
import { resizeImageToSquare } from '../../utils/resize-image';

type Props = {
  name: string;
  avatarUrl?: string | null;
};

export function PartnerAvatarUpload({ name, avatarUrl }: Props) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  const displaySrc = preview ?? avatarUrl ?? null;

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const square = await resizeImageToSquare(file, 200);
      const uploaded = await api.uploadAvatarImage(square);
      await api.updatePartnerProfile({ avatarUrl: uploaded.url });
      return uploaded.url;
    },
    onSuccess: (url) => {
      setPreview(url);
      setError('');
      void queryClient.invalidateQueries({ queryKey: ['partner', 'me'] });
    },
    onError: (err) => {
      setError((err as Error).message || 'Tải ảnh thất bại');
    },
  });

  function onPick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Chỉ nhận file ảnh');
      return;
    }
    mutation.mutate(file);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative h-[200px] w-[200px] shrink-0 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-canvas)]">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={name}
            width={200}
            height={200}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--color-muted)]">
            200×200
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-2">
        <p className="text-sm font-semibold text-[var(--color-ink)]">Ảnh đại diện</p>
        <p className="text-xs text-[var(--color-muted)]">
          Tự cắt giữa và chuẩn hóa <strong>200×200px</strong> (JPG/PNG/WEBP/GIF).
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-semibold hover:bg-[var(--color-canvas)] disabled:opacity-60"
        >
          {mutation.isPending ? 'Đang tải…' : 'Tải ảnh lên'}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {mutation.isSuccess ? (
          <p className="text-sm font-semibold text-emerald-700">Đã cập nhật ảnh.</p>
        ) : null}
      </div>
    </div>
  );
}
