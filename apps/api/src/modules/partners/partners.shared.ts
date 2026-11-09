import { env } from '../../config/env';
import { BadRequestException } from '@nestjs/common';
import { PartnerServicePostStatus } from '@prisma/client';
import {
  parseDistricts,
  parseGallery,
  parseSkills,
  parseWorkModes,
} from '../../common/partner-profile-fields';
import { computePartnerRankScore } from '../../common/partner-rank';

export const servicePostServiceSelect = {
  id: true,
  slug: true,
  name: true,
  unit: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      group: { select: { id: true, name: true, slug: true } },
    },
  },
} as const;

export const BANK_VERIFY_TTL_MS = 15 * 60 * 1000;

export const DEFAULT_VIETQR_BIN = env.vietQrBankId ?? '970436';

export const userPublicSelect = {
  id: true,
  fullName: true,
  role: true,
} as const;

export const userPrivateSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  phoneVerified: true,
  role: true,
} as const;

export const ONLINE_WINDOW_MS = 2 * 60 * 1000;

export function isPartnerOnline(lastOnlineAt: Date | null | undefined) {
  if (!lastOnlineAt) return false;
  return Date.now() - lastOnlineAt.getTime() < ONLINE_WINDOW_MS;
}

export function maskReviewerName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Khách';
  if (parts.length === 1) return `${parts[0].slice(0, 1)}***`;
  return `${parts[0]} ${parts[parts.length - 1].slice(0, 1)}.`;
}

export const offeringInclude = {
  service: {
    select: {
      id: true,
      slug: true,
      name: true,
      unit: true,
      basePrice: true,
      isActive: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          group: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  },
} as const;

export function shapePublic(
  profile: {
    id: string;
    userId: string;
    headline: string | null;
    bio: string | null;
    city: string | null;
    districts: string | null;
    ratingAvg: number;
    ratingCount: number;
    level: number;
    isVerified: boolean;
    phoneVerified: boolean;
    bankVerified: boolean;
    avatarUrl: string | null;
    galleryJson?: string | null;
    skillsJson: string | null;
    acceptingJobs: boolean;
    workModes: string | null;
    responseMinutes: number;
    user: { id: string; fullName: string };
    lastOnlineAt?: Date | null;
    offerings?: Array<{
      id: string;
      price: number | null;
      priceMin?: number | null;
      priceMax?: number | null;
      headline: string | null;
      experienceYears: number;
      includes: string | null;
      excludes: string | null;
      coverageNote: string | null;
      service: {
        id: string;
        slug: string;
        name: string;
        unit: string;
        basePrice: number;
        category?: {
          id: string;
          name: string;
          slug: string;
          group: { id: string; name: string; slug: string };
        };
      };
    }>;
  },
  completedJobs: number,
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    fromUser: { id: string; fullName: string };
    booking: {
      service: {
        id: string;
        name: string;
        slug: string;
        category?: {
          group: { name: string; slug: string };
        } | null;
      };
    };
  }> = [],
  hoursByServiceId: Map<string, number> = new Map(),
  hireSuccessCount = 0,
) {
  const reviewedBySlug = new Map<
    string,
    { ratings: number[]; service: (typeof reviews)[0]['booking']['service'] }
  >();
  for (const r of reviews) {
    const slug = r.booking.service.slug;
    const entry = reviewedBySlug.get(slug) ?? {
      ratings: [],
      service: r.booking.service,
    };
    entry.ratings.push(r.rating);
    reviewedBySlug.set(slug, entry);
  }

  /** Tất cả dịch vụ đang nhận; ưu tiên nghề đã có đánh giá. */
  const offerings = (profile.offerings ?? [])
    .map((o) => {
      const stats = reviewedBySlug.get(o.service.slug);
      const ratingCount = stats?.ratings.length ?? 0;
      const ratingAvg =
        ratingCount > 0
          ? Math.round(
              (stats!.ratings.reduce((s, n) => s + n, 0) / ratingCount) * 10,
            ) / 10
          : 0;
      const priceMin =
        o.priceMin && o.priceMin > 0
          ? o.priceMin
          : o.price && o.price > 0
            ? o.price
            : o.service.basePrice;
      const priceMax =
        o.priceMax && o.priceMax > 0
          ? Math.max(o.priceMax, priceMin)
          : priceMin;
      return {
        id: o.id,
        price: priceMin,
        priceMin,
        priceMax,
        headline: o.headline,
        experienceYears: o.experienceYears,
        hoursWorked: hoursByServiceId.get(o.service.id) ?? 0,
        includes: o.includes,
        excludes: o.excludes,
        coverageNote: o.coverageNote,
        ratingAvg,
        ratingCount,
        service: {
          id: o.service.id,
          slug: o.service.slug,
          name: o.service.name,
          unit: o.service.unit,
          basePrice: o.service.basePrice,
          category: o.service.category
            ? {
                id: o.service.category.id,
                name: o.service.category.name,
                slug: o.service.category.slug,
                group: o.service.category.group,
              }
            : null,
        },
      };
    })
    .sort((a, b) => b.ratingCount - a.ratingCount || b.ratingAvg - a.ratingAvg);

  return {
    id: profile.id,
    userId: profile.userId,
    fullName: profile.user.fullName,
    headline: profile.headline,
    bio: profile.bio,
    city: profile.city,
    districts: parseDistricts(profile.districts),
    skills: parseSkills(profile.skillsJson),
    acceptingJobs: profile.acceptingJobs,
    workModes: parseWorkModes(profile.workModes),
    responseMinutes: profile.responseMinutes,
    ratingAvg: profile.ratingAvg,
    ratingCount: profile.ratingCount,
    level: profile.level,
    isVerified: profile.isVerified,
    phoneVerified: profile.phoneVerified,
    bankVerified: profile.bankVerified,
    avatarUrl: profile.avatarUrl,
    gallery: parseGallery(profile.galleryJson),
    completedJobs,
    hireSuccessCount,
    rank: computePartnerRankScore(completedJobs, hireSuccessCount),
    isOnline: isPartnerOnline(profile.lastOnlineAt),
    lastOnlineAt: profile.lastOnlineAt?.toISOString() ?? null,
    offerings,
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      fromName: r.fromUser.fullName,
      serviceId: r.booking.service.id,
      serviceName: r.booking.service.name,
      serviceSlug: r.booking.service.slug,
      groupSlug: r.booking.service.category?.group.slug ?? null,
      groupName: r.booking.service.category?.group.name ?? null,
    })),
  };
}

export function parsePostImages(
  imagesJson: string | null | undefined,
  coverUrl?: string | null,
): string[] {
  if (imagesJson) {
    try {
      const parsed = JSON.parse(imagesJson) as unknown;
      if (Array.isArray(parsed)) {
        const urls = parsed
          .filter((u): u is string => typeof u === 'string')
          .map((u) => u.trim())
          .filter(Boolean);
        if (urls.length) return urls.slice(0, 8);
      }
    } catch {
      /* fall through */
    }
  }
  return coverUrl?.trim() ? [coverUrl.trim()] : [];
}

export function serializePostImages(images: string[]) {
  const urls = images
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 8);
  if (!urls.length) {
    throw new BadRequestException('Cần ít nhất một ảnh');
  }
  return {
    images: urls,
    imagesJson: JSON.stringify(urls),
    coverUrl: urls[0],
  };
}

/** Làm sạch HTML bài đăng (không cho link/script) + kiểm tra độ dài chữ thuần. */
export function normalizePostBody(raw: string) {
  let html = raw.trim();
  html = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?a\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
  const plain = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length < 20) {
    throw new BadRequestException('Nội dung cần ít nhất 20 ký tự');
  }
  if (html.length > 8000) {
    throw new BadRequestException('Nội dung quá dài (tối đa 8000 ký tự)');
  }
  return html;
}

export function offeringPriceRange(
  offering?: {
    price?: number | null;
    priceMin?: number | null;
    priceMax?: number | null;
  } | null,
): {
  price: number | null;
  priceMin: number | null;
  priceMax: number | null;
} {
  if (!offering) {
    return { price: null, priceMin: null, priceMax: null };
  }
  const min =
    offering.priceMin && offering.priceMin > 0
      ? offering.priceMin
      : offering.price && offering.price > 0
        ? offering.price
        : null;
  if (min == null) {
    return { price: null, priceMin: null, priceMax: null };
  }
  const max =
    offering.priceMax && offering.priceMax > 0
      ? Math.max(offering.priceMax, min)
      : min;
  return { price: min, priceMin: min, priceMax: max };
}

export function assertPriceRange(priceMin: number, priceMax: number) {
  if (priceMax < priceMin) {
    throw new BadRequestException('Giá max phải lớn hơn hoặc bằng giá min');
  }
}

export function shapeServicePost<
  T extends {
    id: string;
    title: string;
    body: string;
    coverUrl: string | null;
    imagesJson?: string | null;
    serviceId: string;
    status?: PartnerServicePostStatus;
    rejectReason?: string | null;
    reviewedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    service: unknown;
  },
>(
  post: T,
  range?:
    | {
        price?: number | null;
        priceMin?: number | null;
        priceMax?: number | null;
      }
    | number
    | null,
) {
  const images = parsePostImages(post.imagesJson, post.coverUrl);
  const normalized =
    typeof range === 'number' || range == null
      ? offeringPriceRange(
          range == null
            ? null
            : { price: range, priceMin: range, priceMax: range },
        )
      : offeringPriceRange(range);
  return {
    id: post.id,
    title: post.title,
    body: post.body,
    coverUrl: images[0] ?? post.coverUrl,
    images,
    serviceId: post.serviceId,
    price: normalized.price,
    priceMin: normalized.priceMin,
    priceMax: normalized.priceMax,
    ...(post.status !== undefined ? { status: post.status } : {}),
    ...(post.rejectReason !== undefined
      ? { rejectReason: post.rejectReason }
      : {}),
    ...(post.reviewedAt !== undefined ? { reviewedAt: post.reviewedAt } : {}),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    service: post.service,
  };
}
