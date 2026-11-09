import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartnerServicePostStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AdminPageQueryDto } from './common.dto';

export class AdminServicePostQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  @IsOptional()
  @IsEnum(PartnerServicePostStatus)
  status?: PartnerServicePostStatus;
}

export class AdminReviewServicePostDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(PartnerServicePostStatus)
  status!: PartnerServicePostStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectReason?: string;
}
