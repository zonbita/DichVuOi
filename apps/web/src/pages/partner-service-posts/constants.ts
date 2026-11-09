import { PRICE_SLIDER_MIN } from '../../components/ui/price-range-slider';
import type { PartnerServicePost } from '../../types/partner-service-post';

export const MAX_IMAGES = 8;
/** Trần mặc định khi chưa có giá chào. */
export const DEFAULT_PRICE_MAX = 5_000_000;

export const STATUS_LABEL: Record<PartnerServicePost['status'], string> = {
  PENDING: 'Chờ BQT duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

export const STATUS_CLASS: Record<PartnerServicePost['status'], string> = {
  PENDING: 'border-amber-300 bg-amber-50 text-amber-800',
  APPROVED: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  REJECTED: 'border-red-300 bg-red-50 text-red-700',
};


export type FormState = {
  serviceId: string;
  title: string;
  body: string;
  priceMin: number;
  priceMax: number;
  images: string[];
};

export const emptyForm = (
  serviceId = '',
  priceMin = PRICE_SLIDER_MIN,
  priceMax = DEFAULT_PRICE_MAX,
): FormState => ({
  serviceId,
  title: '',
  body: '',
  priceMin,
  priceMax: Math.max(priceMax, priceMin),
  images: [],
});

export type OfferingOption = {
  serviceId: string;
  name: string;
  unit: string;
  price: number | null;
  priceMin: number | null;
  priceMax: number | null;
  groupName: string;
  groupSlug: string;
};
