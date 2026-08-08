import type { AuthResponse, AuthUser, PartnerLevelBreakdown, PartnerProfile, PublicPartnerProfile } from '../types/auth';
import type {
  Booking,
  BookingApplication,
  BookingMessage,
  BookingReview,
  CreateBookingInput,
  FavoritePartner,
  GroupDetail,
  PartnerSchedule,
  PartnerSearchHit,
  RebookHint,
  Service,
  ServiceGroup,
  ServiceGroupTree,
  ServiceProvider,
} from '../types/catalog';
import type {
  AdminBooking,
  AdminBookingDetail,
  AdminCatalogGroup,
  AdminCategoryOption,
  AdminFinanceAdjustResult,
  AdminFinanceOverview,
  AdminFinanceTransaction,
  AdminFinanceWallet,
  AdminFlaggedMessage,
  AdminPartner,
  AdminReview,
  AdminService,
  AdminServiceInput,
  AdminServicePost,
  AdminServicePostDetail,
  AdminServicePostQueueItem,
  AdminStats,
  AdminUser,
  Paginated,
} from '../types/admin';
import type { Complaint, ComplaintStatus } from '../types/complaint';
import type { ChatbotReply, ChatbotStats } from '../types/chatbot';
import type { SupportMessage, SupportThread, SupportThreadDetail } from '../types/support';
import type { PartnerServicePost } from '../types/partner-service-post';
import type { PublicServicePostDetail, PublicServicePostListItem } from '../types/public-service-post';
import type {
  Invoice,
  VietQrBank,
  VietQrTopUpIntent,
  VietQrTopUpStatus,
  WalletSummary,
} from '../types/finance';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/** Bỏ qua filter rỗng/undefined để URL sạch và query key ổn định. */
function queryString(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const raw = search.toString();
  return raw ? `?${raw}` : '';
}

export type AdminListQuery = {
  q?: string;
  page?: number;
  pageSize?: number;
};

export type AdminUserQuery = AdminListQuery & { role?: string };

export type AdminPartnerQuery = AdminListQuery & {
  verified?: boolean;
  acceptingJobs?: boolean;
  blocked?: boolean;
  city?: string;
};

export type AdminBookingQuery = AdminListQuery & {
  status?: string;
  paymentStatus?: string;
  from?: string;
  to?: string;
};

export type AdminServiceQuery = AdminListQuery & {
  categoryId?: string;
  groupId?: string;
  isActive?: boolean;
};

function authHeaders(token?: string | null): HeadersInit {
  const stored = token ?? localStorage.getItem('dichvuoi_token');
  return {
    'Content-Type': 'application/json',
    ...(stored ? { Authorization: `Bearer ${stored}` } : {}),
  };
}

function authOnlyHeaders(token?: string | null): HeadersInit {
  const stored = token ?? localStorage.getItem('dichvuoi_token');
  return stored ? { Authorization: `Bearer ${stored}` } : {};
}

async function request<T>(path: string, init?: RequestInit & { token?: string | null }): Promise<T> {
  const { token, ...rest } = init ?? {};
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      ...authHeaders(token),
      ...(rest.headers ?? {}),
    },
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = raw || 'Yêu cầu thất bại';
    try {
      const parsed = JSON.parse(raw) as { message?: string | string[] };
      if (Array.isArray(parsed.message)) message = parsed.message.join(', ');
      else if (parsed.message) message = parsed.message;
    } catch {
      /* keep raw */
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  getGroups: (featured = false) =>
    request<ServiceGroup[]>(`/api/groups${featured ? '?featured=true' : ''}`),
  getGroupsTree: () => request<ServiceGroupTree[]>('/api/groups?tree=true'),
  getGroup: (slug: string) => request<GroupDetail>(`/api/groups/${slug}`),
  getServices: (group?: string) =>
    request<Service[]>(`/api/services${group ? `?group=${group}` : ''}`),
  getService: (slug: string) => request<Service>(`/api/services/${slug}`),
  getServiceProviders: (slug: string) =>
    request<ServiceProvider[]>(`/api/services/${slug}/partners`),

  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    enableOffering?: boolean;
    acceptedTerms: boolean;
  }) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  loginWithGoogle: (payload: { idToken: string; acceptedTerms?: boolean }) =>
    request<AuthResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: (token?: string | null) => request<AuthUser>('/api/auth/me', { token }),
  acceptTerms: (token?: string | null) =>
    request<AuthUser>('/api/auth/accept-terms', {
      method: 'POST',
      token,
      body: JSON.stringify({}),
    }),

  createBooking: (payload: CreateBookingInput) =>
    request<Booking>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getBooking: (id: string) => request<Booking>(`/api/bookings/${id}`),
  getMyBookings: () => request<Booking[]>('/api/bookings/mine'),
  getRebookHints: () => request<RebookHint[]>('/api/bookings/rebook-hints'),
  getOpenBookings: () => request<Booking[]>('/api/bookings/open'),
  getOpenJobsBoard: (page = 1, pageSize = 8) =>
    request<{
      items: Booking[];
      total: number;
      page: number;
      pageSize: number;
      pageCount: number;
    }>(`/api/bookings/open/board${queryString({ page, pageSize })}`),
  getPartnerBookings: () => request<Booking[]>('/api/bookings/partner/mine'),
  getPartnerSchedule: (year: number, month: number) =>
    request<PartnerSchedule>(
      `/api/bookings/partner/schedule${queryString({ year, month })}`,
    ),
  getCustomerPublishSchedule: (year: number, month: number) =>
    request<PartnerSchedule>(
      `/api/bookings/mine/publish-schedule${queryString({ year, month })}`,
    ),
  acceptBooking: (id: string) =>
    request<{
      booking: Booking;
      application?: BookingApplication;
      depositAmount: number;
    }>(`/api/bookings/${id}/accept`, { method: 'POST' }),
  applyBooking: (id: string, note?: string) =>
    request<{
      booking: Booking;
      application?: BookingApplication;
      depositAmount: number;
    }>(`/api/bookings/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify(note ? { note } : {}),
    }),
  getBookingApplications: (id: string) =>
    request<BookingApplication[]>(`/api/bookings/${id}/applications`),
  selectBookingApplicant: (bookingId: string, applicationId: string) =>
    request<Booking>(
      `/api/bookings/${bookingId}/applications/${applicationId}/select`,
      { method: 'POST' },
    ),
  updateBookingStatus: (id: string, status: string) =>
    request<Booking>(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  confirmBooking: (id: string, acceptIncomplete = false) =>
    request<Booking>(`/api/bookings/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ acceptIncomplete }),
    }),
  proposeBookingSettlement: (id: string, percent: number) =>
    request<Booking>(`/api/bookings/${id}/settlement/propose`, {
      method: 'POST',
      body: JSON.stringify({ percent }),
    }),
  approveBookingSettlement: (id: string) =>
    request<Booking>(`/api/bookings/${id}/settlement/approve`, {
      method: 'POST',
    }),
  updateBookingRequirement: (
    bookingId: string,
    requirementId: string,
    payload: {
      partnerDone?: boolean;
      customerConfirmed?: boolean;
      evidenceUrl?: string;
    },
  ) =>
    request<Booking>(
      `/api/bookings/${bookingId}/requirements/${requirementId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    ),
  addBookingRequirement: (bookingId: string, content: string) =>
    request<Booking>(`/api/bookings/${bookingId}/requirements`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  getBookingMessages: (id: string) =>
    request<BookingMessage[]>(`/api/bookings/${id}/messages`),
  postBookingMessage: (id: string, body: string) =>
    request<BookingMessage>(`/api/bookings/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  payBooking: (id: string) =>
    request<Booking>(`/api/bookings/${id}/pay`, { method: 'POST' }),
  getWallet: () => request<WalletSummary>('/api/wallet'),
  getVietQrBanks: () => request<VietQrBank[]>('/api/wallet/vietqr/banks'),
  withdrawWallet: (payload: {
    amount: number;
    bankBin: string;
    bankCode?: string;
    bankName: string;
    accountNo: string;
    accountName: string;
  }) =>
    request<{
      currency: string;
      balance: number;
      amount: number;
      status: string;
      message: string;
      payout: {
        bankBin: string | null;
        bankCode: string | null;
        bankName: string | null;
        accountNo: string | null;
        accountName: string | null;
      };
    }>('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  requestBankVerify: (payload: {
    bankBin: string;
    bankCode?: string;
    bankName: string;
    accountNo: string;
    accountName: string;
  }) =>
    request<{
      ok: boolean;
      channel: string;
      expiresAt: string;
      code?: string;
      message: string;
      payout: {
        bankBin: string;
        bankCode: string | null;
        bankName: string;
        accountNo: string;
        accountName: string;
      };
    }>('/api/wallet/verify-bank/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  confirmBankVerify: (code: string) =>
    request<WalletSummary>('/api/wallet/verify-bank/confirm', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  topUpWallet: (amount: number) =>
    request<{ currency: string; balance: number }>('/api/wallet/top-up', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  createVietQrTopUpIntent: (amount: number) =>
    request<VietQrTopUpIntent>('/api/wallet/top-up/vietqr/intent', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  getVietQrTopUpStatus: (intentId: string) =>
    request<VietQrTopUpStatus>(`/api/wallet/top-up/vietqr/${encodeURIComponent(intentId)}`),
  confirmVietQrTopUpMock: (intentId: string) =>
    request<{ currency: string; balance: number; amount: number }>(
      `/api/wallet/top-up/vietqr/${encodeURIComponent(intentId)}/mock-confirm`,
      { method: 'POST' },
    ),
  listInvoices: () => request<Invoice[]>('/api/invoices'),
  getInvoice: (id: string) => request<Invoice>(`/api/invoices/${id}`),
  createReview: (id: string, payload: { rating: number; comment?: string }) =>
    request<BookingReview>(`/api/bookings/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createBookingComplaint: (
    bookingId: string,
    payload: {
      category: string;
      description: string;
      requirementIds?: string[];
      evidenceNote: string;
    },
  ) =>
    request<Complaint>(`/api/bookings/${bookingId}/complaints`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  uploadEvidenceImage: async (file: File) => {
    const body = new FormData();
    body.append('file', file);
    const response = await fetch(`${API_BASE}/api/uploads/evidence`, {
      method: 'POST',
      headers: authOnlyHeaders(),
      body,
    });
    if (!response.ok) {
      const raw = await response.text();
      let message = 'Tải ảnh thất bại';
      try {
        const parsed = JSON.parse(raw) as { message?: string | string[] };
        if (typeof parsed.message === 'string') message = parsed.message;
        else if (Array.isArray(parsed.message)) message = parsed.message.join(', ');
      } catch {
        if (raw.trim()) message = raw.slice(0, 200);
      }
      throw new Error(message);
    }
    return response.json() as Promise<{
      url: string;
      fileName: string;
      size: number;
    }>;
  },
  uploadAvatarImage: async (file: File) => {
    const body = new FormData();
    body.append('file', file);
    const response = await fetch(`${API_BASE}/api/uploads/avatar`, {
      method: 'POST',
      headers: authOnlyHeaders(),
      body,
    });
    if (!response.ok) {
      const raw = await response.text();
      let message = 'Tải ảnh đại diện thất bại';
      try {
        const parsed = JSON.parse(raw) as { message?: string | string[] };
        if (typeof parsed.message === 'string') message = parsed.message;
        else if (Array.isArray(parsed.message)) message = parsed.message.join(', ');
      } catch {
        if (raw.trim()) message = raw.slice(0, 200);
      }
      throw new Error(message);
    }
    return response.json() as Promise<{
      url: string;
      fileName: string;
      size: number;
    }>;
  },
  uploadServicePostImage: async (file: File) => {
    const body = new FormData();
    body.append('file', file);
    const response = await fetch(`${API_BASE}/api/uploads/service-post`, {
      method: 'POST',
      headers: authOnlyHeaders(),
      body,
    });
    if (!response.ok) {
      const raw = await response.text();
      let message = 'Tải ảnh thất bại';
      try {
        const parsed = JSON.parse(raw) as { message?: string | string[] };
        if (typeof parsed.message === 'string') message = parsed.message;
        else if (Array.isArray(parsed.message)) message = parsed.message.join(', ');
      } catch {
        if (raw.trim()) message = raw.slice(0, 200);
      }
      throw new Error(message);
    }
    return response.json() as Promise<{
      url: string;
      fileName: string;
      size: number;
    }>;
  },
  listMyComplaints: () => request<Complaint[]>('/api/complaints/mine'),

  adminStats: () => request<AdminStats>('/api/admin/stats'),
  adminGmvSeries: (days = 30) =>
    request<{
      days: number;
      total: number;
      points: Array<{ date: string; gmv: number }>;
    }>(`/api/admin/stats/gmv-series${queryString({ days })}`),
  adminAuditLogs: (query: AdminListQuery = {}) =>
    request<
      Paginated<{
        id: string;
        action: string;
        targetType: string | null;
        targetId: string | null;
        meta: Record<string, unknown> | null;
        createdAt: string;
        actor: { id: string; fullName: string; email: string };
      }>
    >(`/api/admin/audit-logs${queryString(query)}`),
  adminFinanceOverview: () =>
    request<AdminFinanceOverview>('/api/admin/finance/overview'),
  adminFinanceWallets: (query: {
    q?: string;
    page?: number;
    pageSize?: number;
    positiveOnly?: boolean;
  } = {}) =>
    request<Paginated<AdminFinanceWallet>>(
      `/api/admin/finance/wallets${queryString(query)}`,
    ),
  adminFinanceTransactions: (query: {
    q?: string;
    type?: string;
    userId?: string;
    page?: number;
    pageSize?: number;
  } = {}) =>
    request<Paginated<AdminFinanceTransaction>>(
      `/api/admin/finance/transactions${queryString(query)}`,
    ),
  adminAdjustWallet: (userId: string, payload: { amount: number; reason: string }) =>
    request<AdminFinanceAdjustResult>(
      `/api/admin/finance/wallets/${userId}/adjust`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    ),
  adminUsers: (query: AdminUserQuery = {}) =>
    request<Paginated<AdminUser>>(`/api/admin/users${queryString(query)}`),
  adminUpdateUser: (
    id: string,
    payload: { role?: string; chatBanned?: boolean },
  ) =>
    request<AdminUser>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  adminPartners: (query: AdminPartnerQuery = {}) =>
    request<Paginated<AdminPartner>>(`/api/admin/partners${queryString(query)}`),
  adminUpdatePartner: (
    userId: string,
    payload: {
      isVerified?: boolean;
      acceptingJobs?: boolean;
      isBlocked?: boolean;
      phoneVerified?: boolean;
      bankVerified?: boolean;
    },
  ) =>
    request<AdminPartner>(`/api/admin/partners/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  adminBookings: (query: AdminBookingQuery = {}) =>
    request<Paginated<AdminBooking>>(`/api/admin/bookings${queryString(query)}`),
  adminBooking: (id: string) =>
    request<AdminBookingDetail>(`/api/admin/bookings/${id}`),
  adminUpdateBooking: (
    id: string,
    payload: { status?: string; paymentStatus?: string; note?: string },
  ) =>
    request<AdminBooking>(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  adminReviews: (query: AdminListQuery = {}) =>
    request<Paginated<AdminReview>>(`/api/admin/reviews${queryString(query)}`),
  adminServicePosts: (
    query: AdminListQuery & { status?: string } = {},
  ) =>
    request<Paginated<AdminServicePost>>(
      `/api/admin/service-posts${queryString(query)}`,
    ),
  adminServicePostQueue: (query: AdminListQuery = {}) =>
    request<Paginated<AdminServicePostQueueItem>>(
      `/api/admin/service-posts/queue${queryString(query)}`,
    ),
  adminServicePostDetail: (id: string) =>
    request<AdminServicePostDetail>(`/api/admin/service-posts/${id}`),
  adminReviewServicePost: (
    id: string,
    payload: { status: 'APPROVED' | 'REJECTED'; rejectReason?: string },
  ) =>
    request<{
      id: string;
      title: string;
      status: string;
      rejectReason: string | null;
    }>(`/api/admin/service-posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  adminFlaggedMessages: (query: AdminListQuery = {}) =>
    request<Paginated<AdminFlaggedMessage>>(
      `/api/admin/messages/flagged${queryString(query)}`,
    ),
  adminComplaints: (query: { status?: ComplaintStatus } = {}) =>
    request<Complaint[]>(
      `/api/admin/complaints${queryString({ status: query.status })}`,
    ),
  adminResolveComplaint: (
    id: string,
    payload: {
      status: 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW';
      deductionPoints?: number;
      adminNote?: string;
      resolutionAction?:
        | 'REFUND'
        | 'RELEASE'
        | 'RETRY_IN_PROGRESS'
        | 'RETRY_AWAITING'
        | 'NONE';
    },
  ) =>
    request<Complaint>(`/api/admin/complaints/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  adminCatalog: () => request<AdminCatalogGroup[]>('/api/admin/catalog'),
  adminCategories: () =>
    request<AdminCategoryOption[]>('/api/admin/categories'),
  adminServices: (query: AdminServiceQuery = {}) =>
    request<Paginated<AdminService>>(`/api/admin/services${queryString(query)}`),
  adminCreateService: (payload: AdminServiceInput) =>
    request<AdminService>('/api/admin/services', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  adminUpdateService: (id: string, payload: Partial<AdminServiceInput>) =>
    request<AdminService>(`/api/admin/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  adminUpdateGroup: (id: string, payload: { isFeatured?: boolean }) =>
    request<AdminCatalogGroup>(`/api/admin/groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  enableOffering: (payload?: {
    phone?: string;
    headline?: string;
    bio?: string;
    city?: string;
    districts?: string;
    skills?: string[];
    workModes?: string;
    acceptingJobs?: boolean;
    responseMinutes?: number;
    serviceIds?: string[];
  }) =>
    request<AuthResponse>('/api/partners/enable', {
      method: 'POST',
      body: JSON.stringify(payload ?? {}),
    }),
  getPartnerProfile: () =>
    request<PartnerProfile & { user: AuthUser }>('/api/partners/me'),
  getPartnerLevel: () => request<PartnerLevelBreakdown>('/api/partners/me/level'),
  getPublicPartner: (userId: string) =>
    request<PublicPartnerProfile>(`/api/partners/public/${userId}`),
  getPublicPartnerPost: (userId: string, postId: string) =>
    request<PublicServicePostDetail>(
      `/api/partners/public/${userId}/posts/${postId}`,
    ),
  getApprovedServicePosts: (page = 1, pageSize = 12) =>
    request<{
      items: PublicServicePostListItem[];
      total: number;
      page: number;
      pageSize: number;
      pageCount: number;
    }>(`/api/partners/posts${queryString({ page, pageSize })}`),
  searchPartners: (q: string, limit = 24) =>
    request<PartnerSearchHit[]>(
      `/api/partners/search${queryString({ q, limit })}`,
    ),
  getFavoritePartnerIds: () => request<string[]>('/api/partners/favorites/ids'),
  getFavoritePartners: () => request<FavoritePartner[]>('/api/partners/favorites'),
  addFavoritePartner: (partnerUserId: string) =>
    request<{ partnerUserId: string; saved: boolean }>(
      `/api/partners/favorites/${partnerUserId}`,
      { method: 'POST' },
    ),
  removeFavoritePartner: (partnerUserId: string) =>
    request<{ partnerUserId: string; saved: boolean }>(
      `/api/partners/favorites/${partnerUserId}`,
      { method: 'DELETE' },
    ),
  updatePartnerProfile: (payload: {
    phone?: string;
    headline?: string;
    bio?: string;
    city?: string;
    districts?: string;
    skills?: string[];
    workModes?: string;
    acceptingJobs?: boolean;
    responseMinutes?: number;
    avatarUrl?: string;
    gallery?: string[];
  }) =>
    request<PartnerProfile>('/api/partners/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  syncPartnerOfferings: (serviceIds: string[]) =>
    request<PartnerProfile & { user: AuthUser }>('/api/partners/me/offerings', {
      method: 'PUT',
      body: JSON.stringify({ serviceIds }),
    }),
  getMyServicePosts: (serviceId?: string) =>
    request<PartnerServicePost[]>(
      `/api/partners/me/posts${queryString({ serviceId })}`,
    ),
  createServicePost: (payload: {
    serviceId: string;
    title: string;
    body: string;
    priceMin: number;
    priceMax: number;
    images: string[];
  }) =>
    request<PartnerServicePost>('/api/partners/me/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateServicePost: (
    id: string,
    payload: {
      serviceId?: string;
      title?: string;
      body?: string;
      priceMin?: number;
      priceMax?: number;
      images?: string[];
    },
  ) =>
    request<PartnerServicePost>(`/api/partners/me/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteServicePost: (id: string) =>
    request<{ ok: boolean }>(`/api/partners/me/posts/${id}`, {
      method: 'DELETE',
    }),

  requestPartnerPhoneOtp: (phone: string) =>
    request<{
      ok: boolean;
      phone: string;
      expiresAt: string;
      debugCode: string;
      key?: string;
      channel: string;
      message: string;
    }>('/api/partners/me/verify-phone/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),
  confirmPartnerPhoneOtp: (code: string) =>
    request<PartnerProfile>('/api/partners/me/verify-phone/confirm', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  requestPhoneOtpKey: (phone: string) =>
    request<{
      ok: boolean;
      phone: string;
      /** Chỉ có khi channel = web_key_mock. */
      key?: string;
      expiresAt: string;
      oneTime: boolean;
      channel: string;
      message: string;
    }>('/api/auth/verify-phone/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),
  confirmPhoneOtpKey: (key: string) =>
    request<AuthUser>('/api/auth/verify-phone/confirm', {
      method: 'POST',
      body: JSON.stringify({ key }),
    }),
  requestEmailOtp: (email: string) =>
    request<{
      ok: boolean;
      alreadyVerified: boolean;
      channel: string;
      expiresAt?: string;
      code?: string;
      message: string;
    }>('/api/auth/verify-email/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  confirmEmailOtp: (code: string) =>
    request<AuthUser>('/api/auth/verify-email/confirm', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  linkPartnerBank: (payload: {
    bankName: string;
    accountNo: string;
    accountName: string;
    bankBin?: string;
  }) =>
    request<{
      ok: boolean;
      intentId: string;
      amount: number;
      expiresAt: string;
      qrImageUrl: string;
      bankName: string;
      accountNo: string;
      accountName: string;
      message: string;
      mockConfirmEnabled?: boolean;
    }>('/api/partners/me/verify-bank/link', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  confirmPartnerBankVerify: (intentId: string) =>
    request<PartnerProfile>('/api/partners/me/verify-bank/mock-confirm', {
      method: 'POST',
      body: JSON.stringify({ intentId }),
    }),

  chatbotStats: () => request<ChatbotStats>('/api/chatbot/stats'),
  chatbotSuggestions: (limit = 8) =>
    request<string[]>(`/api/chatbot/suggestions?limit=${limit}`),
  chatbotAsk: (message: string, sessionId?: string) =>
    request<ChatbotReply>('/api/chatbot/ask', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    }),

  getMySupportChat: () => request<SupportThreadDetail>('/api/support/my'),
  postMySupportMessage: (body: string) =>
    request<SupportMessage>('/api/support/my/messages', {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  listSupportThreads: (status?: string) =>
    request<SupportThread[]>(
      status ? `/api/support/threads?status=${status}` : '/api/support/threads',
    ),
  getSupportThread: (id: string) =>
    request<SupportThreadDetail>(`/api/support/threads/${id}`),
  postSupportThreadMessage: (id: string, body: string) =>
    request<SupportMessage>(`/api/support/threads/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  updateSupportThread: (
    id: string,
    payload: { status?: string; assigneeId?: string | null },
  ) =>
    request<SupportThread>(`/api/support/threads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

/** Số tiền theo locale vi-VN, không kèm đơn vị. */
export function formatPriceNumber(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(value);
}

/** Số tiền kèm đơn vị VNĐ, ví dụ `100.000 VNĐ`. */
export function formatPrice(value: number) {
  return `${formatPriceNumber(value)} VNĐ`;
}

/** Giờ làm trên sàn theo nghề (từ đơn hoàn thành). */
export function formatWorkHours(hours: number | null | undefined) {
  const value = hours ?? 0;
  if (value <= 0) return '0 giờ';
  const label = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${label} giờ`;
}

export function formatBookingStatus(status: string) {
  const map: Record<string, string> = {
    SCHEDULED: 'Hẹn giờ đăng',
    PENDING: 'Chờ chọn người',
    CONFIRMED: 'Đã nhận',
    IN_PROGRESS: 'Đang làm',
    AWAITING_CONFIRM: 'Chờ xác nhận',
    DISPUTED: 'Đang tranh chấp',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };
  return map[status] ?? status;
}

export function formatPaymentStatus(status: string) {
  const map: Record<string, string> = {
    UNPAID: 'Chưa đặt cọc',
    HELD: 'Hệ thống đang giữ cọc',
    RELEASED: 'Đã giải ngân',
    REFUNDED: 'Đã hoàn cọc',
  };
  return map[status] ?? status;
}
