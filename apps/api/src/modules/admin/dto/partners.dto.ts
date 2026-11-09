import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { AdminPageQueryDto, toOptionalBoolean } from './common.dto';

export class AdminPartnerQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({ description: 'Lọc theo trạng thái xác minh' })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ description: 'Lọc theo đang nhận việc' })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  acceptingJobs?: boolean;

  @ApiPropertyOptional({ description: 'Lọc theo tài khoản bị admin chặn' })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  blocked?: boolean;

  @ApiPropertyOptional({ description: 'Tỉnh / thành phố' })
  @IsOptional()
  @IsString()
  city?: string;
}

export class AdminUpdatePartnerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  acceptingJobs?: boolean;

  @ApiPropertyOptional({
    description:
      'Admin chặn / mở chặn tài khoản (dashboard bị hạn chế; vẫn khiếu nại + chat support)',
  })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @ApiPropertyOptional({ description: 'Admin bật/tắt xác minh SĐT' })
  @IsOptional()
  @IsBoolean()
  phoneVerified?: boolean;

  @ApiPropertyOptional({ description: 'Admin bật/tắt xác minh ngân hàng' })
  @IsOptional()
  @IsBoolean()
  bankVerified?: boolean;
}
