/**
 * Enum nghiệp vụ dùng chung giữa API và web.
 *
 * Nguồn sự thật là `apps/api/prisma/schema.prisma`. Test
 * `apps/api/src/common/shared-enums.spec.ts` so sánh từng enum ở đây với
 * enum Prisma sinh ra, nên khi sửa schema mà quên sửa file này thì test fail.
 *
 * Dùng object `as const` + union type thay cho TS `enum` để web (bật
 * `erasableSyntaxOnly`) import được trực tiếp.
 */

type ValueOf<T> = T[keyof T];

function values<T extends Record<string, string>>(obj: T) {
  return Object.values(obj) as ValueOf<T>[];
}

export const Role = {
  CUSTOMER: 'CUSTOMER',
  PARTNER: 'PARTNER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
} as const;
export type Role = ValueOf<typeof Role>;

export const BookingStatus = {
  SCHEDULED: 'SCHEDULED',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  AWAITING_CONFIRM: 'AWAITING_CONFIRM',
  DISPUTED: 'DISPUTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type BookingStatus = ValueOf<typeof BookingStatus>;

export const RequirementSource = {
  SERVICE_INCLUDES: 'SERVICE_INCLUDES',
  CUSTOMER_NOTE: 'CUSTOMER_NOTE',
  MANUAL: 'MANUAL',
} as const;
export type RequirementSource = ValueOf<typeof RequirementSource>;

export const ComplaintResolutionAction = {
  REFUND: 'REFUND',
  RELEASE: 'RELEASE',
  RETRY_IN_PROGRESS: 'RETRY_IN_PROGRESS',
  RETRY_AWAITING: 'RETRY_AWAITING',
  NONE: 'NONE',
} as const;
export type ComplaintResolutionAction = ValueOf<
  typeof ComplaintResolutionAction
>;

export const PaymentStatus = {
  UNPAID: 'UNPAID',
  HELD: 'HELD',
  RELEASED: 'RELEASED',
  REFUNDED: 'REFUNDED',
} as const;
export type PaymentStatus = ValueOf<typeof PaymentStatus>;

export const WalletTransactionType = {
  TOP_UP: 'TOP_UP',
  WITHDRAW: 'WITHDRAW',
  ESCROW_HOLD: 'ESCROW_HOLD',
  ESCROW_REFUND: 'ESCROW_REFUND',
  PARTNER_PAYOUT: 'PARTNER_PAYOUT',
  ADMIN_ADJUSTMENT: 'ADMIN_ADJUSTMENT',
  APPLY_DEPOSIT: 'APPLY_DEPOSIT',
  APPLY_REFUND: 'APPLY_REFUND',
  APPLY_FORFEIT: 'APPLY_FORFEIT',
} as const;
export type WalletTransactionType = ValueOf<typeof WalletTransactionType>;

export const ApplicationStatus = {
  APPLIED: 'APPLIED',
  SELECTED: 'SELECTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  REFUNDED: 'REFUNDED',
} as const;
export type ApplicationStatus = ValueOf<typeof ApplicationStatus>;

export const PartnerServicePostStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type PartnerServicePostStatus = ValueOf<
  typeof PartnerServicePostStatus
>;

export const HomeShoutKind = {
  GREETING: 'GREETING',
  AVAILABLE: 'AVAILABLE',
  PROMO: 'PROMO',
  LOOKING: 'LOOKING',
  THANKS: 'THANKS',
} as const;
export type HomeShoutKind = ValueOf<typeof HomeShoutKind>;

export const InvoiceStatus = {
  PAID: 'PAID',
  SETTLED: 'SETTLED',
  REFUNDED: 'REFUNDED',
} as const;
export type InvoiceStatus = ValueOf<typeof InvoiceStatus>;

export const SupportThreadStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const;
export type SupportThreadStatus = ValueOf<typeof SupportThreadStatus>;

export const ComplaintStatus = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;
export type ComplaintStatus = ValueOf<typeof ComplaintStatus>;

/** Bảng tra tên enum → danh sách giá trị, dùng cho test đồng bộ với Prisma. */
export const SHARED_ENUMS = {
  Role: values(Role),
  BookingStatus: values(BookingStatus),
  RequirementSource: values(RequirementSource),
  ComplaintResolutionAction: values(ComplaintResolutionAction),
  PaymentStatus: values(PaymentStatus),
  WalletTransactionType: values(WalletTransactionType),
  ApplicationStatus: values(ApplicationStatus),
  PartnerServicePostStatus: values(PartnerServicePostStatus),
  HomeShoutKind: values(HomeShoutKind),
  InvoiceStatus: values(InvoiceStatus),
  SupportThreadStatus: values(SupportThreadStatus),
  ComplaintStatus: values(ComplaintStatus),
} as const;
