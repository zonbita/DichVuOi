import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class EnablePartnerDto {
  @ApiPropertyOptional({ example: 'Thợ điện nước Quận 1' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  headline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ example: 'Hồ Chí Minh' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ example: 'Quận 1, Quận 3' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  districts?: string;

  @ApiPropertyOptional({ example: ['điện nước', 'sửa chữa'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: 'onsite,online' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  workModes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  acceptingJobs?: boolean;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  responseMinutes?: number;

  /** Nghề (Service) gắn lên hồ sơ — chọn nhiều như tags. */
  @ApiPropertyOptional({ example: ['cuid_service_1', 'cuid_service_2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIds?: string[];
}

export class UpdatePartnerProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  headline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  districts?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  workModes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  acceptingJobs?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  responseMinutes?: number;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];
}

/** Đồng bộ danh sách nghề (PartnerService) — kiểu tags nhiều lựa chọn. */
export class SyncPartnerOfferingsDto {
  @ApiPropertyOptional({ example: ['cuid_a', 'cuid_b'] })
  @IsArray()
  @IsString({ each: true })
  serviceIds!: string[];
}
