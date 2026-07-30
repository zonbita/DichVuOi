export type PartnerLevelInput = {
    onlineHours: number;
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
    onlineHours: number;
    jobsPoints: number;
    ratingPoints: number;
    reviewCountPoints: number;
    verifiedBonus: number;
    diversityBonus: number;
};
export declare function computePartnerLevel(input: PartnerLevelInput): PartnerLevelBreakdown;
export declare const PARTNER_LEVEL_FORMULA: {
    readonly online: {
        readonly perHour: 0.25;
        readonly hoursCap: 180;
        readonly totalCap: 45;
    };
    readonly hours: {
        readonly perHour: 0.25;
        readonly perServiceHoursCap: 180;
        readonly totalCap: 45;
    };
    readonly jobs: {
        readonly perJob: 0.25;
        readonly cap: 80;
    };
    readonly rating: {
        readonly minReviews: 3;
        readonly maxPoints: 15;
    };
    readonly reviewCount: {
        readonly perReview: 0.125;
        readonly cap: 40;
    };
    readonly verifiedBonus: 10;
    readonly diversity: {
        readonly perOffering: 0.625;
        readonly cap: 8;
    };
    readonly levelRange: {
        readonly min: 1;
        readonly max: 100;
    };
};
