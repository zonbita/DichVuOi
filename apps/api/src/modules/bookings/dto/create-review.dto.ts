import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ example: 'Làm việc đúng giờ, sạch sẽ.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  /** Chỉ admin dùng khi ghi hộ. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  toUserId?: string;
}
