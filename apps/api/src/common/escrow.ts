/** Hoa hồng sàn mặc định: 15% (1500 basis points). */
export const DEFAULT_COMMISSION_BPS = 1500;

/** Cọc ứng tuyển người làm: 10% tổng giá đơn. */
export const APPLY_DEPOSIT_BPS = 1000;

/** Cửa sổ ghép người làm (ngày) cho đơn PENDING mở. */
export const MATCHING_WINDOW_DAYS = 7;

/** SLA phản hồi sau khi chủ chọn người làm (giờ) — phải vào IN_PROGRESS. */
export const RESPONSE_SLA_HOURS = 4;

export function computeEscrowSplit(
  totalPrice: number,
  commissionBps = DEFAULT_COMMISSION_BPS,
) {
  const commissionAmount = Math.round((totalPrice * commissionBps) / 10000);
  const partnerPayout = Math.max(0, totalPrice - commissionAmount);
  return { commissionAmount, partnerPayout, commissionBps };
}

export function computeApplyDeposit(totalPrice: number) {
  return Math.max(1, Math.round((totalPrice * APPLY_DEPOSIT_BPS) / 10000));
}
