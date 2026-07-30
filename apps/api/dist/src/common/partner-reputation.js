"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPUTATION_DEDUCTION_PRESETS = exports.REPUTATION_SUSPEND_THRESHOLD = exports.REPUTATION_WARN_THRESHOLD = exports.REPUTATION_STARTING_POINTS = void 0;
exports.getReputationPeriodIndex = getReputationPeriodIndex;
exports.getReputationPeriodBounds = getReputationPeriodBounds;
exports.reputationPercent = reputationPercent;
exports.REPUTATION_STARTING_POINTS = 1000;
exports.REPUTATION_WARN_THRESHOLD = 700;
exports.REPUTATION_SUSPEND_THRESHOLD = 500;
exports.REPUTATION_DEDUCTION_PRESETS = {
    MINOR: 50,
    MODERATE: 100,
    SERIOUS: 200,
};
function getReputationPeriodIndex(anchorDate, now = new Date()) {
    const anchor = new Date(anchorDate);
    if (now < anchor)
        return 0;
    let periodIndex = 0;
    let periodStart = new Date(anchor);
    while (true) {
        const periodEnd = new Date(periodStart);
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        if (now < periodEnd)
            return periodIndex;
        periodIndex += 1;
        periodStart = periodEnd;
    }
}
function getReputationPeriodBounds(anchorDate, periodIndex) {
    const start = new Date(anchorDate);
    start.setFullYear(start.getFullYear() + periodIndex);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    return { start, end };
}
function reputationPercent(currentPoints, startingPoints = exports.REPUTATION_STARTING_POINTS) {
    if (startingPoints <= 0)
        return 0;
    return Math.max(0, Math.min(100, Math.round((currentPoints / startingPoints) * 100)));
}
//# sourceMappingURL=partner-reputation.js.map