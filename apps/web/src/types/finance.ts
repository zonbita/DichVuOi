export type WalletTransactionType =
  | 'TOP_UP'
  | 'WITHDRAW'
  | 'ESCROW_HOLD'
  | 'ESCROW_REFUND'
  | 'PARTNER_PAYOUT'
  | 'ADMIN_ADJUSTMENT'
  | 'APPLY_DEPOSIT'
  | 'APPLY_REFUND'
  | 'APPLY_FORFEIT';

export type InvoiceStatus = 'PAID' | 'SETTLED' | 'REFUNDED';

export type WalletTransaction = {
  id: string;
  userId: string;
  bookingId: string | null;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  reference: string;
  createdAt: string;
  booking?: {
    id: string;
    service: { name: string };
  } | null;
};

export type WalletSummary = {
  currency: 'VND' | string;
  balance: number;
  /** Dev/demo: mock top-up / VietQR confirm. Off in production unless ALLOW_MOCK_PAYMENTS. */
  mockPaymentsEnabled?: boolean;
  emailVerified?: boolean;
  bankVerified?: boolean;
  /** emailVerified — điều kiện rút tiền (bắt buộc). */
  canWithdraw?: boolean;
  payout?: {
    bankBin: string | null;
    bankCode: string | null;
    bankName: string | null;
    accountNo: string | null;
    accountName: string | null;
  };
  transactions: WalletTransaction[];
};

export type VietQrBank = {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
};

export type VietQrTopUpIntent = {
  intentId: string;
  amount: number;
  currency: 'VND' | string;
  bankId: string;
  accountNo: string;
  accountName: string;
  transferNote: string;
  qrImageUrl: string;
  expiresAt: string;
};

export type VietQrTopUpStatus = {
  intentId: string;
  amount: number;
  status: 'PENDING' | 'PAID';
  paidAt: string | null;
  expiresAt: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  customerId: string;
  partnerId: string | null;
  customerName: string;
  serviceName: string;
  subtotal: number;
  commissionAmount: number;
  partnerPayout: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: string;
  settledAt: string | null;
  refundedAt: string | null;
  updatedAt: string;
  booking?: {
    id: string;
    status: string;
    paymentStatus: string;
    scheduledAt?: string;
  };
  customer?: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string | null;
  };
  partner?: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string | null;
  } | null;
};

export const WALLET_TX_LABELS: Record<WalletTransactionType, string> = {
  TOP_UP: 'Nạp ví',
  WITHDRAW: 'Rút tiền',
  ESCROW_HOLD: 'Đặt cọc đơn',
  ESCROW_REFUND: 'Hoàn cọc',
  PARTNER_PAYOUT: 'Giải ngân',
  ADMIN_ADJUSTMENT: 'Điều chỉnh admin',
  APPLY_DEPOSIT: 'Cọc ứng tuyển',
  APPLY_REFUND: 'Hoàn cọc ứng tuyển',
  APPLY_FORFEIT: 'Tịch thu cọc ứng tuyển',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  PAID: 'Đã giữ cọc trên sàn',
  SETTLED: 'Đã quyết toán',
  REFUNDED: 'Đã hoàn',
};

export const TOP_UP_PRESETS = [
  20_000,
  50_000,
  100_000,
  200_000,
  500_000,
  1_000_000,
  2_000_000,
  5_000_000,
  10_000_000,
] as const;
