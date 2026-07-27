/** Điểm uy tín khởi đầu mỗi chu kỳ (năm kể từ ngày tạo tài khoản partner). */
export const REPUTATION_STARTING_POINTS = 1000;

/** Ngưỡng cảnh báo / tạm khóa nhận việc (documented in README). */
export const REPUTATION_WARN_THRESHOLD = 700;
export const REPUTATION_SUSPEND_THRESHOLD = 500;

export const REPUTATION_DEDUCTION_PRESETS = {
  MINOR: 50,
  MODERATE: 100,
  SERIOUS: 200,
} as const;

export type ReputationDeductionPreset = keyof typeof REPUTATION_DEDUCTION_PRESETS;

export function getReputationPeriodIndex(anchorDate: Date, now = new Date()): number {
  const anchor = new Date(anchorDate);
  if (now < anchor) return 0;

  let periodIndex = 0;
  let periodStart = new Date(anchor);

  while (true) {
    const periodEnd = new Date(periodStart);
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    if (now < periodEnd) return periodIndex;
    periodIndex += 1;
    periodStart = periodEnd;
  }
}

export function getReputationPeriodBounds(anchorDate: Date, periodIndex: number) {
  const start = new Date(anchorDate);
  start.setFullYear(start.getFullYear() + periodIndex);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  return { start, end };
}

export function reputationPercent(currentPoints: number, startingPoints = REPUTATION_STARTING_POINTS) {
  if (startingPoints <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((currentPoints / startingPoints) * 100)));
}
