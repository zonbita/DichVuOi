/**
 * Rank người dùng — thang 1–1000.
 * rank = clamp(1, 1000, đơn hoàn thành (partner) + đơn thuê thành công (customer))
 */
export const PARTNER_RANK_MIN = 1;
export const PARTNER_RANK_MAX = 1000;

export function computePartnerRankScore(
  completedJobs: number,
  hireSuccessCount: number,
) {
  const raw =
    Math.max(0, Math.round(completedJobs) || 0) +
    Math.max(0, Math.round(hireSuccessCount) || 0);
  return Math.min(
    PARTNER_RANK_MAX,
    Math.max(PARTNER_RANK_MIN, raw || PARTNER_RANK_MIN),
  );
}
