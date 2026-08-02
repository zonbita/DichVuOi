"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APPLY_DEPOSIT_BUDGET_THRESHOLD = exports.RESPONSE_SLA_HOURS = exports.MATCHING_WINDOW_DAYS = exports.APPLY_DEPOSIT_BPS = exports.DEFAULT_COMMISSION_BPS = void 0;
exports.computeEscrowSplit = computeEscrowSplit;
exports.computeApplyDeposit = computeApplyDeposit;
exports.applyDepositPercentBounds = applyDepositPercentBounds;
exports.clampApplyDepositPercent = clampApplyDepositPercent;
exports.DEFAULT_COMMISSION_BPS = 1500;
exports.APPLY_DEPOSIT_BPS = 1000;
exports.MATCHING_WINDOW_DAYS = 7;
exports.RESPONSE_SLA_HOURS = 4;
function computeEscrowSplit(totalPrice, commissionBps = exports.DEFAULT_COMMISSION_BPS) {
    const commissionAmount = Math.round((totalPrice * commissionBps) / 10000);
    const partnerPayout = Math.max(0, totalPrice - commissionAmount);
    return { commissionAmount, partnerPayout, commissionBps };
}
function computeApplyDeposit(totalPrice, applyDepositBps = exports.APPLY_DEPOSIT_BPS) {
    const bps = Math.min(10000, Math.max(0, Math.round(applyDepositBps)));
    if (bps <= 0 || totalPrice <= 0)
        return 0;
    return Math.max(1, Math.round((totalPrice * bps) / 10000));
}
exports.APPLY_DEPOSIT_BUDGET_THRESHOLD = 5_000_000;
function applyDepositPercentBounds(budgetOrTotal) {
    if (budgetOrTotal > exports.APPLY_DEPOSIT_BUDGET_THRESHOLD) {
        return { min: 50, max: 100, defaultPercent: 50 };
    }
    return { min: 0, max: 50, defaultPercent: 10 };
}
function clampApplyDepositPercent(percent, budgetOrTotal) {
    const { min, max } = applyDepositPercentBounds(budgetOrTotal);
    return Math.min(max, Math.max(min, Math.round(percent)));
}
//# sourceMappingURL=escrow.js.map