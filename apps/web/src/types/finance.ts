export type WalletTransactionType =
  | 'TOP_UP'
  | 'ESCROW_HOLD'
  | 'ESCROW_REFUND'
  | 'PARTNER_PAYOUT'
  | 'ADMIN_ADJUSTMENT';

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
  transactions: WalletTransaction[];
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
  ESCROW_HOLD: 'Đặt cọc đơn',
  ESCROW_REFUND: 'Hoàn cọc',
  PARTNER_PAYOUT: 'Giải ngân',
  ADMIN_ADJUSTMENT: 'Điều chỉnh admin',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  PAID: 'Đã thanh toán (escrow)',
  SETTLED: 'Đã quyết toán',
  REFUNDED: 'Đã hoàn',
};

export const TOP_UP_PRESETS = [
  100_000,
  200_000,
  500_000,
  1_000_000,
  2_000_000,
  5_000_000,
] as const;
