import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  hireServiceSchema,
  defaultScheduledAtLocal,
  defaultPublishAtLocal,
  applyDepositPercentBounds,
  clampApplyDepositPercent,
  type HireServiceFormValues,
} from '../../../features/booking/create-booking-schema';
import { useAuth } from '../../../features/auth/auth-context';
import { api } from '../../../services/api';
import type { ServiceGroupTree } from '../../../types/catalog';
import { groupColor } from '../../../utils/catalog-colors';
import type { CatalogServicePick } from '../../home/catalog-menu-shared';
import { PRICE_SLIDER_MIN } from '../../ui/price-range-slider';
import { defaultBudgetForService, flattenServices } from './hire-form-utils';

export type HireServiceFormProps = {
  groups: ServiceGroupTree[];
  selected: CatalogServicePick | null;
  onSelectedChange: (pick: CatalogServicePick | null) => void;
};

export function useHireServiceForm({
  groups,
  selected,
  onSelectedChange,
}: HireServiceFormProps) {
  const { user, refreshMe } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState<string[]>([]);

  const services = useMemo(() => flattenServices(groups), [groups]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<HireServiceFormValues>({
    resolver: zodResolver(hireServiceSchema),
    defaultValues: {
      serviceSlug: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      scheduledAt: defaultScheduledAtLocal(),
      schedulePublish: false,
      publishAt: '',
      jobTitle: '',
      note: '',
      budgetMin: PRICE_SLIDER_MIN,
      budgetMax: 5_000_000,
      applyDepositPercent: 10,
    },
  });

  const serviceSlug = watch('serviceSlug');
  const budgetMin = watch('budgetMin');
  const budgetMax = watch('budgetMax');
  const applyDepositPercent = watch('applyDepositPercent');
  const depositBounds = applyDepositPercentBounds(budgetMax || 0);
  const customerName = watch('customerName');
  const customerPhone = watch('customerPhone');
  const scheduledAt = watch('scheduledAt');
  const schedulePublish = watch('schedulePublish');
  const publishAt = watch('publishAt');
  const jobTitle = watch('jobTitle');

  useEffect(() => {
    if (!schedulePublish) return;
    if (publishAt && publishAt.trim()) return;
    setValue('publishAt', defaultPublishAtLocal(), { shouldValidate: true });
  }, [schedulePublish, publishAt, setValue]);

  useEffect(() => {
    if (!user) return;
    reset((current) => ({
      ...current,
      customerName: current.customerName || user.fullName,
      customerPhone: current.customerPhone || user.phone || '',
      customerEmail: current.customerEmail || user.email || '',
    }));
  }, [user, reset]);

  useEffect(() => {
    if (selected?.slug) {
      setValue('serviceSlug', selected.slug, { shouldValidate: true });
    }
  }, [selected?.slug, setValue]);

  useEffect(() => {
    const next = clampApplyDepositPercent(
      Number.isFinite(applyDepositPercent) ? applyDepositPercent : depositBounds.defaultPercent,
      budgetMax || 0,
    );
    if (next !== applyDepositPercent) {
      setValue('applyDepositPercent', next, { shouldValidate: true });
    }
  }, [budgetMax, applyDepositPercent, depositBounds.defaultPercent, setValue]);

  useEffect(() => {
    if (!serviceSlug) {
      if (selected) onSelectedChange(null);
      return;
    }
    const match = services.find((item) => item.slug === serviceSlug);
    if (match && match.slug !== selected?.slug) {
      onSelectedChange(match);
    }
  }, [serviceSlug, services, selected?.slug, onSelectedChange, selected]);

  const activeService =
    services.find((item) => item.slug === serviceSlug) ?? null;
  const walletBudgetCap = useMemo(() => {
    if (!user) return null;
    const raw = user.walletBalance ?? 0;
    return Math.max(PRICE_SLIDER_MIN, raw);
  }, [user]);
  const activeColor = activeService
    ? groupColor(activeService.groupSlug)
    : null;

  useEffect(() => {
    if (walletBudgetCap === null) return;
    if (budgetMin > walletBudgetCap) {
      setValue('budgetMin', walletBudgetCap, { shouldValidate: true });
    }
    if (budgetMax > walletBudgetCap) {
      setValue('budgetMax', walletBudgetCap, { shouldValidate: true });
    }
  }, [walletBudgetCap, budgetMin, budgetMax, setValue]);

  useEffect(() => {
    if (!activeService) return;
    const range = defaultBudgetForService(activeService);
    const cap = walletBudgetCap ?? range.max;
    setValue('budgetMin', Math.min(range.min, cap), { shouldValidate: true });
    setValue('budgetMax', Math.min(range.max, cap), { shouldValidate: true });
  }, [activeService?.slug, setValue, activeService, walletBudgetCap]);

  const activeStep: 1 | 2 | 3 = !serviceSlug
    ? 1
    : !(customerName?.trim() && customerPhone?.trim() && scheduledAt)
      ? 2
      : 3;

  const depositPercent = Number.isFinite(applyDepositPercent)
    ? clampApplyDepositPercent(applyDepositPercent, budgetMax || 0)
    : depositBounds.defaultPercent;
  const depositFillPct =
    ((depositPercent - depositBounds.min) /
      Math.max(1, depositBounds.max - depositBounds.min)) *
    100;
  const depositEstimate = Math.max(
    depositPercent === 0 ? 0 : 1,
    Math.round(((budgetMax || 0) * depositPercent) / 100),
  );

  const bookingMutation = useMutation({
    mutationFn: api.createBooking,
    onSuccess: async (booking) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        queryClient.invalidateQueries({ queryKey: ['bookings', 'mine'] }),
        refreshMe(),
      ]);
      navigate(`/dat-lich/${booking.id}`);
    },
  });

  function onSubmit(values: HireServiceFormValues) {
    if (!user) {
      navigate(`/dang-nhap?redirect=/don-cua-toi/thue`);
      return;
    }

    const taskNote = tasks.map((t) => t.trim()).filter(Boolean).join('\n');
    bookingMutation.mutate({
      serviceSlug: values.serviceSlug,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      customerEmail: values.customerEmail || undefined,
      address: 'Cập nhật sau khi chọn người làm',
      scheduledAt: new Date(values.scheduledAt).toISOString(),
      publishAt:
        values.schedulePublish && values.publishAt?.trim()
          ? new Date(values.publishAt).toISOString()
          : undefined,
      note: taskNote || undefined,
      jobTitle: values.jobTitle.trim(),
      budgetMin: values.budgetMin,
      budgetMax: values.budgetMax,
      applyDepositPercent: values.applyDepositPercent,
    });
  }

  return {
    user,
    tasks,
    setTasks,
    services,
    register,
    handleSubmit,
    setValue,
    control,
    errors,
    budgetMin,
    budgetMax,
    depositBounds,
    customerName,
    customerPhone,
    scheduledAt,
    schedulePublish,
    publishAt,
    jobTitle,
    activeService,
    walletBudgetCap,
    activeColor,
    activeStep,
    depositPercent,
    depositFillPct,
    depositEstimate,
    bookingMutation,
    onSubmit,
  };
}

export type HireServiceFormState = ReturnType<typeof useHireServiceForm>;
