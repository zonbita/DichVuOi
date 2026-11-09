import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PRICE_SLIDER_MIN } from '../../components/ui/price-range-slider';
import { useAuth } from '../../features/auth/auth-context';
import { api } from '../../services/api';
import type { PartnerServicePost } from '../../types/partner-service-post';
import { resizeImageToSquare } from '../../utils/resize-image';
import { plainTextFromHtml, sanitizePostHtml } from '../../utils/sanitize-post-html';
import {
  DEFAULT_PRICE_MAX,
  emptyForm,
  MAX_IMAGES,
  type FormState,
  type OfferingOption,
} from './constants';

export function usePartnerServicePosts() {
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
      .map((o) => {
        const priceMin =
          o.priceMin && o.priceMin > 0
            ? o.priceMin
            : o.price && o.price > 0
              ? o.price
              : null;
        const priceMax =
          o.priceMax && o.priceMax > 0
            ? Math.max(o.priceMax, priceMin ?? o.priceMax)
            : priceMin;
        return {
          serviceId: o.service?.id ?? o.serviceId,
          name: o.service?.name ?? 'Nghề',
          unit: o.service?.unit ?? 'lần',
          price: priceMin,
          priceMin,
          priceMax,
          groupName: o.service?.category?.group?.name ?? 'Khác',
          groupSlug: o.service?.category?.group?.slug ?? '',
        };
      })
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
      const priceMin = Math.round(form.priceMin);
      const priceMax = Math.round(form.priceMax);
      if (!Number.isFinite(priceMin) || priceMin < 1000) {
        throw new Error('Chọn giá min hợp lệ (tối thiểu 1.000 VNĐ).');
      }
      if (!Number.isFinite(priceMax) || priceMax < 1000) {
        throw new Error('Chọn giá max hợp lệ (tối thiểu 1.000 VNĐ).');
      }
      if (priceMax < priceMin) {
        throw new Error('Giá max phải lớn hơn hoặc bằng giá min.');
      }
      const body = sanitizePostHtml(form.body);
      if (plainTextFromHtml(body).length < 20) {
        throw new Error('Nội dung cần ít nhất 20 ký tự.');
      }
      const payload = {
        serviceId: form.serviceId,
        title: form.title.trim(),
        body,
        priceMin: Math.round(priceMin),
        priceMax: Math.round(priceMax),
        images: form.images,
      };
      if (editingId) {
        return api.updateServicePost(editingId, {
          title: payload.title,
          body: payload.body,
          priceMin: payload.priceMin,
          priceMax: payload.priceMax,
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
    const seedMin =
      selectedProfession.priceMin != null && selectedProfession.priceMin > 0
        ? selectedProfession.priceMin
        : selectedProfession.price != null && selectedProfession.price > 0
          ? selectedProfession.price
          : PRICE_SLIDER_MIN;
    const seedMax =
      selectedProfession.priceMax != null && selectedProfession.priceMax > 0
        ? selectedProfession.priceMax
        : seedMin > 0
          ? Math.max(seedMin, DEFAULT_PRICE_MAX)
          : DEFAULT_PRICE_MAX;
    setForm(emptyForm(professionId, seedMin, seedMax));
    setFormOpen(true);
    setError(null);
    setUploadError('');
  }

  function openEdit(post: PartnerServicePost) {
    setEditingId(post.id);
    setProfessionId(post.serviceId);
    const offering = offeringOptions.find((o) => o.serviceId === post.serviceId);
    const priceMin =
      offering?.priceMin ??
      post.priceMin ??
      post.price ??
      PRICE_SLIDER_MIN;
    const priceMax =
      offering?.priceMax ??
      post.priceMax ??
      (priceMin > 0 ? Math.max(priceMin, DEFAULT_PRICE_MAX) : DEFAULT_PRICE_MAX);
    setForm({
      serviceId: post.serviceId,
      title: post.title,
      body: post.body,
      priceMin: Math.max(0, priceMin),
      priceMax: Math.max(priceMin, priceMax),
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

  return {
    user,
    professionId,
    editingId,
    setEditingId,
    form,
    setForm,
    setFormOpen,
    formOpen,
    error,
    setError,
    uploadError,
    fileInputRef,
    postsQuery,
    offeringOptions,
    existingPostForProfession,
    posts,
    onProfessionChange,
    saveMutation,
    uploadMutation,
    onPickFiles,
    deleteMutation,
    openCreate,
    openEdit,
    primaryActionDisabled,
    primaryActionLabel,
    formProfessionName,
    formUnit,
  };
}

export type PartnerServicePostsState = ReturnType<typeof usePartnerServicePosts>;
