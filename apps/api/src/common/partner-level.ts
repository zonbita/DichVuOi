/**
 * Công thức cấp (level) người làm — thang 1–100.
 *
 * level = clamp(1, 100, round(
 *   hoursPoints + jobsPoints + ratingPoints + reviewCountPoints
 *   + verifiedBonus + diversityBonus
 * ))
 *
 * --- Điểm giờ theo nghề (hoursPoints, tối đa 45) ---
 * Mỗi nghề (service) đã làm trên sàn:
 *   points_i = min(hours_i, 120) × 0.25   → tối đa 30 điểm / nghề
 * Tổng hoursPoints = min(Σ points_i, 45)
 * → Làm nhiều giờ ở nhiều nghề được thưởng, nhưng có trần để không “cày” vô hạn.
 *
 * --- Điểm khác ---
 * jobsPoints        = min(completedJobs, 80) × 0.25     → tối đa 20
 * ratingPoints      = ratingCount >= 3
 *                     ? (ratingAvg / 5) × 15             → tối đa 15
 *                     : 0
 * reviewCountPoints = min(ratingCount, 40) × 0.125      → tối đa 5
 * verifiedBonus     = isVerified ? 10 : 0               → 0 hoặc 10
 * diversityBonus    = min(activeOfferings, 8) × 0.625   → tối đa 5
 *
 * Tổng lý thuyết ~100; round rồi kẹp 1–100.
 */

export type PartnerLevelInput = {
  /** Giờ làm theo từng serviceId (đơn COMPLETED). */
  hoursByService: Map<string, number> | Record<string, number>;
  completedJobs: number;
  ratingAvg: number;
  ratingCount: number;
  isVerified: boolean;
  activeOfferings: number;
};

export type PartnerLevelBreakdown = {
  level: number;
  totalPoints: number;
  hoursPoints: number;
  jobsPoints: number;
  ratingPoints: number;
  reviewCountPoints: number;
  verifiedBonus: number;
  diversityBonus: number;
  /** Chi tiết điểm giờ từng nghề (serviceId → điểm). */
  hoursByServicePoints: Array<{ serviceId: string; hours: number; points: number }>;
};

const HOURS_PER_SERVICE_CAP = 120;
const HOURS_POINT_PER_HOUR = 0.25;
const HOURS_POINTS_TOTAL_CAP = 45;

const JOBS_CAP = 80;
const JOBS_POINT_EACH = 0.25;

const RATING_MIN_REVIEWS = 3;
const RATING_POINTS_MAX = 15;

const REVIEW_COUNT_CAP = 40;
const REVIEW_COUNT_POINT_EACH = 0.125;

const VERIFIED_BONUS = 10;

const DIVERSITY_CAP = 8;
const DIVERSITY_POINT_EACH = 0.625;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function asHoursMap(
  input: Map<string, number> | Record<string, number>,
): Map<string, number> {
  if (input instanceof Map) return input;
  return new Map(Object.entries(input));
}

export function computePartnerLevel(input: PartnerLevelInput): PartnerLevelBreakdown {
  const hoursMap = asHoursMap(input.hoursByService);
  const hoursByServicePoints: PartnerLevelBreakdown['hoursByServicePoints'] = [];

  let hoursRaw = 0;
  for (const [serviceId, hours] of hoursMap) {
    const h = Math.max(0, hours);
    const points = Math.min(h, HOURS_PER_SERVICE_CAP) * HOURS_POINT_PER_HOUR;
    hoursByServicePoints.push({
      serviceId,
      hours: round1(h),
      points: round1(points),
    });
    hoursRaw += points;
  }
  hoursByServicePoints.sort((a, b) => b.points - a.points);

  const hoursPoints = round1(Math.min(hoursRaw, HOURS_POINTS_TOTAL_CAP));
  const jobsPoints = round1(
    Math.min(Math.max(0, input.completedJobs), JOBS_CAP) * JOBS_POINT_EACH,
  );
  const ratingPoints =
    input.ratingCount >= RATING_MIN_REVIEWS
      ? round1(clamp(input.ratingAvg, 0, 5) / 5 * RATING_POINTS_MAX)
      : 0;
  const reviewCountPoints = round1(
    Math.min(Math.max(0, input.ratingCount), REVIEW_COUNT_CAP) *
      REVIEW_COUNT_POINT_EACH,
  );
  const verifiedBonus = input.isVerified ? VERIFIED_BONUS : 0;
  const diversityBonus = round1(
    Math.min(Math.max(0, input.activeOfferings), DIVERSITY_CAP) *
      DIVERSITY_POINT_EACH,
  );

  const totalPoints = round1(
    hoursPoints +
      jobsPoints +
      ratingPoints +
      reviewCountPoints +
      verifiedBonus +
      diversityBonus,
  );
  const level = clamp(Math.round(totalPoints), 1, 100);

  return {
    level,
    totalPoints,
    hoursPoints,
    jobsPoints,
    ratingPoints,
    reviewCountPoints,
    verifiedBonus,
    diversityBonus,
    hoursByServicePoints,
  };
}

/** Hằng số công thức — dùng cho docs / FE giải thích. */
export const PARTNER_LEVEL_FORMULA = {
  hours: {
    perHour: HOURS_POINT_PER_HOUR,
    perServiceHoursCap: HOURS_PER_SERVICE_CAP,
    totalCap: HOURS_POINTS_TOTAL_CAP,
  },
  jobs: { perJob: JOBS_POINT_EACH, cap: JOBS_CAP },
  rating: { minReviews: RATING_MIN_REVIEWS, maxPoints: RATING_POINTS_MAX },
  reviewCount: { perReview: REVIEW_COUNT_POINT_EACH, cap: REVIEW_COUNT_CAP },
  verifiedBonus: VERIFIED_BONUS,
  diversity: { perOffering: DIVERSITY_POINT_EACH, cap: DIVERSITY_CAP },
  levelRange: { min: 1, max: 100 },
} as const;
