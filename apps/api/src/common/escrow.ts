/** Hoa hồng sàn mặc định: 15% (1500 basis points). */
export const DEFAULT_COMMISSION_BPS = 1500;

export function computeEscrowSplit(
  totalPrice: number,
  commissionBps = DEFAULT_COMMISSION_BPS,
) {
  const commissionAmount = Math.round((totalPrice * commissionBps) / 10000);
  const partnerPayout = Math.max(0, totalPrice - commissionAmount);
  return { commissionAmount, partnerPayout, commissionBps };
}
