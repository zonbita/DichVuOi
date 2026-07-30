"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESPONSE_SLA_HOURS = exports.MATCHING_WINDOW_DAYS = exports.APPLY_DEPOSIT_BPS = exports.DEFAULT_COMMISSION_BPS = void 0;
exports.computeEscrowSplit = computeEscrowSplit;
exports.computeApplyDeposit = computeApplyDeposit;
exports.DEFAULT_COMMISSION_BPS = 1500;
exports.APPLY_DEPOSIT_BPS = 1000;
exports.MATCHING_WINDOW_DAYS = 7;
exports.RESPONSE_SLA_HOURS = 4;
function computeEscrowSplit(totalPrice, commissionBps = exports.DEFAULT_COMMISSION_BPS) {
    const commissionAmount = Math.round((totalPrice * commissionBps) / 10000);
    const partnerPayout = Math.max(0, totalPrice - commissionAmount);
    return { commissionAmount, partnerPayout, commissionBps };
}
function computeApplyDeposit(totalPrice) {
    return Math.max(1, Math.round((totalPrice * exports.APPLY_DEPOSIT_BPS) / 10000));
}
//# sourceMappingURL=escrow.js.map