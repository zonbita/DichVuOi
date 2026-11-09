import { Icon } from '../../components/ui/icon';
import { PriceRangeSlider } from '../../components/ui/price-range-slider';
import { SimpleRichEditor } from '../../components/ui/simple-rich-editor';
import { mediaSrc } from '../../utils/media-src';
import { MAX_IMAGES } from './constants';
import type { PartnerServicePostsState } from './use-partner-service-posts';

export function ServicePostForm({ state }: { state: PartnerServicePostsState }) {
  const {
    form,
    setForm,
    editingId,
    setEditingId,
    setFormOpen,
    error,
    setError,
    uploadError,
    fileInputRef,
    saveMutation,
    uploadMutation,
    onPickFiles,
    formProfessionName,
    formUnit,
  } = state;
  return (
    <form
      className="glass-card space-y-3 !rounded-2xl p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        saveMutation.mutate();
      }}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="text-base font-extrabold">
          {editingId ? 'Sửa bài đăng' : 'Bài đăng mới'}
        </h2>
        <span
          className="inline-flex items-center rounded-full border-2 border-[var(--color-brand)] bg-[var(--color-brand)] px-3 py-1 text-xs font-extrabold text-white"
          title={
            editingId
              ? 'Sửa bài — sau khi lưu sẽ chờ BQT duyệt lại'
              : 'Sau khi lưu, bài sẽ chờ BQT duyệt'
          }
        >
          Nghề: {formProfessionName}
        </span>
      </div>
      <p className="text-xs text-[var(--color-muted)]">
        Sau khi lưu, bài sẽ ở trạng thái chờ BQT duyệt
        {editingId ? ' (kể cả khi sửa bài đã duyệt)' : ''}.
      </p>
      <label className="block text-sm">
        <span className="font-semibold">Tiêu đề</span>
        <input
          className="mt-1 w-full rounded-xl border border-[var(--color-line)] px-3 py-2"
          value={form.title}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, title: e.target.value }))
          }
          maxLength={160}
          required
          placeholder="VD: Thiết kế nội thất 3D — Rhino & Revit"
        />
      </label>
      <div className="overflow-hidden rounded-xl border border-[#DCE6EC] bg-white">
        <div className="px-3 py-2.5 sm:px-4 sm:py-3">
          <PriceRangeSlider
            layout="vertical"
            title={`Giá chào (${formUnit})`}
            min={form.priceMin}
            max={form.priceMax}
            showBubbles
            onChange={({ min, max }) =>
              setForm((prev) => ({
                ...prev,
                priceMin: min,
                priceMax: max,
              }))
            }
          />
          <p className="mt-1.5 text-xs text-[var(--color-muted)]">
            Kéo thanh hoặc nhập «Từ / Đến» — tối thiểu 1.000 VNĐ khi lưu.
          </p>
        </div>
      </div>
      <div className="block text-sm">
        <span className="font-semibold">Nội dung</span>
        <SimpleRichEditor
          value={form.body}
          onChange={(body) => setForm((prev) => ({ ...prev, body }))}
          placeholder="Mô tả phạm vi, quy trình, cam kết chất lượng…"
          minPlainLength={20}
        />
      </div>
      <div className="block text-sm">
        <span className="font-semibold">
          Ảnh dịch vụ <span className="text-red-600">*</span>
        </span>
        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
          Chọn nhiều ảnh · ô vuông một hàng · bắt buộc ít nhất 1 · tối đa{' '}
          {MAX_IMAGES}
        </p>
        <div className="mt-2 flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
          {form.images.map((url) => (
            <div key={url} className="relative h-20 w-20 shrink-0">
              <img
                src={mediaSrc(url)}
                alt=""
                className="h-20 w-20 rounded-lg border border-[var(--color-line)] object-cover"
              />
              <button
                type="button"
                aria-label="Xóa ảnh"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    images: prev.images.filter((u) => u !== url),
                  }))
                }
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white"
              >
                ×
              </button>
            </div>
          ))}
          {form.images.length < MAX_IMAGES ? (
            <button
              type="button"
              disabled={uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-line)] bg-[var(--color-canvas)] text-[var(--color-muted)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand-deep)] disabled:opacity-60"
            >
              <Icon name="upload" className="h-5 w-5" />
              <span className="mt-1 text-[10px] font-bold">
                {uploadMutation.isPending ? '…' : 'Thêm'}
              </span>
            </button>
          ) : null}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => onPickFiles(e.target.files)}
        />
        {uploadError ? (
          <p className="mt-1 text-sm text-red-600">{uploadError}</p>
        ) : null}
        {form.images.length === 0 ? (
          <p className="mt-1 text-xs text-amber-700">
            Cần ít nhất một ảnh để gửi duyệt.
          </p>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="btn-primary px-4 py-2 text-sm"
          disabled={saveMutation.isPending || form.images.length < 1}
        >
          {saveMutation.isPending ? 'Đang lưu…' : 'Gửi duyệt'}
        </button>
        <button
          type="button"
          className="btn-secondary px-4 py-2 text-sm"
          onClick={() => {
            setFormOpen(false);
            setEditingId(null);
            setError(null);
          }}
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
