import {
  APPLY_DEPOSIT_BUDGET_THRESHOLD,
  applyDepositPercentBounds,
  clampApplyDepositPercent,
  computeApplyDeposit,
  computeEscrowSplit,
} from './escrow';

describe('computeEscrowSplit', () => {
  it('defaults to 15% commission', () => {
    expect(computeEscrowSplit(1_000_000)).toEqual({
      commissionAmount: 150_000,
      partnerPayout: 850_000,
      commissionBps: 1500,
    });
  });

  it('0 bps → partner gets everything', () => {
    expect(computeEscrowSplit(12_345, 0)).toMatchObject({
      commissionAmount: 0,
      partnerPayout: 12_345,
    });
  });

  it('rounds commission and always sums to total', () => {
    const s = computeEscrowSplit(33_333, 1500); // 4999.95 → 5000
    expect(s.commissionAmount).toBe(5000);
    expect(s.commissionAmount + s.partnerPayout).toBe(33_333);
    expect(computeEscrowSplit(3, 1500).commissionAmount).toBe(0); // 0.45
    expect(computeEscrowSplit(10, 1500).commissionAmount).toBe(2); // 1.5 → 2
  });

  it('never yields negative payout (>100% commission)', () => {
    expect(computeEscrowSplit(100, 20000).partnerPayout).toBe(0);
  });
});

describe('computeApplyDeposit', () => {
  it('default 10%', () => {
    expect(computeApplyDeposit(1_000_000)).toBe(100_000);
  });
  it('0 bps or 0 price → 0', () => {
    expect(computeApplyDeposit(1_000_000, 0)).toBe(0);
    expect(computeApplyDeposit(0, 1000)).toBe(0);
    expect(computeApplyDeposit(-5, 1000)).toBe(0);
  });
  it('minimum 1₫ when bps > 0', () => {
    expect(computeApplyDeposit(1, 1)).toBe(1);
    expect(computeApplyDeposit(4, 1000)).toBe(1);
  });
  it('rounds and clamps bps to 0..10000', () => {
    expect(computeApplyDeposit(15, 1000)).toBe(2); // 1.5 → 2
    expect(computeApplyDeposit(1000, 50_000)).toBe(1000);
    expect(computeApplyDeposit(1000, -100)).toBe(0);
    expect(computeApplyDeposit(1000, 999.6)).toBe(100);
  });
});

describe('applyDeposit percent bounds/clamp', () => {
  it('bounds switch above budget threshold', () => {
    expect(applyDepositPercentBounds(APPLY_DEPOSIT_BUDGET_THRESHOLD)).toEqual({
      min: 0,
      max: 50,
      defaultPercent: 10,
    });
    expect(
      applyDepositPercentBounds(APPLY_DEPOSIT_BUDGET_THRESHOLD + 1),
    ).toEqual({ min: 50, max: 100, defaultPercent: 50 });
  });
  it('clamps into bounds', () => {
    expect(clampApplyDepositPercent(80, 1_000_000)).toBe(50);
    expect(clampApplyDepositPercent(-3, 1_000_000)).toBe(0);
    expect(clampApplyDepositPercent(10, 10_000_000)).toBe(50);
    expect(clampApplyDepositPercent(120, 10_000_000)).toBe(100);
    expect(clampApplyDepositPercent(33.4, 1_000_000)).toBe(33);
  });
});
