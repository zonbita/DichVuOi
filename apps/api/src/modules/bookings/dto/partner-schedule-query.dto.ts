import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class PartnerScheduleQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year!: number;

  /** Tháng 1–12 */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}
