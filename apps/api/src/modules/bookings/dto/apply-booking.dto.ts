import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApplyBookingDto {
  @ApiPropertyOptional({ description: 'Ghi chú ứng tuyển ngắn' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
