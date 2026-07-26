/** Bọc kết quả phân trang của mọi list `/api/admin/*`. */
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type AdminStats = {
  users: number;
  partners: number;
  partnersPendingVerify: number;
  bookings: number;
  openJobs: number;
  completed: number;
  cancelled: number;
  escrowHeldCount: number;
  escrowHeldAmount: number;
  escrowReleasedCount: number;
  commissionEarned: number;
  gmvCompleted: number;
  reviews: number;
  redactedMessages: number;
};

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  createdAt: string;
  partnerProfile: {
    id: string;
    isVerified: boolean;
    ratingAvg: number;
    ratingCount: number;
    acceptingJobs: boolean;
    level: number;
  } | null;
  _count: {
    customerBookings: number;
    partnerBookings: number;
  };
};

export type AdminPartner = {
  id: string;
  userId: string;
  headline: string | null;
  city: string | null;
  ratingAvg: number;
  ratingCount: number;
  level: number;
  isVerified: boolean;
  acceptingJobs: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
  };
  _count: { offerings: number };
};

export type AdminBooking = {
  id: string;
  status: string;
  paymentStatus: string;
  totalPrice: number;
  commissionAmount: number;
  partnerPayout: number;
  customerName: string;
  scheduledAt: string;
  createdAt: string;
  service: { id: string; name: string; slug: string };
  user: { id: string; fullName: string; email: string };
  partner: { id: string; fullName: string; email: string } | null;
  _count: { messages: number; reviews: number };
};

export type AdminBookingDetail = {
  id: string;
  status: string;
  paymentStatus: string;
  address: string;
  note: string | null;
  customerName: string;
  customerPhone: string;
  totalPrice: number;
  commissionBps: number;
  commissionAmount: number;
  partnerPayout: number;
  scheduledAt: string;
  createdAt: string;
  paidAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  service: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    unit: string;
  };
  user: { id: string; fullName: string; email: string; phone: string | null };
  partner: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  } | null;
  messages: Array<{
    id: string;
    body: string;
    redacted: boolean;
    createdAt: string;
    sender: { id: string; fullName: string; email: string };
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    fromUser: { id: string; fullName: string };
    toUser: { id: string; fullName: string };
  }>;
};

export type AdminReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  fromUser: { id: string; fullName: string; email: string };
  toUser: { id: string; fullName: string; email: string };
  booking: { id: string; status: string; service: { name: string } };
};

export type AdminFlaggedMessage = {
  id: string;
  body: string;
  redacted: boolean;
  createdAt: string;
  sender: { id: string; fullName: string; email: string };
  booking: { id: string; status: string; service: { name: string } };
};

export type AdminCatalogGroup = {
  id: string;
  slug: string;
  name: string;
  isFeatured: boolean;
  _count: { categories: number };
  categories: Array<{
    id: string;
    name: string;
    _count: { services: number };
  }>;
};

export type AdminCategoryOption = {
  id: string;
  name: string;
  slug: string;
  group: { id: string; name: string; slug: string };
};

export type AdminService = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  basePrice: number;
  priceMin: number;
  priceMax: number;
  unit: string;
  supportsOnline: boolean;
  durationMin: number;
  isActive: boolean;
  createdAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
    group: { id: string; name: string; slug: string };
  };
  _count: { bookings: number; partners: number };
};

export type AdminServiceInput = {
  name: string;
  slug?: string;
  categoryId: string;
  basePrice: number;
  priceMin?: number;
  priceMax?: number;
  unit?: string;
  supportsOnline?: boolean;
  durationMin?: number;
  description?: string;
  isActive?: boolean;
};
