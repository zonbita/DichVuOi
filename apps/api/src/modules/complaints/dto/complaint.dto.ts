import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintStatus } from '@prisma/client';
import {
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
}

export class AdminResolveComplaintDto {
  @ApiProperty({ enum: ComplaintStatus })
  @IsEnum(ComplaintStatus)
  @IsIn([ComplaintStatus.VERIFIED, ComplaintStatus.REJECTED, ComplaintStatus.UNDER_REVIEW])
  status!: ComplaintStatus;

  @ApiPropertyOptional({ description: 'Bắt buộc khi VERIFIED' })
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
