export type UserRole = 'CUSTOMER' | 'PARTNER' | 'ADMIN';

export type WorkMode = 'onsite' | 'online';

export type PartnerLevelBreakdown = {
  storedLevel: number;
  level: number;
  totalPoints: number;
  hoursPoints: number;
  jobsPoints: number;
  ratingPoints: number;
  reviewCountPoints: number;
  verifiedBonus: number;
  diversityBonus: number;
  hoursByServicePoints: Array<{
    serviceId: string;
    hours: number;
    points: number;
    serviceName: string | null;
    serviceSlug: string | null;
  }>;
  inputs: {
    completedJobs: number;
    ratingAvg: number;
    ratingCount: number;
    isVerified: boolean;
    activeOfferings: number;
  };
  formula: {
    hours: { perHour: number; perServiceHoursCap: number; totalCap: number };
    jobs: { perJob: number; cap: number };
    rating: { minReviews: number; maxPoints: number };
    reviewCount: { perReview: number; cap: number };
    verifiedBonus: number;
    diversity: { perOffering: number; cap: number };
    levelRange: { min: number; max: number };
  };
};

export type PartnerProfile = {
  id: string;
  headline: string | null;
  bio: string | null;
  city: string | null;
  districts?: string | null;
  isVerified: boolean;
  /** Cấp 1–100 — chỉ có khi user là người làm. */
  level: number;
  avatarUrl?: string | null;
  /** Portfolio ảnh (URL). */
  gallery?: string[];
  galleryJson?: string | null;
  skillsJson?: string | null;
  skills?: string[];
  acceptingJobs?: boolean;
  workModes?: string | null;
  workModesList?: WorkMode[];
  districtsList?: string[];
  responseMinutes?: number;
  /** Nghề đang gắn (Service id) — chọn nhiều như tags. */
  serviceIds?: string[];
  offerings?: Array<{
    id: string;
    serviceId: string;
    price: number | null;
    headline: string | null;
    isActive: boolean;
    /** Tổng giờ làm nghề này trên sàn (đơn COMPLETED). */
    hoursWorked?: number;
    service: {
      id: string;
      slug: string;
      name: string;
      unit: string;
      basePrice: number;
      category: {
        id: string;
        name: string;
        slug: string;
        group: { id: string; name: string; slug: string };
      };
    };
  }>;
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  partnerProfile: PartnerProfile | null;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

/** Hồ sơ công khai người làm (không SĐT/email). */
export type PublicPartnerProfile = {
  id: string;
  userId: string;
  fullName: string;
  headline: string | null;
  bio: string | null;
  city: string | null;
  districts: string[];
  skills: string[];
  acceptingJobs: boolean;
  workModes: WorkMode[];
  responseMinutes: number;
  ratingAvg: number;
  ratingCount: number;
  level: number;
  isVerified: boolean;
  avatarUrl: string | null;
  gallery: string[];
  completedJobs: number;
  offerings: Array<{
    id: string;
    price: number;
    headline: string | null;
    experienceYears: number;
    /** Tổng giờ làm nghề này trên sàn. */
    hoursWorked: number;
    includes: string | null;
    excludes: string | null;
    coverageNote: string | null;
    /** Điểm ★ theo dịch vụ (chỉ nghề đã được đánh giá). */
    ratingAvg: number;
    ratingCount: number;
    service: {
      id: string;
      slug: string;
      name: string;
      unit: string;
      basePrice: number;
      category: {
        id: string;
        name: string;
        slug: string;
        group: { id: string; name: string; slug: string };
      } | null;
    };
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    fromName: string;
    serviceName: string;
    serviceSlug: string;
    groupSlug?: string | null;
    groupName?: string | null;
  }>;
  reputation: {
    currentPoints: number;
    startingPoints: number;
    percent: number;
    periodIndex: number;
    periodStart: string;
    periodEnd: string;
    deductedThisPeriod: number;
  };
};
