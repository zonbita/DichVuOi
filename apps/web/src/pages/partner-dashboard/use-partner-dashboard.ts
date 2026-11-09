import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { ProfessionOption } from '../../components/ui/profession-tags-input';
import { useAuth } from '../../features/auth/auth-context';
import { usePartnerRealtime } from '../../hooks/use-partner-realtime';
import { catalogQueries } from '../../lib/catalog-queries';
import { toast } from '../../lib/notify';
import { findProvinceByName } from '../../data/provinces';
import { api } from '../../services/api';
import {
  defaultCity,
  phoneRegex,
  profileSchema,
  type ProfileInput,
  type ProfileValues,
} from './profile-schema';

export function usePartnerDashboard() {
  const { user, loading, canOffer, applySession, setMode, refreshMe } = useAuth();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const legacyTab = searchParams.get('tab');
  const tab =
    pathname.endsWith('/don-thue') || legacyTab === 'incoming'
      ? 'incoming'
      : pathname.endsWith('/viec') || legacyTab === 'jobs'
        ? 'jobs'
        : pathname.endsWith('/ho-so') || legacyTab === 'profile'
          ? 'profile'
          : pathname.endsWith('/cap-do') || legacyTab === 'level'
            ? 'level'
            : 'overview';
  const [profileServiceIds, setProfileServiceIds] = useState<string[]>([]);
  /** Lọc Việc của tôi theo nghề — `'all'` = mọi nghề. */
  const [jobsProfessionId, setJobsProfessionId] = useState('all');
  const [appliedBookingIds, setAppliedBookingIds] = useState<string[]>([]);

  const openQuery = useQuery({
    queryKey: ['bookings', 'open'],
    queryFn: api.getOpenBookings,
    enabled: canOffer,
  });

  const mineQuery = useQuery({
    queryKey: ['bookings', 'partner'],
    queryFn: api.getPartnerBookings,
    enabled: canOffer,
  });

  const profileQuery = useQuery({
    queryKey: ['partner', 'me'],
    queryFn: api.getPartnerProfile,
    enabled: canOffer,
  });

  const levelQuery = useQuery({
    queryKey: ['partner', 'me', 'level'],
    queryFn: api.getPartnerLevel,
    enabled: canOffer,
  });

  usePartnerRealtime(canOffer, user?.id);

  const servicesQuery = useQuery(catalogQueries.services);

  const professionOptions = useMemo<ProfessionOption[]>(
    () =>
      (servicesQuery.data ?? []).map((service) => ({
        id: service.id,
        name: service.name,
        slug: service.slug,
        groupSlug: service.category.group.slug,
        groupName: service.category.group.name,
        categoryName: service.category.name,
      })),
    [servicesQuery.data],
  );

  const hoursByServiceId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const offering of profileQuery.data?.offerings ?? []) {
      map[offering.serviceId] = offering.hoursWorked ?? 0;
    }
    return map;
  }, [profileQuery.data?.offerings]);

  useEffect(() => {
    if (!profileQuery.data) return;
    setProfileServiceIds(
      profileQuery.data.serviceIds ??
        profileQuery.data.offerings?.map((o) => o.serviceId) ??
        [],
    );
  }, [profileQuery.data]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    formState: { isSubmitting, errors },
  } = useForm<ProfileInput, unknown, ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      phone: profileQuery.data?.user?.phone ?? user?.phone ?? '',
      bio: profileQuery.data?.bio ?? '',
      city:
        findProvinceByName(profileQuery.data?.city)?.name ??
        findProvinceByName(profileQuery.data?.districtsList?.[0])?.name ??
        defaultCity,
    },
  });

  /** Tạo hồ sơ nhận việc lần đầu (API enable) — không còn form «Bật nhận việc» riêng. */
  async function ensurePartnerProfile(values?: ProfileValues) {
    if (canOffer) return;
    const v = values ?? getValues();
    const phone = (v.phone || user?.phone || '').trim();
    if (!phoneRegex.test(phone)) {
      throw new Error('Nhập SĐT hợp lệ trên hồ sơ trước khi tải ảnh');
    }
    const city = v.city || defaultCity;
    const session = await api.enableOffering({
      phone,
      bio: v.bio,
      city,
      serviceIds: profileServiceIds,
    });
    applySession(session);
    setMode('offer');
    await queryClient.invalidateQueries({ queryKey: ['partner'] });
    await queryClient.invalidateQueries({ queryKey: ['bookings'] });
    await queryClient.invalidateQueries({ queryKey: ['services'] });
  }

  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.applyBooking(id),
    onSuccess: async (_, id) => {
      setAppliedBookingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast.success('Đã ứng tuyển', {
        description: 'Đơn đã vào Việc của tôi — chờ chủ đơn chọn',
      });
      navigate('/doi-tac/viec');
    },
    onError: (err) => {
      const message = (err as Error).message || 'Không ứng tuyển được';
      toast.error(message, {
        description:
          message.includes('chưa có đăng ký nghề')
            ? 'Vào Hồ sơ để thêm nghề này rồi thử lại'
            : undefined,
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateBookingStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['partner', 'me', 'level'] });
    },
  });

  const approveSettlementMutation = useMutation({
    mutationFn: (id: string) => api.approveBookingSettlement(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
      void queryClient.invalidateQueries({ queryKey: ['partner', 'me', 'level'] });
    },
  });

  const profileMutation = useMutation({
    mutationFn: async (values: ProfileValues) => {
      if (!canOffer) {
        await ensurePartnerProfile(values);
        return;
      }
      await api.updatePartnerProfile({
        phone: values.phone,
        bio: values.bio,
        city: values.city,
        districts: values.city,
      });
      await api.syncPartnerOfferings(profileServiceIds);
    },
    onSuccess: async () => {
      await refreshMe();
      await queryClient.invalidateQueries({ queryKey: ['partner', 'me'] });
      await queryClient.invalidateQueries({ queryKey: ['partner', 'me', 'level'] });
      await queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Đã lưu hồ sơ', {
        description: 'Thông tin người làm đã được cập nhật',
      });
    },
    onError: (err) => {
      toast.error('Không lưu được hồ sơ', {
        description: (err as Error).message || 'Thử lại sau',
      });
    },
  });

  const jobsProfessionTabs = useMemo(() => {
    const open = openQuery.data ?? [];

    /** Chỉ nghề user đã gắn trên hồ sơ — không suy từ đơn lạ. */
    const fromOfferings = (profileQuery.data?.offerings ?? [])
      .filter((o) => o.isActive !== false)
      .map((o) => ({ id: o.serviceId, label: o.service.name }));

    const selected =
      fromOfferings.length > 0
        ? fromOfferings
        : (profileQuery.data?.serviceIds ?? profileServiceIds).map((id) => {
            const opt = professionOptions.find((p) => p.id === id);
            return { id, label: opt?.name ?? id };
          });

    const countFor = (serviceId: string) =>
      open.filter((b) => b.service?.id === serviceId).length;

    const professionTabs = selected
      .map((s) => {
        const option = professionOptions.find((p) => p.id === s.id);
        return {
          id: s.id,
          label: s.label,
          count: countFor(s.id),
          groupSlug: option?.groupSlug,
          groupName: option?.groupName,
          categoryName: option?.categoryName,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));

    return [
      {
        id: 'all',
        label: 'Tất cả nghề',
        count: open.length,
        groupSlug: undefined,
        groupName: undefined,
        categoryName: undefined,
      },
      ...professionTabs,
    ];
  }, [
    openQuery.data,
    profileQuery.data?.offerings,
    profileQuery.data?.serviceIds,
    profileServiceIds,
    professionOptions,
  ]);

  useEffect(() => {
    if (jobsProfessionId === 'all') return;
    const stillExists = jobsProfessionTabs.some((t) => t.id === jobsProfessionId);
    if (!stillExists) setJobsProfessionId('all');
  }, [jobsProfessionId, jobsProfessionTabs]);

  return {
    user,
    loading,
    canOffer,
    pathname,
    legacyTab,
    tab,
    profileServiceIds,
    setProfileServiceIds,
    jobsProfessionId,
    setJobsProfessionId,
    appliedBookingIds,
    openQuery,
    mineQuery,
    profileQuery,
    levelQuery,
    professionOptions,
    hoursByServiceId,
    register,
    handleSubmit,
    reset,
    control,
    isSubmitting,
    errors,
    ensurePartnerProfile,
    acceptMutation,
    statusMutation,
    approveSettlementMutation,
    profileMutation,
    jobsProfessionTabs,
  };
}

export type PartnerDashboardState = ReturnType<typeof usePartnerDashboard>;
