"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARTNER_RANK_MAX = exports.PARTNER_RANK_MIN = void 0;
exports.computePartnerRankScore = computePartnerRankScore;
exports.PARTNER_RANK_MIN = 1;
exports.PARTNER_RANK_MAX = 1000;
function computePartnerRankScore(completedJobs, hireSuccessCount) {
    const raw = Math.max(0, Math.round(completedJobs) || 0) +
        Math.max(0, Math.round(hireSuccessCount) || 0);
    return Math.min(exports.PARTNER_RANK_MAX, Math.max(exports.PARTNER_RANK_MIN, raw || exports.PARTNER_RANK_MIN));
}
//# sourceMappingURL=partner-rank.js.map