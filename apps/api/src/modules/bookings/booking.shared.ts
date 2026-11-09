import { Role } from '../../database/prisma/client';
import {
  shapeBookingForViewer,
  type ContactViewerRole,
} from '../../common/contact-privacy';
import { computeApplyDeposit } from '../../common/escrow';
/** Cửa sổ chờ xác nhận mặc định (giờ) sau khi người làm báo xong. */
export const CONFIRM_WINDOW_HOURS = 48;

export const applicationInclude = {
  partner: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      partnerProfile: {
        select: {
          headline: true,
          ratingAvg: true,
          ratingCount: true,
          level: true,
          avatarUrl: true,
          city: true,
          isVerified: true,
          phoneVerified: true,
          bankVerified: true,
          onlineSeconds: true,
          offerings: {
            select: { serviceId: true, price: true },
          },
        },
      },
      reputationPeriods: {
        orderBy: { periodIndex: 'desc' as const },
        take: 1,
        select: { currentPoints: true },
      },
    },
  },
} as const;

export const bookingInclude = {
  service: {
    include: {
      category: {
        include: { group: true },
      },
    },
  },
  partner: {
    select: { id: true, fullName: true, phone: true, email: true },
  },
  user: {
    select: { id: true, fullName: true, phone: true, email: true },
  },
  reviews: {
    select: {
      id: true,
      fromUserId: true,
      toUserId: true,
      rating: true,
      comment: true,
      createdAt: true,
    },
  },
  requirements: {
    orderBy: { sortOrder: 'asc' as const },
  },
  applications: {
    orderBy: { createdAt: 'asc' as const },
    include: applicationInclude,
  },
} as const;

export type Viewer = { id: string; role: string };

export function bookingViewerRole(
  booking: { userId: string; partnerId: string | null },
  viewer: Viewer | undefined,
  mode?: 'open_queue',
): ContactViewerRole {
  if (mode === 'open_queue') return 'open_queue';
  if (!viewer) return 'customer';
  if (viewer.role === Role.ADMIN) return 'admin';
  if (booking.partnerId && booking.partnerId === viewer.id) return 'partner';
  if (booking.userId === viewer.id) return 'customer';
  return 'customer';
}

export function shapeBooking<
  T extends Parameters<typeof shapeBookingForViewer>[0],
>(booking: T, viewer: Viewer | undefined, mode?: 'open_queue') {
  const shaped = shapeBookingForViewer(
    booking,
    bookingViewerRole(booking, viewer, mode),
  ) as T & {
    applications?: Array<{ partnerId: string }>;
    applicationCount?: number;
  };

  const apps = Array.isArray(shaped.applications)
    ? shaped.applications
    : undefined;
  const viewerApplications =
    viewer &&
    viewer.role === Role.PARTNER &&
    booking.userId !== viewer.id &&
    apps
      ? apps.filter((a) => a.partnerId === viewer.id)
      : undefined;

  if (mode === 'open_queue') {
    const { applications: _drop, ...rest } = shaped as T & {
      applications?: unknown;
    };
    return {
      ...rest,
      applicationCount: apps?.length ?? 0,
      applications: viewerApplications,
      applyDepositAmount: computeApplyDeposit(
        Number((booking as { totalPrice?: number }).totalPrice ?? 0),
        Number(
          (booking as { applyDepositBps?: number }).applyDepositBps ?? 1000,
        ),
      ),
      applyDepositBps: Number(
        (booking as { applyDepositBps?: number }).applyDepositBps ?? 1000,
      ),
      applyDepositPercent: Math.round(
        Number(
          (booking as { applyDepositBps?: number }).applyDepositBps ?? 1000,
        ) / 100,
      ),
    };
  }

  if (viewerApplications) {
    return {
      ...shaped,
      applications: viewerApplications,
    };
  }

  return shaped;
}
