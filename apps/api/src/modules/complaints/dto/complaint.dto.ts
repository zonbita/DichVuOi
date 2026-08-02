import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintResolutionAction, ComplaintStatus } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { REPUTATION_STARTING_POINTS } from '../../../common/partner-reputation';

export class CreateComplaintDto {
  @ApiProperty({ example: 'quality' })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  category!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @ApiPropertyOptional({ description: 'Id mục checklist tranh chấp' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirementIds?: string[];

  @ApiProperty({ description: 'Bằng chứng: link ảnh/video/chat hoặc mô tả tham chiếu' })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  evidenceNote!: string;
}

export class AdminResolveComplaintDto {
  @ApiProperty({ enum: ComplaintStatus })
  @IsEnum(ComplaintStatus)
  @IsIn([
    ComplaintStatus.VERIFIED,
    ComplaintStatus.REJECTED,
    ComplaintStatus.UNDER_REVIEW,
  ])
  status!: ComplaintStatus;

  @ApiPropertyOptional({
    enum: ComplaintResolutionAction,
    description:
      'REFUND=chấp nhận khách; RELEASE=giải ngân; RETRY_*=làm lại; NONE=không đổi cọc giữ chỗ',
  })
  @IsOptional()
  @IsEnum(ComplaintResolutionAction)
  resolutionAction?: ComplaintResolutionAction;

  @ApiPropertyOptional({ description: 'Bắt buộc khi VERIFIED trừ điểm partner' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(REPUTATION_STARTING_POINTS)
  deductionPoints?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNote?: string;
}

export class AdminComplaintQueryDto {
  @ApiPropertyOptional({ enum: ComplaintStatus })
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;
}
