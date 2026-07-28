import { computePartnerLevel, PARTNER_LEVEL_FORMULA } from './partner-level';

describe('computePartnerLevel', () => {
  it('starts near level 1 with no activity', () => {
    const result = computePartnerLevel({
      onlineHours: 0,
      completedJobs: 0,
      ratingAvg: 0,
      ratingCount: 0,
      isVerified: false,
      activeOfferings: 0,
    });
    expect(result.level).toBe(1);
    expect(result.hoursPoints).toBe(0);
    expect(result.totalPoints).toBe(0);
  });

  it('gives hours points from online time with cap', () => {
    const result = computePartnerLevel({
      onlineHours: 200, // capped at 180h → 45 pts
      completedJobs: 0,
      ratingAvg: 0,
      ratingCount: 0,
      isVerified: false,
      activeOfferings: 0,
    });
    expect(result.hoursPoints).toBe(45);
    expect(result.onlineHours).toBe(200);
  });

  it('adds jobs, rating, verified and diversity', () => {
    const result = computePartnerLevel({
      onlineHours: 20,
      completedJobs: 40,
      ratingAvg: 5,
      ratingCount: 10,
      isVerified: true,
      activeOfferings: 4,
    });
    expect(result.hoursPoints).toBe(5); // 20*0.25
    expect(result.jobsPoints).toBe(10); // 40*0.25
    expect(result.ratingPoints).toBe(15); // 5/5*15
    expect(result.reviewCountPoints).toBe(1.3); // 10*0.125
    expect(result.verifiedBonus).toBe(10);
    expect(result.diversityBonus).toBe(2.5); // 4*0.625
    expect(result.level).toBeGreaterThan(30);
    expect(result.level).toBeLessThanOrEqual(100);
  });

  it('ignores rating points until enough reviews', () => {
    const result = computePartnerLevel({
      onlineHours: 0,
      completedJobs: 0,
      ratingAvg: 5,
      ratingCount: 2,
      isVerified: false,
      activeOfferings: 0,
    });
    expect(result.ratingPoints).toBe(0);
    expect(PARTNER_LEVEL_FORMULA.rating.minReviews).toBe(3);
    expect(PARTNER_LEVEL_FORMULA.online.totalCap).toBe(45);
  });
});
