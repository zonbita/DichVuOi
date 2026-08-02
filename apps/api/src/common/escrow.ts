/** Hoa hồng sàn mặc định: 15% (1500 basis points). */
export const DEFAULT_COMMISSION_BPS = 1500;

/** Cọc ứng tuyển mặc định: 10% tổng giá đơn (khi chủ thuê không set). */
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

/** 0% → 0₫; >0% → tối thiểu 1₫. `applyDepositBps` = 0..10000. */
export function computeApplyDeposit(
  totalPrice: number,
  applyDepositBps = APPLY_DEPOSIT_BPS,
) {
  const bps = Math.min(10000, Math.max(0, Math.round(applyDepositBps)));
  if (bps <= 0 || totalPrice <= 0) return 0;
  return Math.max(1, Math.round((totalPrice * bps) / 10000));
}

/** Ngưỡng ngân sách: trên mức này cọc ứng tuyển tối thiểu 50%. */
export const APPLY_DEPOSIT_BUDGET_THRESHOLD = 5_000_000;

/** Khoảng % cọc ứng tuyển theo ngân sách tối đa / totalPrice. */
export function applyDepositPercentBounds(budgetOrTotal: number) {
  if (budgetOrTotal > APPLY_DEPOSIT_BUDGET_THRESHOLD) {
    return { min: 50, max: 100, defaultPercent: 50 };
  }
  return { min: 0, max: 50, defaultPercent: 10 };
}

export function clampApplyDepositPercent(
  percent: number,
  budgetOrTotal: number,
) {
  const { min, max } = applyDepositPercentBounds(budgetOrTotal);
  return Math.min(max, Math.max(min, Math.round(percent)));
}
