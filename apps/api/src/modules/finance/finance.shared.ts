import { ForbiddenException } from '@nestjs/common';
import { BookingStatus } from '../../database/prisma/client';
import { allowMockPayments } from '../../common/security-env';

export const BANK_VERIFY_OTP_TTL_MS = 10 * 60 * 1000;

export type SettlementOptions = {
  status?: BookingStatus;
  expectedStatus?: BookingStatus;
  disputeResultNote?: string | null;
};

export type PercentSettlementOptions = {
  expectedStatus?: BookingStatus;
  disputeResultNote?: string | null;
};

export type ApplyDepositOptions = {
  /** Override amount; default 10% of booking.totalPrice. */
  amount?: number;
};

export type VietQrIntentPayload = {
  u: string;
  a: number;
  e: number;
  n: string;
  o?: number;
};

export function assertMockPaymentsAllowed() {
  if (!allowMockPayments()) {
    throw new ForbiddenException(
      'Thanh toán mô phỏng đã tắt. Bật ALLOW_MOCK_PAYMENTS=1 chỉ khi cần demo.',
    );
  }
}

export function invoiceNumber(bookingId: string) {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `DVO-${y}${m}${d}-${bookingId.slice(-8).toUpperCase()}`;
}
