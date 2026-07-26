import { minutesToWorkHours } from './partner-work-hours';

describe('partner-work-hours', () => {
  it('converts minutes to hours with one decimal', () => {
    expect(minutesToWorkHours(0)).toBe(0);
    expect(minutesToWorkHours(60)).toBe(1);
    expect(minutesToWorkHours(90)).toBe(1.5);
    expect(minutesToWorkHours(45)).toBe(0.8);
  });
});
