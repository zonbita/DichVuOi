export declare const DEFAULT_COMMISSION_BPS = 1500;
export declare const APPLY_DEPOSIT_BPS = 1000;
export declare const MATCHING_WINDOW_DAYS = 7;
export declare const RESPONSE_SLA_HOURS = 4;
export declare function computeEscrowSplit(totalPrice: number, commissionBps?: number): {
    commissionAmount: number;
    partnerPayout: number;
    commissionBps: number;
};
export declare function computeApplyDeposit(totalPrice: number, applyDepositBps?: number): number;
export declare const APPLY_DEPOSIT_BUDGET_THRESHOLD = 5000000;
export declare function applyDepositPercentBounds(budgetOrTotal: number): {
    min: number;
    max: number;
    defaultPercent: number;
};
export declare function clampApplyDepositPercent(percent: number, budgetOrTotal: number): number;
