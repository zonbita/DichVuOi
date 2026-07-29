import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRequirementDto {
  @ApiProperty({ description: 'Nội dung công việc cần làm', example: 'Lau kính cửa sổ' })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  content!: string;
}

export class UpdateRequirementDto {
  @ApiPropertyOptional({ description: 'Người làm đánh dấu đã làm' })
  @IsOptional()
  @IsBoolean()
  partnerDone?: boolean;

  @ApiPropertyOptional({ description: 'Khách xác nhận đã nhận / đã xong' })
  @IsOptional()
  @IsBoolean()
  customerConfirmed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  evidenceUrl?: string;
}

export class ConfirmBookingDto {
  @ApiPropertyOptional({
    description: 'Đồng ý hoàn thành dù còn mục chưa tích',
  })
  @IsOptional()
  @IsBoolean()
  acceptIncomplete?: boolean;
}
