import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardPageHeader } from '../components/dashboard/dashboard-chrome';
import { SquareImageSlider } from '../components/partner/square-image-slider';
import { Icon } from '../components/ui/icon';
import { RichPostBody, SimpleRichEditor } from '../components/ui/simple-rich-editor';
import { useAuth } from '../features/auth/auth-context';
import { api, formatPrice } from '../services/api';
import type { PartnerServicePost } from '../types/partner-service-post';
import { resizeImageToSquare } from '../utils/resize-image';
import { plainTextFromHtml, sanitizePostHtml } from '../utils/sanitize-post-html';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const MAX_IMAGES = 8;

function mediaSrc(url: string) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return `${API_BASE}${url}`;
}

const STATUS_LABEL: Record<PartnerServicePost['status'], string> = {
  PENDING: 'Chờ BQT duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

const STATUS_CLASS: Record<PartnerServicePost['status'], string> = {
  PENDING: 'border-amber-300 bg-amber-50 text-amber-800',
  APPROVED: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  REJECTED: 'border-red-300 bg-red-50 text-red-700',
};


type FormState = {
  serviceId: string;
  title: string;
  body: string;
  /** Chuỗi số VNĐ — parse khi lưu. */
  price: string;
  images: string[];
};

const emptyForm = (serviceId = '', price = ''): FormState => ({
  serviceId,
  title: '',
  body: '',
  price,
  images: [],
});

type OfferingOption = {
  serviceId: string;
  name: string;
  unit: string;
  price: number | null;
  groupName: string;
  groupSlug: string;
};

function ProfessionSelect({
  offerings,
  value,
  onChange,
  includeAll,
  required,
}: {
  offerings: OfferingOption[];
  value: string;
  onChange: (id: string) => void;
  includeAll?: boolean;
  required?: boolean;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, { groupName: string; items: OfferingOption[] }>();
    for (const o of offerings) {
      const key = o.groupSlug || o.groupName || 'khac';
      const entry = map.get(key) ?? { groupName: o.groupName || 'Khác', items: [] };
      entry.items.push(o);
      map.set(key, entry);
    }
    return Array.from(map.values()).map((g) => ({
      ...g,
      items: [...g.items].sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    }));
  }, [offerings]);

  return (
    <select
      className="field-input mt-1 w-full py-2.5"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    >
      {includeAll ? <option value="all">Tất cả nghề</option> : null}
      {!includeAll ? (
        <option value="" disabled>
          Chọn nghề…
        </option>
      ) : null}
      {grouped.map((group) => (
        <optgroup key={group.groupName} label={group.groupName}>
          {group.items.map((item) => (
            <option key={item.serviceId} value={item.serviceId}>
              {item.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export function PartnerServicePostsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [professionId, setProfessionId] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileQuery = useQuery({
    queryKey: ['partner', 'me'],
    queryFn: api.getPartnerProfile,
  });

  const postsQuery = useQuery({
    queryKey: ['partner', 'posts'],
    queryFn: () => api.getMyServicePosts(),
  });

  const offerings = profileQuery.data?.offerings ?? [];

  const offeringOptions = useMemo((): OfferingOption[] => {
    return offerings
      .map((o) => ({
        serviceId: o.service?.id ?? o.serviceId,
        name: o.service?.name ?? 'Nghề',
        unit: o.service?.unit ?? 'lần',
        price: o.price ?? null,
        groupName: o.service?.category?.group?.name ?? 'Khác',
        groupSlug: o.service?.category?.group?.slug ?? '',
      }))
      .filter((o) => Boolean(o.serviceId))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [offerings]);

  const postsByServiceId = useMemo(() => {
    const map = new Map<string, PartnerServicePost>();
    for (const post of postsQuery.data ?? []) {
      if (!map.has(post.serviceId)) map.set(post.serviceId, post);
    }
    return map;
  }, [postsQuery.data]);

  const selectedProfession = useMemo(
    () => offeringOptions.find((o) => o.serviceId === professionId) ?? null,
    [offeringOptions, professionId],
  );

  const existingPostForProfession =
    professionId !== 'all' ? postsByServiceId.get(professionId) ?? null : null;

  const posts = useMemo(() => {
    const all = postsQuery.data ?? [];
    if (professionId === 'all') return all;
    return all.filter((p) => p.serviceId === professionId);
  }, [postsQuery.data, professionId]);

  useEffect(() => {
    if (professionId === 'all') return;
    if (!offeringOptions.some((o) => o.serviceId === professionId)) {
      setProfessionId('all');
    }
  }, [professionId, offeringOptions]);

  function onProfessionChange(id: string) {
    setProfessionId(id);
    setFormOpen(false);
    setEditingId(null);
    setError(null);
    setUploadError('');
  }

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['partner', 'posts'] }),
      queryClient.invalidateQueries({ queryKey: ['partner', 'me'] }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.serviceId || form.serviceId === 'all') {
        throw new Error('Chọn một nghề ở bộ lọc trước khi lưu.');
      }
      if (form.images.length < 1) {
        throw new Error('Cần ít nhất một ảnh.');
      }
      const price = Number(String(form.price).replace(/[^\d]/g, ''));
      if (!Number.isFinite(price) || price < 1000) {
        throw new Error('Nhập giá chào hợp lệ (tối thiểu 1.000 VNĐ).');
      }
      const body = sanitizePostHtml(form.body);
      if (plainTextFromHtml(body).length < 20) {
        throw new Error('Nội dung cần ít nhất 20 ký tự.');
      }
      const payload = {
        serviceId: form.serviceId,
        title: form.title.trim(),
        body,
        price: Math.round(price),
        images: form.images,
      };
      if (editingId) {
        return api.updateServicePost(editingId, {
          title: payload.title,
          body: payload.body,
          price: payload.price,
          images: payload.images,
        });
      }
      return api.createServicePost(payload);
    },
    onSuccess: async () => {
      setError(null);
      setUploadError('');
      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm(professionId === 'all' ? '' : professionId));
      await invalidate();
    },
    onError: (err: Error) => setError(err.message || 'Không lưu được bài đăng'),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const square = await resizeImageToSquare(file, 640);
      return api.uploadServicePostImage(square);
    },
    onSuccess: (data) => {
      setForm((prev) => {
        if (prev.images.length >= MAX_IMAGES) return prev;
        return { ...prev, images: [...prev.images, data.url] };
      });
      setUploadError('');
    },
    onError: (err) => {
      setUploadError((err as Error).message || 'Tải ảnh thất bại');
    },
  });

  function onPickFiles(files: FileList | null) {
    if (!files?.length) return;
    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) {
      setUploadError(`Tối đa ${MAX_IMAGES} ảnh`);
      return;
    }
    const picked = Array.from(files).slice(0, remaining);
    for (const file of picked) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Chỉ nhận file ảnh');
        continue;
      }
      uploadMutation.mutate(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteServicePost(id),
    onSuccess: invalidate,
  });

  function openCreate() {
    if (professionId === 'all' || !selectedProfession) {
      setError('Chọn một nghề ở bộ lọc trước khi viết bài.');
      return;
    }
    if (existingPostForProfession) {
      openEdit(existingPostForProfession);
      return;
    }
    setEditingId(null);
    const seedPrice =
      selectedProfession.price != null && selectedProfession.price > 0
        ? String(selectedProfession.price)
        : '';
    setForm(emptyForm(professionId, seedPrice));
    setFormOpen(true);
    setError(null);
    setUploadError('');
  }

  function openEdit(post: PartnerServicePost) {
    setEditingId(post.id);
    setProfessionId(post.serviceId);
    const offeringPrice =
      offeringOptions.find((o) => o.serviceId === post.serviceId)?.price ??
      post.price;
    setForm({
      serviceId: post.serviceId,
      title: post.title,
      body: post.body,
      price:
        offeringPrice != null && offeringPrice > 0 ? String(offeringPrice) : '',
      images:
        post.images?.length > 0
          ? post.images
          : post.coverUrl
            ? [post.coverUrl]
            : [],
    });
    setFormOpen(true);
    setError(null);
    setUploadError('');
  }

  const primaryActionDisabled =
    offeringOptions.length === 0 || professionId === 'all';
  const primaryActionLabel = existingPostForProfession
    ? 'Sửa bài đăng'
    : 'Viết bài mới';
  const formProfession =
    offeringOptions.find((o) => o.serviceId === form.serviceId) ??
    selectedProfession;
  const formProfessionName = formProfession?.name ?? '—';
  const formUnit = formProfession?.unit ?? 'lần';

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        icon="pencil"
        title="Dịch vụ của tôi"
        description="Chọn nghề rồi viết / sửa bài. Mỗi nghề chỉ một bài — đã có bài thì chỉ được sửa. Bài hiện công khai sau khi BQT duyệt."
        actions={
          <div className="flex flex-wrap gap-2">
            {user?.id ? (
              <Link
                to={`/user/${user.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-navy)] shadow-[0_4px_16px_rgba(24,49,63,0.05)]"
              >
                <Icon name="eye" className="h-4 w-4" />
                Xem hồ sơ công khai
              </Link>
            ) : null}
            <button
              type="button"
              onClick={openCreate}
              disabled={primaryActionDisabled}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-navy)] px-3 py-2 text-sm font-bold !text-white transition hover:bg-[var(--color-navy-deep)] disabled:opacity-50"
              title={
                professionId === 'all'
                  ? 'Chọn một nghề ở bộ lọc trước'
                  : primaryActionLabel
              }
            >
              <Icon name="pencil" className="h-4 w-4 !text-white" />
              {primaryActionLabel}
            </button>
          </div>
        }
      />

      {offeringOptions.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5 text-sm text-[var(--color-muted)]">
          Bạn chưa gắn nghề nào trên hồ sơ.{' '}
          <Link
            to="/doi-tac/ho-so"
            className="font-semibold text-[var(--color-brand-deep)]"
          >
            Cập nhật Hồ sơ
          </Link>{' '}
          trước khi đăng bài.
        </div>
      ) : (
        <label className="block w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2.5 text-sm">
          <span className="text-sm font-extrabold tracking-wide text-[var(--color-brand-deep)]">
            Chọn nghề để viết / sửa bài
          </span>
          <ProfessionSelect
            offerings={offeringOptions}
            value={professionId}
            onChange={onProfessionChange}
            includeAll
          />
          {professionId === 'all' ? (
            <p className="mt-1.5 text-xs text-amber-700">
              Chọn một nghề cụ thể để viết bài mới hoặc sửa bài đã có.
            </p>
          ) : existingPostForProfession ? (
            <p className="mt-1.5 text-xs text-[var(--color-muted)]">
              Nghề này đã có bài — chỉ được sửa, không tạo thêm.
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-[var(--color-muted)]">
              Nghề này chưa có bài — bấm «Viết bài mới».
            </p>
          )}
        </label>
      )}

      {formOpen ? (
        <form
          className="space-y-3 rounded-2xl border border-[var(--color-line)] bg-white p-4 sm:p-5"
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
          <label className="block text-sm">
            <span className="font-semibold">
              Giá chào <span className="text-red-600">*</span>
            </span>
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              Giá bạn chào cho nghề này — hiện trên hồ sơ công khai và khi khách thuê.
            </p>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                className="w-full rounded-xl border border-[var(--color-line)] px-3 py-2"
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    price: e.target.value.replace(/[^\d]/g, ''),
                  }))
                }
                required
                placeholder="VD: 200000"
              />
              <span className="shrink-0 text-sm font-semibold text-[var(--color-muted)]">
                VNĐ/{formUnit}
              </span>
            </div>
          </label>
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
      ) : null}

      {!formOpen && error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      {postsQuery.isLoading ? (
        <p className="text-sm text-[var(--color-muted)]">Đang tải bài đăng…</p>
      ) : null}

      {!postsQuery.isLoading && posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white p-8 text-center text-sm text-[var(--color-muted)]">
          {professionId === 'all'
            ? 'Chọn nghề ở trên để xem / viết bài.'
            : 'Chưa có bài đăng cho nghề này.'}
        </div>
      ) : null}

      <div className="space-y-3">
        {posts.map((post) => {
          const imgs =
            post.images?.length > 0
              ? post.images
              : post.coverUrl
                ? [post.coverUrl]
                : [];
          return (
            <article
              key={post.id}
              className="border border-[var(--color-line)] bg-white"
            >
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-line)] px-4 py-3 sm:px-5">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--color-brand-deep)]">
                    {post.service.name}
                  </p>
                  <span
                    className={`inline-flex border px-2.5 py-1 text-xs font-extrabold ${STATUS_CLASS[post.status]}`}
                  >
                    {STATUS_LABEL[post.status]}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm font-bold text-[var(--color-ink)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand-deep)]"
                    onClick={() => openEdit(post)}
                  >
                    <Icon name="pencil" className="h-3.5 w-3.5" />
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 border border-transparent px-3 py-1.5 text-sm font-bold text-red-700 transition hover:border-red-200 hover:bg-red-50"
                    onClick={() => {
                      if (window.confirm('Xóa bài đăng này?')) {
                        deleteMutation.mutate(post.id);
                      }
                    }}
                  >
                    <Icon name="trash" className="h-3.5 w-3.5" />
                    Xóa
                  </button>
                </div>
              </header>

              <div className="px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-extrabold leading-snug text-[var(--color-navy)]">
                    {post.title}
                  </h3>
                  {post.price != null && post.price > 0 ? (
                    <p className="text-base font-extrabold text-[var(--color-sale)]">
                      {formatPrice(post.price)}
                      <span className="text-xs font-semibold text-[var(--color-muted)]">
                        /{post.service.unit}
                      </span>
                    </p>
                  ) : null}
                </div>

                {imgs.length > 0 ? (
                  <SquareImageSlider images={imgs} resolveSrc={mediaSrc} size={112} />
                ) : null}

                <div className="mt-3 max-w-none text-sm text-[var(--color-ink)]">
                  <RichPostBody html={post.body} />
                </div>

                {post.status === 'REJECTED' && post.rejectReason ? (
                  <p className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    Lý do từ chối: {post.rejectReason}
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
