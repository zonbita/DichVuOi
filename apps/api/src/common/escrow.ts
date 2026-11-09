/**
 * Công thức escrow/cọc đã chuyển sang `@dichvuoi/shared` để web và API
 * dùng cùng một nguồn. File này giữ lại để không phải sửa import cũ.
 */
export {
  APPLY_DEPOSIT_BPS,
  APPLY_DEPOSIT_BUDGET_THRESHOLD,
  DEFAULT_COMMISSION_BPS,
  MATCHING_WINDOW_DAYS,
  RESPONSE_SLA_HOURS,
  applyDepositPercentBounds,
  clampApplyDepositPercent,
  computeApplyDeposit,
  computeEscrowSplit,
} from '@dichvuoi/shared';
