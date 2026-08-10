import type { QueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { PublicPartnerProfile } from '../types/auth';
import type {
  PublicServicePostDetail,
  PublicServicePostListItem,
} from '../types/public-service-post';
import { mediaSrc } from '../utils/media-src';
import { publicPartnerQueryOptions } from './query-client';

export function publicPartnerPostQueryKey(userId: string, postId: string) {
  return ['partner', 'public-post', userId, postId] as const;
}

function preloadImages(urls: string[]) {
  if (typeof Image === 'undefined') return;
  for (const raw of urls.slice(0, 4)) {
    const src = mediaSrc(raw);
    if (!src) continue;
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }
}

/** Seed tạm từ hồ sơ công khai — đủ render chi tiết, API vẫn refetch nền. */
export function seedDetailFromPublicProfile(
  profile: PublicPartnerProfile,
  postId: string,
): PublicServicePostDetail | null {
  const post = profile.servicePosts.find((p) => p.id === postId);
  if (!post) return null;

  const offering = profile.offerings.find((o) => o.service.id === post.serviceId);
  const serviceReviews = profile.reviews
    .filter((r) => r.serviceId === post.serviceId)
    .slice(0, 24);
  const ratingCount = serviceReviews.length;
  const ratingAvg =
    ratingCount > 0
      ? Math.round(
          (serviceReviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount) *
            10,
        ) / 10
      : 0;

  return {
    post: {
      id: post.id,
      title: post.title,
      body: post.body,
      coverUrl: post.coverUrl,
      images: post.images ?? [],
      serviceId: post.serviceId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      service: post.service,
    },
    seller: {
      userId: profile.userId,
      fullName: profile.fullName,
      headline: profile.headline,
      city: profile.city,
      avatarUrl: profile.avatarUrl,
      level: profile.level,
      isVerified: profile.isVerified,
      phoneVerified: profile.phoneVerified,
      bankVerified: profile.bankVerified,
      ratingAvg: profile.ratingAvg,
      ratingCount: profile.ratingCount,
      responseMinutes: profile.responseMinutes,
      acceptingJobs: profile.acceptingJobs,
      completedJobs: profile.completedJobs,
      hireSuccessCount: profile.hireSuccessCount,
      rank: profile.rank,
    },
    offering: offering
      ? {
          id: offering.id,
          price: offering.price,
          priceMin: offering.priceMin ?? null,
          priceMax: offering.priceMax ?? null,
          headline: offering.headline,
          experienceYears: offering.experienceYears,
          includes: offering.includes,
          excludes: offering.excludes,
          coverageNote: offering.coverageNote,
          ratingAvg: offering.ratingAvg || ratingAvg,
          ratingCount: offering.ratingCount || ratingCount,
          unit: offering.service.unit || post.service.unit,
        }
      : null,
    reviews: serviceReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      fromName: r.fromName,
    })),
  };
}

/** Seed mỏng từ card list — đủ title/ảnh/seller; body/reviews chờ API. */
export function seedDetailFromListItem(
  item: PublicServicePostListItem,
): PublicServicePostDetail {
  return {
    post: {
      id: item.id,
      title: item.title,
      body: item.body,
      coverUrl: item.coverUrl,
      images: item.images ?? [],
      serviceId: item.serviceId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      service: item.service,
    },
    seller: {
      userId: item.seller.userId,
      fullName: item.seller.fullName,
      headline: item.seller.headline,
      city: item.seller.city,
      avatarUrl: item.seller.avatarUrl,
      level: item.seller.level,
      isVerified: item.seller.isVerified,
      ratingAvg: item.seller.ratingAvg,
      ratingCount: item.seller.ratingCount,
      responseMinutes: 0,
      acceptingJobs: item.seller.acceptingJobs ?? true,
      completedJobs: item.seller.completedJobs,
      hireSuccessCount: item.seller.hireSuccessCount,
      rank: item.seller.rank,
    },
    offering: {
      id: `seed-${item.id}`,
      price: item.price,
      priceMin: item.priceMin ?? null,
      priceMax: item.priceMax ?? null,
      headline: null,
      experienceYears: 0,
      includes: null,
      excludes: null,
      coverageNote: null,
      ratingAvg: item.seller.ratingAvg,
      ratingCount: item.seller.ratingCount,
      unit: item.service.unit,
    },
    reviews: [],
  };
}

type PrefetchOpts = {
  seed?: PublicServicePostDetail | null;
  images?: string[];
};

/** Warm lazy chunk + seed cache + prefetch API + preload ảnh gallery. */
export function prefetchPublicPartnerPost(
  queryClient: QueryClient,
  userId: string,
  postId: string,
  opts?: PrefetchOpts,
) {
  if (!userId || !postId) return;

  void import('../pages/partner-service-post-detail-page');

  const queryKey = publicPartnerPostQueryKey(userId, postId);
  const existing = queryClient.getQueryData<PublicServicePostDetail>(queryKey);

  if (!existing && opts?.seed) {
    // updatedAt: 0 → stale ngay, prefetchQuery vẫn gọi API nền.
    queryClient.setQueryData(queryKey, opts.seed, { updatedAt: 0 });
  }

  const imageUrls =
    opts?.images ??
    opts?.seed?.post.images ??
    existing?.post.images ??
    (opts?.seed?.post.coverUrl ? [opts.seed.post.coverUrl] : []);
  preloadImages(imageUrls);

  void queryClient.prefetchQuery({
    queryKey,
    queryFn: () => api.getPublicPartnerPost(userId, postId),
    ...publicPartnerQueryOptions,
  });
}
