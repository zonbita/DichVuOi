export type PartnerServicePostStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PartnerServicePost = {
  id: string;
  title: string;
  body: string;
  coverUrl: string | null;
  images: string[];
  serviceId: string;
  /** Giá chào min — alias priceMin (tương thích). */
  price: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  status: PartnerServicePostStatus;
  rejectReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  service: {
    id: string;
    slug: string;
    name: string;
    unit: string;
    category: {
      id: string;
      name: string;
      slug: string;
      group: { id: string; name: string; slug: string };
    } | null;
  };
};
