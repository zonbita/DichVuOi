/** Chi tiết bài đăng dịch vụ công khai (gig). */
export type PublicServicePostDetail = {
  post: {
    id: string;
    title: string;
    body: string;
    coverUrl: string | null;
    images: string[];
    serviceId: string;
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
    priceMin: number | null;
    priceMax: number | null;
    headline: string | null;
    experienceYears: number;
    includes: string | null;
    excludes: string | null;
    coverageNote: string | null;
    ratingAvg: number;
    ratingCount: number;
    unit: string;
  } | null;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    fromName: string;
  }>;
};

/** Item list bài đăng đã duyệt (trang chủ). */
export type PublicServicePostListItem = {
  id: string;
  title: string;
  body: string;
  coverUrl: string | null;
  images: string[];
  serviceId: string;
  price: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
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
  seller: {
    userId: string;
    fullName: string;
    headline: string | null;
    city: string | null;
    avatarUrl: string | null;
    level: number;
    isVerified: boolean;
    ratingAvg: number;
    ratingCount: number;
    isOnline?: boolean;
    acceptingJobs?: boolean;
    /** Uy tín chu kỳ — tách biệt level (1–100). */
    reputation: {
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
