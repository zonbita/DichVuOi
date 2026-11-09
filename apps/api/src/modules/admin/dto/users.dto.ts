import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { AdminPageQueryDto } from './common.dto';

export class AdminUserQueryDto extends AdminPageQueryDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Khóa / mở chat đơn (sau tin PII hoặc cảnh cáo)',
  })
  @IsOptional()
  @IsBoolean()
  chatBanned?: boolean;
}
