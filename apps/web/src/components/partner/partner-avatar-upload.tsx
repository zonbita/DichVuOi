import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useAuth } from '../../features/auth/auth-context';
import { api } from '../../services/api';
import { resizeImageToSquare } from '../../utils/resize-image';
import { Icon } from '../ui/icon';

type Props = {
  name: string;
  avatarUrl?: string | null;
  /** Tạo PartnerProfile nếu chưa có (trước khi PATCH avatar). */
  ensureProfile?: () => Promise<void>;
};

export function PartnerAvatarUpload({
  name,
  avatarUrl,
  ensureProfile,
}: Props) {
  const { refreshMe } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const displaySrc = preview ?? avatarUrl ?? null;

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      if (ensureProfile) await ensureProfile();
      const square = await resizeImageToSquare(file, 200);
      const uploaded = await api.uploadAvatarImage(square);
      await api.updatePartnerProfile({ avatarUrl: uploaded.url });
      return uploaded.url;
    },
    onSuccess: async (url) => {
      setPreview(url);
      setError('');
      await queryClient.invalidateQueries({ queryKey: ['partner', 'me'] });
      await refreshMe();
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

  function openPicker() {
    if (mutation.isPending) return;
    inputRef.current?.click();
  }

  return (
    <div className="flex h-full flex-col rounded-[18px] border border-[#DCE6EC] bg-[#F4F8FA] p-4 sm:p-5">
      <div className="mb-2 flex items-center gap-2">
        <Icon name="user" className="h-4 w-4 text-[#079A9A]" />
        <h3 className="text-sm font-semibold text-[#0F2F4A]">Ảnh đại diện</h3>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-[#64748B]">
        Tự cắt giữa và chuẩn hóa <strong className="font-semibold">200×200px</strong>{' '}
        (JPG/PNG/WEBP/GIF).
      </p>

      <div
        className={`relative mx-auto aspect-square w-full max-w-[200px] overflow-hidden rounded-[12px] border-2 border-dashed bg-white transition ${
          dragging
            ? 'border-[#079A9A] bg-[#E8F7F6]'
            : 'border-[#DCE6EC] hover:border-[#13B8B0]'
        } ${mutation.isPending ? 'opacity-70' : ''}`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onPick(e.dataTransfer.files?.[0]);
        }}
      >
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={name}
            width={200}
            height={200}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#64748B]">
            <Icon name="user" className="h-10 w-10" />
            <span className="text-sm font-medium">200×200</span>
          </div>
        )}

        <button
          type="button"
          aria-label="Chụp / chọn ảnh"
          disabled={mutation.isPending}
          onClick={openPicker}
          className="absolute right-2.5 bottom-2.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#079A9A] text-white shadow-[0_2px_8px_rgba(7,154,154,0.28)] transition hover:bg-[#068787] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#13B8B0]/40 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <Icon name="camera" className="h-4 w-4" />
        </button>
      </div>

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
        onClick={openPicker}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-[#DCE6EC] bg-white px-3 text-sm font-semibold text-[#0F2F4A] transition hover:border-[#13B8B0]/60 hover:bg-[#F4F8FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#13B8B0]/30 disabled:opacity-60"
      >
        <Icon name="upload" className="h-4 w-4 text-[#079A9A]" />
        {mutation.isPending ? 'Đang tải…' : 'Tải ảnh lên'}
      </button>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {mutation.isSuccess && !error ? (
        <p className="mt-2 text-sm font-semibold text-[#079A9A]">Đã cập nhật ảnh.</p>
      ) : null}
    </div>
  );
}
