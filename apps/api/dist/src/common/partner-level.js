"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARTNER_LEVEL_FORMULA = void 0;
exports.computePartnerLevel = computePartnerLevel;
const ONLINE_HOURS_CAP = 180;
const ONLINE_POINT_PER_HOUR = 0.25;
const ONLINE_POINTS_TOTAL_CAP = 45;
const JOBS_CAP = 80;
const JOBS_POINT_EACH = 0.25;
const RATING_MIN_REVIEWS = 3;
const RATING_POINTS_MAX = 15;
const REVIEW_COUNT_CAP = 40;
const REVIEW_COUNT_POINT_EACH = 0.125;
const VERIFIED_BONUS = 10;
const DIVERSITY_CAP = 8;
const DIVERSITY_POINT_EACH = 0.625;
function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}
function round1(n) {
    return Math.round(n * 10) / 10;
}
function computePartnerLevel(input) {
    const onlineHours = Math.max(0, input.onlineHours);
    const hoursPoints = round1(Math.min(Math.min(onlineHours, ONLINE_HOURS_CAP) * ONLINE_POINT_PER_HOUR, ONLINE_POINTS_TOTAL_CAP));
    const jobsPoints = round1(Math.min(Math.max(0, input.completedJobs), JOBS_CAP) * JOBS_POINT_EACH);
    const ratingPoints = input.ratingCount >= RATING_MIN_REVIEWS
        ? round1(clamp(input.ratingAvg, 0, 5) / 5 * RATING_POINTS_MAX)
        : 0;
    const reviewCountPoints = round1(Math.min(Math.max(0, input.ratingCount), REVIEW_COUNT_CAP) *
        REVIEW_COUNT_POINT_EACH);
    const verifiedBonus = input.isVerified ? VERIFIED_BONUS : 0;
    const diversityBonus = round1(Math.min(Math.max(0, input.activeOfferings), DIVERSITY_CAP) *
        DIVERSITY_POINT_EACH);
    const totalPoints = round1(hoursPoints +
        jobsPoints +
        ratingPoints +
        reviewCountPoints +
        verifiedBonus +
        diversityBonus);
    const level = clamp(Math.round(totalPoints), 1, 100);
    return {
        level,
        totalPoints,
        hoursPoints,
        onlineHours: round1(onlineHours),
        jobsPoints,
        ratingPoints,
        reviewCountPoints,
        verifiedBonus,
        diversityBonus,
    };
}
exports.PARTNER_LEVEL_FORMULA = {
    online: {
        perHour: ONLINE_POINT_PER_HOUR,
        hoursCap: ONLINE_HOURS_CAP,
        totalCap: ONLINE_POINTS_TOTAL_CAP,
    },
    hours: {
        perHour: ONLINE_POINT_PER_HOUR,
        perServiceHoursCap: ONLINE_HOURS_CAP,
        totalCap: ONLINE_POINTS_TOTAL_CAP,
    },
    jobs: { perJob: JOBS_POINT_EACH, cap: JOBS_CAP },
    rating: { minReviews: RATING_MIN_REVIEWS, maxPoints: RATING_POINTS_MAX },
    reviewCount: { perReview: REVIEW_COUNT_POINT_EACH, cap: REVIEW_COUNT_CAP },
    verifiedBonus: VERIFIED_BONUS,
    diversity: { perOffering: DIVERSITY_POINT_EACH, cap: DIVERSITY_CAP },
    levelRange: { min: 1, max: 100 },
};
//# sourceMappingURL=partner-level.js.map