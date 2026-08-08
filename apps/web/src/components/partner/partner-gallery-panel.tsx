import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { api } from '../../services/api';
import { mediaSrc } from '../../utils/media-src';

const MAX_GALLERY = 6;

/**
 * Album portfolio hồ sơ (galleryJson) — khác ảnh bài đăng dịch vụ.
 */
export function PartnerGalleryPanel() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const profileQuery = useQuery({
    queryKey: ['partner', 'me'],
    queryFn: api.getPartnerProfile,
  });

  const gallery = profileQuery.data?.gallery ?? [];

  const saveMutation = useMutation({
    mutationFn: (next: string[]) => api.updatePartnerProfile({ gallery: next }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['partner', 'me'] });
      setError('');
    },
    onError: (err: Error) => setError(err.message || 'Không lưu được album'),
  });

  async function onPick(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    const room = MAX_GALLERY - gallery.length;
    if (room <= 0) {
      setError(`Tối đa ${MAX_GALLERY} ảnh portfolio`);
      return;
    }
    const picked = [...files].slice(0, room);
    const urls: string[] = [];
    try {
      for (const file of picked) {
        const up = await api.uploadServicePostImage(file);
        urls.push(up.url);
      }
      await saveMutation.mutateAsync([...gallery, ...urls]);
    } catch (err) {
      setError((err as Error).message || 'Upload thất bại');
    }
  }

  function removeAt(index: number) {
    const next = gallery.filter((_, i) => i !== index);
    saveMutation.mutate(next);
  }

  if (profileQuery.isLoading) {
    return (
      <p className="text-sm text-[var(--color-muted)]">Đang tải album…</p>
    );
  }

  if (!profileQuery.data) return null;

  return (
    <section className="glass-card space-y-3 p-4 sm:p-5">
      <div>
        <h3 className="text-base font-extrabold text-[var(--color-navy)]">
          Portfolio hồ sơ
        </h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Ảnh đời tư / showcase (tối đa {MAX_GALLERY}) — khác ảnh trong bài đăng dịch vụ.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {gallery.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="relative aspect-square overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)]"
          >
            <img
              src={mediaSrc(url)}
              alt=""
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute right-1 top-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white"
            >
              Xóa
            </button>
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void onPick(e.target.files);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={gallery.length >= MAX_GALLERY || saveMutation.isPending}
        onClick={() => inputRef.current?.click()}
        className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
      >
        {saveMutation.isPending ? 'Đang lưu…' : 'Thêm ảnh'}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
