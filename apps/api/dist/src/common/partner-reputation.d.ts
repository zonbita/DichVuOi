export declare const REPUTATION_STARTING_POINTS = 1000;
export declare const REPUTATION_WARN_THRESHOLD = 700;
export declare const REPUTATION_SUSPEND_THRESHOLD = 500;
export declare const REPUTATION_DEDUCTION_PRESETS: {
    readonly MINOR: 50;
    readonly MODERATE: 100;
    readonly SERIOUS: 200;
};
export type ReputationDeductionPreset = keyof typeof REPUTATION_DEDUCTION_PRESETS;
export declare function getReputationPeriodIndex(anchorDate: Date, now?: Date): number;
export declare function getReputationPeriodBounds(anchorDate: Date, periodIndex: number): {
    start: Date;
    end: Date;
};
export declare function reputationPercent(currentPoints: number, startingPoints?: number): number;
