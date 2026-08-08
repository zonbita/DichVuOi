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
  complaintsPending: number;
  servicePostsPending: number;
  /** Thread chat hỗ trợ còn OPEN. */
  supportOpen: number;
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
  phoneVerified: boolean;
  bankVerified: boolean;
  bankName?: string | null;
  bankAccountNo?: string | null;
  acceptingJobs: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
    isBlocked?: boolean;
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

export type AdminServicePost = {
  id: string;
  title: string;
  body: string;
  coverUrl: string | null;
  images: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  service: {
    id: string;
    slug: string;
    name: string;
    category: {
      name: string;
      group: { name: string; slug: string };
    } | null;
  };
  partner: {
    userId: string;
    fullName: string;
    email: string;
  };
};

/** Hàng chờ duyệt — nhóm theo người làm. */
export type AdminServicePostQueueItem = {
  partnerProfileId: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  level: number;
  pendingCount: number;
  oldestPendingAt: string | null;
  firstPostId: string | null;
  posts: Array<{
    id: string;
    title: string;
    serviceName: string;
    createdAt: string;
  }>;
};

/** Chi tiết bài admin duyệt (layout gig). */
export type AdminServicePostDetail = {
  post: {
    id: string;
    title: string;
    body: string;
    coverUrl: string | null;
    images: string[];
    serviceId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
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
  seller: {
    userId: string;
    fullName: string;
    email: string;
    headline: string | null;
    city: string | null;
    avatarUrl: string | null;
    level: number;
    isVerified: boolean;
    phoneVerified?: boolean;
    bankVerified?: boolean;
    ratingAvg: number;
    ratingCount: number;
    responseMinutes: number;
    acceptingJobs: boolean;
  };
  offering: {
    id: string;
    price: number | null;
    headline: string | null;
    experienceYears: number;
    includes: string | null;
    excludes: string | null;
    coverageNote: string | null;
    unit: string;
  } | null;
  siblingPending: Array<{
    id: string;
    title: string;
    serviceName: string;
  }>;
};

export type AdminFlaggedMessage = {
  id: string;
  body: string;
  redacted: boolean;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    email: string;
    chatBanned?: boolean;
  };
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

export type AdminFinanceOverview = {
  currency: string;
  totalWalletBalance: number;
  walletsWithBalance: number;
  escrowHeldCount: number;
  escrowHeldAmount: number;
  commissionEarned: number;
  withdrawnTotal: number;
  recentTransactions: AdminFinanceTransaction[];
};

export type AdminFinanceWallet = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  walletBalance: number;
  bankName: string | null;
  bankAccountNo: string | null;
  bankAccountName: string | null;
  updatedAt: string;
};

export type AdminFinanceTransaction = {
  id: string;
  userId: string;
  bookingId: string | null;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  reference: string;
  createdAt: string;
  user: { id: string; fullName: string; email: string };
  booking?: {
    id: string;
    service: { name: string };
  } | null;
};

export type AdminFinanceAdjustResult = {
  currency: string;
  balance: number;
  amount: number;
  user: { id: string; fullName: string; email: string };
};
