export type ServiceGroup = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isFeatured: boolean;
  _count?: { categories: number };
};

export type CatalogTreeService = {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  priceMin?: number;
  priceMax?: number;
  unit: string;
  durationMin: number;
  supportsOnline: boolean;
};

export type CatalogTreeCategory = {
  id: string;
  slug: string;
  name: string;
  services: CatalogTreeService[];
};

export type ServiceGroupTree = ServiceGroup & {
  categories: CatalogTreeCategory[];
};

export type Service = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  basePrice: number;
  /** Giá tham khảo thị trường — cận dưới. */
  priceMin?: number;
  /** Giá tham khảo thị trường — cận trên. */
  priceMax?: number;
  unit: string;
  durationMin: number;
  supportsOnline: boolean;
  /** Số người làm (đang chào dịch vụ này). */
  _count?: { partners: number };
  category: {
    id: string;
    name: string;
    slug: string;
    group: {
      id: string;
      name: string;
      slug: string;
    };
  };
};

export type GroupDetail = ServiceGroup & {
  categories: Array<{
    id: string;
    slug: string;
    name: string;
    services: Service[];
  }>;
};

export type ContactPolicy = {
  channel: 'in_app';
  phoneRevealed: boolean;
  addressRevealed: boolean;
  hint: string;
};

export type PaymentStatus = 'UNPAID' | 'HELD' | 'RELEASED' | 'REFUNDED';

export type BookingRequirement = {
  id: string;
  content: string;
  sortOrder: number;
  source: 'SERVICE_INCLUDES' | 'CUSTOMER_NOTE' | 'MANUAL';
  partnerDone: boolean;
  partnerDoneAt: string | null;
  customerConfirmed: boolean;
  customerConfirmedAt: string | null;
  evidenceUrl: string | null;
};

export type BookingReview = {
  id: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type BookingApplication = {
  id: string;
  bookingId: string;
  partnerId: string;
  depositAmount: number;
  depositStatus: PaymentStatus | string;
  status: 'APPLIED' | 'SELECTED' | 'REJECTED' | 'WITHDRAWN' | 'REFUNDED' | string;
  note?: string | null;
  createdAt: string;
  partner?: {
    id: string;
    fullName: string;
    phone?: string | null;
    email?: string;
    partnerProfile?: {
      headline?: string | null;
      ratingAvg?: number;
      ratingCount?: number;
      level?: number;
      avatarUrl?: string | null;
      city?: string | null;
      isVerified?: boolean;
      phoneVerified?: boolean;
      bankVerified?: boolean;
      onlineSeconds?: number;
      offerings?: Array<{ serviceId: string; price: number | null }>;
    } | null;
    reputationPeriods?: Array<{ currentPoints: number }>;
  } | null;
};

export type Booking = {
  id: string;
  userId?: string;
  status: string;
  address: string;
  scheduledAt: string;
  /** Giờ đăng lên bảng tin (đơn mở hẹn giờ). */
  publishAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  note: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  partnerId?: string | null;
  paymentStatus?: PaymentStatus;
  commissionBps?: number;
  commissionAmount?: number;
  partnerPayout?: number;
  paidAt?: string | null;
  releasedAt?: string | null;
  refundedAt?: string | null;
  confirmDeadlineAt?: string | null;
  matchingDeadlineAt?: string | null;
  responseDeadlineAt?: string | null;
  disputeResultNote?: string | null;
  settlementPercent?: number | null;
  settlementProposedBy?: 'CUSTOMER' | 'PARTNER' | 'ADMIN' | null;
  customerSettlementApprovedAt?: string | null;
  partnerSettlementApprovedAt?: string | null;
  settlementResolvedAt?: string | null;
  customerPhoneMasked?: boolean;
  addressMasked?: boolean;
  contactPolicy?: ContactPolicy;
  reviews?: BookingReview[];
  requirements?: BookingRequirement[];
  applications?: BookingApplication[];
  applicationCount?: number;
  /** Cọc ứng tuyển yêu cầu (₫) — theo applyDepositBps × totalPrice. */
  applyDepositAmount?: number;
  /** Basis points cọc ứng tuyển (0–10000). */
  applyDepositBps?: number;
  /** % cọc ứng tuyển (0–100). */
  applyDepositPercent?: number;
  service: Service;
  partner?: {
    id: string;
    fullName: string;
    phone: string | null;
    email: string;
  } | null;
  /** Chủ đơn (khách thuê) — có thể che SĐT trên hàng chờ. */
  user?: {
    id: string;
    fullName: string;
    phone?: string | null;
    email?: string;
  } | null;
};

/** Slot lịch tháng partner (API schedule). */
export type ScheduleSlot = Booking & {
  day: number;
  startHour: number;
  endHour: number;
  durationMin: number;
  durationHours: number;
};

export type PartnerSchedule = {
  year: number;
  month: number;
  daysInMonth: number;
  items: ScheduleSlot[];
};

export type BookingMessage = {
  id: string;
  bookingId: string;
  body: string;
  redacted: boolean;
  createdAt: string;
  sender: { id: string; fullName: string };
};

export type CreateBookingInput = {
  serviceSlug: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  scheduledAt: string;
  /** Hẹn giờ đăng lên bảng tin (ISO). Chỉ đơn mở. */
  publishAt?: string;
  partnerId?: string;
  note?: string;
  budgetMin?: number;
  budgetMax?: number;
  /** % cọc ứng tuyển người làm (0–100). Mặc định API = 10. */
  applyDepositPercent?: number;
};

export type ServiceProvider = {
  id: string;
  price: number;
  headline: string | null;
  experienceYears: number;
  /** Giờ làm nghề này trên sàn (đơn hoàn thành × durationMin). */
  hoursWorked?: number;
  includes?: string | null;
  excludes?: string | null;
  coverageNote?: string | null;
  partner: {
    userId: string;
    fullName: string;
    city: string | null;
    districts?: string[];
    skills?: string[];
    acceptingJobs?: boolean;
    workModes?: Array<'onsite' | 'online'>;
    responseMinutes?: number;
    bio: string | null;
    headline: string | null;
    ratingAvg: number;
    ratingCount: number;
    isVerified: boolean;
    phoneVerified?: boolean;
    bankVerified?: boolean;
    /** Cấp 1–100 — chỉ người làm. */
    level: number;
    avatarUrl: string | null;
    completedJobs: number;
    reputation?: {
      currentPoints: number;
      startingPoints: number;
      percent: number;
      periodIndex: number;
      periodStart: string;
      periodEnd: string;
      deductedThisPeriod: number;
    } | null;
  };
};

/** Partner đã lưu — section «Người làm quen». */
export type FavoritePartner = {
  partnerUserId: string;
  fullName: string;
  headline: string | null;
  avatarUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  level: number;
  isVerified: boolean;
  phoneVerified?: boolean;
  bankVerified?: boolean;
  acceptingJobs: boolean;
  favoritedAt: string;
  topOffering: {
    serviceSlug: string;
    serviceName: string;
    price: number;
    unit: string;
  } | null;
};

/** Kết quả tìm người làm theo tên / nghề (`GET /api/partners/search`). */
export type PartnerSearchHit = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
  ratingAvg: number;
  level: number;
  isVerified: boolean;
  phoneVerified?: boolean;
  bankVerified?: boolean;
  serviceSlug: string | null;
  serviceName: string | null;
  price: number | null;
  unit: string | null;
  matchReason: 'name' | 'profession';
};

/** Gợi ý thuê lại từ đơn COMPLETED. */
export type RebookHint = {
  partnerUserId: string;
  partnerName: string;
  partnerAvatarUrl: string | null;
  serviceSlug: string;
  serviceName: string;
  groupSlug: string;
  lastBookedAt: string;
  lastPrice: number;
  bookingCount: number;
};
